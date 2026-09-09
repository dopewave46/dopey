/**
 * Local Postgres for development, with no Docker and nothing to install
 * (spec Section K — "easy for a solo developer to run locally").
 *
 * `embedded-postgres` downloads a real Postgres server binary and runs it
 * against a persistent data directory (`server/.pgdata`, git-ignored). The
 * cluster is shut down automatically when the Node process exits.
 *
 * In production, `DATABASE_URL` points at a managed Postgres and none of this
 * code runs — see `USE_EMBEDDED_PG`.
 */
import net from "node:net";
import { existsSync } from "node:fs";
import path from "node:path";
import { env, isProd } from "../config/env.js";
import { logger } from "../utils/logger.js";

/**
 * Minimal local types for `embedded-postgres`. The package is a devDependency
 * and is NOT installed in production, so it must not be referenced in a way the
 * type-checker needs to resolve — the real module is only pulled in via a
 * runtime dynamic import, guarded by `USE_EMBEDDED_PG`.
 */
interface EmbeddedPgOptions {
  databaseDir: string;
  user: string;
  password: string;
  port: number;
  persistent?: boolean;
  initdbFlags?: string[];
  onLog?: (msg: string) => void;
  onError?: (msg: unknown) => void;
}
interface EmbeddedPgInstance {
  initialise(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  createDatabase(name: string): Promise<void>;
}
type EmbeddedPgCtor = new (opts: EmbeddedPgOptions) => EmbeddedPgInstance;

const DATA_DIR = path.resolve(process.cwd(), ".pgdata");
const PARSED = new URL(env.DATABASE_URL);
const PORT = Number(PARSED.port || 5432);
const DB_NAME = PARSED.pathname.replace(/^\//, "") || "dopeorca_os";

/** Use the embedded server unless explicitly told to use an external one. */
export const USE_EMBEDDED_PG = env.USE_EMBEDDED_PG && !isProd;

function portInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(600, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

let instance: EmbeddedPgInstance | null = null;

/**
 * Ensure a Postgres is listening on the configured port. If one is already
 * there (e.g. `npm run db:up` in another terminal), just use it. Otherwise boot
 * an embedded cluster for the lifetime of this process.
 */
export async function ensurePostgres(): Promise<void> {
  if (!USE_EMBEDDED_PG) return;
  if (await portInUse(PORT)) {
    logger.info({ port: PORT }, "using Postgres already running on this port");
    return;
  }

  // Dynamic import via an indirect specifier: `embedded-postgres` is a
  // devDependency and is absent in production, so `tsc` must not try to resolve
  // it. This line is unreachable in prod (guarded by USE_EMBEDDED_PG above).
  const moduleName: string = "embedded-postgres";
  const mod = (await import(moduleName)) as { default: EmbeddedPgCtor };
  const EmbeddedPostgres = mod.default;

  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: PARSED.username || "postgres",
    password: decodeURIComponent(PARSED.password || "postgres"),
    port: PORT,
    persistent: true,
    // Force UTF-8 so INR ₹ and em-dashes in seed/activity text store correctly
    // (Windows initdb otherwise defaults the cluster to WIN1252).
    initdbFlags: ["--encoding=UTF8", "--no-locale"],
    onLog: () => {},
    onError: (msg: unknown) => logger.debug({ msg }, "embedded-postgres"),
  });

  if (!existsSync(path.join(DATA_DIR, "PG_VERSION"))) {
    logger.info({ dir: DATA_DIR }, "initialising embedded Postgres (first run)");
    await pg.initialise();
  }
  await pg.start();
  try {
    await pg.createDatabase(DB_NAME);
    logger.info({ db: DB_NAME }, "created database");
  } catch {
    /* already exists */
  }
  instance = pg;
  logger.info({ port: PORT, db: DB_NAME }, "embedded Postgres ready");
}

export async function stopPostgres(): Promise<void> {
  if (instance) {
    await instance.stop();
    instance = null;
  }
}
