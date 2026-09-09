import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit config — drives `db:generate` (schema -> SQL migration files) and
 * `db:migrate` (apply them). Plain, version-controlled `.sql` under
 * `src/db/migrations/`; forward-only, with a `_journal` drizzle-kit maintains.
 */
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/dopeorca_os",
  },
  strict: true,
  verbose: true,
});
