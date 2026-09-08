import { useMemo, useSyncExternalStore } from "react";
import { amcStore } from "@/services/amcStore";
import { financeStore } from "@/services/financeStore";
import { taskStore } from "@/services/taskStore";
import { crmStore } from "@/services/crmStore";
import { deriveNotifications } from "@/services/notificationSelectors";

/** Re-derives notifications whenever any feeding store changes. */
export function useLiveNotifications() {
  const subscribe = (cb: () => void) => {
    const unsubs = [
      amcStore.subscribe(cb),
      financeStore.subscribe(cb),
      taskStore.subscribe(cb),
      crmStore.subscribe(cb),
    ];
    return () => unsubs.forEach((u) => u());
  };
  // Snapshot identity changes with any store; recompute the derived list in a memo.
  const tick = useSyncExternalStore(
    subscribe,
    () =>
      `${amcStore.getSnapshot().amcs.length}:${financeStore.getSnapshot().invoices.length}:${
        taskStore.getSnapshot().length
      }:${financeStore.getSnapshot().payments.length}`,
    () => "0",
  );
  return useMemo(() => deriveNotifications(), [tick]);
}
