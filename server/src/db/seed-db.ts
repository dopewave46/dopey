/**
 * Seed the database with realistic sample data — the same dataset (same ids:
 * lead-01…, client-01…, proj-01…) the frontend's mock data shows, so the
 * backend can be exercised end-to-end before Prompt 11 and the numbers look
 * familiar. Run via `npm run db:seed`.
 *
 * Idempotent: every sample table is truncated first, then rebuilt. `users` and
 * `sessions` are left untouched except that the admin account is ensured.
 * A real deployment never runs this — it starts empty.
 */
import { sql } from "drizzle-orm";
import { dbc, closeDb } from "./client.js";
import { db } from "../repositories/index.js";
import { buildSeed } from "../repositories/seed.js";
import { runMigrations } from "./migrate.js";
import { ensurePostgres, stopPostgres } from "./embedded.js";
import { DEFAULT_SETTINGS } from "../config/defaults.js";
import { env } from "../config/env.js";
import { hashPassword } from "../utils/password.js";
import { newId } from "../utils/ids.js";
import { nowISO } from "../utils/dates.js";
import { logger } from "../utils/logger.js";

const SAMPLE_TABLES = [
  "activities",
  "notifications",
  "amc_tasks",
  "amcs",
  "payments",
  "invoices",
  "expenses",
  "tasks",
  "project_stages",
  "projects",
  "follow_ups",
  "clients",
  "leads",
  "settings",
];

async function ensureAdmin(): Promise<void> {
  const existing = await db.users.find((u) => u.role === "admin");
  if (existing) return;
  const now = nowISO();
  await db.users.insert({
    id: newId("user"),
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL.toLowerCase(),
    role: "admin",
    passwordHash: await hashPassword(env.ADMIN_PASSWORD),
    createdAt: now,
    updatedAt: now,
  });
  logger.info({ email: env.ADMIN_EMAIL }, "seeded admin account");
}

export async function seedDatabase(): Promise<void> {
  await dbc.execute(sql.raw(`TRUNCATE ${SAMPLE_TABLES.join(", ")} RESTART IDENTITY CASCADE`));

  const s = buildSeed();

  // clients before leads (leads.converted_client_id -> clients), but
  // clients.source_lead_id -> leads, so insert clients without that link first.
  for (const c of s.clients) {
    const { sourceLeadId: _drop, ...rest } = c;
    await db.clients.insert(rest as typeof c);
  }
  for (const l of s.leads) await db.leads.insert(l);
  for (const c of s.clients) {
    if (c.sourceLeadId) await db.clients.patch(c.id, { sourceLeadId: c.sourceLeadId });
  }

  for (const p of s.projects) await db.projects.insert(p);
  for (const ps of s.projectStages) await db.projectStages.insert(ps);
  for (const task of s.tasks) await db.tasks.insert(task);
  for (const inv of s.invoices) await db.invoices.insert(inv);
  for (const pay of s.payments) await db.payments.insert(pay);
  for (const e of s.expenses) await db.expenses.insert(e);
  for (const a of s.amcs) await db.amcs.insert(a);
  for (const at of s.amcTasks) await db.amcTasks.insert(at);
  for (const f of s.followUps) await db.followUps.insert(f);
  for (const act of s.activities) await db.activities.insert(act);

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.settings.set(key, value);
  }

  await ensureAdmin();

  const counts = {
    leads: s.leads.length,
    clients: s.clients.length,
    projects: s.projects.length,
    invoices: s.invoices.length,
    payments: s.payments.length,
    amcs: s.amcs.length,
  };
  logger.info(counts, "database seeded");
}

if (process.argv[1]?.endsWith("seed-db.ts") || process.argv[1]?.endsWith("seed-db.js")) {
  try {
    await ensurePostgres();
    await runMigrations();
    await seedDatabase();
  } catch (err) {
    logger.error({ err }, "seed failed");
    process.exitCode = 1;
  } finally {
    await closeDb();
    await stopPostgres();
  }
}
