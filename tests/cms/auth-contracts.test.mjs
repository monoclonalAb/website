import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  AUTH_CEREMONIES,
  AUTHENTICATOR_TRANSPORTS,
  CHALLENGE_MAX_AGE_SECONDS,
  SESSION_MAX_AGE_SECONDS,
  challengeSchema,
  credentialSchema,
  opaqueTokenSchema,
  relyingPartySchema,
  sessionSchema,
  studioOwnerSchema,
} from "../../cms/auth/contracts.ts";
import {
  createOpaqueToken,
  enrollmentTokenMatches,
  tokenDigest,
  tokenMatches,
} from "../../cms/auth/tokens.ts";
import { authFixtures, fixtureToken } from "../helpers/cms-auth-fixtures.mjs";

const iso = (value) => new Date(value).toISOString();
const rejectsChanges = (schema, original, changes) => {
  for (const change of changes)
    assert.equal(
      schema.safeParse({ ...original, ...change }).success,
      false,
      `Should reject changed fields: ${Object.keys(change).join(", ")}`,
    );
};

test("server token generation produces canonical 32-byte independent values", () => {
  const first = createOpaqueToken();
  const second = createOpaqueToken();
  assert.equal(opaqueTokenSchema.safeParse(first).success, true);
  assert.equal(Buffer.from(first, "base64url").length, 32);
  assert.notEqual(first, second); // Not a statistical entropy or issuance test.
});

test("stored token digests are stable SHA-256 and purpose-separated", () => {
  const token = fixtureToken(0);
  const expected = createHash("sha256")
    .update("website-studio:session\0")
    .update(token)
    .digest("hex");
  assert.equal(tokenDigest("session", token), expected);
  const digests = ["session", "challenge-binding", "enrollment"].map(
    (purpose) => tokenDigest(purpose, token),
  );
  assert.equal(new Set(digests).size, 3);
  assert.equal(tokenMatches("session", token, expected), true);
  assert.equal(tokenMatches("session", fixtureToken(1), expected), false);
  assert.equal(tokenMatches("enrollment", token, expected), false);
});

test("malformed/missing bearers and noncanonical aliases fail closed without secret-bearing errors", () => {
  const token = fixtureToken(0);
  // A non-zero padding bit can decode to identical bytes: reject the alias.
  const alias = `${token.slice(0, -1)}B`;
  assert.deepEqual(
    Buffer.from(alias, "base64url"),
    Buffer.from(token, "base64url"),
  );
  for (const input of [
    undefined,
    null,
    false,
    {},
    1,
    "",
    " ",
    `${token}=`,
    `${token}\n`,
    alias,
    "a".repeat(10_000),
    Buffer.alloc(31).toString("base64url"),
    Buffer.alloc(33).toString("base64url"),
  ]) {
    assert.equal(tokenDigest("session", input), null);
    assert.equal(tokenMatches("session", input, "a".repeat(64)), false);
  }
  for (const hash of [undefined, "", "A".repeat(64), "a".repeat(63), {}])
    assert.equal(tokenMatches("session", token, hash), false);
  assert.equal(tokenDigest("unknown-purpose", token), null);
});

test("enrollment token matching requires set, valid configured and supplied values", () => {
  const token = fixtureToken(3);
  assert.equal(enrollmentTokenMatches(token, token), true);
  for (const missing of [undefined, null, "", " ", "weak-config", {}]) {
    assert.equal(enrollmentTokenMatches(missing, token), false);
    assert.equal(enrollmentTokenMatches(token, missing), false);
    assert.equal(enrollmentTokenMatches(missing, missing), false);
  }
  assert.equal(enrollmentTokenMatches(token, fixtureToken(4)), false);
});

test("auth records parse losslessly with one owner and no raw bearer or private-key fields", () => {
  const { owner, credential, session, challenge } = authFixtures();
  for (const [schema, value] of [
    [studioOwnerSchema, owner],
    [credentialSchema, credential],
    [sessionSchema, session],
    [challengeSchema, challenge],
  ]) {
    assert.deepEqual(schema.parse(value), value);
    const input = { ...value, future_field: "must not silently strip" };
    assert.equal(schema.safeParse(input).success, false);
    assert.equal(input.future_field, "must not silently strip");
  }
  rejectsChanges(studioOwnerSchema, owner, [
    { id: 2 },
    { auth_version: 0 },
    { auth_version: "2" },
    { auth_version: 2_147_483_648 },
    { webauthn_user_id: "eric@example.test" },
  ]);
  rejectsChanges(credentialSchema, credential, [
    { owner_id: 2 },
    { private_key: "never store this" },
    { password: "no password flow" },
  ]);
  rejectsChanges(sessionSchema, session, [
    { token: fixtureToken(1) },
    { token_hash: fixtureToken(1) },
    { owner_id: 2 },
  ]);
  rejectsChanges(challengeSchema, challenge, [
    { browser_binding_token: fixtureToken(2) },
    { enrollment_token: fixtureToken(3) },
  ]);
});

test("credential encoding, unsigned counter, backup eligibility and transports are strict", () => {
  const { credential } = authFixtures();
  rejectsChanges(credentialSchema, credential, [
    { credential_id: "" },
    { credential_id: "a" },
    { credential_id: "_w==" },
    { credential_id: Buffer.alloc(1_024).toString("base64url") },
    { public_key: "" },
    { public_key: Buffer.alloc(4_097).toString("base64url") },
    { counter: -1 },
    { counter: 0.5 },
    { counter: "0" },
    { counter: 4_294_967_296 },
    { device_type: "singleDevice" },
    { device_type: "unknown" },
    { backed_up: "true" },
    { transports: ["unknown"] },
    { transports: ["smart-card"] },
    { transports: ["internal", "internal"] },
    { transports: null },
    { revoked_at: "2026-09-04T00:00:00Z" },
  ]);
  assert.equal(
    credentialSchema.safeParse({
      ...credential,
      counter: 4_294_967_295,
      transports: AUTHENTICATOR_TRANSPORTS,
    }).success,
    true,
  );
  assert.equal(
    credentialSchema.safeParse({
      ...credential,
      device_type: "singleDevice",
      backed_up: false,
      transports: [],
    }).success,
    true,
  );
});

test("RP/origin records require canonical exact binding but do not authorize an environment", () => {
  for (const value of [
    { origin: "http://localhost:3100", rp_id: "localhost" },
    { origin: "https://ericzheng.nz", rp_id: "ericzheng.nz" },
  ])
    assert.deepEqual(relyingPartySchema.parse(value), value);
  const valid = { origin: "https://ericzheng.nz", rp_id: "ericzheng.nz" };
  rejectsChanges(relyingPartySchema, valid, [
    { origin: "http://ericzheng.nz" },
    { origin: "https://ericzheng.nz/" },
    { origin: "https://ericzheng.nz?next=studio" },
    { origin: "https://user:secret@ericzheng.nz" },
    { origin: "https://ericzheng.nz.evil.test" },
    { rp_id: "nz" },
    { rp_id: "ERiCzheng.nz" },
    { origin: "https://127.0.0.1", rp_id: "127.0.0.1" },
    { origin: "https://[::1]", rp_id: "[::1]" },
    { origin: "http://127.0.0.1:3100", rp_id: "127.0.0.1" },
    { origin: "http://localhost", rp_id: "localhost" },
  ]);
  // A structurally valid preview still MUST be denied by the later server gate.
  assert.equal(
    relyingPartySchema.safeParse({
      origin: "https://preview.example.test",
      rp_id: "preview.example.test",
    }).success,
    true,
  );
});

test("session lifetime is positive and capped; revocation and offset timestamps are validated", () => {
  const { session } = authFixtures();
  const created = Date.parse(session.created_at);
  rejectsChanges(sessionSchema, session, [
    { expires_at: session.created_at },
    { expires_at: iso(created - 1) },
    { expires_at: iso(created + SESSION_MAX_AGE_SECONDS * 1_000 + 1) },
    { expires_at: "not a date" },
    { revoked_at: iso(created - 1) },
    { auth_version: 0 },
  ]);
  assert.equal(
    sessionSchema.safeParse({ ...session, revoked_at: session.expires_at })
      .success,
    true,
  );
  assert.equal(
    sessionSchema.safeParse({
      ...session,
      created_at: "2026-09-05T12:00:00+02:00",
    }).success,
    true,
  );
});

test("challenge ceremonies require exactly their enrollment/session bindings", () => {
  const { challenge, session, tokens } = authFixtures();
  for (const ceremony of AUTH_CEREMONIES) {
    const value = {
      ...challenge,
      ceremony,
      enrollment_token_hash:
        ceremony === "authenticate"
          ? null
          : tokenDigest("enrollment", tokens.enrollment),
      authorizing_session_id:
        ceremony === "enroll_additional" ? session.id : null,
    };
    assert.deepEqual(challengeSchema.parse(value), value);
    rejectsChanges(challengeSchema, value, [
      {
        enrollment_token_hash:
          value.enrollment_token_hash === null ? "a".repeat(64) : null,
      },
      {
        authorizing_session_id:
          value.authorizing_session_id === null ? session.id : null,
      },
    ]);
  }
  rejectsChanges(challengeSchema, challenge, [
    { ceremony: "signup" },
    { browser_binding_hash: "" },
    { challenge: fixtureToken(5) + "=" },
  ]);
});

test("challenges are short-lived with consumption inside the lifetime", () => {
  const { challenge } = authFixtures();
  const created = Date.parse(challenge.created_at);
  rejectsChanges(challengeSchema, challenge, [
    { expires_at: iso(created) },
    { expires_at: iso(created + CHALLENGE_MAX_AGE_SECONDS * 1_000 + 1) },
    { consumed_at: iso(created - 1) },
    { consumed_at: challenge.expires_at },
  ]);
  assert.equal(
    challengeSchema.safeParse({ ...challenge, consumed_at: iso(created + 1) })
      .success,
    true,
  );
});
