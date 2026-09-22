import type { OutreachLog } from "./types";
import { api } from "./api";
import type { StoreStatus } from "./storeStatus";

/**
 * Outreach daily log store (45-Day Mission module) — API-backed, same
 * `useSyncExternalStore` shape as every other module store.
 */

interface OutreachState {
  today: OutreachLog | null;
  history: OutreachLog[];
  streak: number;
  status: StoreStatus;
  error: string | null;
}

let state: OutreachState = { today: null, history: [], streak: 0, status: "idle", error: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function set(next: Partial<OutreachState>) {
  state = { ...state, ...next };
  emit();
}

async function loadAll() {
  const [today, history, streakRes] = await Promise.all([
    api.get<OutreachLog>("/outreach/today"),
    api.get<OutreachLog[]>("/outreach/history"),
    api.get<{ streak: number }>("/outreach/streak"),
  ]);
  set({ today, history, streak: streakRes.streak });
}

export const outreachStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },

  async hydrate(): Promise<void> {
    if (state.status === "loading") return;
    set({ status: "loading", error: null });
    try {
      await loadAll();
      set({ status: "ready", error: null });
    } catch (err) {
      set({ status: "error", error: err instanceof Error ? err.message : "Failed to load outreach log" });
    }
  },

  async reload(): Promise<void> {
    await loadAll();
  },

  async updateToday(patch: { callsMade?: number; instagramPosted?: boolean; notes?: string }): Promise<OutreachLog> {
    const updated = await api.patch<OutreachLog>("/outreach/today", patch);
    const streakRes = await api.get<{ streak: number }>("/outreach/streak");
    const history = await api.get<OutreachLog[]>("/outreach/history");
    set({ today: updated, history, streak: streakRes.streak });
    return updated;
  },
};
