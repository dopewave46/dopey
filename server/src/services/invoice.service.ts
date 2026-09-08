import { db } from "../repositories/index.js";
import type { Invoice, InvoiceStatusDisplay, InvoiceStatusStored, Payment } from "../types/entities.js";
import { newId } from "../utils/ids.js";
import { nowISO } from "../utils/dates.js";
import { ConflictError, NotFoundError, ValidationError } from "../utils/errors.js";
import { logActivity } from "./activity.service.js";
import { getClient } from "./client.service.js";

/* ------------------------------------------------------------------ */
/* Derived status + balances (spec Section J, Prompt 07 §4)           */
/* ------------------------------------------------------------------ */

export function completedPaymentsFor(payments: Payment[], invoiceId: string): Payment[] {
  return payments.filter((p) => p.invoiceId === invoiceId && p.status === "completed");
}

export function outstandingBalance(invoice: Invoice, payments: Payment[]): number {
  const paid = completedPaymentsFor(payments, invoice.id).reduce((s, p) => s + p.amount, 0);
  return Math.max(0, invoice.amount - paid);
}

/** "overdue" and "pending" are never stored — computed here every read. */
export function displayStatus(invoice: Invoice, payments: Payment[]): InvoiceStatusDisplay {
  if (invoice.status === "draft" || invoice.status === "cancelled") return invoice.status;
  const balance = outstandingBalance(invoice, payments);
  if (balance <= 0 || invoice.status === "paid") return "paid";
  if (new Date(invoice.dueDate).getTime() < Date.now()) return "overdue";
  return invoice.amount - balance > 0 ? "pending" : "sent";
}

export async function decorate(invoice: Invoice): Promise<Invoice & { displayStatus: InvoiceStatusDisplay; balance: number }> {
  const payments = await db.payments.all();
  return { ...invoice, displayStatus: displayStatus(invoice, payments), balance: outstandingBalance(invoice, payments) };
}

/* ------------------------------------------------------------------ */
/* CRUD + transitions                                                 */
/* ------------------------------------------------------------------ */

async function nextInvoiceNumber(): Promise<string> {
  const rows = await db.invoices.all();
  const max = rows.reduce((m, i) => {
    const n = Number(i.invoiceNumber.replace(/\D/g, ""));
    return Number.isFinite(n) && n > m ? n : m;
  }, 200);
  return `INV-0${max + 1}`;
}

export async function listInvoices(filter: { status?: InvoiceStatusDisplay; clientId?: string; projectId?: string; q?: string } = {}) {
  const [rows, payments] = await Promise.all([db.invoices.all(), db.payments.all()]);
  let decorated = rows.map((i) => ({ ...i, displayStatus: displayStatus(i, payments), balance: outstandingBalance(i, payments) }));
  if (filter.status) decorated = decorated.filter((i) => i.displayStatus === filter.status);
  if (filter.clientId) decorated = decorated.filter((i) => i.clientId === filter.clientId);
  if (filter.projectId) decorated = decorated.filter((i) => i.projectId === filter.projectId);
  if (filter.q) {
    const q = filter.q.toLowerCase();
    decorated = decorated.filter((i) => i.invoiceNumber.toLowerCase().includes(q));
  }
  return decorated.sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));
}

export async function getInvoice(id: string): Promise<Invoice> {
  const invoice = await db.invoices.getById(id);
  if (!invoice) throw new NotFoundError("Invoice");
  return invoice;
}

export async function createInvoice(input: {
  clientId: string;
  projectId?: string;
  amount: number;
  issueDate: string;
  dueDate?: string;
  notes?: string;
}): Promise<Invoice> {
  await getClient(input.clientId);
  if (input.projectId) {
    const project = await db.projects.getById(input.projectId);
    if (!project) throw new ValidationError("That project doesn't exist.");
    if (project.clientId !== input.clientId) throw new ValidationError("The project and client don't match.");
  }
  const now = nowISO();
  const invoice: Invoice = {
    id: newId("inv"),
    invoiceNumber: await nextInvoiceNumber(),
    clientId: input.clientId,
    projectId: input.projectId,
    amount: input.amount,
    issueDate: input.issueDate,
    dueDate: input.dueDate ?? input.issueDate,
    status: "draft",
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  await db.invoices.insert(invoice);
  await logActivity("invoice", invoice.id, "invoice_created", `Invoice ${invoice.invoiceNumber} created (draft)`);
  return invoice;
}

export async function updateInvoice(id: string, patch: Partial<Invoice>): Promise<Invoice> {
  const invoice = await getInvoice(id);
  if (invoice.status !== "draft" && (patch.amount !== undefined || patch.projectId !== undefined)) {
    throw new ConflictError("Only draft invoices can have their amount or project changed.");
  }
  const updated = await db.invoices.patch(id, patch);
  if (!updated) throw new NotFoundError("Invoice");
  return updated;
}

/** Manual transitions only: draft → sent → paid | cancelled (Prompt 07 §4). */
export async function setInvoiceStatus(id: string, status: InvoiceStatusStored): Promise<Invoice> {
  const invoice = await getInvoice(id);
  const patch: Partial<Invoice> = { status };
  if (status === "paid") patch.paidDate = invoice.paidDate ?? nowISO();
  if (status !== "paid") patch.paidDate = undefined;
  const updated = (await db.invoices.patch(id, patch))!;
  await logActivity("invoice", id, "invoice_status_changed", `Invoice ${invoice.invoiceNumber} → ${status}`);
  return updated;
}

export async function deleteInvoice(id: string): Promise<void> {
  await getInvoice(id);
  const linkedPayments = await db.payments.count((p) => p.invoiceId === id);
  if (linkedPayments > 0) throw new ConflictError("This invoice has payments recorded against it. Cancel it instead.");
  await db.invoices.remove(id);
}
