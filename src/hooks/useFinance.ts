import { useSyncExternalStore } from "react";
import { financeStore } from "@/services/financeStore";

export function useFinance() {
  const state = useSyncExternalStore(
    financeStore.subscribe,
    financeStore.getSnapshot,
    financeStore.getSnapshot,
  );
  return { ...state, store: financeStore };
}
