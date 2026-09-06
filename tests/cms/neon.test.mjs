import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import {
  checkServerIdentity,
  createSecureContext,
  rootCertificates,
} from "node:tls";
import test from "node:test";
import pg from "pg";
import { sql } from "drizzle-orm";
import { neonConnectionOptions } from "../../cms/db/connection-options.ts";
import { isolatedTestTarget } from "../helpers/cms-test-target.mjs";
import { CmsDatabaseError } from "../../cms/db/transactions.ts";

// Synthetic endpoints/credentials only. All acquisitions are stubbed BEFORE the
// real factory is imported. No test resolves or connects to a hosted endpoint.
const directHost = "ep-cms-fixture-a1b2c3d4.ap-southeast-2.aws.neon.tech";
const pooledHost =
  "ep-cms-fixture-a1b2c3d4-pooler.ap-southeast-2.aws.neon.tech";
const configuration = (mode = "pooled") => ({
  connectionUrl: `postgresql://cms_runtime:never-output-me@${mode === "direct" ? directHost : pooledHost}:5432/postgres`,
  mode,
  tls: { trust: "system" },
  // pg's option is opportunistic, not channel_binding=require.
  channelBinding: "prefer",
});
const refused = (error) => {
  assert.equal(
    error.message,
    "Invalid CMS database configuration; details redacted.",
  );
  assert.equal(error.cause, undefined);
  assert.ok(!JSON.stringify(error).includes("never-output-me"));
  return true;
};

for (const mode of ["direct", "pooled"]) {
  test(`Neon ${mode} configuration pins endpoint, mode, verified TLS and bounded pg options`, () => {
    const config = configuration(mode);
    const { pool, limits } = neonConnectionOptions(config);
    assert.equal(pool.host, mode === "direct" ? directHost : pooledHost);
    assert.equal(pool.port, 5432);
    assert.equal(pool.user, "cms_runtime");
    assert.equal(pool.ssl.rejectUnauthorized, true);
    assert.equal(pool.ssl.minVersion, "TLSv1.2");
    assert.equal(pool.ssl.servername, pool.host);
    assert.equal(pool.ssl.checkServerIdentity, checkServerIdentity);
    assert.equal(pool.ssl.ca, undefined);
    assert.equal(pool.enableChannelBinding, true);
    assert.equal(pool.connectionString, undefined);
    assert.equal(pool.max, 2);
    assert.equal(pool.connectionTimeoutMillis, 3000);
    assert.equal(pool.query_timeout, 6000);
    assert.equal(limits.statementTimeoutMs, 5000);
    assert.equal(pool.options.trim(), ""); // no startup session state
    assert.equal(pool.statement_timeout, undefined); // set inside BEGIN instead
    assert.doesNotThrow(() => createSecureContext(pool.ssl));
    assert.equal(
      pool.ssl.checkServerIdentity(pool.host, {
        subjectaltname: "DNS:not-the-configured-host.invalid",
      }).code,
      "ERR_TLS_CERT_ALTNAME_INVALID",
    );
  });
}

test("Neon endpoint validation accepts current AWS region shapes with the pooler suffix as the mode boundary", () => {
  const alternateDirect = directHost.replace("ap-southeast-2", "us-east-2");
  const alternatePooled = pooledHost.replace("ap-southeast-2", "us-east-2");
  assert.equal(
    neonConnectionOptions({
      ...configuration("direct"),
      connectionUrl: configuration("direct").connectionUrl.replace(
        directHost,
        alternateDirect,
      ),
    }).pool.host,
    alternateDirect,
  );
  assert.equal(
    neonConnectionOptions({
      ...configuration("pooled"),
      connectionUrl: configuration("pooled").connectionUrl.replace(
        pooledHost,
        alternatePooled,
      ),
    }).pool.host,
    alternatePooled,
  );
});

test("Neon channel binding is explicitly opportunistic; mandatory URL/config requests are refused, not discarded", () => {
  assert.equal(
    neonConnectionOptions(configuration()).pool.enableChannelBinding,
    true,
  );
  assert.throws(
    () =>
      neonConnectionOptions({
        ...configuration(),
        channelBinding: "require",
      }),
    refused,
  );
  assert.throws(
    () =>
      neonConnectionOptions({
        ...configuration(),
        connectionUrl:
          configuration().connectionUrl + "?channel_binding=require",
      }),
    refused,
  );
});

test("Neon endpoint/mode and security-directive refusal is redacted and cannot widen local isolation", () => {
  const base = configuration();
  for (const input of [
    undefined,
    null,
    {},
    { ...base, mode: undefined },
    { ...base, mode: "auto" },
    { ...base, channelBinding: undefined },
    { ...base, channelBinding: "require" },
    { ...base, channelBinding: "disable" },
    { ...base, extra: "never-output-me" },
  ])
    assert.throws(() => neonConnectionOptions(input), refused);
  for (const url of [
    undefined,
    "",
    "never-output-me",
    "https://neon.tech",
    base.connectionUrl.replace(pooledHost, "127.0.0.1"),
    base.connectionUrl.replace(
      pooledHost,
      "db.abcdefghijklmnopqrst.supabase.co",
    ),
    base.connectionUrl.replace(pooledHost, "pooler.supabase.com"),
    base.connectionUrl.replace(pooledHost, `${pooledHost}.evil.invalid`),
    base.connectionUrl.replace(pooledHost, "ep-fixture.neon.tech"),
    base.connectionUrl.replace(pooledHost, "ep-fixture.other.neon.tech"),
    base.connectionUrl.replace(pooledHost, "ep--pooler.ap.aws.neon.tech"),
    base.connectionUrl.replace(":5432", ""),
    base.connectionUrl.replace(":5432", ":0"),
    base.connectionUrl.replace(":5432", ":5433"),
    base.connectionUrl.replace(":5432", ":65536"),
    base.connectionUrl.replace("never-output-me", ""),
    base.connectionUrl.replace("never-output-me", "%00"),
    base.connectionUrl.replace("never-output-me", "%ZZ"),
    base.connectionUrl.replace("never-output-me", "never\n-output-me"),
    base.connectionUrl.replace("/postgres", "/postgres/other"),
    ...[
      "?sslmode=disable",
      "?sslmode=require",
      "?sslmode=verify-full",
      "?sslmode=verify-full&channel_binding=require",
      "?channel_binding=require",
      "?sslrootcert=private",
      "?host=elsewhere",
      "?options=private",
      "#private",
    ].map((suffix) => base.connectionUrl + suffix),
  ])
    assert.throws(
      () => neonConnectionOptions({ ...base, connectionUrl: url }),
      refused,
    );
  assert.throws(
    () => neonConnectionOptions({ ...configuration("direct"), mode: "pooled" }),
    refused,
  );
  assert.throws(
    () => neonConnectionOptions({ ...configuration("pooled"), mode: "direct" }),
    refused,
  );
  for (const mode of ["direct", "pooled"])
    assert.throws(
      () =>
        isolatedTestTarget({
          CMS_TEST_DATABASE_URL: configuration(mode).connectionUrl.replace(
            "/postgres",
            "/website_cms_test_fixture",
          ),
          CMS_TEST_DATABASE_CONFIRM: "website_cms_test_fixture",
        }),
      /Refusing CMS test target/,
    );
});

test("Neon TLS requires explicit trust; rejects weakening, file paths and malformed CA bundles", () => {
  for (const tls of [
    undefined,
    false,
    true,
    {},
    { trust: "auto" },
    { trust: "system", rejectUnauthorized: false },
    { trust: "system", checkServerIdentity: () => undefined },
    { trust: "system", servername: "other" },
    { trust: "system", ca: "never-output-me" },
    { trust: "ca" },
    { trust: "ca", ca: "" },
    { trust: "ca", ca: "/private/never-output-me.crt" },
    {
      trust: "ca",
      ca: "-----BEGIN CERTIFICATE-----\ninvalid\n-----END CERTIFICATE-----",
    },
    { trust: "ca", ca: rootCertificates[0] + "garbage" },
    { trust: "ca", ca: "x".repeat(65_537) },
  ])
    assert.throws(
      () => neonConnectionOptions({ ...configuration(), tls }),
      refused,
    );
  // Node's bundled public roots are offline parsing fixtures, NOT Neon CAs.
  const ca = rootCertificates.slice(0, 2).join("\n");
  const { pool } = neonConnectionOptions({
    ...configuration(),
    tls: { trust: "ca", ca },
  });
  assert.equal(pool.ssl.ca, ca);
  assert.equal(pool.ssl.rejectUnauthorized, true);
  assert.equal(pool.ssl.checkServerIdentity, checkServerIdentity);
  assert.doesNotThrow(() => createSecureContext(pool.ssl));
});

test("Neon limits reject unbounded/unknown overrides and decode credentials without pg URL parsing", () => {
  for (const limits of [
    { maxConnections: 11 },
    { queryTimeoutMs: 5000 },
    { connectionTimeoutMs: Infinity },
    { connectionTimeoutMs: 2_147_483_648 },
    { lockTimeoutMs: 6000 },
    { options: "never-output-me" },
    { toString: 1 },
  ])
    assert.throws(
      () => neonConnectionOptions(configuration(), limits),
      refused,
    );
  const config = configuration("direct");
  config.connectionUrl = config.connectionUrl.replace(
    "never-output-me",
    "never%40output%3Ame%2F%3F%23%25",
  );
  const { pool } = neonConnectionOptions(config, {
    maxConnections: 1,
    connectionTimeoutMs: 750,
  });
  assert.equal(pool.password, "never@output:me/?#%");
  assert.equal(pool.max, 1);
  assert.equal(pool.connectionTimeoutMillis, 750);
});

test("actual pg client construction cannot replace explicit Neon credentials/TLS/startup policy with PG env settings (no socket)", (t) => {
  const poison = {
    DATABASE_URL: "never-output-me",
    PGHOST: "other.invalid",
    PGPORT: "1",
    PGUSER: "other",
    PGDATABASE: "other",
    PGPASSWORD: "other",
    PGSSLMODE: "disable",
    PGSSLNEGOTIATION: "never-output-me",
    PGOPTIONS: "-c search_path=other",
    PGREPLICATION: "database",
    PGCLIENT_ENCODING: "other",
  };
  const saved = Object.fromEntries(
    Object.keys(poison).map((key) => [key, process.env[key]]),
  );
  t.after(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  Object.assign(process.env, poison);
  const { pool } = neonConnectionOptions(configuration());
  const client = new pg.Client(pool); // construction only, never connect()
  const params = client.connectionParameters;
  for (const key of [
    "host",
    "port",
    "user",
    "password",
    "database",
    "ssl",
    "options",
    "replication",
    "client_encoding",
    "sslnegotiation",
  ])
    assert.deepEqual(params[key], pool[key]);
  assert.equal(client.enableChannelBinding, true);
  assert.throws(
    () =>
      neonConnectionOptions({
        ...configuration(),
        connectionUrl: undefined,
      }),
    refused,
  );
});

function stubPool(t, phase) {
  const calls = [];
  const released = [];
  let acquisitions = 0;
  let closes = 0;
  const secret = Object.assign(new Error("never-output-me"), { code: "08006" });
  const client = new EventEmitter();
  client.query = async (text, values) => {
    // Passing only text/values never supplies pg's named prepared-statement config.
    assert.equal(typeof text, "string");
    calls.push([text, values]);
    if (
      (phase === "begin" && text.startsWith("BEGIN")) ||
      (phase === "query" && text === "select $1 as value") ||
      text === phase?.toUpperCase()
    )
      throw secret;
    return { command: text.split(" ")[0], rows: [{ value: 7 }], rowCount: 1 };
  };
  client.release = (destroy) => released.push(destroy);
  t.mock.method(pg.Pool.prototype, "connect", async function () {
    acquisitions++;
    assert.equal(this.options.ssl.rejectUnauthorized, true);
    assert.equal(this.options.ssl.servername, pooledHost);
    assert.equal(this.options.enableChannelBinding, true);
    if (phase === "acquire") throw secret;
    return client;
  });
  t.mock.method(pg.Pool.prototype, "end", async () => {
    closes++;
    if (phase === "close") throw secret;
  });
  return {
    calls,
    released,
    acquisitions: () => acquisitions,
    closes: () => closes,
  };
}

test("Neon factory import/construction/unused close are lazy; sequential transactions use unnamed parameterized queries and transaction-local state (offline)", async (t) => {
  const f = stubPool(t);
  const { createNeonDatabase } = await import("../../cms/db/neon.ts");
  const unused = await createNeonDatabase(configuration());
  await unused.close();
  assert.equal(f.acquisitions(), 0);
  assert.equal(f.closes(), 1);
  const db = await createNeonDatabase(configuration());
  assert.equal(f.acquisitions(), 0);
  for (let i = 0; i < 2; i++)
    assert.equal(
      await db.transaction(async (tx) => {
        const read = await tx.query(sql`select ${"never-output-me"} as value`);
        return read.rows[0].value;
      }),
      7,
    );
  assert.equal(f.acquisitions(), 2);
  const state = f.calls.filter(([text]) =>
    text.startsWith("SELECT set_config"),
  );
  assert.equal(state.length, 2);
  for (const [text, values] of state) {
    assert.equal((text.match(/, true\)/g) ?? []).length, 4);
    assert.match(text, /set_config\('TimeZone', 'UTC', true\)/);
    assert.deepEqual(values, ["5000", "1000", "5000"]);
  }
  assert.deepEqual(
    f.calls.filter(([text]) => text.startsWith("select")),
    Array(2).fill(["select $1 as value", ["never-output-me"]]),
  );
  assert.equal(f.calls.filter(([text]) => text === "COMMIT").length, 2);
  assert.deepEqual(f.released, [false, false]);
  const close = db.close();
  assert.equal(close, db.close());
  await close;
  await assert.rejects(
    db.transaction(async () => 1),
    (e) => e.phase === "usage",
  );
  assert.equal(f.closes(), 2);
});

for (const phase of [
  "acquire",
  "begin",
  "query",
  "commit",
  "rollback",
  "close",
]) {
  test(`Neon real factory preserves redacted ${phase} failure, discard/cleanup and no blind retry (offline)`, async (t) => {
    const f = stubPool(t, phase);
    const { createNeonDatabase } = await import("../../cms/db/neon.ts");
    const db = await createNeonDatabase(configuration());
    const work = db.transaction(async (tx) => {
      await tx.query(sql`select ${"never-output-me"} as value`);
      if (phase === "rollback") throw new Error("callback failed");
    });
    const safe = (error) => {
      if (phase === "rollback") {
        assert.ok(error instanceof AggregateError);
        assert.equal(error.errors[0].message, "callback failed");
        error = error.errors[1];
      }
      assert.ok(error instanceof CmsDatabaseError);
      assert.equal(error.phase, phase);
      assert.equal(error.sqlState, "08006");
      assert.equal(
        error.commitOutcome,
        phase === "commit" ? "unknown" : undefined,
      );
      assert.equal(error.cause, undefined);
      assert.ok(!error.message.includes("never-output-me"));
      assert.ok(!JSON.stringify(error).includes("never-output-me"));
      return true;
    };
    if (phase === "close") {
      await work;
      const close = db.close();
      await assert.rejects(close, safe);
      assert.equal(db.close(), close);
    } else {
      await assert.rejects(work, safe);
      await db.close();
    }
    assert.equal(f.acquisitions(), 1);
    assert.equal(f.closes(), 1);
    assert.deepEqual(
      f.released,
      phase === "acquire" ? [] : [phase !== "close"],
    );
  });
}

test("Neon invalid factory input fails before acquisition and dependencies retain only the SQL capability", async (t) => {
  const f = stubPool(t);
  const { createNeonDatabase } = await import("../../cms/db/neon.ts");
  await assert.rejects(
    createNeonDatabase({ ...configuration(), tls: false }),
    refused,
  );
  assert.equal(f.acquisitions(), 0);
  const pkg = JSON.parse(
    await readFile(new URL("../../package.json", import.meta.url), "utf8"),
  );
  assert.equal(pkg.dependencies.pg, "^8.23.0");
  assert.ok(pkg.devDependencies["@types/pg"]);
  assert.equal(pkg.devDependencies.pg, undefined);
  assert.equal(pkg.dependencies["@neondatabase/serverless"], undefined);
  assert.equal(pkg.dependencies["@supabase/supabase-js"], undefined);
  const lock = await readFile(
    new URL("../../pnpm-lock.yaml", import.meta.url),
    "utf8",
  );
  // Drizzle's upstream optional-peer metadata remains; no resolved provider SDK
  // may be installed merely to label this standard pg transport.
  assert.ok(!lock.includes("@neondatabase/serverless@"));
  assert.ok(!lock.includes("@supabase/supabase-js@"));
});
