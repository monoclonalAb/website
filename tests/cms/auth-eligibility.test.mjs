import assert from "node:assert/strict";
import test from "node:test";
import {
  checkChallengeEligibility,
  checkSessionEligibility,
} from "../../cms/auth/eligibility.ts";
import { tokenDigest } from "../../cms/auth/tokens.ts";
import { authFixtures, fixtureToken } from "../helpers/cms-auth-fixtures.mjs";

function sessionInput(f) {
  return {
    owner: f.owner,
    credential: f.credential,
    session: f.session,
    token: f.tokens.session,
    trustedRp: f.rp,
    now: f.now,
  };
}
function challengeInput(f, ceremony = "authenticate") {
  return {
    owner: f.owner,
    trustedRp: f.rp,
    now: f.now,
    ceremony,
    challenge: {
      ...f.challenge,
      ceremony,
      enrollment_token_hash:
        ceremony === "authenticate"
          ? null
          : tokenDigest("enrollment", f.tokens.enrollment),
      authorizing_session_id:
        ceremony === "enroll_additional" ? f.session.id : null,
    },
    browserBindingToken: f.tokens.browser,
    configuredEnrollmentToken: f.tokens.enrollment,
    suppliedEnrollmentToken: f.tokens.enrollment,
    authorizingSession: {
      session: f.session,
      credential: f.credential,
      token: f.tokens.session,
    },
  };
}

test("session eligibility requires matching bearer and complete fresh server records", () => {
  const f = authFixtures();
  const input = sessionInput(f);
  assert.equal(checkSessionEligibility(input), true);
  for (const change of [
    { token: undefined },
    { token: fixtureToken(9) },
    { session: null },
    { credential: null },
    { owner: null },
    { session: { ...f.session, credential_id: f.challenge.id } },
    {
      session: {
        ...f.session,
        token_hash: tokenDigest("enrollment", f.tokens.session),
      },
    },
    { credential: { ...f.credential, owner_id: 2 } },
  ])
    assert.equal(checkSessionEligibility({ ...input, ...change }), false);
});

test("revoked credentials, revoked sessions and owner auth-epoch changes invalidate sessions", () => {
  const f = authFixtures();
  const input = sessionInput(f);
  const revoked_at = new Date(f.now).toISOString();
  for (const change of [
    { session: { ...f.session, revoked_at } },
    { credential: { ...f.credential, revoked_at } },
    { owner: { ...f.owner, auth_version: 3 } },
    { session: { ...f.session, auth_version: 1 } },
  ])
    assert.equal(checkSessionEligibility({ ...input, ...change }), false);
});

test("session expiry is exclusive, issuance is not future-dated, and invalid clocks fail closed", () => {
  const f = authFixtures();
  const input = sessionInput(f);
  const expires = Date.parse(f.session.expires_at);
  assert.equal(checkSessionEligibility({ ...input, now: expires - 1 }), true);
  for (const now of [
    expires,
    expires + 1,
    Date.parse(f.session.created_at) - 1,
    NaN,
    Infinity,
  ]) {
    assert.equal(checkSessionEligibility({ ...input, now }), false);
  }
  for (const record of ["owner", "credential"])
    assert.equal(
      checkSessionEligibility({
        ...input,
        [record]: {
          ...input[record],
          created_at: new Date(f.now + 1).toISOString(),
        },
      }),
      false,
    );
});

test("session and credential must both match the trusted exact origin and RP", () => {
  const f = authFixtures();
  const input = sessionInput(f);
  const production = { origin: "https://ericzheng.nz", rp_id: "ericzheng.nz" };
  for (const change of [
    { trustedRp: production },
    { session: { ...f.session, ...production } },
    { credential: { ...f.credential, ...production } },
    { trustedRp: { ...f.rp, origin: "http://localhost:3000" } },
    { trustedRp: { ...f.rp, rp_id: "127.0.0.1" } },
  ])
    assert.equal(checkSessionEligibility({ ...input, ...change }), false);
  assert.equal(
    checkSessionEligibility({
      ...input,
      trustedRp: production,
      session: { ...f.session, ...production },
      credential: { ...f.credential, ...production },
    }),
    true,
  );
});

test("challenge preflight binds purpose, initiating browser, owner epoch and trusted RP", () => {
  const f = authFixtures();
  const input = challengeInput(f);
  assert.equal(checkChallengeEligibility(input), true);
  for (const change of [
    { browserBindingToken: undefined },
    { browserBindingToken: fixtureToken(9) },
    { ceremony: "enroll_bootstrap" },
    { ceremony: "unknown" },
    { challenge: null },
    { owner: null },
    { owner: { ...f.owner, auth_version: 3 } },
    { trustedRp: { origin: "http://localhost:3000", rp_id: "localhost" } },
    { challenge: { ...f.challenge, rp_id: "wrong.example.test" } },
    {
      challenge: {
        ...f.challenge,
        browser_binding_hash: tokenDigest("session", f.tokens.browser),
      },
    },
  ])
    assert.equal(checkChallengeEligibility({ ...input, ...change }), false);
});

test("expired, consumed, not-yet-issued and malformed challenges are ineligible", () => {
  const f = authFixtures();
  const input = challengeInput(f);
  const expires = Date.parse(f.challenge.expires_at);
  assert.equal(checkChallengeEligibility({ ...input, now: expires - 1 }), true);
  for (const now of [
    expires,
    expires + 1,
    Date.parse(f.challenge.created_at) - 1,
    NaN,
    Infinity,
  ]) {
    assert.equal(checkChallengeEligibility({ ...input, now }), false);
  }
  assert.equal(
    checkChallengeEligibility({
      ...input,
      challenge: {
        ...input.challenge,
        consumed_at: new Date(f.now).toISOString(),
      },
    }),
    false,
  );
  assert.equal(
    checkChallengeEligibility({
      ...input,
      challenge: { ...input.challenge, expires_at: "invalid" },
    }),
    false,
  );
});

test("every enrollment, including additional credentials, rechecks set/matching enrollment token", () => {
  const f = authFixtures();
  for (const ceremony of [
    "enroll_bootstrap",
    "enroll_additional",
    "enroll_recovery",
  ]) {
    const input = challengeInput(f, ceremony);
    assert.equal(checkChallengeEligibility(input), true);
    for (const change of [
      { configuredEnrollmentToken: undefined },
      { configuredEnrollmentToken: "" },
      { suppliedEnrollmentToken: undefined },
      { suppliedEnrollmentToken: fixtureToken(9) },
      {
        configuredEnrollmentToken: fixtureToken(9),
        suppliedEnrollmentToken: fixtureToken(9),
      },
    ])
      assert.equal(
        checkChallengeEligibility({ ...input, ...change }),
        false,
        ceremony,
      );
  }
  // Sign-in remains distinct from token-gated enrollment.
  assert.equal(
    checkChallengeEligibility({
      ...challengeInput(f),
      configuredEnrollmentToken: undefined,
      suppliedEnrollmentToken: undefined,
    }),
    true,
  );
});

test("additional enrollment requires the same still-live authorizing session and credential", () => {
  const f = authFixtures();
  const input = challengeInput(f, "enroll_additional");
  const evidence = input.authorizingSession;
  for (const authorizingSession of [
    undefined,
    { ...evidence, token: undefined },
    { ...evidence, token: fixtureToken(9) },
    { ...evidence, session: { ...f.session, id: f.challenge.id } },
    {
      ...evidence,
      session: { ...f.session, revoked_at: new Date(f.now).toISOString() },
    },
    {
      ...evidence,
      credential: {
        ...f.credential,
        revoked_at: new Date(f.now).toISOString(),
      },
    },
    {
      ...evidence,
      session: { ...f.session, expires_at: new Date(f.now).toISOString() },
    },
  ])
    assert.equal(
      checkChallengeEligibility({ ...input, authorizingSession }),
      false,
    );
});

test("token-gated bootstrap and recovery are explicit session exceptions, not a zero-credential rule", () => {
  const f = authFixtures(); // Existing credential remains present in this fixture.
  for (const ceremony of ["enroll_bootstrap", "enroll_recovery"]) {
    const input = {
      ...challengeInput(f, ceremony),
      authorizingSession: undefined,
    };
    assert.equal(checkChallengeEligibility(input), true);
    assert.equal(
      checkChallengeEligibility({
        ...input,
        suppliedEnrollmentToken: undefined,
      }),
      false,
    );
  }
});

test("eligibility checks do not consume challenges, mutate records or establish WebAuthn proof", () => {
  const input = challengeInput(authFixtures());
  const before = structuredClone(input);
  assert.equal(checkChallengeEligibility(input), true);
  assert.equal(checkChallengeEligibility(input), true); // An unconsumed snapshot can pass twice.
  assert.deepEqual(input, before);
  // Atomic consumption, maintained-verifier signature/UV checks and real
  // concurrent requests are mandatory later; a boolean is not sign-in success.
});
