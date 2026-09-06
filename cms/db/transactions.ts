import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

export type DatabasePhase =
  "acquire" | "begin" | "query" | "commit" | "rollback" | "close" | "usage";

// Driver errors can contain connection strings, SQL, parameters and private rows.
// Keep only a SQLSTATE, never their message/cause. Callback errors remain private
// caller-owned errors: this module neither logs nor serializes them.
export class CmsDatabaseError extends Error {
  readonly phase: DatabasePhase;
  readonly sqlState?: string;
  readonly commitOutcome: "unknown" | undefined;

  constructor(phase: DatabasePhase, error?: unknown) {
    super(`CMS database ${phase} failed; details redacted.`);
    this.name = "CmsDatabaseError";
    this.phase = phase;
    const code =
      error && typeof error === "object" && "code" in error ? error.code : null;
    if (typeof code === "string" && /^[0-9A-Z]{5}$/.test(code))
      this.sqlState = code;
    // A lost COMMIT response cannot establish whether the write committed.
    this.commitOutcome = phase === "commit" ? "unknown" : undefined;
  }
}

export interface QueryResult {
  rows: Record<string, unknown>[];
  rowCount: number | null;
  command: string;
}

// Structural pg Pool/Client subset for local and Neon SQL transports. No
// pool.query, raw client, named prepared query config or implicit retry is exposed.
export interface TransactionClient {
  query(text: string, values?: unknown[]): Promise<QueryResult>;
  release(destroy?: boolean): void;
  on(event: "error", listener: (error: Error) => void): unknown;
  removeListener(event: "error", listener: (error: Error) => void): unknown;
}

export interface TransactionPool {
  connect(): Promise<TransactionClient>;
  end(): Promise<void>;
  on(event: "error", listener: (error: Error) => void): unknown;
  removeListener(event: "error", listener: (error: Error) => void): unknown;
}

export interface CmsTransaction {
  // Trusted Drizzle SQL only. Validate unknown results at the repository boundary.
  // Await each query; do not issue transaction control SQL or escape this scope.
  query(statement: SQL): Promise<QueryResult>;
}

export interface CmsDatabase {
  transaction<T>(work: (tx: CmsTransaction) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export interface TransactionLimits {
  statementTimeoutMs: number;
  lockTimeoutMs: number;
  idleTransactionTimeoutMs: number;
}

// Internal ownership boundary: the adapter owns this pool until close().
export function transactionDatabase(
  pool: TransactionPool,
  limits: TransactionLimits,
): CmsDatabase {
  const dialect = new PgDialect();
  const running = new Set<Promise<unknown>>();
  let closing: Promise<void> | undefined;
  // pg evicts broken idle clients. Consume the event without logging
  // secret-bearing errors; the next acquisition may fail through the safe API.
  const idleError = () => {};
  pool.on("error", idleError);

  async function run<T>(work: (tx: CmsTransaction) => Promise<T>): Promise<T> {
    let client: TransactionClient;
    try {
      client = await pool.connect();
    } catch (error) {
      throw new CmsDatabaseError("acquire", error);
    }
    let destroy = false;
    let began = false;
    let active = false;
    let failure: CmsDatabaseError | undefined;
    let pending: Promise<QueryResult> | undefined;
    const connectionError = (error: Error) => {
      destroy = true;
      failure ??= new CmsDatabaseError("query", error);
    };
    client.on("error", connectionError);
    async function command(
      phase: DatabasePhase,
      text: string,
      values?: unknown[],
    ) {
      try {
        return await client.query(text, values);
      } catch (error) {
        const safe = new CmsDatabaseError(phase, error);
        // SQL errors can be rolled back. Network/client timeouts and ambiguous
        // boundary failures must never return a suspect connection to the pool.
        if (
          !safe.sqlState ||
          safe.sqlState.startsWith("08") ||
          phase !== "query"
        )
          destroy = true;
        throw safe;
      }
    }
    const tx: CmsTransaction = {
      query(statement) {
        if (!active || pending || failure) {
          failure ??= new CmsDatabaseError("usage");
          return Promise.reject(failure);
        }
        const operation = (async () => {
          let query;
          try {
            query = dialect.sqlToQuery(statement);
          } catch {
            throw new CmsDatabaseError("query");
          }
          return command("query", query.sql, query.params);
        })();
        pending = operation;
        // Observe rejected detached queries too; swallowed errors cannot commit.
        void operation.then(
          () => {
            pending = undefined;
          },
          (error) => {
            pending = undefined;
            failure ??=
              error instanceof CmsDatabaseError
                ? error
                : new CmsDatabaseError("query");
          },
        );
        return operation;
      },
    };
    try {
      await command("begin", "BEGIN ISOLATION LEVEL READ COMMITTED");
      began = true;
      await command(
        "query",
        // Transaction-local state only: a pooler may switch backends after COMMIT.
        "SELECT set_config('statement_timeout', $1, true), set_config('lock_timeout', $2, true), set_config('idle_in_transaction_session_timeout', $3, true), set_config('TimeZone', 'UTC', true)",
        [
          String(limits.statementTimeoutMs),
          String(limits.lockTimeoutMs),
          String(limits.idleTransactionTimeoutMs),
        ],
      );
      active = true;
      let value: T;
      try {
        value = await work(tx);
      } finally {
        active = false;
        if (pending) {
          failure ??= new CmsDatabaseError("usage");
          await pending.catch(() => {});
        }
      }
      if (failure) throw failure;
      const committed = await command("commit", "COMMIT");
      if (committed.command !== "COMMIT") {
        destroy = true;
        throw new CmsDatabaseError("commit");
      }
      began = false;
      return value;
    } catch (error) {
      if (began) {
        try {
          await command("rollback", "ROLLBACK");
        } catch (rollbackError) {
          throw new AggregateError(
            [error, rollbackError],
            "CMS transaction failed and rollback could not be confirmed.",
          );
        }
      }
      throw error;
    } finally {
      active = false;
      client.release(destroy);
      client.removeListener("error", connectionError);
    }
  }

  return {
    transaction(work) {
      if (closing) return Promise.reject(new CmsDatabaseError("usage"));
      const result = run(work);
      running.add(result);
      void result.then(
        () => running.delete(result),
        () => running.delete(result),
      );
      return result;
    },
    close() {
      // Idempotent, refuses new work immediately, drains accepted work first.
      closing ??= (async () => {
        await Promise.allSettled([...running]);
        try {
          await pool.end();
        } catch (error) {
          throw new CmsDatabaseError("close", error);
        } finally {
          pool.removeListener("error", idleError);
        }
      })();
      return closing;
    },
  };
}
