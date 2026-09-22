import { useSyncExternalStore } from "react";
import { outreachStore } from "@/services/outreachStore";

export function useOutreach() {
  const state = useSyncExternalStore(outreachStore.subscribe, outreachStore.getSnapshot, outreachStore.getSnapshot);
  return { ...state, store: outreachStore };
}
