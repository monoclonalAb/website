import { tokenDigest } from "../../cms/auth/tokens.ts";

// Deterministic, inert test values. The encoded public key is NOT a valid COSE
// key and no WebAuthn assertion, credential or authenticated session is issued.
export const fixtureToken = (byte) =>
  Buffer.alloc(32, byte).toString("base64url");
export function authFixtures() {
  const created = "2026-09-05T10:00:00.000Z";
  const rp = { origin: "http://localhost:3100", rp_id: "localhost" };
  const tokens = {
    session: fixtureToken(1),
    browser: fixtureToken(2),
    enrollment: fixtureToken(3),
  };
  const owner = {
    id: 1,
    webauthn_user_id: fixtureToken(4),
    auth_version: 2,
    created_at: created,
  };
  const credential = {
    id: "00000000-0000-4000-8000-000000000021",
    owner_id: 1,
    credential_id: Buffer.from("inert credential ID fixture").toString(
      "base64url",
    ),
    public_key: Buffer.from("encoding fixture only; not COSE").toString(
      "base64url",
    ),
    counter: 0,
    device_type: "multiDevice",
    backed_up: true,
    transports: ["internal", "hybrid"],
    ...rp,
    created_at: created,
    revoked_at: null,
  };
  const session = {
    id: "00000000-0000-4000-8000-000000000022",
    owner_id: 1,
    credential_id: credential.id,
    token_hash: tokenDigest("session", tokens.session),
    auth_version: owner.auth_version,
    ...rp,
    created_at: created,
    expires_at: "2026-09-12T10:00:00.000Z",
    revoked_at: null,
  };
  const challenge = {
    id: "00000000-0000-4000-8000-000000000023",
    owner_id: 1,
    auth_version: owner.auth_version,
    ceremony: "authenticate",
    challenge: fixtureToken(5),
    browser_binding_hash: tokenDigest("challenge-binding", tokens.browser),
    enrollment_token_hash: null,
    authorizing_session_id: null,
    ...rp,
    created_at: created,
    expires_at: "2026-09-05T10:05:00.000Z",
    consumed_at: null,
  };
  return {
    rp,
    owner,
    credential,
    session,
    challenge,
    tokens,
    now: Date.parse(created) + 1_000,
  };
}
