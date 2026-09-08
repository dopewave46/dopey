import { db } from "../repositories/index.js";
import type { Activity, ActivityEntity } from "../types/entities.js";
import { newId } from "../utils/ids.js";
import { nowISO } from "../utils/dates.js";
import { logger } from "../utils/logger.js";

/**
 * Central activity logger (spec Section J, Prompt 09 §7). Every meaningful
 * mutation — create, status change, payment, conversion, completion — writes
 * one Activity row. Append-only; never updated or deleted here.
 */
export async function logActivity(
  entityType: ActivityEntity,
  entityId: string,
  type: string,
  summary: string,
): Promise<Activity> {
  const activity: Activity = {
    id: newId("act"),
    type,
    entityType,
    entityId,
    summary,
    createdAt: nowISO(),
  };
  await db.activities.insert(activity);
  logger.info({ type, entityType, entityId }, "activity");
  return activity;
}

export async function listActivities(opts: { entityType?: ActivityEntity; entityId?: string; limit?: number } = {}): Promise<Activity[]> {
  let rows = await db.activities.all();
  if (opts.entityType) rows = rows.filter((a) => a.entityType === opts.entityType);
  if (opts.entityId) rows = rows.filter((a) => a.entityId === opts.entityId);
  rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return opts.limit ? rows.slice(0, opts.limit) : rows;
}
