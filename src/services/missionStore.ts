import { api } from "./api";
import type { StoreStatus } from "./storeStatus";

/** 45-Day Mission progress — mirrors the server's `MissionStatus` shape. */
export type MissionPhaseStatus = "not_started" | "in_progress" | "hit_target" | "missed";

export interface MissionPhase {
  phase: 1 | 2 | 3;
  targetRevenue: number;
  endDay: number;
  progressPercent: number;
  status: MissionPhaseStatus;
}

export interface MissionStatus {
  startDate: string;
  currentDay: number;
  currentPhase: 1 | 2 | 3;
  daysRemainingInPhase: number;
  daysRemainingOverall: number;
  revenueToDate: number;
  totalTargetRevenue: number;
  phases: MissionPhase[];
}

interface MissionState {
  status: StoreStatus;
  error: string | null;
  mission: MissionStatus | null;
}

let state: MissionState = { status: "idle", error: null, mission: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function set(next: Partial<MissionState>) {
  state = { ...state, ...next };
  emit();
}

export const missionStore = {
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
      const mission = await api.get<MissionStatus>("/mission");
      set({ mission, status: "ready", error: null });
    } catch (err) {
      set({ status: "error", error: err instanceof Error ? err.message : "Failed to load mission status" });
    }
  },

  async reload(): Promise<void> {
    const mission = await api.get<MissionStatus>("/mission");
    set({ mission });
  },
};
