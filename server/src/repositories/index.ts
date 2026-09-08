import type {
  Activity,
  Amc,
  AmcTask,
  Client,
  Expense,
  FollowUp,
  Invoice,
  Lead,
  Notification,
  Payment,
  Project,
  ProjectStage,
  Session,
  Task,
  User,
} from "../types/entities.js";
import { MemoryKeyValue, MemoryRepository } from "./memory-store.js";
import { buildSeed } from "./seed.js";
import { env } from "../config/env.js";
import { hashPassword } from "../utils/password.js";
import { newId } from "../utils/ids.js";
import { nowISO } from "../utils/dates.js";
import { logger } from "../utils/logger.js";
import { DEFAULT_SETTINGS } from "../config/defaults.js";

const seed = buildSeed();

/**
 * The single data-access surface. Every service reads/writes through `db.*`.
 * Swapping `MemoryRepository` for a Postgres-backed implementation in Prompt 10
 * is a change to this file only.
 */
export const db = {
  users: new MemoryRepository<User>(),
  sessions: new MemoryRepository<Session>(),
  leads: new MemoryRepository<Lead>(seed.leads),
  clients: new MemoryRepository<Client>(seed.clients),
  followUps: new MemoryRepository<FollowUp>(seed.followUps),
  projects: new MemoryRepository<Project>(seed.projects),
  projectStages: new MemoryRepository<ProjectStage>(seed.projectStages),
  tasks: new MemoryRepository<Task>(seed.tasks),
  invoices: new MemoryRepository<Invoice>(seed.invoices),
  payments: new MemoryRepository<Payment>(seed.payments),
  expenses: new MemoryRepository<Expense>(seed.expenses),
  amcs: new MemoryRepository<Amc>(seed.amcs),
  amcTasks: new MemoryRepository<AmcTask>(seed.amcTasks),
  activities: new MemoryRepository<Activity>(seed.activities),
  notifications: new MemoryRepository<Notification>([]),
  settings: new MemoryKeyValue(DEFAULT_SETTINGS as Record<string, unknown>),
};

export type Db = typeof db;

let initialised = false;

/**
 * One-time setup: seed the single admin account if none exists (spec Section L
 * — no public sign-up). Credentials come from env; in Prompt 10 this moves to a
 * dedicated `npm run seed` step against the real database.
 */
export async function initDb(): Promise<void> {
  if (initialised) return;
  const existingAdmin = await db.users.find((u) => u.role === "admin");
  if (!existingAdmin) {
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
  initialised = true;
}
