import type { Task, TaskPriority } from "./types";
import { api } from "./api";
import type { StoreStatus } from "./storeStatus";

/**
 * Tasks store (Prompt 11) — API-backed. The single source of truth for tasks
 * across the app (the /tasks page, the Dashboard card, the Project and Client
 * Tasks tabs). `hydrate()` loads from the backend; mutations go through the API.
 */

interface TaskState {
  tasks: Task[];
  status: StoreStatus;
  error: string | null;
}

let state: TaskState = { tasks: [], status: "idle", error: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function set(next: Partial<TaskState>) {
  state = { ...state, ...next };
  emit();
}

export const taskStore = {
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
      const tasks = await api.get<Task[]>("/tasks");
      set({ tasks, status: "ready", error: null });
    } catch (err) {
      set({ status: "error", error: err instanceof Error ? err.message : "Failed to load tasks" });
    }
  },

  async reload(): Promise<void> {
    set({ tasks: await api.get<Task[]>("/tasks") });
  },

  async addTask(input: {
    title: string;
    description?: string;
    projectId?: string;
    clientId?: string;
    priority?: TaskPriority;
    dueDate?: string;
    notes?: string;
  }): Promise<Task> {
    const task = await api.post<Task>("/tasks", input);
    set({ tasks: [task, ...state.tasks] });
    return task;
  },

  async updateTask(id: string, patch: Partial<Task>): Promise<Task> {
    const updated = await api.patch<Task>(`/tasks/${id}`, patch);
    set({ tasks: state.tasks.map((t) => (t.id === id ? updated : t)) });
    return updated;
  },

  async toggleTask(id: string): Promise<void> {
    const updated = await api.post<Task>(`/tasks/${id}/toggle`, {});
    set({ tasks: state.tasks.map((t) => (t.id === id ? updated : t)) });
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
    set({ tasks: state.tasks.filter((t) => t.id !== id) });
  },
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

/** Restrained priority dot colours (Prompt 08 §6 — not neon). */
export const TASK_PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: "var(--border-strong)",
  medium: "var(--slate)",
  high: "var(--warning)",
  urgent: "var(--crimson)",
};
