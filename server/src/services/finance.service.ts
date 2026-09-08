import { db } from "../repositories/index.js";
import type { Invoice, Payment } from "../types/entities.js";
import { inRange, periodMonths, periodRange, type PeriodKey } from "../utils/dates.js";
import { displayStatus, outstandingBalance } from "./invoice.service.js";

/**
 * Financial rollups (spec Section J, Prompt 07 §3). Everything is derived from
 * invoices + payments + expenses on every call — no denormalised totals to
 * drift.
 */

export interface RevenueSummary {
  earned: number;
  received: number;
  pending: number;
  overdue: number;
  expenses: number;
  profit: number;
}

export async function revenueSummary(period: PeriodKey): Promise<RevenueSummary> {
  const [invoices, payments, expenses] = await Promise.all([db.invoices.all(), db.payments.all(), db.expenses.all()]);
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
    const status = displayStatus(invoice, payments);
    const balance = outstandingBalance(invoice, payments);
    if (status === "overdue") overdue += balance;
    else if (status === "sent" || status === "pending") pending += balance;
  }

  const expensesTotal = expenses.filter((e) => inRange(e.date, start, end)).reduce((s, e) => s + e.amount, 0);

  return { earned, received, pending, overdue, expenses: expensesTotal, profit: received - expensesTotal };
}

export interface ClientBreakdownRow {
  clientId: string;
  invoiced: number;
  received: number;
  pending: number;
}

export async function breakdownByClient(): Promise<ClientBreakdownRow[]> {
  const [invoices, payments] = await Promise.all([db.invoices.all(), db.payments.all()]);
  const map = new Map<string, ClientBreakdownRow>();
  const row = (id: string) => map.get(id) ?? { clientId: id, invoiced: 0, received: 0, pending: 0 };
  for (const invoice of invoices) {
    if (invoice.status === "draft" || invoice.status === "cancelled") continue;
    const r = row(invoice.clientId);
    r.invoiced += invoice.amount;
    r.pending += outstandingBalance(invoice, payments);
    map.set(invoice.clientId, r);
  }
  for (const payment of payments) {
    if (payment.status !== "completed") continue;
    const r = row(payment.clientId);
    r.received += payment.amount;
    map.set(payment.clientId, r);
  }
  return [...map.values()].sort((a, b) => b.invoiced - a.invoiced);
}

export interface MonthMoney {
  key: string;
  label: string;
  received: number;
  pending: number;
  overdue: number;
  earned: number;
  expenses: number;
  profit: number;
}

export async function moneyByMonth(period: PeriodKey): Promise<MonthMoney[]> {
  const [invoices, payments, expenses] = await Promise.all([db.invoices.all(), db.payments.all(), db.expenses.all()]);
  return periodMonths(period).map((b) => {
    const received = payments
      .filter((p) => p.status === "completed" && inRange(p.paymentDate, b.start, b.end))
      .reduce((s, p) => s + p.amount, 0);
    const earned = invoices
      .filter((i) => i.status !== "draft" && i.status !== "cancelled" && inRange(i.issueDate, b.start, b.end))
      .reduce((s, i) => s + i.amount, 0);
    let pending = 0;
    let overdue = 0;
    for (const invoice of invoices) {
      if (!inRange(invoice.dueDate, b.start, b.end)) continue;
      const status = displayStatus(invoice, payments);
      const balance = outstandingBalance(invoice, payments);
      if (status === "overdue") overdue += balance;
      else if (status === "sent" || status === "pending") pending += balance;
    }
    const monthExpenses = expenses.filter((e) => inRange(e.date, b.start, b.end)).reduce((s, e) => s + e.amount, 0);
    return { key: b.key, label: b.label, received, earned, pending, overdue, expenses: monthExpenses, profit: received - monthExpenses };
  });
}

/** Money position for one project — drives the Project Finance tab (Prompt 07 §9). */
export async function projectFinance(projectId: string): Promise<{ invoiced: number; received: number; pending: number; hasOverdue: boolean; invoices: Invoice[]; payments: Payment[] }> {
  const [allInvoices, allPayments] = await Promise.all([db.invoices.all(), db.payments.all()]);
  const invoices = allInvoices.filter((i) => i.projectId === projectId);
  const payments = allPayments.filter((p) => p.projectId === projectId);
  const invoiced = invoices.filter((i) => i.status !== "draft" && i.status !== "cancelled").reduce((s, i) => s + i.amount, 0);
  const received = payments.filter((p) => p.status === "completed").reduce((s, p) => s + p.amount, 0);
  let pending = 0;
  let hasOverdue = false;
  for (const invoice of invoices) {
    const status = displayStatus(invoice, allPayments);
    if (status === "overdue") hasOverdue = true;
    if (status === "sent" || status === "pending" || status === "overdue") pending += outstandingBalance(invoice, allPayments);
  }
  return { invoiced, received, pending, hasOverdue, invoices, payments };
}

/** Same shape for one client — drives the Client Invoices/Payments tabs. */
export async function clientFinance(clientId: string) {
  const [allInvoices, allPayments] = await Promise.all([db.invoices.all(), db.payments.all()]);
  const invoices = allInvoices.filter((i) => i.clientId === clientId);
  const payments = allPayments.filter((p) => p.clientId === clientId);
  const invoiced = invoices.filter((i) => i.status !== "draft" && i.status !== "cancelled").reduce((s, i) => s + i.amount, 0);
  const received = payments.filter((p) => p.status === "completed").reduce((s, p) => s + p.amount, 0);
  let pending = 0;
  let hasOverdue = false;
  for (const invoice of invoices) {
    const status = displayStatus(invoice, allPayments);
    if (status === "overdue") hasOverdue = true;
    if (status === "sent" || status === "pending" || status === "overdue") pending += outstandingBalance(invoice, allPayments);
  }
  return { invoices, payments, invoiced, received, pending, hasOverdue };
}
