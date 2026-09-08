import type { Task } from "./types";

export type TaskBucket = "today" | "upcoming" | "overdue" | "completed";

function startOfToday() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
}

export function bucketOf(task: Task): TaskBucket {
  if (task.status === "completed") return "completed";
  const sot = startOfToday();
  const sotm = sot + 86_400_000;
  if (!task.dueDate) return "upcoming";
  const due = new Date(task.dueDate).getTime();
  if (due < sot) return "overdue";
  if (due < sotm) return "today";
  return "upcoming";
}

export function tasksInBucket(tasks: Task[], bucket: TaskBucket): Task[] {
  const rows = tasks.filter((t) => bucketOf(t) === bucket);
  if (bucket === "completed") {
    return rows.sort((a, b) => (a.completedAt ?? "") < (b.completedAt ?? "") ? 1 : -1);
  }
  return rows.sort((a, b) => {
    const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    if (ad !== bd) return ad - bd;
    return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
  });
}

const PRIORITY_RANK: Record<Task["priority"], number> = { low: 0, medium: 1, high: 2, urgent: 3 };

export function bucketCounts(tasks: Task[]): Record<TaskBucket, number> {
  const counts: Record<TaskBucket, number> = { today: 0, upcoming: 0, overdue: 0, completed: 0 };
  for (const t of tasks) counts[bucketOf(t)] += 1;
  return counts;
}

export function completedThisWeek(tasks: Task[]): number {
  const weekAgo = Date.now() - 7 * 86_400_000;
  return tasks.filter((t) => t.status === "completed" && t.completedAt && new Date(t.completedAt).getTime() >= weekAgo)
    .length;
}

export type TaskGrouping = "none" | "project" | "priority";

export interface TaskGroup {
  key: string;
  label: string;
  tasks: Task[];
}

export function groupTasks(
  tasks: Task[],
  grouping: TaskGrouping,
  projectName: (id?: string) => string,
): TaskGroup[] {
  if (grouping === "none") return [{ key: "all", label: "", tasks }];

  const map = new Map<string, TaskGroup>();
  for (const t of tasks) {
    let key: string;
    let label: string;
    if (grouping === "project") {
      key = t.projectId ?? "none";
      label = t.projectId ? projectName(t.projectId) : "No project";
    } else {
      key = t.priority;
      label = t.priority[0].toUpperCase() + t.priority.slice(1);
    }
    if (!map.has(key)) map.set(key, { key, label, tasks: [] });
    map.get(key)!.tasks.push(t);
  }

  const groups = [...map.values()];
  if (grouping === "priority") {
    groups.sort((a, b) => (PRIORITY_RANK[b.key as Task["priority"]] ?? -1) - (PRIORITY_RANK[a.key as Task["priority"]] ?? -1));
  } else {
    groups.sort((a, b) => (a.key === "none" ? 1 : b.key === "none" ? -1 : a.label.localeCompare(b.label)));
  }
  return groups;
}
