import { db } from "../repositories/index.js";
import type { FollowUp } from "../types/entities.js";
import { newId } from "../utils/ids.js";
import { nowISO, startOfToday, DAY_MS } from "../utils/dates.js";
import { NotFoundError } from "../utils/errors.js";

export type FollowUpBucket = "overdue" | "today" | "week" | "later";

export function bucketOf(dueDate: string): FollowUpBucket {
  const sot = startOfToday();
  const t = new Date(dueDate).getTime();
  if (t < sot) return "overdue";
  if (t < sot + DAY_MS) return "today";
  if (t < sot + 7 * DAY_MS) return "week";
  return "later";
}

export async function listFollowUps(opts: { status?: "pending" | "done"; parentType?: FollowUp["parentType"]; parentId?: string } = {}): Promise<FollowUp[]> {
  let rows = await db.followUps.all();
  if (opts.status) rows = rows.filter((f) => f.status === opts.status);
  if (opts.parentType) rows = rows.filter((f) => f.parentType === opts.parentType);
  if (opts.parentId) rows = rows.filter((f) => f.parentId === opts.parentId);
  return rows.sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
}

export async function addFollowUp(input: Omit<FollowUp, "id" | "status"> & { status?: FollowUp["status"] }): Promise<FollowUp> {
  const followUp: FollowUp = { ...input, id: newId("fu"), status: input.status ?? "pending" };
  await db.followUps.insert(followUp);
  return followUp;
}

export async function completeFollowUp(id: string): Promise<FollowUp> {
  const existing = await db.followUps.getById(id);
  if (!existing) throw new NotFoundError("Follow-up");
  return (await db.followUps.patch(id, { status: "done", completedAt: nowISO() }))!;
}

export async function rescheduleFollowUp(id: string, dueDate: string): Promise<FollowUp> {
  const existing = await db.followUps.getById(id);
  if (!existing) throw new NotFoundError("Follow-up");
  return (await db.followUps.patch(id, { dueDate, status: "pending", completedAt: undefined }))!;
}

export async function deleteFollowUp(id: string): Promise<void> {
  const existing = await db.followUps.getById(id);
  if (!existing) throw new NotFoundError("Follow-up");
  await db.followUps.remove(id);
}
