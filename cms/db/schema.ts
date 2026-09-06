import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  type PgTableExtraConfigValue,
} from "drizzle-orm/pg-core";

export * from "./auth-schema.ts";

export const postCollection = pgEnum("post_collection", ["blog", "leetcode"]);
export const publicationKind = pgEnum("publication_kind", [
  "publish",
  "unpublish",
]);
export const publicationSyncStatus = pgEnum("publication_sync_status", [
  "pending",
  "synced",
]);
const instant = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "string" });

// JSONB remains unknown on reads: TypeScript annotations are not validation.
// Keep future/unsupported snapshots intact, then validate at the boundary.
export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey(),
    collection: postCollection("collection").notNull(),
    slug: text("slug").notNull(),
    version: integer("version").notNull().default(1),
    draftVersion: integer("draft_version").notNull().default(1),
    draftSchemaVersion: integer("draft_schema_version").notNull(),
    draft: jsonb("draft").$type<unknown>().notNull(),
    firstPublishedAt: instant("first_published_at"),
    publishedAt: instant("published_at"),
    publishedRevisionId: uuid("published_revision_id"),
    createdAt: instant("created_at").notNull().defaultNow(),
    updatedAt: instant("updated_at").notNull().defaultNow(),
  },
  (table): PgTableExtraConfigValue[] => [
    unique("posts_collection_slug_key").on(table.collection, table.slug),
    unique("posts_id_collection_key").on(table.id, table.collection),
    foreignKey({
      name: "posts_own_published_revision_fk",
      columns: [table.id, table.publishedRevisionId],
      foreignColumns: [revisions.postId, revisions.id],
    }),
    check(
      "posts_slug_check",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(${table.slug}) <= 160`,
    ),
    check(
      "posts_versions_check",
      sql`${table.version} >= ${table.draftVersion} AND ${table.draftVersion} > 0 AND ${table.draftSchemaVersion} > 0`,
    ),
    check(
      "posts_draft_envelope_check",
      sql`(
    jsonb_typeof(${table.draft}) = 'object'
    AND ${table.draft}->'schema_version' = to_jsonb(${table.draftSchemaVersion})
    AND ${table.draft}->'metadata'->>'collection' = ${table.collection}::text
  ) IS TRUE`,
    ),
    check(
      "posts_publication_check",
      sql`(
    (${table.publishedRevisionId} IS NULL AND ${table.publishedAt} IS NULL)
    OR (${table.publishedRevisionId} IS NOT NULL AND ${table.publishedAt} IS NOT NULL
      AND ${table.firstPublishedAt} IS NOT NULL AND ${table.firstPublishedAt} <= ${table.publishedAt})
  )`,
    ),
  ],
);

export const revisions = pgTable(
  "revisions",
  {
    id: uuid("id").primaryKey(),
    postId: uuid("post_id").notNull(),
    collection: postCollection("collection").notNull(),
    draftVersion: integer("draft_version").notNull(),
    schemaVersion: integer("schema_version").notNull(),
    snapshot: jsonb("snapshot").$type<unknown>().notNull(),
    createdAt: instant("created_at").notNull().defaultNow(),
  },
  (table): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "revisions_post_collection_fk",
      columns: [table.postId, table.collection],
      foreignColumns: [posts.id, posts.collection],
    }),
    unique("revisions_post_id_key").on(table.postId, table.id),
    // Explicit save and publish can select the same immutable draft snapshot.
    unique("revisions_post_draft_version_key").on(
      table.postId,
      table.draftVersion,
    ),
    check(
      "revisions_versions_check",
      sql`${table.draftVersion} > 0 AND ${table.schemaVersion} > 0`,
    ),
    check(
      "revisions_snapshot_envelope_check",
      sql`(
    jsonb_typeof(${table.snapshot}) = 'object'
    AND ${table.snapshot}->'schema_version' = to_jsonb(${table.schemaVersion})
    AND ${table.snapshot}->'metadata'->>'collection' = ${table.collection}::text
  ) IS TRUE`,
    ),
  ],
);

// A transactional outbox/receipt: insert alongside the publication pointer
// change, then persist attempts until ALL required invalidations succeed.
// No publisher, worker, cache handler or production connection exists yet.
export const publicationOperations = pgTable(
  "publication_operations",
  {
    id: uuid("id").primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id),
    kind: publicationKind("kind").notNull(),
    expectedVersion: integer("expected_version").notNull(),
    expectedDraftVersion: integer("expected_draft_version").notNull(),
    resultVersion: integer("result_version").notNull(),
    requestHash: text("request_hash").notNull(),
    revisionId: uuid("revision_id"),
    invalidationTags: text("invalidation_tags").array().notNull(),
    syncStatus: publicationSyncStatus("sync_status")
      .notNull()
      .default("pending"),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: instant("next_attempt_at").defaultNow(),
    lastAttemptAt: instant("last_attempt_at"),
    syncedAt: instant("synced_at"),
    createdAt: instant("created_at").notNull().defaultNow(),
  },
  (table): PgTableExtraConfigValue[] => [
    unique("publication_operations_post_version_key").on(
      table.postId,
      table.resultVersion,
    ),
    foreignKey({
      name: "publication_operations_own_revision_fk",
      columns: [table.postId, table.revisionId],
      foreignColumns: [revisions.postId, revisions.id],
    }),
    check(
      "publication_operations_version_check",
      sql`${table.expectedVersion} > 0 AND ${table.expectedDraftVersion} > 0 AND ${table.expectedDraftVersion} <= ${table.expectedVersion} AND ${table.resultVersion}::bigint = ${table.expectedVersion}::bigint + 1`,
    ),
    check(
      "publication_operations_hash_check",
      sql`${table.requestHash} ~ '^[a-f0-9]{64}$'`,
    ),
    check(
      "publication_operations_revision_check",
      sql`(${table.kind} = 'publish' AND ${table.revisionId} IS NOT NULL) OR (${table.kind} = 'unpublish' AND ${table.revisionId} IS NULL)`,
    ),
    check(
      "publication_operations_tags_check",
      sql`cardinality(${table.invalidationTags}) BETWEEN 1 AND 128 AND array_position(${table.invalidationTags}, NULL) IS NULL AND array_position(${table.invalidationTags}, '') IS NULL`,
    ),
    check(
      "publication_operations_sync_check",
      sql`${table.attempts} >= 0 AND (
    (${table.syncStatus} = 'pending' AND ${table.syncedAt} IS NULL AND ${table.nextAttemptAt} IS NOT NULL)
    OR (${table.syncStatus} = 'synced' AND ${table.syncedAt} IS NOT NULL AND ${table.nextAttemptAt} IS NULL AND ${table.attempts} > 0 AND ${table.lastAttemptAt} IS NOT NULL)
  )`,
    ),
    index("publication_operations_pending_idx")
      .on(table.nextAttemptAt)
      .where(sql`${table.syncStatus} = 'pending'`),
  ],
);
