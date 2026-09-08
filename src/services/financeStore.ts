import type { Expense, Invoice, Payment } from "./types";
import {
  SAMPLE_EXPENSES,
  SAMPLE_INVOICES,
  SAMPLE_PAYMENTS,
  NEXT_INVOICE_SEQ,
} from "@/data/sampleFinance";
import { projectStore } from "./projectStore";

/**
 * In-memory Finance store — the single source of truth for money.
 *
 * Invoices, payments and expenses live here. The Finance module, the Dashboard
 * Money section, the Client profile tabs and the Project Finance tab all derive
 * their numbers from this store (via `financeSelectors`), so figures never
 * drift. Async-shaped, immutable slices, subscriber notifications. Stands in
 * for the backend until Prompt 09–11.
 */

interface FinanceState {
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
}

let seq = NEXT_INVOICE_SEQ;
let state: FinanceState = {
  invoices: SAMPLE_INVOICES,
  payments: SAMPLE_PAYMENTS,
  expenses: SAMPLE_EXPENSES,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const nowISO = () => new Date().toISOString();
const rid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

function set(next: Partial<FinanceState>) {
  state = { ...state, ...next };
  emit();
}

function completedPaidFor(invoiceId: string): number {
  return state.payments
    .filter((p) => p.invoiceId === invoiceId && p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);
}

export const financeStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },

  /* ---------------- Invoices ---------------- */

  addInvoice(input: {
    clientId: string;
    projectId?: string;
    amount: number;
    issueDate: string;
    dueDate: string;
    notes?: string;
  }): Invoice {
    const invoice: Invoice = {
      id: rid("inv"),
      invoiceNumber: `INV-0${seq++}`,
      clientId: input.clientId,
      projectId: input.projectId,
      amount: input.amount,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      status: "draft",
      notes: input.notes,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    set({ invoices: [invoice, ...state.invoices] });
    return invoice;
  },

  updateInvoice(id: string, patch: Partial<Invoice>) {
    set({
      invoices: state.invoices.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: nowISO() } : i)),
    });
  },

  /** Manual status transitions: draft → sent → paid | cancelled. */
  setInvoiceStatus(id: string, status: "draft" | "sent" | "paid" | "cancelled") {
    const invoice = state.invoices.find((i) => i.id === id);
    if (!invoice) return;
    financeStore.updateInvoice(id, {
      status,
      paidDate: status === "paid" ? invoice.paidDate ?? nowISO() : undefined,
    });
  },

  /* ---------------- Payments ---------------- */

  addPayment(input: {
    clientId: string;
    projectId?: string;
    invoiceId?: string;
    amount: number;
    paymentDate: string;
    method: Payment["method"];
    status: Payment["status"];
    reference?: string;
  }): Payment {
    const payment: Payment = {
      id: rid("pay"),
      clientId: input.clientId,
      projectId: input.projectId,
      invoiceId: input.invoiceId,
      amount: input.amount,
      paymentDate: input.paymentDate,
      method: input.method,
      status: input.status,
      reference: input.reference,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    set({ payments: [payment, ...state.payments] });

    // Settle the linked invoice if this completes it.
    if (payment.invoiceId && payment.status === "completed") {
      const invoice = state.invoices.find((i) => i.id === payment.invoiceId);
      if (invoice && invoice.status !== "cancelled") {
        const paid = completedPaidFor(invoice.id);
        if (paid >= invoice.amount) {
          financeStore.updateInvoice(invoice.id, { status: "paid", paidDate: payment.paymentDate });
        } else if (invoice.status === "draft") {
          financeStore.updateInvoice(invoice.id, { status: "sent" });
        }
      }
    }

    // Reflect on the linked project's activity feed (Prompt 06).
    if (payment.projectId) {
      projectStore.noteActivity(
        payment.projectId,
        "payment_received",
        `Payment recorded — ₹${payment.amount.toLocaleString("en-IN")} (${METHOD_LABELS[payment.method]})`,
      );
    }
    return payment;
  },

  /* ---------------- Expenses ---------------- */

  addExpense(input: Omit<Expense, "id" | "createdAt" | "updatedAt">): Expense {
    const expense: Expense = { ...input, id: rid("exp"), createdAt: nowISO(), updatedAt: nowISO() };
    set({ expenses: [expense, ...state.expenses] });
    return expense;
  },

  updateExpense(id: string, patch: Partial<Expense>) {
    set({
      expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: nowISO() } : e)),
    });
  },

  deleteExpense(id: string) {
    set({ expenses: state.expenses.filter((e) => e.id !== id) });
  },
};

export const METHOD_LABELS: Record<Payment["method"], string> = {
  bank_transfer: "Bank transfer",
  upi: "UPI",
  card: "Card",
  cash: "Cash",
  other: "Other",
};

export const EXPENSE_CATEGORY_LABELS: Record<Expense["category"], string> = {
  hosting: "Hosting",
  domain: "Domain",
  software: "Software",
  advertising: "Advertising",
  equipment: "Equipment",
  operations: "Operations",
  other: "Other",
};
