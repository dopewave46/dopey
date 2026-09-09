/**
 * DopeOrca OS — database schema (Prompt 10).
 *
 * ORM/tooling: **Drizzle ORM + drizzle-kit**.
 *   - SQL-first: the schema below *is* the source of truth; drizzle-kit turns it
 *     into plain, readable, version-controlled `.sql` migration files
 *     (`server/migrations/`). No hidden client-generation step, no runtime
 *     query engine — it compiles to prepared `pg` statements. That fits an
 *     Express + native-ESM + `tsx` backend far more cleanly than Prisma's
 *     generated client, and gives stronger types than Knex.
 *   - Postgres only, one connection string, trivial for a solo dev to run
 *     locally (embedded-postgres) and to host on any standard provider.
 *
 * Design rules honoured here:
 *   - Columns mirror `src/types/entities.ts` field-for-field (snake_case) — no
 *     renames, no invented enum values. Enums are `text` + a CHECK constraint
 *     (easier to evolve forward than native PG enum types).
 *   - Money: `numeric(12,2)`, single currency. A `currency` column defaulted to
 *     'INR' rides along on the money-movement tables for future-proofing
 *     (spec Section Q) — it is not surfaced to the entity types yet.
 *   - All timestamps are `timestamptz`, stored UTC.
 *   - Derived values (invoice balance/overdue, AMC status, client balance,
 *     dashboard/analytics aggregates) are NOT columns — the Prompt 09 service
 *     layer computes them. `projects.progress_percent` is the one stored
 *     rollup, kept in sync by `project.service` exactly as in Prompt 09.
 */
import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import {
  ACTIVITY_ENTITIES,
  AMC_PAYMENT_STATUSES,
  CLIENT_STATUSES,
  EXPENSE_CATEGORIES,
  FOLLOW_UP_PARENTS,
  INVOICE_STATUSES_STORED,
  LEAD_STAGES,
  NOTIFICATION_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PROJECT_STAGE_STATES,
  PROJECT_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "../types/entities.js";

/** `col IN ('a','b',…)` CHECK body from an enum tuple. */
const oneOf = (col: string, values: readonly string[]) =>
  sql.raw(`${col} in (${values.map((v) => `'${v}'`).join(", ")})`);

const money = (name: string) => numeric(name, { precision: 12, scale: 2 });
const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const currency = () => text("currency").notNull().default("INR");

/* ------------------------------------------------------------------ */
/* users + sessions (backend-only)                                    */
/* ------------------------------------------------------------------ */

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("admin"),
    avatarUrl: text("avatar_url"),
    createdAt: ts("created_at").notNull(),
    updatedAt: ts("updated_at").notNull(),
  },
  (t) => [check("users_role_chk", oneOf("role", ["admin"] as const)), index("users_email_idx").on(t.email)],
);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: ts("created_at").notNull(),
  expiresAt: ts("expires_at").notNull(),
  userAgent: text("user_agent"),
  ip: text("ip"),
});

/* ------------------------------------------------------------------ */
/* leads + clients (circular FK — both nullable, both ON DELETE SET NULL) */
/* ------------------------------------------------------------------ */

export const leads = pgTable(
  "leads",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    business: text("business"),
    phone: text("phone"),
    email: text("email"),
    location: text("location"),
    source: text("source"),
    serviceRequired: text("service_required"),
    requirements: text("requirements"),
    estimatedValue: money("estimated_value"),
    stage: text("stage").notNull(),
    followUpDate: ts("follow_up_date"),
    notes: text("notes"),
    // Circular with clients.source_lead_id — both nullable, both SET NULL; the
    // seed and the conversion service insert in dependency order.
    convertedClientId: text("converted_client_id").references((): AnyPgColumn => clients.id, {
      onDelete: "set null",
    }),
    archivedAt: ts("archived_at"),
    createdAt: ts("created_at").notNull(),
    updatedAt: ts("updated_at").notNull(),
  },
  (t) => [
    check("leads_stage_chk", oneOf("stage", LEAD_STAGES)),
    index("leads_stage_idx").on(t.stage),
    index("leads_follow_up_date_idx").on(t.followUpDate),
  ],
);

export const clients = pgTable(
  "clients",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    company: text("company"),
    phone: text("phone"),
    email: text("email"),
    location: text("location"),
    website: text("website"),
    status: text("status").notNull().default("active"),
    sourceLeadId: text("source_lead_id").references((): AnyPgColumn => leads.id, { onDelete: "set null" }),
    notes: text("notes"),
    createdAt: ts("created_at").notNull(),
    updatedAt: ts("updated_at").notNull(),
  },
  (t) => [check("clients_status_chk", oneOf("status", CLIENT_STATUSES)), index("clients_status_idx").on(t.status)],
);

/* ------------------------------------------------------------------ */
/* projects + project_stages                                          */
/* ------------------------------------------------------------------ */

export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    value: money("value").notNull(),
    startDate: ts("start_date"),
    deadline: ts("deadline"),
    status: text("status").notNull().default("planning"),
    progressPercent: integer("progress_percent").notNull().default(0),
    requirements: text("requirements"),
    notes: text("notes"),
    repoUrl: text("repo_url"),
    stagingUrl: text("staging_url"),
    liveUrl: text("live_url"),
    currency: currency(),
    createdAt: ts("created_at").notNull(),
    updatedAt: ts("updated_at").notNull(),
  },
  (t) => [
    check("projects_status_chk", oneOf("status", PROJECT_STATUSES)),
    index("projects_status_idx").on(t.status),
    index("projects_deadline_idx").on(t.deadline),
    index("projects_client_id_idx").on(t.clientId),
  ],
);

export const projectStages = pgTable(
  "project_stages",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    stageName: text("stage_name").notNull(),
    state: text("state").notNull().default("not_started"),
    completionPercent: integer("completion_percent").notNull().default(0),
    order: integer("order").notNull(),
  },
  (t) => [
    check("project_stages_state_chk", oneOf("state", PROJECT_STAGE_STATES)),
    index("project_stages_project_id_idx").on(t.projectId),
  ],
);

/* ------------------------------------------------------------------ */
/* tasks                                                              */
/* ------------------------------------------------------------------ */

export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }),
    clientId: text("client_id").references(() => clients.id, { onDelete: "set null" }),
    priority: text("priority").notNull().default("medium"),
    status: text("status").notNull().default("todo"),
    dueDate: ts("due_date"),
    notes: text("notes"),
    completedAt: ts("completed_at"),
    createdAt: ts("created_at").notNull(),
    updatedAt: ts("updated_at").notNull(),
  },
  (t) => [
    check("tasks_priority_chk", oneOf("priority", TASK_PRIORITIES)),
    check("tasks_status_chk", oneOf("status", TASK_STATUSES)),
    index("tasks_due_date_idx").on(t.dueDate),
    index("tasks_status_idx").on(t.status),
  ],
);

/* ------------------------------------------------------------------ */
/* invoices + payments + expenses                                     */
/* ------------------------------------------------------------------ */

export const invoices = pgTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    invoiceNumber: text("invoice_number").notNull().unique(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    amount: money("amount").notNull(),
    issueDate: ts("issue_date").notNull(),
    dueDate: ts("due_date").notNull(),
    status: text("status").notNull().default("draft"),
    paidDate: ts("paid_date"),
    notes: text("notes"),
    currency: currency(),
    createdAt: ts("created_at").notNull(),
    updatedAt: ts("updated_at").notNull(),
  },
  (t) => [
    check("invoices_status_chk", oneOf("status", INVOICE_STATUSES_STORED)),
    index("invoices_status_idx").on(t.status),
    index("invoices_due_date_idx").on(t.dueDate),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    invoiceId: text("invoice_id").references(() => invoices.id, { onDelete: "restrict" }),
    amount: money("amount").notNull(),
    paymentDate: ts("payment_date").notNull(),
    method: text("method").notNull(),
    status: text("status").notNull().default("completed"),
    reference: text("reference"),
    currency: currency(),
    createdAt: ts("created_at").notNull(),
    updatedAt: ts("updated_at").notNull(),
  },
  (t) => [
    check("payments_method_chk", oneOf("method", PAYMENT_METHODS)),
    check("payments_status_chk", oneOf("status", PAYMENT_STATUSES)),
    index("payments_payment_date_idx").on(t.paymentDate),
    index("payments_status_idx").on(t.status),
  ],
);

export const expenses = pgTable(
  "expenses",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    amount: money("amount").notNull(),
    date: ts("date").notNull(),
    notes: text("notes"),
    currency: currency(),
    createdAt: ts("created_at").notNull(),
    updatedAt: ts("updated_at").notNull(),
  },
  () => [check("expenses_category_chk", oneOf("category", EXPENSE_CATEGORIES))],
);

/* ------------------------------------------------------------------ */
/* amcs + amc_tasks                                                   */
/* ------------------------------------------------------------------ */

export const amcs = pgTable(
  "amcs",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    service: text("service").notNull(),
    startDate: ts("start_date").notNull(),
    renewalDate: ts("renewal_date").notNull(),
    paymentStatus: text("payment_status").notNull().default("due"),
    hostingRenewalDate: ts("hosting_renewal_date"),
    notes: text("notes"),
    createdAt: ts("created_at").notNull(),
    updatedAt: ts("updated_at").notNull(),
  },
  (t) => [
    check("amcs_payment_status_chk", oneOf("payment_status", AMC_PAYMENT_STATUSES)),
    index("amcs_renewal_date_idx").on(t.renewalDate),
  ],
);

export const amcTasks = pgTable(
  "amc_tasks",
  {
    id: text("id").primaryKey(),
    amcId: text("amc_id")
      .notNull()
      .references(() => amcs.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    status: text("status").notNull().default("todo"),
    dueDate: ts("due_date"),
  },
  () => [check("amc_tasks_status_chk", oneOf("status", ["todo", "done"] as const))],
);

/* ------------------------------------------------------------------ */
/* follow_ups + activities + notifications (polymorphic — no FK)       */
/* ------------------------------------------------------------------ */

export const followUps = pgTable(
  "follow_ups",
  {
    id: text("id").primaryKey(),
    parentType: text("parent_type").notNull(),
    parentId: text("parent_id").notNull(),
    dueDate: ts("due_date").notNull(),
    note: text("note").notNull(),
    status: text("status").notNull().default("pending"),
    completedAt: ts("completed_at"),
  },
  () => [
    check("follow_ups_parent_type_chk", oneOf("parent_type", FOLLOW_UP_PARENTS)),
    check("follow_ups_status_chk", oneOf("status", ["pending", "done"] as const)),
  ],
);

export const activities = pgTable(
  "activities",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    summary: text("summary").notNull(),
    createdAt: ts("created_at").notNull(),
  },
  (t) => [
    check("activities_entity_type_chk", oneOf("entity_type", ACTIVITY_ENTITIES)),
    index("activities_created_at_idx").on(t.createdAt),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    isRead: boolean("is_read").notNull().default(false),
    dedupeKey: text("dedupe_key"),
    createdAt: ts("created_at").notNull(),
  },
  () => [check("notifications_type_chk", oneOf("type", NOTIFICATION_TYPES))],
);

/* ------------------------------------------------------------------ */
/* settings — key/value                                               */
/* ------------------------------------------------------------------ */

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const schema = {
  users,
  sessions,
  leads,
  clients,
  projects,
  projectStages,
  tasks,
  invoices,
  payments,
  expenses,
  amcs,
  amcTasks,
  followUps,
  activities,
  notifications,
  settings,
};
