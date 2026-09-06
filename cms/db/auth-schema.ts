import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  AUTH_CEREMONIES,
  CHALLENGE_MAX_AGE_SECONDS,
  SESSION_MAX_AGE_SECONDS,
} from "../auth/contracts.ts";

const instant = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "string" });
const tokenPattern = "^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$";
export const studioCeremony = pgEnum("studio_ceremony", AUTH_CEREMONIES);
export const studioDeviceType = pgEnum("studio_device_type", [
  "singleDevice",
  "multiDevice",
]);

// No seed is created here. The eventual token-gated bootstrap must create/read
// this one stable identity transactionally, not infer permission from row count.
export const studioOwner = pgTable(
  "studio_owner",
  {
    id: smallint("id").primaryKey().default(1),
    webauthnUserId: text("webauthn_user_id").notNull(),
    authVersion: integer("auth_version").notNull().default(1),
    createdAt: instant("created_at").notNull().defaultNow(),
  },
  (table) => [
    check("studio_owner_singleton_check", sql`${table.id} = 1`),
    check("studio_owner_version_check", sql`${table.authVersion} > 0`),
    check(
      "studio_owner_user_handle_check",
      sql`${table.webauthnUserId} ~ ${sql.raw(`'${tokenPattern}'`)}`,
    ),
  ],
);

export const studioCredentials = pgTable(
  "studio_credentials",
  {
    id: uuid("id").primaryKey(),
    ownerId: smallint("owner_id")
      .notNull()
      .references(() => studioOwner.id),
    credentialId: text("credential_id").notNull().unique(),
    publicKey: text("public_key").notNull(),
    counter: bigint("counter", { mode: "number" }).notNull(),
    deviceType: studioDeviceType("device_type").notNull(),
    backedUp: boolean("backed_up").notNull(),
    transports: text("transports").array().notNull(),
    origin: text("origin").notNull(),
    rpId: text("rp_id").notNull(),
    createdAt: instant("created_at").notNull().defaultNow(),
    revokedAt: instant("revoked_at"),
  },
  (table) => [
    check(
      "studio_credentials_id_encoding_check",
      sql`${table.credentialId} ~ '^[A-Za-z0-9_-]+$' AND length(${table.credentialId}) <= 1364 AND length(${table.credentialId}) % 4 <> 1`,
    ),
    check(
      "studio_credentials_key_encoding_check",
      sql`${table.publicKey} ~ '^[A-Za-z0-9_-]+$' AND length(${table.publicKey}) <= 5462 AND length(${table.publicKey}) % 4 <> 1`,
    ),
    check(
      "studio_credentials_counter_check",
      sql`${table.counter} BETWEEN 0 AND 4294967295`,
    ),
    check(
      "studio_credentials_backup_check",
      sql`NOT ${table.backedUp} OR ${table.deviceType} = 'multiDevice'`,
    ),
    check(
      "studio_credentials_transports_check",
      sql`${table.transports} <@ ARRAY['ble','hybrid','internal','nfc','usb']::text[] AND cardinality(${table.transports}) <= 5 AND array_position(${table.transports}, NULL) IS NULL`,
    ),
    check(
      "studio_credentials_rp_check",
      sql`length(${table.origin}) BETWEEN 1 AND 300 AND length(${table.rpId}) BETWEEN 1 AND 253`,
    ),
    check(
      "studio_credentials_revocation_check",
      sql`${table.revokedAt} IS NULL OR ${table.revokedAt} >= ${table.createdAt}`,
    ),
  ],
);

export const studioSessions = pgTable(
  "studio_sessions",
  {
    id: uuid("id").primaryKey(),
    ownerId: smallint("owner_id")
      .notNull()
      .references(() => studioOwner.id),
    credentialId: uuid("credential_id")
      .notNull()
      .references(() => studioCredentials.id),
    tokenHash: text("token_hash").notNull().unique(),
    // NOT an FK to owner.auth_version: advancing the owner epoch invalidates old
    // sessions without deleting history or preventing that epoch change.
    authVersion: integer("auth_version").notNull(),
    origin: text("origin").notNull(),
    rpId: text("rp_id").notNull(),
    createdAt: instant("created_at").notNull().defaultNow(),
    expiresAt: instant("expires_at").notNull(),
    revokedAt: instant("revoked_at"),
  },
  (table) => [
    check(
      "studio_sessions_hash_check",
      sql`${table.tokenHash} ~ '^[a-f0-9]{64}$'`,
    ),
    check("studio_sessions_version_check", sql`${table.authVersion} > 0`),
    check(
      "studio_sessions_lifetime_check",
      sql`${table.expiresAt} > ${table.createdAt} AND ${table.expiresAt} <= ${table.createdAt} + interval '${sql.raw(String(SESSION_MAX_AGE_SECONDS))} seconds'`,
    ),
    check(
      "studio_sessions_rp_check",
      sql`length(${table.origin}) BETWEEN 1 AND 300 AND length(${table.rpId}) BETWEEN 1 AND 253`,
    ),
    check(
      "studio_sessions_revocation_check",
      sql`${table.revokedAt} IS NULL OR ${table.revokedAt} >= ${table.createdAt}`,
    ),
    index("studio_sessions_expiry_idx").on(table.expiresAt),
    index("studio_sessions_credential_idx").on(table.credentialId),
  ],
);

export const studioChallenges = pgTable(
  "studio_challenges",
  {
    id: uuid("id").primaryKey(),
    ownerId: smallint("owner_id")
      .notNull()
      .references(() => studioOwner.id),
    authVersion: integer("auth_version").notNull(),
    ceremony: studioCeremony("ceremony").notNull(),
    // The expected challenge is public ceremony material but SERVER generated.
    challenge: text("challenge").notNull().unique(),
    browserBindingHash: text("browser_binding_hash").notNull(),
    enrollmentTokenHash: text("enrollment_token_hash"),
    authorizingSessionId: uuid("authorizing_session_id").references(
      () => studioSessions.id,
    ),
    origin: text("origin").notNull(),
    rpId: text("rp_id").notNull(),
    createdAt: instant("created_at").notNull().defaultNow(),
    expiresAt: instant("expires_at").notNull(),
    consumedAt: instant("consumed_at"),
  },
  (table) => [
    check("studio_challenges_version_check", sql`${table.authVersion} > 0`),
    check(
      "studio_challenges_value_check",
      sql`${table.challenge} ~ ${sql.raw(`'${tokenPattern}'`)}`,
    ),
    check(
      "studio_challenges_binding_check",
      sql`${table.browserBindingHash} ~ '^[a-f0-9]{64}$'`,
    ),
    check(
      "studio_challenges_enrollment_check",
      sql`(
    (${table.ceremony} = 'authenticate' AND ${table.enrollmentTokenHash} IS NULL)
    OR (${table.ceremony} <> 'authenticate' AND ${table.enrollmentTokenHash} IS NOT NULL AND ${table.enrollmentTokenHash} ~ '^[a-f0-9]{64}$')
  )`,
    ),
    check(
      "studio_challenges_session_check",
      sql`(${table.ceremony} = 'enroll_additional') = (${table.authorizingSessionId} IS NOT NULL)`,
    ),
    check(
      "studio_challenges_lifetime_check",
      sql`${table.expiresAt} > ${table.createdAt} AND ${table.expiresAt} <= ${table.createdAt} + interval '${sql.raw(String(CHALLENGE_MAX_AGE_SECONDS))} seconds'`,
    ),
    check(
      "studio_challenges_rp_check",
      sql`length(${table.origin}) BETWEEN 1 AND 300 AND length(${table.rpId}) BETWEEN 1 AND 253`,
    ),
    check(
      "studio_challenges_consumed_check",
      sql`${table.consumedAt} IS NULL OR (${table.consumedAt} >= ${table.createdAt} AND ${table.consumedAt} < ${table.expiresAt})`,
    ),
    index("studio_challenges_expiry_idx").on(table.expiresAt),
    index("studio_challenges_session_idx").on(table.authorizingSessionId),
  ],
);
