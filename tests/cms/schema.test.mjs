import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api";
import { getTableConfig } from "drizzle-orm/pg-core";
import * as schema from "../../cms/db/schema.ts";

const read = (path) =>
  readFileSync(
    new URL(`../../cms/db/migrations/${path}`, import.meta.url),
    "utf8",
  );

test("Drizzle definitions and generated migration snapshot have no schema drift (no DB)", async () => {
  const snapshots = [0, 1, 2, 3].map((index) =>
    JSON.parse(read(`meta/${String(index).padStart(4, "0")}_snapshot.json`)),
  );
  const latest = snapshots[3];
  const current = generateDrizzleJson(schema, latest.id);
  assert.deepEqual(await generateMigration(latest, current), []);
  const generatedSteps = [
    [generateDrizzleJson({}), snapshots[0], "0000_cms_foundation.sql"],
    [snapshots[1], snapshots[2], "0002_studio_auth_foundation.sql"],
  ];
  for (const [previous, next, file] of generatedSteps) {
    const statements = await generateMigration(previous, next);
    assert.equal(
      statements.join(";\n").replace(/\s+/g, "").replaceAll(";", ""),
      read(file)
        .replaceAll("--> statement-breakpoint", "")
        .replace(/\s+/g, "")
        .replaceAll(";", ""),
      file,
    );
  }
  // Custom trigger migrations do not alter the generated table snapshots.
  assert.deepEqual(await generateMigration(snapshots[0], snapshots[1]), []);
  assert.deepEqual(await generateMigration(snapshots[2], snapshots[3]), []);
});

test("drafts, durable revisions, same-post publication pointers and retry receipts are distinct", () => {
  const posts = getTableConfig(schema.posts);
  const revisions = getTableConfig(schema.revisions);
  const operations = getTableConfig(schema.publicationOperations);
  assert.equal(schema.posts.publishedRevisionId.notNull, false);
  assert.equal(schema.posts.firstPublishedAt.notNull, false);
  assert.equal(schema.posts.draft.notNull, true);
  assert.equal(schema.revisions.snapshot.notNull, true);
  assert.ok(
    posts.foreignKeys.some(
      (key) =>
        key.getName() === "posts_own_published_revision_fk" &&
        key.reference().columns.length === 2,
    ),
  );
  assert.ok(
    revisions.uniqueConstraints.some(
      (key) => key.name === "revisions_post_draft_version_key",
    ),
  );
  assert.ok(
    operations.uniqueConstraints.some(
      (key) => key.name === "publication_operations_post_version_key",
    ),
  );
  assert.equal(schema.publicationOperations.id.primary, true);
  assert.equal(schema.publicationOperations.syncStatus.default, "pending");
  assert.ok(
    operations.indexes.some(
      (idx) => idx.config.name === "publication_operations_pending_idx",
    ),
  );
});

test("migration journal retains the custom immutable-history and slug-lock guards", () => {
  const journal = JSON.parse(read("meta/_journal.json"));
  assert.deepEqual(
    journal.entries.map((entry) => entry.tag),
    [
      "0000_cms_foundation",
      "0001_cms_integrity",
      "0002_studio_auth_foundation",
      "0003_studio_auth_integrity",
    ],
  );
  const sql = read("0001_cms_integrity.sql");
  for (const trigger of [
    "posts_guard_update",
    "revisions_immutable",
    "publication_operations_no_delete",
    "publication_operations_guard_update",
  ]) {
    assert.match(sql, new RegExp(`CREATE TRIGGER ${trigger}\\b`));
  }
  // Artifact presence only. PostgreSQL syntax/behavior needs test:cms:db.
  assert.match(sql, /OLD\.first_published_at IS NOT NULL/);
  assert.match(sql, /NEW\.slug IS DISTINCT FROM OLD\.slug/);
  assert.match(sql, /BEFORE UPDATE OR DELETE ON revisions/);
});

test("auth tables keep singleton identity, public keys, hashed sessions and ceremony bindings separate", () => {
  const owner = getTableConfig(schema.studioOwner);
  const credentials = getTableConfig(schema.studioCredentials);
  const sessions = getTableConfig(schema.studioSessions);
  const challenges = getTableConfig(schema.studioChallenges);
  assert.ok(
    owner.checks.some(
      (constraint) => constraint.name === "studio_owner_singleton_check",
    ),
  );
  assert.equal(schema.studioCredentials.credentialId.isUnique, true);
  assert.equal(schema.studioSessions.tokenHash.isUnique, true);
  assert.equal(schema.studioChallenges.challenge.isUnique, true);
  assert.equal(schema.studioChallenges.enrollmentTokenHash.notNull, false);
  assert.equal(schema.studioChallenges.authorizingSessionId.notNull, false);
  assert.equal(schema.studioSessions.authVersion.notNull, true);
  assert.equal(schema.studioChallenges.authVersion.notNull, true);
  assert.ok(
    sessions.foreignKeys.some(
      (fk) => fk.reference().foreignTable === schema.studioCredentials,
    ),
  );
  assert.ok(
    challenges.foreignKeys.some(
      (fk) => fk.reference().foreignTable === schema.studioSessions,
    ),
  );
  for (const table of [owner, credentials, sessions, challenges]) {
    assert.ok(
      table.columns.every(
        (column) =>
          ![
            "password",
            "private_key",
            "token",
            "session_token",
            "enrollment_token",
            "browser_binding_token",
          ].includes(column.name),
      ),
    );
  }
});

test("auth custom migration retains irreversible revocation, session lifetime and challenge identity guards", () => {
  const sql = read("0003_studio_auth_integrity.sql");
  for (const trigger of [
    "studio_owner_guard_update",
    "studio_credentials_guard_update",
    "studio_sessions_guard_update",
    "studio_challenges_guard_update",
  ]) {
    assert.match(sql, new RegExp(`CREATE TRIGGER ${trigger}\\b`));
  }
  assert.match(
    sql,
    /NEW\.auth_version::bigint <> OLD\.auth_version::bigint \+ 1/,
  );
  assert.match(sql, /NEW\.counter < OLD\.counter/);
  assert.match(sql, /OLD\.revoked_at IS NOT NULL/);
  assert.match(sql, /OLD\.consumed_at IS NOT NULL OR NEW\.consumed_at IS NULL/);
  // Presence/drift only; actual SQL guards still need the isolated DB suite.
});
