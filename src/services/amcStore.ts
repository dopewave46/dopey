import type { Amc, AmcPaymentStatus, AmcTask } from "./types";
import { api } from "./api";
import type { StoreStatus } from "./storeStatus";

/**
 * Maintenance / AMC store (Prompt 11) — API-backed.
 *
 * The backend returns each contract already decorated with its derived
 * `status` (Active / Expiring Soon / Expired) and `daysToRenewal` — the
 * frontend never recomputes renewal logic (Prompt 08 §4, Prompt 11 §8).
 */

interface AmcState {
  amcs: Amc[];
  amcTasks: AmcTask[];
  status: StoreStatus;
  error: string | null;
}

let state: AmcState = { amcs: [], amcTasks: [], status: "idle", error: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

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

  async hydrate(): Promise<void> {
    if (state.status === "loading") return;
    set({ status: "loading", error: null });
    try {
      const amcs = await api.get<Amc[]>("/amc");
      const taskLists = await Promise.all(
        amcs.map((a) => api.get<AmcTask[]>(`/amc/${a.id}/tasks`)),
      );
      set({ amcs, amcTasks: taskLists.flat(), status: "ready", error: null });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Failed to load maintenance plans",
      });
    }
  },

  async reload(): Promise<void> {
    const amcs = await api.get<Amc[]>("/amc");
    const taskLists = await Promise.all(amcs.map((a) => api.get<AmcTask[]>(`/amc/${a.id}/tasks`)));
    set({ amcs, amcTasks: taskLists.flat() });
  },

  async addAmc(input: {
    clientId: string;
    projectId?: string;
    service: string;
    startDate: string;
    renewalDate: string;
    hostingRenewalDate?: string;
    paymentStatus: AmcPaymentStatus;
    notes?: string;
  }): Promise<Amc> {
    const { id } = await api.post<Amc>("/amc", input);
    // Refetch so the new row carries its server-derived status.
    await amcStore.reload();
    return state.amcs.find((a) => a.id === id) ?? state.amcs[0];
  },

  async updateAmc(id: string, patch: Partial<Amc>): Promise<Amc> {
    await api.patch<Amc>(`/amc/${id}`, patch);
    const decorated = await api.get<Amc>(`/amc/${id}`);
    set({ amcs: state.amcs.map((a) => (a.id === id ? decorated : a)) });
    return decorated;
  },

  async deleteAmc(id: string): Promise<void> {
    await api.delete(`/amc/${id}`);
    set({
      amcs: state.amcs.filter((a) => a.id !== id),
      amcTasks: state.amcTasks.filter((t) => t.amcId !== id),
    });
  },

  async addTask(amcId: string, title: string, dueDate?: string): Promise<AmcTask> {
    const task = await api.post<AmcTask>(`/amc/${amcId}/tasks`, { title, dueDate });
    set({ amcTasks: [...state.amcTasks, task] });
    return task;
  },

  async toggleTask(taskId: string): Promise<void> {
    const task = state.amcTasks.find((t) => t.id === taskId);
    if (!task) return;
    const updated = await api.post<AmcTask>(`/amc/${task.amcId}/tasks/${taskId}/toggle`, {});
    set({ amcTasks: state.amcTasks.map((t) => (t.id === taskId ? updated : t)) });
  },

  async deleteTask(taskId: string): Promise<void> {
    const task = state.amcTasks.find((t) => t.id === taskId);
    if (!task) return;
    await api.delete(`/amc/${task.amcId}/tasks/${taskId}`);
    set({ amcTasks: state.amcTasks.filter((t) => t.id !== taskId) });
  },
};

export const AMC_PAYMENT_LABELS: Record<AmcPaymentStatus, string> = {
  paid: "Paid",
  due: "Due",
  overdue: "Overdue",
};

/** AMC form service options (moved here from the removed sample data). */
export const AMC_SERVICES = [
  "Website Maintenance",
  "Hosting + SSL",
  "Support Retainer",
  "Security & Backups",
  "Content Updates",
] as const;
