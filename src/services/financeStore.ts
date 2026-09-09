import type { Expense, Invoice, Payment } from "./types";
import { api } from "./api";
import { notificationStore } from "./notificationStore";
import type { StoreStatus } from "./storeStatus";

/**
 * Finance store (Prompt 11) — API-backed. The single source of truth for money
 * on the frontend: invoices, payments and expenses. The Finance module, the
 * Dashboard Money section, the Client profile tabs and the Project Finance tab
 * all derive their numbers from here (via `financeSelectors`).
 *
 * The payment → invoice settle cascade and project activity logging happen
 * server-side (Prompt 09 payment.service); after recording a payment this store
 * simply refetches invoices + payments so every view reflects PostgreSQL.
 */

interface FinanceState {
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  status: StoreStatus;
  error: string | null;
}

let state: FinanceState = {
  invoices: [],
  payments: [],
  expenses: [],
  status: "idle",
  error: null,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function set(next: Partial<FinanceState>) {
  state = { ...state, ...next };
  emit();
}

async function fetchInvoices() {
  return api.get<Invoice[]>("/finance/invoices");
}
async function fetchPayments() {
  return api.get<Payment[]>("/finance/payments");
}
async function fetchExpenses() {
  return api.getWithMeta<Expense[]>("/finance/expenses").then((r) => r.data);
}

export const financeStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },

  async hydrate(): Promise<void> {
    if (state.status === "loading") return;
    set({ status: "loading", error: null });
    try {
      const [invoices, payments, expenses] = await Promise.all([
        fetchInvoices(),
        fetchPayments(),
        fetchExpenses(),
      ]);
      set({ invoices, payments, expenses, status: "ready", error: null });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Failed to load finance data",
      });
    }
  },

  async reloadInvoicesAndPayments(): Promise<void> {
    const [invoices, payments] = await Promise.all([fetchInvoices(), fetchPayments()]);
    set({ invoices, payments });
  },

  /* ---------------- Invoices ---------------- */

  async addInvoice(input: {
    clientId: string;
    projectId?: string;
    amount: number;
    issueDate: string;
    dueDate: string;
    notes?: string;
  }): Promise<Invoice> {
    const invoice = await api.post<Invoice>("/finance/invoices", input);
    set({ invoices: [invoice, ...state.invoices] });
    return invoice;
  },

  async updateInvoice(id: string, patch: Partial<Invoice>): Promise<Invoice> {
    const updated = await api.patch<Invoice>(`/finance/invoices/${id}`, patch);
    set({ invoices: state.invoices.map((i) => (i.id === id ? updated : i)) });
    return updated;
  },

  /** Manual status transitions: draft → sent → paid | cancelled. */
  async setInvoiceStatus(
    id: string,
    status: "draft" | "sent" | "paid" | "cancelled",
  ): Promise<void> {
    const updated = await api.post<Invoice>(`/finance/invoices/${id}/status`, { status });
    set({ invoices: state.invoices.map((i) => (i.id === id ? updated : i)) });
  },

  /* ---------------- Payments ---------------- */

  async addPayment(input: {
    clientId: string;
    projectId?: string;
    invoiceId?: string;
    amount: number;
    paymentDate: string;
    method: Payment["method"];
    status: Payment["status"];
    reference?: string;
  }): Promise<Payment> {
    const payment = await api.post<Payment>("/finance/payments", input);
    // Server settles the linked invoice + logs project activity + fires a
    // "payment received" notification — refetch so every view (Finance, Project
    // Finance tab, Dashboard) stays consistent.
    await financeStore.reloadInvoicesAndPayments();
    void notificationStore.refresh();
    return payment;
  },

  /* ---------------- Expenses ---------------- */

  async addExpense(input: Omit<Expense, "id" | "createdAt" | "updatedAt">): Promise<Expense> {
    const expense = await api.post<Expense>("/finance/expenses", input);
    set({ expenses: [expense, ...state.expenses] });
    return expense;
  },

  async updateExpense(id: string, patch: Partial<Expense>): Promise<Expense> {
    const updated = await api.patch<Expense>(`/finance/expenses/${id}`, patch);
    set({ expenses: state.expenses.map((e) => (e.id === id ? updated : e)) });
    return updated;
  },

  async deleteExpense(id: string): Promise<void> {
    await api.delete(`/finance/expenses/${id}`);
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
