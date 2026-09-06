import {
  neonConnectionOptions,
  type DatabaseLimits,
  type NeonConnection,
} from "./connection-options.ts";
import { transactionDatabase } from "./transactions.ts";

// SQL-only Node foundation, not Neon Auth/Data API/Storage/Functions or an
// enabled runtime. Caller owns this pool inside an authorized operation/request
// and must await close() in finally. Imports/construction acquire no connection;
// no env fallback, singleton, automatic migration or retry. Hosted TLS/pooler
// proof is still gated.
export async function createNeonDatabase(
  configuration: NeonConnection,
  limits?: Partial<DatabaseLimits>,
) {
  const options = neonConnectionOptions(configuration, limits);
  const { default: pg } = await import("pg");
  return transactionDatabase(new pg.Pool(options.pool), options.limits);
}
