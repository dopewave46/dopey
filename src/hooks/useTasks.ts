import { useSyncExternalStore } from "react";
import { taskStore } from "@/services/taskStore";

export function useTasks() {
  const state = useSyncExternalStore(taskStore.subscribe, taskStore.getSnapshot, taskStore.getSnapshot);
  return { tasks: state.tasks, status: state.status, error: state.error, store: taskStore };
}
