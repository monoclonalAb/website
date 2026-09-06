import {
  challengeSchema,
  credentialSchema,
  relyingPartySchema,
  sessionSchema,
  studioOwnerSchema,
  type RelyingParty,
  type StudioChallenge,
} from "./contracts.ts";
import { enrollmentTokenMatches, tokenMatches } from "./tokens.ts";

// These are checks over freshly read SERVER records, not request DTOs. Callers
// must enforce the deployment policy first; never derive trustedRp/now from
// client claims, Host/forwarded headers or the WebAuthn response.
type ServerContext = { owner: unknown; trustedRp: RelyingParty; now: number };
type SessionEvidence = {
  session: unknown;
  credential: unknown;
  token: unknown;
};

function activeAt(created: string, expires: string, now: number) {
  return (
    Number.isFinite(now) &&
    Date.parse(created) <= now &&
    now < Date.parse(expires)
  );
}
function sameRp(record: RelyingParty, expected: RelyingParty) {
  return record.origin === expected.origin && record.rp_id === expected.rp_id;
}

/** No DB lookup, cookie handling, caching or authorization of an operation. */
export function checkSessionEligibility(
  input: ServerContext & SessionEvidence,
): boolean {
  const owner = studioOwnerSchema.safeParse(input.owner);
  const session = sessionSchema.safeParse(input.session);
  const credential = credentialSchema.safeParse(input.credential);
  const rp = relyingPartySchema.safeParse(input.trustedRp);
  if (!owner.success || !session.success || !credential.success || !rp.success)
    return false;
  const stored = session.data;
  const key = credential.data;
  return (
    stored.owner_id === owner.data.id &&
    key.owner_id === owner.data.id &&
    stored.credential_id === key.id &&
    stored.auth_version === owner.data.auth_version &&
    stored.revoked_at === null &&
    key.revoked_at === null &&
    Date.parse(owner.data.created_at) <= input.now &&
    Date.parse(key.created_at) <= input.now &&
    activeAt(stored.created_at, stored.expires_at, input.now) &&
    sameRp(stored, rp.data) &&
    sameRp(key, rp.data) &&
    tokenMatches("session", input.token, stored.token_hash)
  );
}

/** Advisory preflight ONLY. A true result neither consumes a challenge nor
 * verifies a passkey. The later transaction must recheck state, atomically
 * consume a bound attempt exactly once and use a maintained WebAuthn verifier
 * with the STORED challenge/RP/origin and required user verification. Failed
 * verification must not rearm consumption or mint a session. Credential/counter
 * and session writes still need transactional/failure evidence.
 */
export function checkChallengeEligibility(
  input: ServerContext & {
    challenge: unknown;
    ceremony: StudioChallenge["ceremony"];
    browserBindingToken: unknown;
    configuredEnrollmentToken?: unknown;
    suppliedEnrollmentToken?: unknown;
    authorizingSession?: SessionEvidence;
  },
): boolean {
  const owner = studioOwnerSchema.safeParse(input.owner);
  const challenge = challengeSchema.safeParse(input.challenge);
  const rp = relyingPartySchema.safeParse(input.trustedRp);
  if (!owner.success || !challenge.success || !rp.success) return false;
  const stored = challenge.data;
  if (
    stored.owner_id !== owner.data.id ||
    stored.auth_version !== owner.data.auth_version ||
    stored.ceremony !== input.ceremony ||
    stored.consumed_at !== null ||
    Date.parse(owner.data.created_at) > input.now ||
    !activeAt(stored.created_at, stored.expires_at, input.now) ||
    !sameRp(stored, rp.data) ||
    !tokenMatches(
      "challenge-binding",
      input.browserBindingToken,
      stored.browser_binding_hash,
    )
  )
    return false;
  if (stored.ceremony === "authenticate") return true;
  if (
    !enrollmentTokenMatches(
      input.configuredEnrollmentToken,
      input.suppliedEnrollmentToken,
    ) ||
    !tokenMatches(
      "enrollment",
      input.configuredEnrollmentToken,
      stored.enrollment_token_hash,
    )
  )
    return false;
  if (stored.ceremony !== "enroll_additional") return true;
  const evidence = input.authorizingSession;
  if (!evidence) return false;
  const session = sessionSchema.safeParse(evidence.session);
  return (
    session.success &&
    session.data.id === stored.authorizing_session_id &&
    checkSessionEligibility({
      ...evidence,
      owner: input.owner,
      trustedRp: input.trustedRp,
      now: input.now,
    })
  );
}
