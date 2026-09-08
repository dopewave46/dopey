import type { Amc, AmcPaymentStatus, AmcTask } from "./types";
import { SAMPLE_AMCS, SAMPLE_AMC_TASKS } from "@/data/sampleAmc";

/**
 * In-memory Maintenance / AMC store. Stands in for the backend until
 * Prompt 09–11. AMC contract status is derived (see `amcSelectors`), never
 * stored here.
 */

interface AmcState {
  amcs: Amc[];
  amcTasks: AmcTask[];
}

let state: AmcState = { amcs: SAMPLE_AMCS, amcTasks: SAMPLE_AMC_TASKS };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const nowISO = () => new Date().toISOString();
const rid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

function set(next: Partial<AmcState>) {
  state = { ...state, ...next };
  emit();
}

export const amcStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },

  addAmc(input: {
    clientId: string;
    projectId?: string;
    service: string;
    startDate: string;
    renewalDate: string;
    hostingRenewalDate?: string;
    paymentStatus: AmcPaymentStatus;
    notes?: string;
  }): Amc {
    const amc: Amc = {
      ...input,
      id: rid("amc"),
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    set({ amcs: [amc, ...state.amcs] });
    return amc;
  },

  updateAmc(id: string, patch: Partial<Amc>) {
    set({ amcs: state.amcs.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: nowISO() } : a)) });
  },

  deleteAmc(id: string) {
    set({
      amcs: state.amcs.filter((a) => a.id !== id),
      amcTasks: state.amcTasks.filter((t) => t.amcId !== id),
    });
  },

  addTask(amcId: string, title: string, dueDate?: string): AmcTask {
    const task: AmcTask = { id: rid("amct"), amcId, title, status: "todo", dueDate };
    set({ amcTasks: [...state.amcTasks, task] });
    return task;
  },

  toggleTask(taskId: string) {
    set({
      amcTasks: state.amcTasks.map((t) =>
        t.id === taskId ? { ...t, status: t.status === "done" ? "todo" : "done" } : t,
      ),
    });
  },

  deleteTask(taskId: string) {
    set({ amcTasks: state.amcTasks.filter((t) => t.id !== taskId) });
  },
};

export const AMC_PAYMENT_LABELS: Record<AmcPaymentStatus, string> = {
  paid: "Paid",
  due: "Due",
  overdue: "Overdue",
};
