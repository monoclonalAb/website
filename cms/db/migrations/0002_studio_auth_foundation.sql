CREATE TYPE "public"."studio_ceremony" AS ENUM('authenticate', 'enroll_bootstrap', 'enroll_additional', 'enroll_recovery');--> statement-breakpoint
CREATE TYPE "public"."studio_device_type" AS ENUM('singleDevice', 'multiDevice');--> statement-breakpoint
CREATE TABLE "studio_challenges" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_id" smallint NOT NULL,
	"auth_version" integer NOT NULL,
	"ceremony" "studio_ceremony" NOT NULL,
	"challenge" text NOT NULL,
	"browser_binding_hash" text NOT NULL,
	"enrollment_token_hash" text,
	"authorizing_session_id" uuid,
	"origin" text NOT NULL,
	"rp_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	CONSTRAINT "studio_challenges_challenge_unique" UNIQUE("challenge"),
	CONSTRAINT "studio_challenges_version_check" CHECK ("studio_challenges"."auth_version" > 0),
	CONSTRAINT "studio_challenges_value_check" CHECK ("studio_challenges"."challenge" ~ '^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$'),
	CONSTRAINT "studio_challenges_binding_check" CHECK ("studio_challenges"."browser_binding_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "studio_challenges_enrollment_check" CHECK ((
    ("studio_challenges"."ceremony" = 'authenticate' AND "studio_challenges"."enrollment_token_hash" IS NULL)
    OR ("studio_challenges"."ceremony" <> 'authenticate' AND "studio_challenges"."enrollment_token_hash" IS NOT NULL AND "studio_challenges"."enrollment_token_hash" ~ '^[a-f0-9]{64}$')
  )),
	CONSTRAINT "studio_challenges_session_check" CHECK (("studio_challenges"."ceremony" = 'enroll_additional') = ("studio_challenges"."authorizing_session_id" IS NOT NULL)),
	CONSTRAINT "studio_challenges_lifetime_check" CHECK ("studio_challenges"."expires_at" > "studio_challenges"."created_at" AND "studio_challenges"."expires_at" <= "studio_challenges"."created_at" + interval '300 seconds'),
	CONSTRAINT "studio_challenges_rp_check" CHECK (length("studio_challenges"."origin") BETWEEN 1 AND 300 AND length("studio_challenges"."rp_id") BETWEEN 1 AND 253),
	CONSTRAINT "studio_challenges_consumed_check" CHECK ("studio_challenges"."consumed_at" IS NULL OR ("studio_challenges"."consumed_at" >= "studio_challenges"."created_at" AND "studio_challenges"."consumed_at" < "studio_challenges"."expires_at"))
);
--> statement-breakpoint
CREATE TABLE "studio_credentials" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_id" smallint NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" bigint NOT NULL,
	"device_type" "studio_device_type" NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text[] NOT NULL,
	"origin" text NOT NULL,
	"rp_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "studio_credentials_credential_id_unique" UNIQUE("credential_id"),
	CONSTRAINT "studio_credentials_id_encoding_check" CHECK ("studio_credentials"."credential_id" ~ '^[A-Za-z0-9_-]+$' AND length("studio_credentials"."credential_id") <= 1364 AND length("studio_credentials"."credential_id") % 4 <> 1),
	CONSTRAINT "studio_credentials_key_encoding_check" CHECK ("studio_credentials"."public_key" ~ '^[A-Za-z0-9_-]+$' AND length("studio_credentials"."public_key") <= 5462 AND length("studio_credentials"."public_key") % 4 <> 1),
	CONSTRAINT "studio_credentials_counter_check" CHECK ("studio_credentials"."counter" BETWEEN 0 AND 4294967295),
	CONSTRAINT "studio_credentials_backup_check" CHECK (NOT "studio_credentials"."backed_up" OR "studio_credentials"."device_type" = 'multiDevice'),
	CONSTRAINT "studio_credentials_transports_check" CHECK ("studio_credentials"."transports" <@ ARRAY['ble','hybrid','internal','nfc','usb']::text[] AND cardinality("studio_credentials"."transports") <= 5 AND array_position("studio_credentials"."transports", NULL) IS NULL),
	CONSTRAINT "studio_credentials_rp_check" CHECK (length("studio_credentials"."origin") BETWEEN 1 AND 300 AND length("studio_credentials"."rp_id") BETWEEN 1 AND 253),
	CONSTRAINT "studio_credentials_revocation_check" CHECK ("studio_credentials"."revoked_at" IS NULL OR "studio_credentials"."revoked_at" >= "studio_credentials"."created_at")
);
--> statement-breakpoint
CREATE TABLE "studio_owner" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"webauthn_user_id" text NOT NULL,
	"auth_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "studio_owner_singleton_check" CHECK ("studio_owner"."id" = 1),
	CONSTRAINT "studio_owner_version_check" CHECK ("studio_owner"."auth_version" > 0),
	CONSTRAINT "studio_owner_user_handle_check" CHECK ("studio_owner"."webauthn_user_id" ~ '^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$')
);
--> statement-breakpoint
CREATE TABLE "studio_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_id" smallint NOT NULL,
	"credential_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"auth_version" integer NOT NULL,
	"origin" text NOT NULL,
	"rp_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "studio_sessions_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "studio_sessions_hash_check" CHECK ("studio_sessions"."token_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "studio_sessions_version_check" CHECK ("studio_sessions"."auth_version" > 0),
	CONSTRAINT "studio_sessions_lifetime_check" CHECK ("studio_sessions"."expires_at" > "studio_sessions"."created_at" AND "studio_sessions"."expires_at" <= "studio_sessions"."created_at" + interval '604800 seconds'),
	CONSTRAINT "studio_sessions_rp_check" CHECK (length("studio_sessions"."origin") BETWEEN 1 AND 300 AND length("studio_sessions"."rp_id") BETWEEN 1 AND 253),
	CONSTRAINT "studio_sessions_revocation_check" CHECK ("studio_sessions"."revoked_at" IS NULL OR "studio_sessions"."revoked_at" >= "studio_sessions"."created_at")
);
--> statement-breakpoint
ALTER TABLE "studio_challenges" ADD CONSTRAINT "studio_challenges_owner_id_studio_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."studio_owner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_challenges" ADD CONSTRAINT "studio_challenges_authorizing_session_id_studio_sessions_id_fk" FOREIGN KEY ("authorizing_session_id") REFERENCES "public"."studio_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_credentials" ADD CONSTRAINT "studio_credentials_owner_id_studio_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."studio_owner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_sessions" ADD CONSTRAINT "studio_sessions_owner_id_studio_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."studio_owner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_sessions" ADD CONSTRAINT "studio_sessions_credential_id_studio_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."studio_credentials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "studio_challenges_expiry_idx" ON "studio_challenges" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "studio_challenges_session_idx" ON "studio_challenges" USING btree ("authorizing_session_id");--> statement-breakpoint
CREATE INDEX "studio_sessions_expiry_idx" ON "studio_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "studio_sessions_credential_idx" ON "studio_sessions" USING btree ("credential_id");