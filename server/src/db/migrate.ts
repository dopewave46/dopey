/**
 * Apply pending migrations from `server/migrations/` to the database at
 * `DATABASE_URL`. Run via `npm run db:migrate`. Safe to run repeatedly —
 * drizzle tracks what has already been applied in `drizzle.__drizzle_migrations`.
 */
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { dbc, closeDb } from "./client.js";
import { ensurePostgres, stopPostgres } from "./embedded.js";
import { logger } from "../utils/logger.js";

// Version-controlled SQL lives at `server/migrations/` — ships with the source,
// so this resolves the same whether run via tsx (dev) or `node dist` (prod).
const migrationsFolder = path.resolve(process.cwd(), "migrations");

export async function runMigrations(): Promise<void> {
  await migrate(dbc, { migrationsFolder });
  logger.info("migrations applied");
}

// When executed directly (not imported).
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    await ensurePostgres();
    await runMigrations();
  } catch (err) {
    logger.error({ err }, "migration failed");
    process.exitCode = 1;
  } finally {
    await closeDb();
    await stopPostgres();
  }
}
