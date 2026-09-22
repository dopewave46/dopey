import { useSyncExternalStore } from "react";
import { missionStore } from "@/services/missionStore";

export function useMission() {
  const state = useSyncExternalStore(missionStore.subscribe, missionStore.getSnapshot, missionStore.getSnapshot);
  return { ...state, store: missionStore };
}
