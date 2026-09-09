import { createServer } from "node:http";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { createApp } from "./app.js";
import { initDb } from "./repositories/index.js";
import { closeDb } from "./db/client.js";
import { ensurePostgres, stopPostgres } from "./db/embedded.js";
import { runMigrations } from "./db/migrate.js";
import { startNotificationsJob, stopNotificationsJob } from "./jobs/notifications.job.js";

/**
 * DopeOrca OS backend — entry point.
 *
 * Stack: Node.js + TypeScript + Express + Zod.
 *  - Express: the most widely-understood Node web framework — the right choice
 *    for a tool one developer maintains long-term. Nothing exotic.
 *  - Zod: schema validation shared in spirit with the frontend's TypeScript;
 *    one place defines required fields, types and enums.
 *  - bcryptjs, pino, helmet, express-rate-limit: small, boring, well-supported.
 *  - Data lives behind a repository interface. Prompt 10: that interface is now
 *    backed by PostgreSQL via Drizzle ORM (see src/db/). In development a local
 *    embedded Postgres is booted automatically; production uses DATABASE_URL.
 */
async function main(): Promise<void> {
  await ensurePostgres();
  await runMigrations();
  await initDb();

  const app = createApp();
  const server = createServer(app);

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, "DopeOrca OS API listening");
  });

  startNotificationsJob();

  const shutdown = (signal: string) => {
    logger.info({ signal }, "shutting down");
    stopNotificationsJob();
    server.close(async () => {
      await closeDb().catch(() => {});
      await stopPostgres().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => logger.error({ reason }, "unhandled rejection"));
  process.on("uncaughtException", (err) => {
    logger.error({ err }, "uncaught exception");
    process.exit(1);
  });
}

void main();
