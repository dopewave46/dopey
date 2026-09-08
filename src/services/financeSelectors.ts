import type { BadgeTone } from "@/components/ui/StatusBadge";
import type { Expense, Invoice, InvoiceStatus, Payment } from "./types";
import { inRange, monthKey, periodMonths, periodRange, type MonthBucket, type PeriodKey } from "@/utils/period";

/* ------------------------------------------------------------------ */
/* Invoice status + balances                                          */
/* ------------------------------------------------------------------ */

export function completedPaymentsFor(payments: Payment[], invoiceId: string): Payment[] {
  return payments.filter((p) => p.invoiceId === invoiceId && p.status === "completed");
}

export function outstandingBalance(invoice: Invoice, payments: Payment[]): number {
  const paid = completedPaymentsFor(payments, invoice.id).reduce((s, p) => s + p.amount, 0);
  return Math.max(0, invoice.amount - paid);
}

/**
 * Display status — "overdue" and "pending" are derived, never stored
 * (locked spec + Prompt 07 §4).
 */
export function invoiceDisplayStatus(invoice: Invoice, payments: Payment[]): InvoiceStatus {
  if (invoice.status === "draft" || invoice.status === "cancelled") return invoice.status;
  const balance = outstandingBalance(invoice, payments);
  if (balance <= 0) return "paid";
  if (invoice.status === "paid") return "paid";
  const overdue = new Date(invoice.dueDate).getTime() < Date.now();
  if (overdue) return "overdue";
  const paidSomething = invoice.amount - balance > 0;
  return paidSomething ? "pending" : "sent";
}

export const INVOICE_STATUS_TONE: Record<InvoiceStatus, BadgeTone> = {
  draft: "neutral",
  sent: "info",
  pending: "warning",
  paid: "success",
  overdue: "error",
  cancelled: "neutral",
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

/* ------------------------------------------------------------------ */
/* Aggregates                                                         */
/* ------------------------------------------------------------------ */

export interface RevenueSummary {
  earned: number; // invoiced this period (excl. draft/cancelled)
  received: number; // payments completed this period
  pending: number; // outstanding on sent/pending invoices (now)
  overdue: number; // outstanding on overdue invoices (now)
  expenses: number; // this period
  profit: number; // received − expenses
}

export function revenueSummary(
  invoices: Invoice[],
  payments: Payment[],
  expenses: Expense[],
  period: PeriodKey,
): RevenueSummary {
  const { start, end } = periodRange(period);

  const earned = invoices
    .filter((i) => i.status !== "draft" && i.status !== "cancelled" && inRange(i.issueDate, start, end))
    .reduce((s, i) => s + i.amount, 0);

  const received = payments
    .filter((p) => p.status === "completed" && inRange(p.paymentDate, start, end))
    .reduce((s, p) => s + p.amount, 0);

  let pending = 0;
  let overdue = 0;
  for (const invoice of invoices) {
    const display = invoiceDisplayStatus(invoice, payments);
    const balance = outstandingBalance(invoice, payments);
    if (display === "overdue") overdue += balance;
    else if (display === "sent" || display === "pending") pending += balance;
  }

  const expensesTotal = expenses
    .filter((e) => inRange(e.date, start, end))
    .reduce((s, e) => s + e.amount, 0);

  return {
    earned,
    received,
    pending,
    overdue,
    expenses: expensesTotal,
    profit: received - expensesTotal,
  };
}

/** Current-month received vs earned (for the overview progress bar). */
export function currentMonthProgress(invoices: Invoice[], payments: Payment[]) {
  const [bucket] = periodMonths("3m").slice(-1);
  const earned = invoices
    .filter((i) => i.status !== "draft" && i.status !== "cancelled" && inRange(i.issueDate, bucket.start, bucket.end))
    .reduce((s, i) => s + i.amount, 0);
  const received = payments
    .filter((p) => p.status === "completed" && inRange(p.paymentDate, bucket.start, bucket.end))
    .reduce((s, p) => s + p.amount, 0);
  return { earned, received, label: bucket.label };
}

/* ------------------------------------------------------------------ */
/* Breakdowns                                                         */
/* ------------------------------------------------------------------ */

export interface ClientBreakdownRow {
  clientId: string;
  invoiced: number;
  received: number;
  pending: number;
}

export function breakdownByClient(invoices: Invoice[], payments: Payment[]): ClientBreakdownRow[] {
  const map = new Map<string, ClientBreakdownRow>();
  for (const invoice of invoices) {
    if (invoice.status === "draft" || invoice.status === "cancelled") continue;
    const row = map.get(invoice.clientId) ?? { clientId: invoice.clientId, invoiced: 0, received: 0, pending: 0 };
    row.invoiced += invoice.amount;
    row.pending += outstandingBalance(invoice, payments);
    map.set(invoice.clientId, row);
  }
  for (const payment of payments) {
    if (payment.status !== "completed") continue;
    const row = map.get(payment.clientId) ?? { clientId: payment.clientId, invoiced: 0, received: 0, pending: 0 };
    row.received += payment.amount;
    map.set(payment.clientId, row);
  }
  return [...map.values()].sort((a, b) => b.invoiced - a.invoiced);
}

export interface MonthMoneyRow extends MonthBucket {
  received: number;
  pending: number;
  overdue: number;
  earned: number;
  expenses: number;
  profit: number;
}

export function moneyByMonth(
  invoices: Invoice[],
  payments: Payment[],
  expenses: Expense[],
  period: PeriodKey,
): MonthMoneyRow[] {
  const buckets = periodMonths(period);
  return buckets.map((b) => {
    const received = payments
      .filter((p) => p.status === "completed" && p.paymentDate && inRange(p.paymentDate, b.start, b.end))
      .reduce((s, p) => s + p.amount, 0);
    const earned = invoices
      .filter((i) => i.status !== "draft" && i.status !== "cancelled" && inRange(i.issueDate, b.start, b.end))
      .reduce((s, i) => s + i.amount, 0);
    let pending = 0;
    let overdue = 0;
    for (const invoice of invoices) {
      if (!inRange(invoice.dueDate, b.start, b.end)) continue;
      const display = invoiceDisplayStatus(invoice, payments);
      const balance = outstandingBalance(invoice, payments);
      if (display === "overdue") overdue += balance;
      else if (display === "sent" || display === "pending") pending += balance;
    }
    const monthExpenses = expenses
      .filter((e) => inRange(e.date, b.start, b.end))
      .reduce((s, e) => s + e.amount, 0);
    return {
      ...b,
      received,
      earned,
      pending,
      overdue,
      expenses: monthExpenses,
      profit: received - monthExpenses,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Per-entity                                                         */
/* ------------------------------------------------------------------ */

export interface EntityFinance {
  invoices: Invoice[];
  payments: Payment[];
  invoiced: number;
  received: number;
  pending: number;
  hasOverdue: boolean;
}

function entityFinance(
  invoices: Invoice[],
  payments: Payment[],
  predicateInv: (i: Invoice) => boolean,
  predicatePay: (p: Payment) => boolean,
): EntityFinance {
  const invs = invoices.filter(predicateInv);
  const pays = payments.filter(predicatePay);
  const invoiced = invs
    .filter((i) => i.status !== "draft" && i.status !== "cancelled")
    .reduce((s, i) => s + i.amount, 0);
  const received = pays.filter((p) => p.status === "completed").reduce((s, p) => s + p.amount, 0);
  let pending = 0;
  let hasOverdue = false;
  for (const invoice of invs) {
    const display = invoiceDisplayStatus(invoice, payments);
    if (display === "overdue") hasOverdue = true;
    if (display === "sent" || display === "pending" || display === "overdue") {
      pending += outstandingBalance(invoice, payments);
    }
  }
  return {
    invoices: invs.sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1)),
    payments: pays.sort((a, b) => (a.paymentDate < b.paymentDate ? 1 : -1)),
    invoiced,
    received,
    pending,
    hasOverdue,
  };
}

export function clientFinance(clientId: string, invoices: Invoice[], payments: Payment[]): EntityFinance {
  return entityFinance(
    invoices,
    payments,
    (i) => i.clientId === clientId,
    (p) => p.clientId === clientId,
  );
}

export interface ProjectFinance extends EntityFinance {
  status: "paid" | "partial" | "pending";
  label: string;
  tone: BadgeTone;
  paid: number;
}

export function projectFinance(
  projectId: string,
  projectValue: number,
  invoices: Invoice[],
  payments: Payment[],
): ProjectFinance {
  const base = entityFinance(
    invoices,
    payments,
    (i) => i.projectId === projectId,
    (p) => p.projectId === projectId,
  );
  const paid = base.received;
  let status: ProjectFinance["status"] = "pending";
  if (projectValue > 0 && paid >= projectValue) status = "paid";
  else if (paid > 0) status = "partial";
  const meta: Record<ProjectFinance["status"], { label: string; tone: BadgeTone }> = {
    paid: { label: "Paid", tone: "success" },
    partial: { label: "Partial", tone: "warning" },
    pending: { label: "Pending", tone: "neutral" },
  };
  return { ...base, paid, status, ...meta[status] };
}

export { monthKey };
