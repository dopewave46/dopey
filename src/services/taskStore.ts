import type { Task, TaskPriority } from "./types";
import { SAMPLE_TASKS } from "@/data/sampleTasks";

/**
 * In-memory Tasks store — the single source of truth for tasks across the app
 * (the /tasks page, the Dashboard card, the Project and Client Tasks tabs).
 * Stands in for the backend until Prompt 09–11.
 */

let tasks: Task[] = SAMPLE_TASKS;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const nowISO = () => new Date().toISOString();
const rid = () => `task-${Math.random().toString(36).slice(2, 9)}`;

function set(next: Task[]) {
  tasks = next;
  emit();
}

export const taskStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return tasks;
  },

  addTask(input: {
    title: string;
    description?: string;
    projectId?: string;
    clientId?: string;
    priority?: TaskPriority;
    dueDate?: string;
    notes?: string;
  }): Task {
    const task: Task = {
      id: rid(),
      title: input.title,
      description: input.description,
      projectId: input.projectId,
      clientId: input.clientId,
      priority: input.priority ?? "medium",
      status: "todo",
      dueDate: input.dueDate,
      notes: input.notes,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    set([task, ...tasks]);
    return task;
  },

  updateTask(id: string, patch: Partial<Task>) {
    set(tasks.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: nowISO() } : t)));
  },

  toggleTask(id: string) {
    set(
      tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === "completed" ? "todo" : "completed",
              completedAt: t.status === "completed" ? undefined : nowISO(),
              updatedAt: nowISO(),
            }
          : t,
      ),
    );
  },

  deleteTask(id: string) {
    set(tasks.filter((t) => t.id !== id));
  },

  removeForProject(projectId: string) {
    set(tasks.filter((t) => t.projectId !== projectId));
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
