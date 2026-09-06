import { X509Certificate } from "node:crypto";
import { checkServerIdentity } from "node:tls";
import { z } from "zod";
import type { TransactionLimits } from "./transactions.ts";

export interface DatabaseLimits extends TransactionLimits {
  maxConnections: number;
  connectionTimeoutMs: number;
  queryTimeoutMs: number;
}

const defaults: DatabaseLimits = {
  maxConnections: 2,
  connectionTimeoutMs: 3_000,
  statementTimeoutMs: 5_000,
  queryTimeoutMs: 6_000,
  lockTimeoutMs: 1_000,
  idleTransactionTimeoutMs: 5_000,
};

const invalid = () =>
  new Error("Invalid CMS database configuration; details redacted.");

function databaseLimits(overrides: Partial<DatabaseLimits> = {}) {
  const limits = { ...defaults, ...overrides };
  if (
    Object.keys(limits).some((key) => !Object.hasOwn(defaults, key)) ||
    Object.values(limits).some(
      (value) =>
        !Number.isSafeInteger(value) || value <= 0 || value > 2_147_483_647,
    ) ||
    limits.maxConnections > 10 ||
    limits.queryTimeoutMs <= limits.statementTimeoutMs ||
    limits.lockTimeoutMs > limits.statementTimeoutMs
  )
    throw invalid();
  return limits;
}

function connectionFields(connectionUrl: string) {
  let url: URL;
  try {
    if (
      typeof connectionUrl !== "string" ||
      /[\u0000-\u0020\u007f]/.test(connectionUrl)
    )
      throw invalid();
    url = new URL(connectionUrl);
  } catch {
    throw invalid();
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.port ||
    Number(url.port) < 1 ||
    Number(url.port) > 65535 ||
    !url.username ||
    !url.password ||
    url.hash ||
    url.search ||
    !/^\/[a-zA-Z0-9_-]+$/.test(url.pathname)
  )
    throw invalid();
  let user: string;
  let password: string;
  try {
    user = decodeURIComponent(url.username);
    password = decodeURIComponent(url.password);
  } catch {
    throw invalid();
  }
  if (
    [user, password].some(
      (value) => !value || /[\u0000-\u001f\u007f]/.test(value),
    )
  )
    throw invalid();
  return {
    host: url.hostname.replace(/^\[|\]$/g, ""),
    port: Number(url.port),
    database: url.pathname.slice(1),
    user,
    password,
  };
}

function poolLimits(limits: DatabaseLimits) {
  return {
    application_name: "website-cms-foundation",
    max: limits.maxConnections,
    connectionTimeoutMillis: limits.connectionTimeoutMs,
    query_timeout: limits.queryTimeoutMs,
    idleTimeoutMillis: 1_000,
  };
}

// Separate loopback transport, NOT the test harness's isolation authorization.
export function databaseConnectionOptions(
  driver: "local-pg",
  connectionUrl: string,
  overrides: Partial<DatabaseLimits> = {},
) {
  const limits = databaseLimits(overrides);
  const fields = connectionFields(connectionUrl);
  if (
    driver !== "local-pg" ||
    !["localhost", "127.0.0.1", "::1"].includes(fields.host)
  )
    throw invalid();
  return {
    limits,
    pool: {
      ...fields,
      ...poolLimits(limits),
      ssl: false as const,
      options: "-c timezone=UTC",
    },
  };
}

const neonConfiguration = z.strictObject({
  connectionUrl: z.string(),
  mode: z.enum(["direct", "pooled"]),
  tls: z.discriminatedUnion("trust", [
    z.strictObject({ trust: z.literal("system") }),
    z.strictObject({
      trust: z.literal("ca"),
      ca: z.string().min(1).max(65_536),
    }),
  ]),
  // pg's boolean is opportunistic: it chooses SCRAM-SHA-256-PLUS when the
  // server offers it and otherwise falls back. Never label this "require".
  channelBinding: z.literal("prefer"),
});
export type NeonConnection = z.infer<typeof neonConfiguration>;

// Server-controlled explicit input only. Never pass a URL to pg: URL SSL
// parameters can replace the verified TLS object, and pg does not parse Neon's
// channel_binding=require directive. Query directives are rejected, not dropped.
export function neonConnectionOptions(
  configuration: NeonConnection,
  overrides: Partial<DatabaseLimits> = {},
) {
  const parsed = neonConfiguration.safeParse(configuration);
  if (!parsed.success) throw invalid(); // zod issues can contain private input
  const { connectionUrl, mode, tls, channelBinding } = parsed.data;
  const fields = connectionFields(connectionUrl);
  const limits = databaseLimits(overrides);
  const labels = fields.host.split(".");
  const endpoint = labels[0] ?? "";
  const pooled = endpoint.endsWith("-pooler");
  const endpointId = pooled ? endpoint.slice(0, -"-pooler".length) : endpoint;
  const neonHost =
    labels.length === 5 &&
    labels[3] === "neon" &&
    labels[4] === "tech" &&
    labels[2] === "aws" &&
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(labels[1] ?? "") &&
    /^ep-[a-z0-9](?:[a-z0-9-]{0,51}[a-z0-9])?$/.test(endpointId);
  if (
    !neonHost ||
    fields.port !== 5432 ||
    (mode === "direct" && pooled) ||
    (mode === "pooled" && !pooled) ||
    !/^[a-z_][a-z0-9_]*$/i.test(fields.user)
  )
    throw invalid();
  let ca: string | undefined;
  if (tls.trust === "ca") {
    ca = tls.ca;
    // Validate PEM CA bundles locally, not via paths/URLs or silently ignored
    // garbage. Expiry/chain/hostname verification still happens in Node TLS.
    const certificates = ca.match(
      /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g,
    );
    try {
      if (
        !certificates?.length ||
        ca
          .replace(
            /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g,
            "",
          )
          .trim() ||
        certificates.some((certificate) => !new X509Certificate(certificate).ca)
      )
        throw invalid();
    } catch {
      throw invalid();
    }
  }
  return {
    limits,
    pool: {
      ...fields,
      ...poolLimits(limits),
      ssl: {
        rejectUnauthorized: true as const,
        minVersion: "TLSv1.2" as const,
        servername: fields.host,
        checkServerIdentity,
        ...(ca === undefined ? {} : { ca }),
      },
      sslnegotiation: "postgres" as const,
      // "prefer", not "require": pg 8.23 selects channel binding only when
      // SCRAM-SHA-256-PLUS is offered. Verified TLS remains independently set.
      enableChannelBinding: channelBinding === "prefer",
      client_encoding: "UTF8",
      // pg treats an empty string as missing and falls back to PGOPTIONS. A
      // whitespace-only options value sends no -c settings and blocks fallback.
      options: " ",
      replication: "false", // explicit normal SQL mode; ignore PGREPLICATION
    },
  };
}
