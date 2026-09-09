import { useCallback, useSyncExternalStore } from "react";
import { crmStore } from "./crmStore";
import { projectStore } from "./projectStore";
import { financeStore } from "./financeStore";
import { taskStore } from "./taskStore";
import { amcStore } from "./amcStore";
import type { StoreStatus } from "./storeStatus";

/**
 * App-data hydration (Prompt 11).
 *
 * Once the session is confirmed, the shell loads every module store from the
 * backend in parallel. Until they're ready the shell shows a single loading
 * state; if any fail it shows one ErrorState with a working retry — which is
 * exactly the "stop the backend / clear cookies" behaviour from §13/§15.
 * After first load, navigating between modules is instant (data is in the
 * stores); each mutation refreshes its own slice.
 */

const STORES = [crmStore, projectStore, financeStore, taskStore, amcStore] as const;

export async function hydrateAll(): Promise<void> {
  await Promise.all(STORES.map((s) => s.hydrate()));
}

function subscribeAll(cb: () => void): () => void {
  const unsubs = STORES.map((s) => s.subscribe(cb));
  return () => unsubs.forEach((u) => u());
}

function combinedStatus(): StoreStatus {
  const statuses = STORES.map((s) => s.getSnapshot().status);
  if (statuses.some((st) => st === "error")) return "error";
  if (statuses.some((st) => st === "loading" || st === "idle")) return "loading";
  return "ready";
}

export interface AppDataState {
  status: StoreStatus;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useAppData(): AppDataState {
  const status = useSyncExternalStore(subscribeAll, combinedStatus, () => "loading" as StoreStatus);

  const retry = useCallback(() => {
    void hydrateAll();
  }, []);

  const error =
    status === "error"
      ? (STORES.map((s) => s.getSnapshot().error).find(Boolean) ?? "Something went wrong loading your data.")
      : null;

  return { status, loading: status === "loading", error, retry };
}
