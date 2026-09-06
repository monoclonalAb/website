import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { sql } from "drizzle-orm";
import { createLocalPgDatabase } from "../../cms/db/local-pg.ts";
import { CmsDatabaseError } from "../../cms/db/transactions.ts";

// Called only AFTER migration harness confirms target, role and table isolation.
// Session-private TEMP tables are the only committed fixtures. close() removes
// them even on test failure; no content/auth fixtures or permanent DDL are added.
export async function checkTransactionDatabaseContracts(
  t,
  connectionUrl,
  observer,
) {
  const db = await createLocalPgDatabase(connectionUrl, { maxConnections: 1 });
  try {
    let backend;
    await t.test(
      "local pg adapter commits interactive read-dependent writes on one client",
      async () => {
        const count = await db.transaction(async (tx) => {
          await tx.query(
            sql`CREATE TEMP TABLE cms_transaction_fixture (id integer PRIMARY KEY, value text NOT NULL) ON COMMIT PRESERVE ROWS`,
          );
          const identity = await tx.query(
            sql`SELECT pg_backend_pid() AS pid, current_setting('statement_timeout') AS timeout, current_setting('TimeZone') AS zone, (SELECT count(*)::int FROM pg_prepared_statements) AS prepared`,
          );
          backend = identity.rows[0].pid;
          assert.equal(identity.rows[0].timeout, "5s");
          assert.equal(identity.rows[0].zone, "UTC");
          assert.equal(identity.rows[0].prepared, 0);
          await tx.query(
            sql`INSERT INTO cms_transaction_fixture VALUES (${1}, ${"Synthetic transaction fixture"})`,
          );
          const first = await tx.query(
            sql`SELECT id FROM cms_transaction_fixture`,
          );
          await tx.query(
            sql`INSERT INTO cms_transaction_fixture VALUES (${Number(first.rows[0].id) + 1}, ${"Dependent fixture"})`,
          );
          return (
            await tx.query(
              sql`SELECT count(*)::int AS count FROM cms_transaction_fixture`,
            )
          ).rows[0].count;
        });
        assert.equal(count, 2);
        await db.transaction(async (tx) => {
          assert.equal(
            (await tx.query(sql`SELECT pg_backend_pid() AS pid`)).rows[0].pid,
            backend,
          );
          assert.equal(
            (
              await tx.query(
                sql`SELECT count(*)::int AS count FROM cms_transaction_fixture`,
              )
            ).rows[0].count,
            2,
          );
        });
      },
    );

    await t.test(
      "local pg adapter rolls back all writes on callback failure and releases for reuse",
      async () => {
        const failure = new Error("Synthetic callback rejection");
        await assert.rejects(
          db.transaction(async (tx) => {
            await tx.query(
              sql`INSERT INTO cms_transaction_fixture VALUES (3, 'Must roll back')`,
            );
            await tx.query(
              sql`UPDATE cms_transaction_fixture SET value = 'Must also roll back' WHERE id = 1`,
            );
            throw failure;
          }),
          (error) => error === failure,
        );
        await db.transaction(async (tx) => {
          const rows = await tx.query(
            sql`SELECT * FROM cms_transaction_fixture ORDER BY id`,
          );
          assert.deepEqual(rows.rows, [
            { id: 1, value: "Synthetic transaction fixture" },
            { id: 2, value: "Dependent fixture" },
          ]);
          assert.equal(
            (await tx.query(sql`SELECT pg_backend_pid() AS pid`)).rows[0].pid,
            backend,
          );
        });
      },
    );

    await t.test(
      "local pg adapter rejects even swallowed SQL failure and rolls back earlier writes",
      async () => {
        await assert.rejects(
          db.transaction(async (tx) => {
            await tx.query(
              sql`INSERT INTO cms_transaction_fixture VALUES (3, 'Must roll back')`,
            );
            await assert.rejects(
              tx.query(
                sql`INSERT INTO cms_transaction_fixture VALUES (1, 'Duplicate')`,
              ),
              (error) => error.sqlState === "23505",
            );
            return "Must not acknowledge success";
          }),
          (error) =>
            error instanceof CmsDatabaseError && error.sqlState === "23505",
        );
        await db.transaction(async (tx) => {
          assert.equal(
            (
              await tx.query(
                sql`SELECT count(*)::int AS count FROM cms_transaction_fixture`,
              )
            ).rows[0].count,
            2,
          );
        });
      },
    );
  } finally {
    await db.close();
  }
  await assert.rejects(
    db.transaction(async () => 1),
    (error) => error.phase === "usage",
  );

  await t.test(
    "local pg close removes committed session-private fixtures",
    async () => {
      // pg Pool.end initiates local client shutdown, not completion of backend
      // exit/catalog cleanup. A fresh observer snapshot can briefly see the TEMP
      // table (reproduced at baseline). Observe actual removal within a bounded
      // window; never replace cleanup proof with a sleep or an unchecked retry.
      const deadline = performance.now() + 2_000;
      let count;
      do {
        count = (
          await observer.query(
            "SELECT count(*)::int AS count FROM pg_class WHERE relname = 'cms_transaction_fixture'",
          )
        ).rows[0].count;
        if (count === 0) break;
        await delay(20);
      } while (performance.now() < deadline);
      assert.equal(count, 0, "Closed adapter TEMP fixtures must disappear");
    },
  );

  await t.test(
    "local pg pool acquisition timeout rejects queued work without running its callback",
    async () => {
      const single = await createLocalPgDatabase(connectionUrl, {
        maxConnections: 1,
        connectionTimeoutMs: 100,
      });
      let release;
      let announce;
      const hold = new Promise((resolve) => {
        release = resolve;
      });
      const started = new Promise((resolve) => {
        announce = resolve;
      });
      const first = single.transaction(async () => {
        announce();
        await hold;
      });
      let called = false;
      try {
        // If the first connection itself fails, observe that rejection rather than
        // leaving a barrier hanging forever.
        await Promise.race([started, first]);
        await assert.rejects(
          single.transaction(async () => {
            called = true;
          }),
          (error) => error.phase === "acquire",
        );
        assert.equal(called, false);
      } finally {
        release();
        await Promise.allSettled([first]);
        await single.close();
      }
    },
  );

  await t.test(
    "local pg statement timeout rolls back and leaves the adapter usable",
    async () => {
      const bounded = await createLocalPgDatabase(connectionUrl, {
        maxConnections: 1,
        statementTimeoutMs: 100,
        lockTimeoutMs: 50,
        queryTimeoutMs: 1000,
      });
      try {
        await assert.rejects(
          bounded.transaction(async (tx) => {
            await tx.query(
              sql`CREATE TEMP TABLE cms_timeout_fixture (id integer)`,
            );
            await tx.query(sql`INSERT INTO cms_timeout_fixture VALUES (1)`);
            await tx.query(sql`SELECT pg_sleep(2)`);
          }),
          (error) => error.phase === "query" && error.sqlState === "57014",
        );
        await bounded.transaction(async (tx) => {
          assert.equal(
            (
              await tx.query(
                sql`SELECT to_regclass('pg_temp.cms_timeout_fixture') AS name`,
              )
            ).rows[0].name,
            null,
          );
          assert.equal(
            (await tx.query(sql`SELECT 1 AS value`)).rows[0].value,
            1,
          );
        });
      } finally {
        await bounded.close();
      }
    },
  );

  await t.test(
    "local pg concurrent callbacks have separate pinned clients, not pool.query transactions",
    async () => {
      const concurrent = await createLocalPgDatabase(connectionUrl, {
        maxConnections: 2,
      });
      let release;
      const both = new Promise((resolve) => {
        release = resolve;
      });
      let arrived = 0;
      const operations = [1, 2].map((id) =>
        concurrent.transaction(async (tx) => {
          const before = (await tx.query(sql`SELECT pg_backend_pid() AS pid`))
            .rows[0].pid;
          await tx.query(
            sql`CREATE TEMP TABLE cms_parallel_fixture (id integer) ON COMMIT DROP`,
          );
          await tx.query(sql`INSERT INTO cms_parallel_fixture VALUES (${id})`);
          if (++arrived === 2) release();
          // Bound the barrier too so a failed peer cannot hang the test/close path.
          let timeout;
          try {
            await Promise.race([
              both,
              new Promise((_, reject) => {
                timeout = setTimeout(
                  () =>
                    reject(new Error("Concurrent fixture barrier timed out")),
                  3000,
                );
              }),
            ]);
          } finally {
            clearTimeout(timeout);
          }
          assert.deepEqual(
            (await tx.query(sql`SELECT id FROM cms_parallel_fixture`)).rows,
            [{ id }],
          );
          assert.equal(
            (await tx.query(sql`SELECT pg_backend_pid() AS pid`)).rows[0].pid,
            before,
          );
          return before;
        }),
      );
      try {
        const pids = await Promise.all(operations);
        assert.notEqual(pids[0], pids[1]);
      } finally {
        await Promise.allSettled(operations);
        await concurrent.close();
      }
    },
  );
}
