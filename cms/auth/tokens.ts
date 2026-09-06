import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { opaqueTokenSchema, tokenHashSchema } from "./contracts.ts";

export type TokenPurpose = "session" | "challenge-binding" | "enrollment";
const purposes = new Set(["session", "challenge-binding", "enrollment"]);

// Server use only; never log the result. Session/browser bearers are stored
// hashed. WebAuthn challenges/user handles are public ceremony material;
// the configured enrollment secret belongs outside the database/repository.
export function createOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Invalid/missing tokens fail closed, without throwing a secret-bearing error. */
export function tokenDigest(
  purpose: TokenPurpose,
  token: unknown,
): string | null {
  const parsed = opaqueTokenSchema.safeParse(token);
  if (!purposes.has(purpose) || !parsed.success) return null;
  return createHash("sha256")
    .update(`website-studio:${purpose}\0`)
    .update(parsed.data)
    .digest("hex");
}

export function tokenMatches(
  purpose: TokenPurpose,
  token: unknown,
  expectedHash: unknown,
): boolean {
  const actual = tokenDigest(purpose, token);
  const expected = tokenHashSchema.safeParse(expectedHash);
  return (
    actual !== null &&
    expected.success &&
    timingSafeEqual(
      Buffer.from(actual, "hex"),
      Buffer.from(expected.data, "hex"),
    )
  );
}

export function enrollmentTokenMatches(
  configuredToken: unknown,
  suppliedToken: unknown,
): boolean {
  const expected = tokenDigest("enrollment", configuredToken);
  return (
    expected !== null && tokenMatches("enrollment", suppliedToken, expected)
  );
}
