import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import { sql } from "drizzle-orm";
import pg from "pg";
import {
  CmsDatabaseError,
  transactionDatabase,
} from "../../cms/db/transactions.ts";
import { databaseConnectionOptions } from "../../cms/db/connection-options.ts";
import { createLocalPgDatabase } from "../../cms/db/local-pg.ts";

const localUrl =
  "postgresql://fixture:never-output-me@127.0.0.1:54321/website_cms_test_unit";
const limits = databaseConnectionOptions("local-pg", localUrl).limits;
const result = (command) => ({ command, rows: [], rowCount: 0 });
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

function fixture(fail = async () => {}) {
  const calls = [];
  const released = [];
  const client = new EventEmitter();
  client.query = async (text, values) => {
    calls.push([text, values]);
    const override = await fail(text, values);
    return override ?? result(text.split(" ")[0]);
  };
  client.release = (destroy) => released.push(destroy);
  const pool = new EventEmitter();
  pool.connect = async () => {
    calls.push(["connect"]);
    return client;
  };
  pool.end = async () => {
    calls.push(["end"]);
  };
  const db = transactionDatabase(pool, limits);
  return { db, pool, client, calls, released };
}
const commands = (f) => f.calls.map(([text]) => text);
const safeError = (phase, state) => (error) => {
  assert.ok(error instanceof CmsDatabaseError);
  assert.equal(error.phase, phase);
  assert.equal(error.sqlState, state);
  assert.ok(!JSON.stringify(error).includes("never-output-me"));
  assert.ok(!error.message.includes("never-output-me"));
  assert.equal(error.cause, undefined);
  return true;
};

test("transaction pins one client, parameterizes Drizzle SQL and commits callback result", async () => {
  const f = fixture(async (text) =>
    text.startsWith("select")
      ? { ...result("SELECT"), rows: [{ value: "private fixture" }] }
      : undefined,
  );
  assert.deepEqual(f.calls, []);
  const value = await f.db.transaction(async (tx) => {
    const first = await tx.query(sql`select ${"never-output-me"} as value`);
    assert.equal(first.rows[0].value, "private fixture");
    await tx.query(sql`select ${first.rows[0].value}`);
    return 42;
  });
  assert.equal(value, 42);
  assert.equal(commands(f).filter((x) => x === "connect").length, 1);
  assert.equal(commands(f)[1], "BEGIN ISOLATION LEVEL READ COMMITTED");
  assert.match(commands(f)[2], /set_config.*statement_timeout/);
  assert.deepEqual(f.calls[3], ["select $1 as value", ["never-output-me"]]);
  assert.equal(commands(f).at(-1), "COMMIT");
  assert.deepEqual(f.released, [false]);
  assert.equal(f.client.listenerCount("error"), 0);
  await f.db.close();
});

test("callback rejection rolls back, preserves caller error and releases a healthy client", async () => {
  const f = fixture();
  const original = new Error("private callback error");
  await assert.rejects(
    f.db.transaction(async (tx) => {
      await tx.query(sql`select 1`);
      throw original;
    }),
    (error) => error === original,
  );
  assert.equal(commands(f).at(-1), "ROLLBACK");
  assert.ok(!commands(f).includes("COMMIT"));
  assert.deepEqual(f.released, [false]);
  await f.db.close();
});

for (const phase of ["acquire", "begin", "query", "commit", "rollback"]) {
  test(`transaction ${phase} failure is redacted, not retried, and safely released`, async () => {
    const secret = Object.assign(new Error("never-output-me"), {
      code: "08006",
      detail: "never-output-me",
    });
    const f = fixture(async (text) => {
      if (
        (phase === "begin" && text.startsWith("BEGIN")) ||
        (phase === "query" && text.startsWith("select")) ||
        text === phase.toUpperCase()
      )
        throw secret;
    });
    if (phase === "acquire")
      f.pool.connect = async () => {
        throw secret;
      };
    const call = f.db.transaction(async (tx) => {
      await tx.query(sql`select 1`);
      if (phase === "rollback") throw new Error("callback failed");
    });
    await assert.rejects(
      call,
      phase === "rollback"
        ? (error) => {
            assert.ok(error instanceof AggregateError);
            assert.equal(error.errors[0].message, "callback failed");
            return safeError("rollback", "08006")(error.errors[1]);
          }
        : (error) => {
            safeError(phase, "08006")(error);
            assert.equal(
              error.commitOutcome,
              phase === "commit" ? "unknown" : undefined,
            );
            return true;
          },
    );
    assert.equal(
      commands(f).filter((x) => x.startsWith("BEGIN")).length,
      phase === "acquire" ? 0 : 1,
    );
    assert.equal(f.released.length, phase === "acquire" ? 0 : 1);
    if (["begin", "query", "commit", "rollback"].includes(phase))
      assert.deepEqual(f.released, [true]);
    await f.db.close();
  });
}

test("caught SQL error still aborts; a COMMIT that returns ROLLBACK is never success", async () => {
  const f = fixture(async (text) => {
    if (text === "select 1")
      throw Object.assign(new Error("private"), { code: "23505" });
  });
  await assert.rejects(
    f.db.transaction(async (tx) => {
      await assert.rejects(
        tx.query(sql`select 1`),
        safeError("query", "23505"),
      );
      return "not success";
    }),
    safeError("query", "23505"),
  );
  assert.ok(!commands(f).includes("COMMIT"));
  await f.db.close();
  const aborted = fixture(async (text) =>
    text === "COMMIT" ? result("ROLLBACK") : undefined,
  );
  await assert.rejects(
    aborted.db.transaction(async () => 1),
    safeError("commit"),
  );
  assert.deepEqual(aborted.released, [true]);
  await aborted.db.close();
});

test("connection errors and client query timeouts discard the checked-out connection", async () => {
  const f = fixture();
  await assert.rejects(
    f.db.transaction(async () => {
      f.client.emit("error", new Error("never-output-me"));
    }),
    safeError("query"),
  );
  assert.deepEqual(f.released, [true]);
  f.pool.emit("error", new Error("idle never-output-me")); // no unhandled event/log
  await f.db.close();
  const timed = fixture(async (text) => {
    if (text === "select 1") throw new Error("query timeout never-output-me");
  });
  await assert.rejects(
    timed.db.transaction((tx) => tx.query(sql`select 1`)),
    safeError("query"),
  );
  assert.deepEqual(timed.released, [true]);
  await timed.db.close();
});

test("escaped, parallel and unfinished queries cannot commit or outlive client ownership", async () => {
  const started = deferred();
  const finish = deferred();
  const f = fixture(async (text) => {
    if (text === "select 1") {
      started.resolve();
      await finish.promise;
    }
  });
  let escaped;
  const operation = f.db.transaction(async (tx) => {
    escaped = tx;
    void tx.query(sql`select 1`);
    await started.promise;
    await assert.rejects(tx.query(sql`select 2`), safeError("usage"));
  });
  await started.promise;
  assert.deepEqual(f.released, []);
  finish.resolve();
  await assert.rejects(operation, safeError("usage"));
  await assert.rejects(escaped.query(sql`select 3`), safeError("usage"));
  assert.ok(!commands(f).includes("COMMIT"));
  assert.ok(!commands(f).includes("select 2"));
  assert.ok(!commands(f).includes("select 3"));
  assert.deepEqual(f.released, [false]);
  await f.db.close();
});

test("unfinished query is drained then rolled back even without a parallel call", async () => {
  const started = deferred();
  const finish = deferred();
  const f = fixture(async (text) => {
    if (text === "select 1") {
      started.resolve();
      await finish.promise;
    }
  });
  const operation = f.db.transaction(async (tx) => {
    void tx.query(sql`select 1`);
  });
  await started.promise;
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(f.released, []);
  assert.ok(!commands(f).includes("COMMIT"));
  finish.resolve();
  await assert.rejects(operation, safeError("usage"));
  assert.equal(commands(f).at(-1), "ROLLBACK");
  await f.db.close();
});

test("close is idempotent, drains accepted transactions and immediately refuses new work", async () => {
  const gate = deferred();
  const started = deferred();
  const f = fixture();
  const work = f.db.transaction(async () => {
    started.resolve();
    await gate.promise;
  });
  await started.promise;
  const close = f.db.close();
  assert.equal(close, f.db.close());
  await assert.rejects(
    f.db.transaction(async () => 1),
    safeError("usage"),
  );
  assert.ok(!commands(f).includes("end"));
  gate.resolve();
  await work;
  await close;
  assert.equal(commands(f).at(-1), "end");
  assert.equal(f.pool.listenerCount("error"), 0);
});

test("pool close failure is redacted and the same failed close is retained", async () => {
  const f = fixture();
  f.pool.end = async () => {
    throw new Error("never-output-me");
  };
  const close = f.db.close();
  await assert.rejects(close, safeError("close"));
  assert.equal(close, f.db.close());
});

test("driver configuration requires explicit bounded transport inputs, never env fallback", () => {
  for (const [driver, url] of [
    ["invalid-driver", localUrl],
    ["local-pg", localUrl.replace(":54321", ":0")],
    ["local-pg", localUrl.replace(":54321", ":65536")],
    ["local-pg", undefined],
    ["local-pg", ""],
    [
      "local-pg",
      localUrl.replace("127.0.0.1", "db.abcdefghijklmnopqrst.supabase.co"),
    ],
    ["local-pg", localUrl.replace(":54321", "")],
    ["local-pg", localUrl.replace("never-output-me", "")],
    ["local-pg", `${localUrl}?host=remote`],
    ["local-pg", `${localUrl}#secret`],
    ["local-pg", localUrl.replace("never-output-me", "%00")],
  ])
    assert.throws(
      () => databaseConnectionOptions(driver, url),
      (error) => !error.message.includes("never-output-me"),
    );
  for (const overrides of [
    { maxConnections: 0 },
    { maxConnections: 11 },
    { statementTimeoutMs: NaN },
    { connectionTimeoutMs: 2_147_483_648 },
    { queryTimeoutMs: 1 },
    { lockTimeoutMs: 6000 },
    { maxConnections: 1.5 },
    { extra: 1 },
    { queryTimeoutMs: undefined },
  ])
    assert.throws(() =>
      databaseConnectionOptions("local-pg", localUrl, overrides),
    );
  const configured = databaseConnectionOptions("local-pg", localUrl);
  assert.equal(configured.pool.host, "127.0.0.1");
  assert.equal(configured.pool.ssl, false);
  assert.equal(configured.pool.connectionTimeoutMillis, 3000);
});

test("local pg real factory is lazy and uses the shared interactive boundary (stubbed connection only)", async (t) => {
  let connects = 0;
  const f = fixture();
  t.mock.method(pg.Pool.prototype, "connect", async function () {
    connects++;
    assert.equal(this.options.max, 2);
    assert.equal(this.options.query_timeout, 6000);
    assert.equal(this.options.password, "never-output-me");
    return f.client;
  });
  const db = await createLocalPgDatabase(localUrl);
  assert.equal(connects, 0);
  assert.equal(
    await db.transaction(async (tx) => {
      await tx.query(sql`select 1`);
      return 7;
    }),
    7,
  );
  assert.equal(connects, 1);
  assert.equal(commands(f).at(-1), "COMMIT");
  await db.close();
  await f.db.close();
});
