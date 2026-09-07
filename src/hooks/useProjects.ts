import { useSyncExternalStore } from "react";
import { projectStore } from "@/services/projectStore";

export function useProjects() {
  const state = useSyncExternalStore(
    projectStore.subscribe,
    projectStore.getSnapshot,
    projectStore.getSnapshot,
  );
  return { ...state, store: projectStore };
}
