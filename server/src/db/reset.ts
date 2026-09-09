/**
 * `npm run db:reset` — drop everything, re-migrate, re-seed. Destructive;
 * development only. Handy after changing the schema.
 */
import { sql } from "drizzle-orm";
import { dbc, closeDb } from "./client.js";
import { runMigrations } from "./migrate.js";
import { seedDatabase } from "./seed-db.js";
import { ensurePostgres, stopPostgres } from "./embedded.js";
import { logger } from "../utils/logger.js";

try {
  await ensurePostgres();
  await dbc.execute(
    sql`drop schema if exists drizzle cascade; drop schema public cascade; create schema public;`,
  );
  logger.info("schema dropped (public + drizzle migration journal)");
  await runMigrations();
  await seedDatabase();
} catch (err) {
  logger.error({ err }, "reset failed");
  process.exitCode = 1;
} finally {
  await closeDb();
  await stopPostgres();
}
