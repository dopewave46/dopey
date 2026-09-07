import type { Activity, Client, FollowUp, Lead } from "./types";

export function lastContactAt(activities: Activity[], entityId: string): string | undefined {
  return activities.find((a) => a.entityId === entityId)?.createdAt;
}

export function activitiesForEntity(activities: Activity[], entityId: string): Activity[] {
  return activities
    .filter((a) => a.entityId === entityId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Earliest pending follow-up for a lead or client. */
export function nextFollowUp(
  followUps: FollowUp[],
  parentType: FollowUp["parentType"],
  parentId: string,
): FollowUp | undefined {
  return followUps
    .filter((f) => f.parentType === parentType && f.parentId === parentId && f.status === "pending")
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))[0];
}

export type FollowUpBucket = "overdue" | "today" | "week" | "later";

export function bucketForDate(iso: string): FollowUpBucket {
  const due = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTomorrow = startOfToday + 86_400_000;
  const endOfWeek = startOfToday + 7 * 86_400_000;
  const t = due.getTime();
  if (t < startOfToday) return "overdue";
  if (t < startOfTomorrow) return "today";
  if (t < endOfWeek) return "week";
  return "later";
}

export function daysOverdue(iso: string): number {
  const due = new Date(iso).getTime();
  return Math.max(0, Math.floor((Date.now() - due) / 86_400_000));
}

export interface ResolvedFollowUp {
  followUp: FollowUp;
  title: string;
  href: string;
  bucket: FollowUpBucket;
}

export function resolveFollowUps(
  followUps: FollowUp[],
  leads: Lead[],
  clients: Client[],
): Record<FollowUpBucket, ResolvedFollowUp[]> {
  const groups: Record<FollowUpBucket, ResolvedFollowUp[]> = {
    overdue: [],
    today: [],
    week: [],
    later: [],
  };
  for (const followUp of followUps) {
    if (followUp.status !== "pending") continue;
    let title = "Follow-up";
    let href = "/follow-ups";
    if (followUp.parentType === "lead") {
      const lead = leads.find((l) => l.id === followUp.parentId);
      if (lead) {
        title = lead.business || lead.name;
        href = `/leads/${lead.id}`;
      }
    } else {
      const client = clients.find((c) => c.id === followUp.parentId);
      if (client) {
        title = client.company || client.name;
        href = `/clients/${client.id}`;
      }
    }
    const bucket = bucketForDate(followUp.dueDate);
    groups[bucket].push({ followUp, title, href, bucket });
  }
  for (const key of Object.keys(groups) as FollowUpBucket[]) {
    groups[key].sort((a, b) => (a.followUp.dueDate < b.followUp.dueDate ? -1 : 1));
  }
  return groups;
}
