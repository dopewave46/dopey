import { db } from "../repositories/index.js";
import type { Amc, AmcPaymentStatus, AmcStatus, AmcTask } from "../types/entities.js";
import { newId } from "../utils/ids.js";
import { nowISO, daysUntil } from "../utils/dates.js";
import { NotFoundError } from "../utils/errors.js";
import { logActivity } from "./activity.service.js";
import { getClient } from "./client.service.js";
import { renewalLeadDays } from "./settings.service.js";

/** Contract status — derived from renewal_date vs today (Prompt 08 §4). */
export function amcStatus(amc: Amc, leadDays: number): AmcStatus {
  const d = daysUntil(amc.renewalDate);
  if (d < 0) return "expired";
  if (d <= leadDays) return "expiring_soon";
  return "active";
}

export async function decorate(amc: Amc): Promise<Amc & { status: AmcStatus; daysToRenewal: number }> {
  const leadDays = await renewalLeadDays();
  return { ...amc, status: amcStatus(amc, leadDays), daysToRenewal: daysUntil(amc.renewalDate) };
}

export async function listAmcs(filter: { status?: AmcStatus; paymentStatus?: AmcPaymentStatus; clientId?: string; q?: string } = {}) {
  const leadDays = await renewalLeadDays();
  let rows = (await db.amcs.all()).map((a) => ({ ...a, status: amcStatus(a, leadDays), daysToRenewal: daysUntil(a.renewalDate) }));
  if (filter.status) rows = rows.filter((a) => a.status === filter.status);
  if (filter.paymentStatus) rows = rows.filter((a) => a.paymentStatus === filter.paymentStatus);
  if (filter.clientId) rows = rows.filter((a) => a.clientId === filter.clientId);
  if (filter.q) {
    const q = filter.q.toLowerCase();
    rows = rows.filter((a) => a.service.toLowerCase().includes(q));
  }
  return rows.sort((a, b) => (a.renewalDate < b.renewalDate ? -1 : 1));
}

export async function getAmc(id: string): Promise<Amc> {
  const amc = await db.amcs.getById(id);
  if (!amc) throw new NotFoundError("Maintenance plan");
  return amc;
}

export async function createAmc(input: {
  clientId: string;
  projectId?: string;
  service: string;
  startDate: string;
  renewalDate: string;
  hostingRenewalDate?: string;
  paymentStatus?: AmcPaymentStatus;
  notes?: string;
}): Promise<Amc> {
  await getClient(input.clientId);
  const now = nowISO();
  const amc: Amc = {
    id: newId("amc"),
    clientId: input.clientId,
    projectId: input.projectId,
    service: input.service,
    startDate: input.startDate,
    renewalDate: input.renewalDate,
    hostingRenewalDate: input.hostingRenewalDate,
    paymentStatus: input.paymentStatus ?? "due",
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  await db.amcs.insert(amc);
  await logActivity("amc", amc.id, "amc_created", `Maintenance plan added — ${amc.service}`);
  return amc;
}

export async function updateAmc(id: string, patch: Partial<Amc>): Promise<Amc> {
  await getAmc(id);
  const updated = await db.amcs.patch(id, patch);
  if (!updated) throw new NotFoundError("Maintenance plan");
  return updated;
}

export async function deleteAmc(id: string): Promise<void> {
  const amc = await getAmc(id);
  await db.amcs.remove(id);
  for (const t of await db.amcTasks.filter((t) => t.amcId === id)) await db.amcTasks.remove(t.id);
  await logActivity("amc", id, "amc_deleted", `Maintenance plan deleted — ${amc.service}`);
}

/* ---------------- AMC checklist ---------------- */

export async function listAmcTasks(amcId: string): Promise<AmcTask[]> {
  await getAmc(amcId);
  return (await db.amcTasks.filter((t) => t.amcId === amcId)).sort((a, b) => (a.status === b.status ? 0 : a.status === "done" ? 1 : -1));
}

export async function addAmcTask(amcId: string, title: string, dueDate?: string): Promise<AmcTask> {
  await getAmc(amcId);
  const task: AmcTask = { id: newId("amct"), amcId, title, status: "todo", dueDate };
  await db.amcTasks.insert(task);
  return task;
}

export async function toggleAmcTask(taskId: string): Promise<AmcTask> {
  const task = await db.amcTasks.getById(taskId);
  if (!task) throw new NotFoundError("Checklist item");
  return (await db.amcTasks.patch(taskId, { status: task.status === "done" ? "todo" : "done" }))!;
}

export async function deleteAmcTask(taskId: string): Promise<void> {
  const task = await db.amcTasks.getById(taskId);
  if (!task) throw new NotFoundError("Checklist item");
  await db.amcTasks.remove(taskId);
}
