import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { isolatedTestTarget } from "../helpers/cms-test-target.mjs";
import { checkAuthDatabaseContracts } from "../helpers/cms-auth-db-checks.mjs";
import { checkTransactionDatabaseContracts } from "../helpers/cms-transaction-db-checks.mjs";

// Opt-in only; an absent target FAILS as blocked, never silently skips/passes.
// Migrations remain in the dedicated test DB; all fixture writes roll back.
test("isolated PostgreSQL migration and constraint checks (not a publishing service)", async (t) => {
  const target = isolatedTestTarget(process.env);
  const client = new pg.Client(target);
  try {
    await client.connect();
  } catch {
    await client.end().catch(() => {});
    throw new Error(
      "BLOCKED: isolated CMS test database connection failed; details redacted. No migrations attempted.",
    );
  }
  t.after(() => client.end());
  const identity = await client.query(
    "SELECT current_database() AS name, current_user AS role",
  );
  assert.equal(
    identity.rows[0].name,
    target.database,
    "Connected database must match confirmed target",
  );
  assert.equal(identity.rows[0].role, target.user);
  const privileges = (
    await client.query(
      "SELECT rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls FROM pg_roles WHERE rolname = current_user",
    )
  ).rows[0];
  assert.ok(
    Object.values(privileges).every((value) => value === false),
    "Refusing privileged test role: use a dedicated non-superuser database owner without cluster-wide privileges",
  );
  const tables = await client.query(
    "SELECT schemaname, tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')",
  );
  const allowed = new Set([
    "public.posts",
    "public.revisions",
    "public.publication_operations",
    "public.studio_owner",
    "public.studio_credentials",
    "public.studio_sessions",
    "public.studio_challenges",
    "drizzle.__drizzle_migrations",
  ]);
  assert.ok(
    tables.rows.every((row) =>
      allowed.has(`${row.schemaname}.${row.tablename}`),
    ),
    "Refusing test database with unrelated tables",
  );
  const db = drizzle(client);
  const config = {
    migrationsFolder: fileURLToPath(
      new URL("../../cms/db/migrations", import.meta.url),
    ),
  };
  await migrate(db, config);
  const readJournal = async () =>
    (
      await client.query(
        "SELECT * FROM drizzle.__drizzle_migrations ORDER BY id",
      )
    ).rows;
  const migratedJournal = await readJournal();
  await migrate(db, config);
  assert.deepEqual(
    await readJournal(),
    migratedJournal,
    "Replay must not rewrite migration receipts",
  );
  assert.equal(
    (
      await client.query(
        "SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations",
      )
    ).rows[0].count,
    4,
  );

  const fixtureCounts = async () => {
    const counts = {};
    // Names come only from this file's fixed allowlist, never caller input.
    for (const table of allowed) {
      if (table.startsWith("public."))
        counts[table] = (
          await client.query(`SELECT count(*)::int AS count FROM ${table}`)
        ).rows[0].count;
    }
    return counts;
  };
  const beforeFixtures = await fixtureCounts();
  await client.query("BEGIN");
  try {
    const postId = "00000000-0000-4000-8000-000000000011";
    const otherPostId = "00000000-0000-4000-8000-000000000012";
    const revisionId = "00000000-0000-4000-8000-000000000013";
    const operationId = "00000000-0000-4000-8000-000000000014";
    const snapshot = {
      schema_version: 1,
      body: {
        schema_version: 1,
        doc: { type: "doc", content: [{ type: "paragraph" }] },
      },
      metadata: {
        schema_version: 1,
        collection: "blog",
        title: "Isolated DB test fixture",
        date: "2026-09-05",
      },
      media: [],
    };
    const reject = async (sql, params, code) => {
      await client.query("SAVEPOINT rejected_write");
      await assert.rejects(
        client.query(sql, params),
        (error) => error.code === code,
      );
      await client.query("ROLLBACK TO SAVEPOINT rejected_write");
      await client.query("RELEASE SAVEPOINT rejected_write");
    };
    await client.query(
      "INSERT INTO posts (id, collection, slug, draft_schema_version, draft) VALUES ($1, 'blog', 'db-fixture-one', 1, $3), ($2, 'blog', 'db-fixture-two', 1, $3)",
      [postId, otherPostId, snapshot],
    );
    await client.query(
      "INSERT INTO revisions (id, post_id, collection, draft_version, schema_version, snapshot) VALUES ($1, $2, 'blog', 1, 1, $3)",
      [revisionId, postId, snapshot],
    );

    await t.test(
      "published references cannot point at another post's revision",
      async () => {
        await reject(
          "UPDATE posts SET version = 2, first_published_at = now(), published_at = now(), published_revision_id = $1 WHERE id = $2",
          [revisionId, otherPostId],
          "23503",
        );
        await client.query(
          "UPDATE posts SET version = 2, first_published_at = now(), published_at = now(), published_revision_id = $1 WHERE id = $2 AND version = 1",
          [revisionId, postId],
        );
      },
    );

    await t.test(
      "draft edits leave immutable revision body and metadata unchanged",
      async () => {
        const changed = structuredClone(snapshot);
        changed.metadata.title = "Private edited fixture";
        await client.query(
          "UPDATE posts SET version = 3, draft_version = 2, draft = $1 WHERE id = $2 AND version = 2",
          [changed, postId],
        );
        assert.deepEqual(
          (
            await client.query("SELECT snapshot FROM revisions WHERE id = $1", [
              revisionId,
            ])
          ).rows[0].snapshot,
          snapshot,
        );
        await reject(
          "UPDATE revisions SET snapshot = $1 WHERE id = $2",
          [changed, revisionId],
          "23514",
        );
        await reject(
          "DELETE FROM revisions WHERE id = $1",
          [revisionId],
          "23514",
        );
      },
    );

    await t.test(
      "unpublish keeps history and the permanent slug lock",
      async () => {
        await client.query(
          "UPDATE posts SET version = 4, published_at = NULL, published_revision_id = NULL WHERE id = $1 AND version = 3",
          [postId],
        );
        const state = (
          await client.query("SELECT * FROM posts WHERE id = $1", [postId])
        ).rows[0];
        assert.equal(state.published_revision_id, null);
        assert.ok(state.first_published_at);
        await reject(
          "UPDATE posts SET version = 5, slug = 'changed' WHERE id = $1",
          [postId],
          "23514",
        );
        await reject(
          "UPDATE posts SET version = 5, first_published_at = NULL WHERE id = $1",
          [postId],
          "23514",
        );
        assert.equal(
          (
            await client.query(
              "SELECT count(*)::int AS count FROM revisions WHERE post_id = $1",
              [postId],
            )
          ).rows[0].count,
          1,
        );
      },
    );

    await t.test(
      "conditional stale writes affect no rows; version and JSON envelope checks fail closed",
      async () => {
        assert.equal(
          (
            await client.query(
              "UPDATE posts SET version = version + 1 WHERE id = $1 AND version = 2",
              [postId],
            )
          ).rowCount,
          0,
        );
        await reject(
          "UPDATE posts SET version = 6 WHERE id = $1",
          [postId],
          "23514",
        );
        await reject(
          "UPDATE posts SET version = 5, draft_version = 3, draft = '{}'::jsonb WHERE id = $1",
          [postId],
          "23514",
        );
      },
    );

    await t.test(
      "idempotency receipts persist pending sync and cannot be rewritten/reused",
      async () => {
        const insert =
          "INSERT INTO publication_operations (id, post_id, kind, expected_version, expected_draft_version, result_version, request_hash, revision_id, invalidation_tags) VALUES ($1, $2, 'publish', 1, 1, 2, $3, $4, ARRAY['fixture:detail', 'fixture:blog'])";
        const params = [operationId, postId, "a".repeat(64), revisionId];
        await client.query(insert, params);
        await reject(insert, params, "23505");
        assert.equal(
          (
            await client.query(
              "SELECT sync_status FROM publication_operations WHERE id = $1",
              [operationId],
            )
          ).rows[0].sync_status,
          "pending",
        );
        await reject(
          "UPDATE publication_operations SET request_hash = $2 WHERE id = $1",
          [operationId, "b".repeat(64)],
          "23514",
        );
        await client.query(
          "UPDATE publication_operations SET attempts = 1, last_attempt_at = now(), next_attempt_at = now() WHERE id = $1",
          [operationId],
        );
        await client.query(
          "UPDATE publication_operations SET sync_status = 'synced', synced_at = now(), next_attempt_at = NULL WHERE id = $1",
          [operationId],
        );
        await reject(
          "UPDATE publication_operations SET sync_status = 'pending', synced_at = NULL, next_attempt_at = now() WHERE id = $1",
          [operationId],
          "23514",
        );
        await reject(
          "DELETE FROM publication_operations WHERE id = $1",
          [operationId],
          "23514",
        );
      },
    );
    await checkAuthDatabaseContracts(t, client);
  } finally {
    await client.query("ROLLBACK");
  }
  await checkTransactionDatabaseContracts(
    t,
    process.env.CMS_TEST_DATABASE_URL,
    client,
  );
  await t.test(
    "all content and auth fixture rows roll back; migration receipts remain",
    async () => {
      assert.deepEqual(await fixtureCounts(), beforeFixtures);
      assert.deepEqual(await readJournal(), migratedJournal);
    },
  );
});
