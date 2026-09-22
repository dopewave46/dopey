import { db } from "../repositories/index.js";
import { getSetting, setSetting } from "./settings.service.js";
import { nowISO } from "../utils/dates.js";

/**
 * 45-Day Mission progress (Outreach module). Phase targets/end-days live in
 * the existing settings key/value store (`mission.*`, spec-equivalent to the
 * agency settings). Revenue-to-date reuses the same "received = completed
 * payments" definition the Finance module already applies (finance.service's
 * `revenueSummary`/`clientFinance`/`projectFinance` all sum completed
 * payments the same way) — computed here for an arbitrary start date rather
 * than finance's fixed 3m/6m/12m/ytd buckets, without touching Finance code.
 */

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

/** Mission Day 1 is set the first time this module is used, then fixed. */
async function getStartDate(): Promise<string> {
  const existing = await getSetting<string | null>("mission.startDate");
  if (existing) return existing;
  const startDate = nowISO();
  await setSetting("mission.startDate", startDate);
  return startDate;
}

function localDay(iso: string): number {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** 1-indexed day number of the mission ("Day 1" = the start date itself). */
function dayNumber(startDate: string): number {
  const days = Math.round((localDay(nowISO()) - localDay(startDate)) / 86_400_000);
  return days + 1;
}

async function revenueSince(startDate: string): Promise<number> {
  const startMs = new Date(startDate).getTime();
  const payments = await db.payments.all();
  return payments
    .filter((p) => p.status === "completed" && new Date(p.paymentDate).getTime() >= startMs)
    .reduce((s, p) => s + p.amount, 0);
}

export async function getMissionStatus(): Promise<MissionStatus> {
  const startDate = await getStartDate();
  const [phase1Target, phase1EndDay, phase2Target, phase2EndDay, phase3Target, phase3EndDay] = await Promise.all([
    getSetting<number>("mission.phase1TargetRevenue"),
    getSetting<number>("mission.phase1EndDay"),
    getSetting<number>("mission.phase2TargetRevenue"),
    getSetting<number>("mission.phase2EndDay"),
    getSetting<number>("mission.phase3TargetRevenue"),
    getSetting<number>("mission.phase3EndDay"),
  ]);

  const currentDay = Math.max(1, dayNumber(startDate));
  const revenueToDate = await revenueSince(startDate);

  const phaseDefs: Array<{ phase: 1 | 2 | 3; target: number; endDay: number; prevEndDay: number }> = [
    { phase: 1, target: phase1Target, endDay: phase1EndDay, prevEndDay: 0 },
    { phase: 2, target: phase2Target, endDay: phase2EndDay, prevEndDay: phase1EndDay },
    { phase: 3, target: phase3Target, endDay: phase3EndDay, prevEndDay: phase2EndDay },
  ];

  const phases: MissionPhase[] = phaseDefs.map(({ phase, target, endDay, prevEndDay }) => {
    const progressPercent = target > 0 ? Math.min(100, Math.round((revenueToDate / target) * 100)) : 0;
    let status: MissionPhaseStatus;
    if (currentDay <= prevEndDay) status = "not_started";
    else if (revenueToDate >= target) status = "hit_target";
    else if (currentDay > endDay) status = "missed";
    else status = "in_progress";
    return { phase, targetRevenue: target, endDay, progressPercent, status };
  });

  const activeDef = phaseDefs.find((p) => currentDay <= p.endDay) ?? phaseDefs[phaseDefs.length - 1];

  return {
    startDate,
    currentDay,
    currentPhase: activeDef.phase,
    daysRemainingInPhase: Math.max(0, activeDef.endDay - currentDay + 1),
    daysRemainingOverall: Math.max(0, phase3EndDay - currentDay + 1),
    revenueToDate,
    totalTargetRevenue: phase3Target,
    phases,
  };
}
