import "dotenv/config";
import { z } from "zod";

/**
 * Typed environment. All configuration and secrets come from env vars — never
 * hard-coded (spec Section O). Parsed once at startup; the process exits with a
 * clear message if anything required is missing or malformed.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),

  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters"),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(168),

  ADMIN_EMAIL: z.string().email().default("hello@dopeorca.tech"),
  ADMIN_PASSWORD: z.string().min(8).default("change-this-on-first-login"),
  ADMIN_NAME: z.string().default("Shahid Khan"),

  // One origin, or a comma-separated list. In development, any localhost /
  // 127.0.0.1 port is also allowed (Vite hops ports when one is busy).
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:5432/dopeorca_os"),
  // Dev only: run a local embedded Postgres (no Docker/install). Ignored in production.
  USE_EMBEDDED_PG: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),

  NOTIFICATIONS_INTERVAL_MINUTES: z.coerce.number().int().positive().default(60),
  RENEWAL_LEAD_DAYS: z.coerce.number().int().positive().default(30),
  DEADLINE_LEAD_DAYS: z.coerce.number().int().positive().default(5),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Cannot use the logger here — it depends on this module.
  console.error("Invalid environment configuration:\n", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

/* ------------------------------------------------------------------ */
/* Production safety checks (Prompt 12 §9, §13)                        */
/* ------------------------------------------------------------------ */

if (isProd) {
  const problems: string[] = [];
  const DEV_DEFAULTS = [
    "replace-me-with-a-long-random-string",
    "dev-only-local-secret-not-for-production-use-1234",
    "8p9OVBcfv-yomzpEWjeBdMHcQi6Obc54EWisT8lOM79Q21SLWgVHKbr6fKSOx7qP",
  ];
  if (DEV_DEFAULTS.includes(env.SESSION_SECRET))
    problems.push("SESSION_SECRET is a known dev value — set a fresh random secret in production.");
  if (env.SESSION_SECRET.length < 32)
    problems.push("SESSION_SECRET should be at least 32 characters in production.");
  if (env.ADMIN_PASSWORD === "change-this-on-first-login")
    problems.push("ADMIN_PASSWORD is still the placeholder.");
  if (env.CORS_ORIGIN.includes("localhost") || env.CORS_ORIGIN.includes("127.0.0.1"))
    problems.push("CORS_ORIGIN still points at localhost — set it to the exact deployed frontend domain.");
  if (env.USE_EMBEDDED_PG)
    problems.push("USE_EMBEDDED_PG must be false in production — point DATABASE_URL at a managed Postgres.");
  if (/localhost|127\.0\.0\.1/.test(env.DATABASE_URL))
    problems.push("DATABASE_URL points at localhost.");
  if (problems.length) {
    console.error("Refusing to start in production with unsafe configuration:\n - " + problems.join("\n - "));
    process.exit(1);
  }
}

/** Explicitly-allowed CORS origins (comma-separated `CORS_ORIGIN`). */
export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/** Whether a browser Origin header should be allowed. */
export function isAllowedOrigin(origin: string): boolean {
  if (corsOrigins.includes(origin)) return true;
  if (!isProd && LOCALHOST_ORIGIN.test(origin)) return true;
  return false;
}
