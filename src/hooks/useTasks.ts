import { useSyncExternalStore } from "react";
import { taskStore } from "@/services/taskStore";

export function useTasks() {
  const tasks = useSyncExternalStore(taskStore.subscribe, taskStore.getSnapshot, taskStore.getSnapshot);
  return { tasks, store: taskStore };
}
