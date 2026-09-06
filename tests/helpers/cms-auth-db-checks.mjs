import assert from "node:assert/strict";
import { checkSessionEligibility } from "../../cms/auth/eligibility.ts";
import { authFixtures, fixtureToken } from "./cms-auth-fixtures.mjs";

// Called ONLY inside the guarded integration suite's existing rollback-only
// fixture transaction. Encoded key material is intentionally not real COSE.
export async function checkAuthDatabaseContracts(t, client) {
  const f = authFixtures();
  const reject = async (query, params, code) => {
    await client.query("SAVEPOINT rejected_auth_write");
    await assert.rejects(
      client.query(query, params),
      (error) => error.code === code,
    );
    await client.query("ROLLBACK TO SAVEPOINT rejected_auth_write");
    await client.query("RELEASE SAVEPOINT rejected_auth_write");
  };
  await client.query(
    "INSERT INTO studio_owner (id, webauthn_user_id, auth_version) VALUES (1, $1, 2)",
    [f.owner.webauthn_user_id],
  );
  const insertCredential =
    "INSERT INTO studio_credentials (id, owner_id, credential_id, public_key, counter, device_type, backed_up, transports, origin, rp_id) VALUES ($1, 1, $2, $3, 0, 'multiDevice', true, ARRAY['internal'], $4, $5)";
  const credentialParams = [
    f.credential.id,
    f.credential.credential_id,
    f.credential.public_key,
    f.rp.origin,
    f.rp.rp_id,
  ];
  await client.query(insertCredential, credentialParams);
  const insertSession =
    "INSERT INTO studio_sessions (id, owner_id, credential_id, token_hash, auth_version, origin, rp_id, expires_at) VALUES ($1, 1, $2, $3, 2, $4, $5, now() + interval '1 day')";
  const sessionParams = [
    f.session.id,
    f.credential.id,
    f.session.token_hash,
    f.rp.origin,
    f.rp.rp_id,
  ];
  await client.query(insertSession, sessionParams);
  const insertChallenge =
    "INSERT INTO studio_challenges (id, owner_id, auth_version, ceremony, challenge, browser_binding_hash, origin, rp_id, expires_at, enrollment_token_hash, authorizing_session_id) VALUES ($1, 1, 2, $2, $3, $4, $5, $6, now() + interval '5 minutes', $7, $8)";
  const challengeParams = [
    f.challenge.id,
    "authenticate",
    f.challenge.challenge,
    f.challenge.browser_binding_hash,
    f.rp.origin,
    f.rp.rp_id,
    null,
    null,
  ];
  await client.query(insertChallenge, challengeParams);

  // Test-only row normalization, not a production driver or auth repository.
  const isoRow = (row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        value instanceof Date
          ? value.toISOString()
          : key === "counter"
            ? Number(value)
            : value,
      ]),
    );
  const sessionEligible = async () => {
    const owner = isoRow(
      (await client.query("SELECT * FROM studio_owner WHERE id = 1")).rows[0],
    );
    const credential = isoRow(
      (
        await client.query("SELECT * FROM studio_credentials WHERE id = $1", [
          f.credential.id,
        ])
      ).rows[0],
    );
    const session = isoRow(
      (
        await client.query("SELECT * FROM studio_sessions WHERE id = $1", [
          f.session.id,
        ])
      ).rows[0],
    );
    // Fixtures use PostgreSQL now(); host/VM clocks can differ by milliseconds.
    // Use the same trusted clock domain, not a sleep or relaxed eligibility rule.
    const databaseNow = (
      await client.query("SELECT clock_timestamp() AS now")
    ).rows[0].now.getTime();
    return checkSessionEligibility({
      owner,
      credential,
      session,
      token: f.tokens.session,
      trustedRp: f.rp,
      now: databaseNow,
    });
  };

  await t.test(
    "auth identity is a singleton with an immutable user handle and forward-only epoch",
    async () => {
      await reject(
        "INSERT INTO studio_owner (id, webauthn_user_id) VALUES (2, $1)",
        [fixtureToken(9)],
        "23514",
      );
      await reject(
        "UPDATE studio_owner SET webauthn_user_id = $1 WHERE id = 1",
        [fixtureToken(9)],
        "23514",
      );
      await reject(
        "UPDATE studio_owner SET auth_version = 1 WHERE id = 1",
        [],
        "23514",
      );
      await reject(
        "UPDATE studio_owner SET auth_version = 4 WHERE id = 1",
        [],
        "23514",
      );
      assert.equal(await sessionEligible(), true);
      await client.query(
        "UPDATE studio_owner SET auth_version = 3 WHERE id = 1",
      );
      assert.equal(await sessionEligible(), false);
    },
  );

  await t.test(
    "credential public-key identity and unsigned counters cannot be rewritten/backtracked",
    async () => {
      await reject(
        insertCredential,
        [f.challenge.id, ...credentialParams.slice(1)],
        "23505",
      );
      await reject(
        "UPDATE studio_credentials SET public_key = $2 WHERE id = $1",
        [f.credential.id, "aW5lcnQ"],
        "23514",
      );
      await client.query(
        "UPDATE studio_credentials SET counter = 1 WHERE id = $1",
        [f.credential.id],
      );
      await reject(
        "UPDATE studio_credentials SET counter = 0 WHERE id = $1",
        [f.credential.id],
        "23514",
      );
      await reject(
        "UPDATE studio_credentials SET counter = 4294967296 WHERE id = $1",
        [f.credential.id],
        "23514",
      );
      await client.query(
        "UPDATE studio_credentials SET revoked_at = now() WHERE id = $1",
        [f.credential.id],
      );
      await reject(
        "UPDATE studio_credentials SET revoked_at = NULL WHERE id = $1",
        [f.credential.id],
        "23514",
      );
    },
  );

  await t.test(
    "sessions retain hash uniqueness, credential ownership, bounded immutable expiry and revocation",
    async () => {
      await reject(
        insertSession,
        [f.challenge.id, ...sessionParams.slice(1)],
        "23505",
      );
      await reject(
        insertSession,
        [
          f.challenge.id,
          f.challenge.id,
          "b".repeat(64),
          f.rp.origin,
          f.rp.rp_id,
        ],
        "23503",
      );
      await reject(
        "INSERT INTO studio_sessions (id, owner_id, credential_id, token_hash, auth_version, origin, rp_id, expires_at) VALUES ($1, 1, $2, $3, 2, $4, $5, now() + interval '8 days')",
        [
          f.challenge.id,
          f.credential.id,
          "b".repeat(64),
          f.rp.origin,
          f.rp.rp_id,
        ],
        "23514",
      );
      await reject(
        "UPDATE studio_sessions SET expires_at = expires_at + interval '1 minute' WHERE id = $1",
        [f.session.id],
        "23514",
      );
      await reject(
        "UPDATE studio_sessions SET token_hash = $2 WHERE id = $1",
        [f.session.id, "b".repeat(64)],
        "23514",
      );
      await client.query(
        "UPDATE studio_sessions SET revoked_at = now() WHERE id = $1",
        [f.session.id],
      );
      await reject(
        "UPDATE studio_sessions SET revoked_at = NULL WHERE id = $1",
        [f.session.id],
        "23514",
      );
    },
  );

  await t.test(
    "challenge ceremony requires exactly the enrollment/session bindings",
    async () => {
      for (const [ceremony, enrollmentHash, sessionId] of [
        ["authenticate", "a".repeat(64), null],
        ["enroll_bootstrap", null, null],
        ["enroll_recovery", "a".repeat(64), f.session.id],
        ["enroll_additional", "a".repeat(64), null],
      ])
        await reject(
          insertChallenge,
          [
            f.session.id,
            ceremony,
            fixtureToken(9),
            ...challengeParams.slice(3, 6),
            enrollmentHash,
            sessionId,
          ],
          "23514",
        );
      await reject(
        "UPDATE studio_challenges SET browser_binding_hash = $2 WHERE id = $1",
        [f.challenge.id, "b".repeat(64)],
        "23514",
      );
      await reject(
        "INSERT INTO studio_challenges (id, owner_id, auth_version, ceremony, challenge, browser_binding_hash, origin, rp_id, expires_at) VALUES ($1, 1, 2, 'authenticate', $2, $3, $4, $5, now() + interval '6 minutes')",
        [f.session.id, fixtureToken(9), ...challengeParams.slice(3, 6)],
        "23514",
      );
    },
  );

  await t.test(
    "conditional challenge consumption succeeds once; replay/reset cannot rearm it",
    async () => {
      // Single-connection constraint evidence, NOT a concurrent auth transaction.
      const consume =
        "UPDATE studio_challenges SET consumed_at = clock_timestamp() WHERE id = $1 AND consumed_at IS NULL AND expires_at > clock_timestamp() RETURNING id";
      assert.equal((await client.query(consume, [f.challenge.id])).rowCount, 1);
      assert.equal((await client.query(consume, [f.challenge.id])).rowCount, 0);
      await reject(
        "UPDATE studio_challenges SET consumed_at = NULL WHERE id = $1",
        [f.challenge.id],
        "23514",
      );
      await reject(
        "UPDATE studio_challenges SET consumed_at = now() WHERE id = $1",
        [f.challenge.id],
        "23514",
      );
    },
  );
}
