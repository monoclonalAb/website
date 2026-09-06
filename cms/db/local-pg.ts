import {
  databaseConnectionOptions,
  type DatabaseLimits,
} from "./connection-options.ts";
import { transactionDatabase } from "./transactions.ts";

// Call inside an explicitly authorized local operation, then close in finally.
// Importing this module or constructing the pool never acquires a connection.
export async function createLocalPgDatabase(
  connectionUrl: string,
  limits?: Partial<DatabaseLimits>,
) {
  const options = databaseConnectionOptions("local-pg", connectionUrl, limits);
  const { default: pg } = await import("pg");
  return transactionDatabase(new pg.Pool(options.pool), options.limits);
}
