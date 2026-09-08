import { db } from "../repositories/index.js";
import type { Task, TaskPriority, TaskStatus } from "../types/entities.js";
import { newId } from "../utils/ids.js";
import { nowISO, startOfToday, DAY_MS } from "../utils/dates.js";
import { NotFoundError } from "../utils/errors.js";

export type TaskBucket = "today" | "upcoming" | "overdue" | "completed";

export function bucketOf(task: Task): TaskBucket {
  if (task.status === "completed") return "completed";
  if (!task.dueDate) return "upcoming";
  const due = new Date(task.dueDate).getTime();
  const sot = startOfToday();
  if (due < sot) return "overdue";
  if (due < sot + DAY_MS) return "today";
  return "upcoming";
}

export async function listTasks(filter: { bucket?: TaskBucket; projectId?: string; clientId?: string; status?: TaskStatus } = {}): Promise<Task[]> {
  let rows = await db.tasks.all();
  if (filter.projectId) rows = rows.filter((t) => t.projectId === filter.projectId);
  if (filter.clientId) rows = rows.filter((t) => t.clientId === filter.clientId);
  if (filter.status) rows = rows.filter((t) => t.status === filter.status);
  if (filter.bucket) rows = rows.filter((t) => bucketOf(t) === filter.bucket);
  return rows.sort((a, b) => {
    const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return ad - bd;
  });
}

export async function getTask(id: string): Promise<Task> {
  const task = await db.tasks.getById(id);
  if (!task) throw new NotFoundError("Task");
  return task;
}

export async function createTask(input: {
  title: string;
  description?: string;
  projectId?: string;
  clientId?: string;
  priority?: TaskPriority;
  dueDate?: string;
  notes?: string;
}): Promise<Task> {
  // Fill client from project when only the project is given.
  let clientId = input.clientId;
  if (!clientId && input.projectId) {
    clientId = (await db.projects.getById(input.projectId))?.clientId;
  }
  const now = nowISO();
  const task: Task = {
    id: newId("task"),
    title: input.title,
    description: input.description,
    projectId: input.projectId,
    clientId,
    priority: input.priority ?? "medium",
    status: "todo",
    dueDate: input.dueDate,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  await db.tasks.insert(task);
  return task;
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task> {
  await getTask(id);
  const updated = await db.tasks.patch(id, patch);
  if (!updated) throw new NotFoundError("Task");
  return updated;
}

export async function toggleTask(id: string): Promise<Task> {
  const task = await getTask(id);
  const done = task.status === "completed";
  return (await db.tasks.patch(id, {
    status: done ? "todo" : "completed",
    completedAt: done ? undefined : nowISO(),
  }))!;
}

export async function deleteTask(id: string): Promise<void> {
  await getTask(id);
  await db.tasks.remove(id);
}
