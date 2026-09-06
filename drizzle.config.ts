import { defineConfig } from "drizzle-kit";

// Artifact generation only. No dotenv, URL, connection or automatic migration.
export default defineConfig({
  dialect: "postgresql",
  schema: "./cms/db/schema.ts",
  out: "./cms/db/migrations",
  strict: true,
});
