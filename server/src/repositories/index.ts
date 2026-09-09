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
import { DbKeyValue, DbRepository } from "./db-store.js";
import * as t from "../db/schema.js";
import { pingDb } from "../db/client.js";
import { env } from "../config/env.js";
import { hashPassword } from "../utils/password.js";
import { newId } from "../utils/ids.js";
import { nowISO } from "../utils/dates.js";
import { logger } from "../utils/logger.js";

/**
 * The single data-access surface. Every service reads/writes through `db.*`.
 *
 * Prompt 10: the in-memory `MemoryRepository` is replaced by `DbRepository`,
 * backed by Postgres via Drizzle. The `Repository<T>` interface, the services
 * and the API contracts are unchanged — only what sits behind `db.*` moved.
 * Demo/sample data now lives in the `db:seed` script, not in this module.
 */
export const db = {
  users: new DbRepository<User>(t.users, "users"),
  sessions: new DbRepository<Session>(t.sessions, "sessions"),
  leads: new DbRepository<Lead>(t.leads, "leads"),
  clients: new DbRepository<Client>(t.clients, "clients"),
  followUps: new DbRepository<FollowUp>(t.followUps, "followUps"),
  projects: new DbRepository<Project>(t.projects, "projects"),
  projectStages: new DbRepository<ProjectStage>(t.projectStages, "projectStages"),
  tasks: new DbRepository<Task>(t.tasks, "tasks"),
  invoices: new DbRepository<Invoice>(t.invoices, "invoices"),
  payments: new DbRepository<Payment>(t.payments, "payments"),
  expenses: new DbRepository<Expense>(t.expenses, "expenses"),
  amcs: new DbRepository<Amc>(t.amcs, "amcs"),
  amcTasks: new DbRepository<AmcTask>(t.amcTasks, "amcTasks"),
  activities: new DbRepository<Activity>(t.activities, "activities"),
  notifications: new DbRepository<Notification>(t.notifications, "notifications"),
  settings: new DbKeyValue(),
};

export type Db = typeof db;

let initialised = false;

/**
 * One-time boot setup: confirm the database is reachable, then seed the single
 * admin account if none exists (spec Section L — no public sign-up). Credentials
 * come from env. Full demo data is loaded separately via `npm run db:seed`.
 */
export async function initDb(): Promise<void> {
  if (initialised) return;
  await pingDb();

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
