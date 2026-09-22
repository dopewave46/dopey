import { db } from "../repositories/index.js";
import type { OutreachLog } from "../types/entities.js";
import { newId } from "../utils/ids.js";
import { nowISO, dayKey } from "../utils/dates.js";
import { NotFoundError } from "../utils/errors.js";

/**
 * Daily outreach habit log (Outreach + 45-Day Mission module). One row per
 * local calendar day — `getOrCreateTodayLog` is the only way a row is
 * created, so there is never a duplicate for the same day.
 */

export async function getOrCreateTodayLog(): Promise<OutreachLog> {
  const today = dayKey();
  const existing = await db.outreachLogs.find((l) => l.date === today);
  if (existing) return existing;

  const now = nowISO();
  const log: OutreachLog = {
    id: newId("outreach"),
    date: today,
    callsMade: 0,
    callsTarget: 30,
    instagramPosted: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.outreachLogs.insert(log);
  return log;
}

export async function updateTodayLog(patch: {
  callsMade?: number;
  instagramPosted?: boolean;
  notes?: string;
}): Promise<OutreachLog> {
  const log = await getOrCreateTodayLog();
  const updated = await db.outreachLogs.patch(log.id, patch);
  if (!updated) throw new NotFoundError("Outreach log");
  return updated;
}

export async function getLogHistory(limit = 30): Promise<OutreachLog[]> {
  const logs = await db.outreachLogs.all();
  return logs.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit);
}

function keyFor(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Consecutive days hitting the call target, computed fresh on every read —
 * never stored (same "derived, not stored" rule as invoice overdue / AMC
 * renewal status). Today only counts once it has itself hit target; otherwise
 * the streak walks backward starting from yesterday.
 */
export async function computeStreak(): Promise<number> {
  const logs = await db.outreachLogs.all();
  const byDate = new Map(logs.map((l) => [l.date, l]));

  const cursor = new Date();
  const today = byDate.get(dayKey());
  if (!today || today.callsMade < today.callsTarget) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  for (;;) {
    const log = byDate.get(keyFor(cursor));
    if (!log || log.callsMade < log.callsTarget) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
