import { isIP } from "node:net";
import { z } from "zod";

// Storage maxima, not a running cookie/session policy. No implicit refresh.
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
export const CHALLENGE_MAX_AGE_SECONDS = 5 * 60;
export const AUTH_VERSION_MAX = 2_147_483_647;
export const AUTH_CEREMONIES = [
  "authenticate",
  "enroll_bootstrap",
  "enroll_additional",
  "enroll_recovery",
] as const;
export const AUTHENTICATOR_TRANSPORTS = [
  "ble",
  "hybrid",
  "internal",
  "nfc",
  "usb",
] as const satisfies readonly AuthenticatorTransport[];

function base64urlBytes(min: number, max: number) {
  const maxEncoded = Math.ceil((max * 4) / 3);
  return z
    .string()
    .min(1)
    .max(maxEncoded)
    .refine((value) => {
      if (value.length > maxEncoded || !/^[A-Za-z0-9_-]+$/.test(value))
        return false;
      const bytes = Buffer.from(value, "base64url");
      return (
        bytes.length >= min &&
        bytes.length <= max &&
        bytes.toString("base64url") === value
      );
    }, "Expected canonical, unpadded base64url bytes");
}

export const opaqueTokenSchema = base64urlBytes(32, 32);
export const tokenHashSchema = z.string().regex(/^[a-f0-9]{64}$/);
const authVersion = z.number().int().min(1).max(AUTH_VERSION_MAX);
const instant = z.iso.datetime({ offset: true });

// Structural binding only, NOT deployment authorization. A preview's HTTPS
// origin can be structurally valid; the later server environment gate must deny it.
const relyingPartyFields = {
  origin: z.string().max(300),
  rp_id: z.string().min(1).max(253),
};
function validRelyingParty(value: { origin: string; rp_id: string }) {
  try {
    const url = new URL(value.origin);
    return (
      url.origin === value.origin &&
      url.username === "" &&
      url.password === "" &&
      url.hostname === value.rp_id &&
      ((url.protocol === "http:" &&
        url.hostname === "localhost" &&
        url.port !== "") ||
        (url.protocol === "https:" &&
          !isIP(url.hostname.replace(/^\[|\]$/g, "")) &&
          url.hostname !== "localhost" &&
          !url.hostname.endsWith(".localhost") &&
          url.hostname.includes(".")))
    );
  } catch {
    return false;
  }
}
export const relyingPartySchema = z
  .strictObject(relyingPartyFields)
  .refine(validRelyingParty, "Invalid canonical origin/RP binding");
export type RelyingParty = z.infer<typeof relyingPartySchema>;

export const studioOwnerSchema = z.strictObject({
  id: z.literal(1),
  // Stable random WebAuthn user handle, not an email or a client-selected ID.
  webauthn_user_id: opaqueTokenSchema,
  auth_version: authVersion,
  created_at: instant,
});
export type StudioOwner = z.infer<typeof studioOwnerSchema>;

export const credentialSchema = z
  .strictObject({
    id: z.uuid(),
    owner_id: z.literal(1),
    credential_id: base64urlBytes(1, 1_023),
    // Encoded COSE bytes from the maintained verifier, not trusted client JSON.
    // This schema validates encoding/size, NOT COSE or cryptographic validity.
    public_key: base64urlBytes(1, 4_096),
    counter: z.number().int().min(0).max(4_294_967_295),
    device_type: z.enum(["singleDevice", "multiDevice"]),
    backed_up: z.boolean(),
    transports: z
      .array(z.enum(AUTHENTICATOR_TRANSPORTS))
      .max(AUTHENTICATOR_TRANSPORTS.length),
    ...relyingPartyFields,
    created_at: instant,
    revoked_at: instant.nullable(),
  })
  .refine(validRelyingParty, "Invalid canonical origin/RP binding")
  .refine(
    (value) => !value.backed_up || value.device_type === "multiDevice",
    "A backed-up credential must be backup eligible",
  )
  .refine(
    (value) => new Set(value.transports).size === value.transports.length,
    "Duplicate authenticator transports",
  )
  .refine(
    (value) =>
      value.revoked_at === null ||
      Date.parse(value.revoked_at) >= Date.parse(value.created_at),
    "Revocation predates creation",
  );
export type StudioCredential = z.infer<typeof credentialSchema>;

const expiringRecordFields = {
  id: z.uuid(),
  owner_id: z.literal(1),
  auth_version: authVersion,
  ...relyingPartyFields,
  created_at: instant,
  expires_at: instant,
};
function boundedLifetime(
  value: { created_at: string; expires_at: string },
  maxSeconds: number,
) {
  const lifetime = Date.parse(value.expires_at) - Date.parse(value.created_at);
  return lifetime > 0 && lifetime <= maxSeconds * 1_000;
}

export const sessionSchema = z
  .strictObject({
    ...expiringRecordFields,
    credential_id: z.uuid(),
    token_hash: tokenHashSchema,
    revoked_at: instant.nullable(),
  })
  .refine(validRelyingParty, "Invalid canonical origin/RP binding")
  .refine(
    (value) => boundedLifetime(value, SESSION_MAX_AGE_SECONDS),
    "Invalid session lifetime",
  )
  .refine(
    (value) =>
      value.revoked_at === null ||
      Date.parse(value.revoked_at) >= Date.parse(value.created_at),
    "Revocation predates creation",
  );
export type StudioSession = z.infer<typeof sessionSchema>;

export const challengeSchema = z
  .strictObject({
    ...expiringRecordFields,
    ceremony: z.enum(AUTH_CEREMONIES),
    challenge: opaqueTokenSchema,
    browser_binding_hash: tokenHashSchema,
    // Every enrollment captures the current token hash, even with a session.
    enrollment_token_hash: tokenHashSchema.nullable(),
    authorizing_session_id: z.uuid().nullable(),
    consumed_at: instant.nullable(),
  })
  .refine(validRelyingParty, "Invalid canonical origin/RP binding")
  .refine(
    (value) => boundedLifetime(value, CHALLENGE_MAX_AGE_SECONDS),
    "Invalid challenge lifetime",
  )
  .refine(
    (value) =>
      (value.ceremony === "authenticate") ===
      (value.enrollment_token_hash === null),
    "Every enrollment requires a token binding; sign-in must not have one",
  )
  .refine(
    (value) =>
      (value.ceremony === "enroll_additional") ===
      (value.authorizing_session_id !== null),
    "Additional enrollment requires an authorizing session; bootstrap/recovery/sign-in do not",
  )
  .refine(
    (value) =>
      value.consumed_at === null ||
      (Date.parse(value.consumed_at) >= Date.parse(value.created_at) &&
        Date.parse(value.consumed_at) < Date.parse(value.expires_at)),
    "Consumption must be within the challenge lifetime",
  );
export type StudioChallenge = z.infer<typeof challengeSchema>;
