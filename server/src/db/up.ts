/**
 * `npm run db:up` — start the local embedded Postgres and keep it running in
 * the foreground (Ctrl+C to stop). Use this when you want one long-lived
 * database that `npm run dev`, `db:migrate` and `db:seed` all share. Data is
 * persisted in `server/.pgdata`.
 *
 * If you only ever run `npm run dev`, you don't need this — the dev server
 * boots its own embedded Postgres when nothing is listening on the port.
 */
import { ensurePostgres, stopPostgres } from "./embedded.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

await ensurePostgres();
logger.info(`Postgres is up. Connection string:\n  ${env.DATABASE_URL}\nPress Ctrl+C to stop.`);

const keepAlive = setInterval(() => {}, 1 << 30);

async function shutdown(): Promise<void> {
  clearInterval(keepAlive);
  await stopPostgres();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
