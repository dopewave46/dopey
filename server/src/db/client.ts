/**
 * The Postgres connection pool + Drizzle handle. One pool for the process,
 * created from `DATABASE_URL`. Everything downstream (repositories, migrator,
 * seed) imports `dbc` / `pool` from here.
 */
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { schema } from "./schema.js";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => logger.error({ err }, "postgres pool error"));

export const dbc = drizzle(pool, { schema, logger: env.LOG_LEVEL === "trace" });

export async function pingDb(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("select 1");
  } finally {
    client.release();
  }
}

export async function closeDb(): Promise<void> {
  await pool.end();
}
