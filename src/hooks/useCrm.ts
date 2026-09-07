import { useSyncExternalStore } from "react";
import { crmStore } from "@/services/crmStore";

/** Subscribe a component to the CRM store. Re-renders on any mutation. */
export function useCrm() {
  const state = useSyncExternalStore(crmStore.subscribe, crmStore.getSnapshot, crmStore.getSnapshot);
  return { ...state, store: crmStore };
}

/** Active (non-archived) leads only. */
export function useActiveLeads() {
  const { leads } = useCrm();
  return leads.filter((l) => !l.archivedAt);
}
