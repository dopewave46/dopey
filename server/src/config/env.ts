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
