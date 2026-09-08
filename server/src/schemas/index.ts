import { z } from "zod";
import { idParam, isoDate, money } from "../middleware/validate.js";
import {
  AMC_PAYMENT_STATUSES,
  CLIENT_STATUSES,
  EXPENSE_CATEGORIES,
  INVOICE_STATUSES_STORED,
  LEAD_STAGES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PROJECT_STAGE_STATES,
  PROJECT_STATUSES,
  TASK_PRIORITIES,
} from "../types/entities.js";

/**
 * Request schemas for every endpoint. Required fields match the "*" fields in
 * the Prompt 05–08 forms; enums match the locked spec (Section G).
 */

const period = z.enum(["3m", "6m", "12m", "ytd"]).default("6m");
export const params = { id: idParam };

/* ---------------- auth ---------------- */
export const authSchemas = {
  login: {
    body: z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
  },
  changePassword: {
    body: z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    }),
  },
};

/* ---------------- leads ---------------- */
const leadBase = z.object({
  name: z.string().trim().min(1),
  business: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
  location: z.string().trim().optional(),
  source: z.string().trim().optional(),
  serviceRequired: z.string().trim().optional(),
  requirements: z.string().trim().optional(),
  estimatedValue: money.optional(),
  stage: z.enum(LEAD_STAGES).optional(),
  followUpDate: isoDate.optional(),
  notes: z.string().trim().optional(),
});
export const leadSchemas = {
  list: { query: z.object({ stage: z.enum(LEAD_STAGES).optional(), source: z.string().optional(), service: z.string().optional(), q: z.string().optional() }) },
  create: { body: leadBase },
  update: { params: idParam, body: leadBase.partial() },
  setStage: { params: idParam, body: z.object({ stage: z.enum(LEAD_STAGES) }) },
  logCall: { params: idParam, body: z.object({ note: z.string().trim().min(1) }) },
  convert: {
    params: idParam,
    body: z.object({
      client: z.object({
        name: z.string().trim().min(1),
        company: z.string().trim().optional(),
        phone: z.string().trim().optional(),
        email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
        location: z.string().trim().optional(),
        website: z.string().trim().optional(),
        notes: z.string().trim().optional(),
      }),
      project: z
        .object({
          name: z.string().trim().min(1),
          value: money.optional(),
          startDate: isoDate.optional(),
          deadline: isoDate.optional(),
          requirements: z.string().trim().optional(),
        })
        .optional(),
    }),
  },
};

/* ---------------- clients ---------------- */
const clientBase = z.object({
  name: z.string().trim().min(1),
  company: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
  location: z.string().trim().optional(),
  website: z.string().trim().optional(),
  status: z.enum(CLIENT_STATUSES).optional(),
  notes: z.string().trim().optional(),
});
export const clientSchemas = {
  list: { query: z.object({ status: z.enum(CLIENT_STATUSES).optional(), location: z.string().optional(), q: z.string().optional() }) },
  create: { body: clientBase.extend({ name: z.string().trim().min(1) }) },
  update: { params: idParam, body: clientBase.partial() },
};

/* ---------------- follow-ups ---------------- */
export const followUpSchemas = {
  list: { query: z.object({ status: z.enum(["pending", "done"]).optional(), parentType: z.enum(["lead", "client"]).optional(), parentId: z.string().optional() }) },
  create: {
    body: z.object({
      parentType: z.enum(["lead", "client"]),
      parentId: z.string().min(1),
      dueDate: isoDate,
      note: z.string().trim().min(1),
    }),
  },
  reschedule: { params: idParam, body: z.object({ dueDate: isoDate }) },
};

/* ---------------- projects ---------------- */
const projectBase = z.object({
  clientId: z.string().min(1),
  name: z.string().trim().min(1),
  value: money,
  startDate: isoDate.optional(),
  deadline: isoDate.optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  requirements: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
export const projectSchemas = {
  list: { query: z.object({ status: z.enum(PROJECT_STATUSES).optional(), clientId: z.string().optional(), q: z.string().optional() }) },
  create: { body: projectBase },
  update: {
    params: idParam,
    body: projectBase.partial().extend({
      repoUrl: z.string().trim().optional(),
      stagingUrl: z.string().trim().optional(),
      liveUrl: z.string().trim().optional(),
    }),
  },
  setStatus: { params: idParam, body: z.object({ status: z.enum(PROJECT_STATUSES) }) },
  setStage: {
    params: z.object({ id: z.string().min(1), stageId: z.string().min(1) }),
    body: z.object({ state: z.enum(PROJECT_STAGE_STATES) }),
  },
};

/* ---------------- tasks ---------------- */
const taskBase = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: isoDate.optional(),
  notes: z.string().trim().optional(),
});
export const taskSchemas = {
  list: {
    query: z.object({
      bucket: z.enum(["today", "upcoming", "overdue", "completed"]).optional(),
      projectId: z.string().optional(),
      clientId: z.string().optional(),
    }),
  },
  create: { body: taskBase },
  update: { params: idParam, body: taskBase.partial().extend({ status: z.enum(["todo", "in_progress", "review", "completed"]).optional() }) },
};

/* ---------------- finance ---------------- */
export const invoiceSchemas = {
  list: {
    query: z.object({
      status: z.enum(["draft", "sent", "pending", "paid", "overdue", "cancelled"]).optional(),
      clientId: z.string().optional(),
      projectId: z.string().optional(),
      q: z.string().optional(),
    }),
  },
  create: {
    body: z.object({
      clientId: z.string().min(1),
      projectId: z.string().optional(),
      amount: money.refine((n) => n > 0, "must be greater than zero"),
      issueDate: isoDate,
      dueDate: isoDate.optional(),
      notes: z.string().trim().optional(),
    }),
  },
  update: {
    params: idParam,
    body: z.object({
      amount: money.optional(),
      projectId: z.string().optional(),
      dueDate: isoDate.optional(),
      notes: z.string().trim().optional(),
    }),
  },
  setStatus: { params: idParam, body: z.object({ status: z.enum(INVOICE_STATUSES_STORED) }) },
};

export const paymentSchemas = {
  list: { query: z.object({ clientId: z.string().optional(), projectId: z.string().optional(), invoiceId: z.string().optional(), method: z.enum(PAYMENT_METHODS).optional() }) },
  create: {
    body: z.object({
      invoiceId: z.string().optional(),
      clientId: z.string().optional(),
      projectId: z.string().optional(),
      amount: money.refine((n) => n > 0, "must be greater than zero"),
      paymentDate: isoDate,
      method: z.enum(PAYMENT_METHODS),
      status: z.enum(PAYMENT_STATUSES).optional(),
      reference: z.string().trim().optional(),
    }),
  },
};

export const expenseSchemas = {
  list: { query: z.object({ category: z.enum(EXPENSE_CATEGORIES).optional(), period: period.optional(), q: z.string().optional() }) },
  create: {
    body: z.object({
      name: z.string().trim().min(1),
      category: z.enum(EXPENSE_CATEGORIES),
      amount: money.refine((n) => n > 0, "must be greater than zero"),
      date: isoDate,
      notes: z.string().trim().optional(),
    }),
  },
  update: {
    params: idParam,
    body: z.object({
      name: z.string().trim().min(1).optional(),
      category: z.enum(EXPENSE_CATEGORIES).optional(),
      amount: money.optional(),
      date: isoDate.optional(),
      notes: z.string().trim().optional(),
    }),
  },
};

/* ---------------- analytics ---------------- */
export const analyticsSchemas = { query: z.object({ period }) };

/* ---------------- amc ---------------- */
const amcBase = z.object({
  clientId: z.string().min(1),
  projectId: z.string().optional(),
  service: z.string().trim().min(1),
  startDate: isoDate,
  renewalDate: isoDate,
  hostingRenewalDate: isoDate.optional(),
  paymentStatus: z.enum(AMC_PAYMENT_STATUSES).optional(),
  notes: z.string().trim().optional(),
});
export const amcSchemas = {
  list: {
    query: z.object({
      status: z.enum(["active", "expiring_soon", "expired"]).optional(),
      paymentStatus: z.enum(AMC_PAYMENT_STATUSES).optional(),
      clientId: z.string().optional(),
      q: z.string().optional(),
    }),
  },
  create: { body: amcBase },
  update: { params: idParam, body: amcBase.partial() },
  addTask: { params: idParam, body: z.object({ title: z.string().trim().min(1), dueDate: isoDate.optional() }) },
};

/* ---------------- settings ---------------- */
export const settingsSchemas = {
  update: { body: z.record(z.string(), z.unknown()) },
};

/* ---------------- search ---------------- */
export const searchSchemas = { query: z.object({ q: z.string().trim().min(1), limit: z.coerce.number().int().positive().max(50).optional() }) };
