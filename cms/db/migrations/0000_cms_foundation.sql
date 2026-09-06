CREATE TYPE "public"."post_collection" AS ENUM('blog', 'leetcode');--> statement-breakpoint
CREATE TYPE "public"."publication_kind" AS ENUM('publish', 'unpublish');--> statement-breakpoint
CREATE TYPE "public"."publication_sync_status" AS ENUM('pending', 'synced');--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"collection" "post_collection" NOT NULL,
	"slug" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"draft_version" integer DEFAULT 1 NOT NULL,
	"draft_schema_version" integer NOT NULL,
	"draft" jsonb NOT NULL,
	"first_published_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"published_revision_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_collection_slug_key" UNIQUE("collection","slug"),
	CONSTRAINT "posts_id_collection_key" UNIQUE("id","collection"),
	CONSTRAINT "posts_slug_check" CHECK ("posts"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("posts"."slug") <= 160),
	CONSTRAINT "posts_versions_check" CHECK ("posts"."version" >= "posts"."draft_version" AND "posts"."draft_version" > 0 AND "posts"."draft_schema_version" > 0),
	CONSTRAINT "posts_draft_envelope_check" CHECK ((
    jsonb_typeof("posts"."draft") = 'object'
    AND "posts"."draft"->'schema_version' = to_jsonb("posts"."draft_schema_version")
    AND "posts"."draft"->'metadata'->>'collection' = "posts"."collection"::text
  ) IS TRUE),
	CONSTRAINT "posts_publication_check" CHECK ((
    ("posts"."published_revision_id" IS NULL AND "posts"."published_at" IS NULL)
    OR ("posts"."published_revision_id" IS NOT NULL AND "posts"."published_at" IS NOT NULL
      AND "posts"."first_published_at" IS NOT NULL AND "posts"."first_published_at" <= "posts"."published_at")
  ))
);
--> statement-breakpoint
CREATE TABLE "publication_operations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"post_id" uuid NOT NULL,
	"kind" "publication_kind" NOT NULL,
	"expected_version" integer NOT NULL,
	"expected_draft_version" integer NOT NULL,
	"result_version" integer NOT NULL,
	"request_hash" text NOT NULL,
	"revision_id" uuid,
	"invalidation_tags" text[] NOT NULL,
	"sync_status" "publication_sync_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now(),
	"last_attempt_at" timestamp with time zone,
	"synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "publication_operations_post_version_key" UNIQUE("post_id","result_version"),
	CONSTRAINT "publication_operations_version_check" CHECK ("publication_operations"."expected_version" > 0 AND "publication_operations"."expected_draft_version" > 0 AND "publication_operations"."expected_draft_version" <= "publication_operations"."expected_version" AND "publication_operations"."result_version"::bigint = "publication_operations"."expected_version"::bigint + 1),
	CONSTRAINT "publication_operations_hash_check" CHECK ("publication_operations"."request_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "publication_operations_revision_check" CHECK (("publication_operations"."kind" = 'publish' AND "publication_operations"."revision_id" IS NOT NULL) OR ("publication_operations"."kind" = 'unpublish' AND "publication_operations"."revision_id" IS NULL)),
	CONSTRAINT "publication_operations_tags_check" CHECK (cardinality("publication_operations"."invalidation_tags") BETWEEN 1 AND 128 AND array_position("publication_operations"."invalidation_tags", NULL) IS NULL AND array_position("publication_operations"."invalidation_tags", '') IS NULL),
	CONSTRAINT "publication_operations_sync_check" CHECK ("publication_operations"."attempts" >= 0 AND (
    ("publication_operations"."sync_status" = 'pending' AND "publication_operations"."synced_at" IS NULL AND "publication_operations"."next_attempt_at" IS NOT NULL)
    OR ("publication_operations"."sync_status" = 'synced' AND "publication_operations"."synced_at" IS NOT NULL AND "publication_operations"."next_attempt_at" IS NULL AND "publication_operations"."attempts" > 0 AND "publication_operations"."last_attempt_at" IS NOT NULL)
  ))
);
--> statement-breakpoint
CREATE TABLE "revisions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"post_id" uuid NOT NULL,
	"collection" "post_collection" NOT NULL,
	"draft_version" integer NOT NULL,
	"schema_version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "revisions_post_id_key" UNIQUE("post_id","id"),
	CONSTRAINT "revisions_post_draft_version_key" UNIQUE("post_id","draft_version"),
	CONSTRAINT "revisions_versions_check" CHECK ("revisions"."draft_version" > 0 AND "revisions"."schema_version" > 0),
	CONSTRAINT "revisions_snapshot_envelope_check" CHECK ((
    jsonb_typeof("revisions"."snapshot") = 'object'
    AND "revisions"."snapshot"->'schema_version' = to_jsonb("revisions"."schema_version")
    AND "revisions"."snapshot"->'metadata'->>'collection' = "revisions"."collection"::text
  ) IS TRUE)
);
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_own_published_revision_fk" FOREIGN KEY ("id","published_revision_id") REFERENCES "public"."revisions"("post_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_operations" ADD CONSTRAINT "publication_operations_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_operations" ADD CONSTRAINT "publication_operations_own_revision_fk" FOREIGN KEY ("post_id","revision_id") REFERENCES "public"."revisions"("post_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_post_collection_fk" FOREIGN KEY ("post_id","collection") REFERENCES "public"."posts"("id","collection") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "publication_operations_pending_idx" ON "publication_operations" USING btree ("next_attempt_at") WHERE "publication_operations"."sync_status" = 'pending';