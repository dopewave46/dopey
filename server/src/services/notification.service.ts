import { db } from "../repositories/index.js";
import type { Lead, Notification, NotificationType, Payment } from "../types/entities.js";
import { newId } from "../utils/ids.js";
import { dayKey, daysUntil, nowISO, startOfToday, DAY_MS } from "../utils/dates.js";
import { NotFoundError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { displayStatus } from "./invoice.service.js";
import { amcStatus } from "./amc.service.js";
import { deadlineLeadDays, notificationEnabled, renewalLeadDays } from "./settings.service.js";

/**
 * Notifications engine (spec Section J, Prompt 09 §7).
 *
 *  - `evaluate()` is the scheduled pass (run on an interval by jobs/notifications.job).
 *    It creates rows for follow-ups due, tasks overdue, invoices overdue, AMC
 *    renewals within the lead time, and project deadlines approaching.
 *  - `onPaymentReceived` / `onNewLead` are event-driven and fire immediately.
 *  - Every row carries a `dedupeKey` = `type:entityId:YYYY-MM-DD`, so the same
 *    thing is never notified twice on the same day.
 *  - Delivery (email/SMS/push) is explicitly out of scope — rows only.
 */

async function create(input: {
  type: NotificationType;
  title: string;
  body: string;
  entityType?: Notification["entityType"];
  entityId?: string;
  dedupeDaily?: boolean;
}): Promise<Notification | null> {
  if (!(await notificationEnabled(input.type))) return null;

  const dedupeKey = input.dedupeDaily
    ? `${input.type}:${input.entityId ?? "-"}:${dayKey()}`
    : undefined;
  if (dedupeKey) {
    const dup = await db.notifications.find((n) => n.dedupeKey === dedupeKey);
    if (dup) return null;
  }

  const notification: Notification = {
    id: newId("ntf"),
    type: input.type,
    title: input.title,
    body: input.body,
    entityType: input.entityType,
    entityId: input.entityId,
    dedupeKey,
    isRead: false,
    createdAt: nowISO(),
  };
  await db.notifications.insert(notification);
  return notification;
}

/* ---------------- event-driven ---------------- */

export async function onPaymentReceived(payment: Payment): Promise<void> {
  const client = payment.clientId ? await db.clients.getById(payment.clientId) : undefined;
  await create({
    type: "payment_received",
    title: "Payment received",
    body: `${client?.company || client?.name || "A client"} paid ₹${payment.amount.toLocaleString("en-IN")}.`,
    entityType: "payment",
    entityId: payment.id,
  });
}

export async function onNewLead(lead: Lead): Promise<void> {
  await create({
    type: "new_lead",
    title: "New lead added",
    body: `${lead.business || lead.name}${lead.source ? ` — ${lead.source}` : ""}`,
    entityType: "lead",
    entityId: lead.id,
  });
}

/* ---------------- scheduled evaluation ---------------- */

export async function evaluate(): Promise<{ created: number }> {
  const [followUps, tasks, invoices, payments, amcs, projects, clients] = await Promise.all([
    db.followUps.all(),
    db.tasks.all(),
    db.invoices.all(),
    db.payments.all(),
    db.amcs.all(),
    db.projects.all(),
    db.clients.all(),
  ]);
  const clientName = (id?: string) => clients.find((c) => c.id === id)?.company || clients.find((c) => c.id === id)?.name || "a client";
  const sot = startOfToday();
  const renewalDays = await renewalLeadDays();
  const deadlineDays = await deadlineLeadDays();
  let created = 0;
  const bump = (n: Notification | null) => {
    if (n) created += 1;
  };

  // Follow-ups due today
  for (const f of followUps) {
    if (f.status !== "pending") continue;
    const due = new Date(f.dueDate).getTime();
    if (due >= sot && due < sot + DAY_MS) {
      bump(await create({
        type: "follow_up_due",
        title: "Follow-up due today",
        body: f.note,
        entityType: f.parentType === "lead" ? "lead" : "client",
        entityId: f.parentId,
        dedupeDaily: true,
      }));
    }
  }

  // Tasks overdue (one summary per day)
  const overdueTasks = tasks.filter((t) => t.status !== "completed" && t.dueDate && new Date(t.dueDate).getTime() < sot);
  if (overdueTasks.length) {
    bump(await create({
      type: "task_overdue",
      title: `${overdueTasks.length} task${overdueTasks.length > 1 ? "s" : ""} overdue`,
      body: overdueTasks.slice(0, 2).map((t) => t.title).join(" · "),
      dedupeDaily: true,
      entityId: "tasks",
    }));
  }

  // Invoices overdue
  for (const invoice of invoices) {
    if (displayStatus(invoice, payments) !== "overdue") continue;
    bump(await create({
      type: "invoice_overdue",
      title: "Invoice overdue",
      body: `${clientName(invoice.clientId)} — ${invoice.invoiceNumber}`,
      entityType: "invoice",
      entityId: invoice.id,
      dedupeDaily: true,
    }));
  }

  // AMC renewals within lead time / expired
  for (const amc of amcs) {
    const status = amcStatus(amc, renewalDays);
    if (status === "active") continue;
    const d = daysUntil(amc.renewalDate);
    bump(await create({
      type: "amc_renewal",
      title: status === "expired" ? "AMC expired" : "AMC renewal due",
      body: `${clientName(amc.clientId)} — ${amc.service}, ${d < 0 ? `${Math.abs(d)} days ago` : d === 0 ? "today" : `in ${d} days`}`,
      entityType: "amc",
      entityId: amc.id,
      dedupeDaily: true,
    }));
  }

  // Project deadlines approaching
  for (const project of projects) {
    if (!project.deadline || project.status === "completed" || project.status === "on_hold") continue;
    const d = daysUntil(project.deadline);
    if (d >= 0 && d <= deadlineDays) {
      bump(await create({
        type: "project_deadline",
        title: "Project deadline approaching",
        body: `${project.name} is due in ${d} day${d === 1 ? "" : "s"}.`,
        entityType: "project",
        entityId: project.id,
        dedupeDaily: true,
      }));
    }
  }

  if (created > 0) logger.info({ created }, "notifications evaluated");
  return { created };
}

/* ---------------- reads ---------------- */

export async function listNotifications(opts: { unreadOnly?: boolean; limit?: number } = {}): Promise<Notification[]> {
  let rows = await db.notifications.all();
  if (opts.unreadOnly) rows = rows.filter((n) => !n.isRead);
  rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return opts.limit ? rows.slice(0, opts.limit) : rows;
}

export async function markRead(id: string): Promise<Notification> {
  const existing = await db.notifications.getById(id);
  if (!existing) throw new NotFoundError("Notification");
  return (await db.notifications.patch(id, { isRead: true }))!;
}

export async function markAllRead(): Promise<number> {
  const unread = await db.notifications.filter((n) => !n.isRead);
  for (const n of unread) await db.notifications.patch(n.id, { isRead: true });
  return unread.length;
}
