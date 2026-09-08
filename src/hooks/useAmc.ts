import { useSyncExternalStore } from "react";
import { amcStore } from "@/services/amcStore";

export function useAmc() {
  const state = useSyncExternalStore(amcStore.subscribe, amcStore.getSnapshot, amcStore.getSnapshot);
  return { ...state, store: amcStore };
}
