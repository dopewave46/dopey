import type { BadgeTone } from "@/components/ui/StatusBadge";
import type { Amc } from "./types";

/** Default renewal lead-time (days) — configurable in Settings later. */
export const RENEWAL_LEAD_DAYS = 30;

export type AmcStatus = "active" | "expiring_soon" | "expired";

export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

/** Derived — never stored (Prompt 08 §4). */
export function amcStatus(amc: Amc, leadDays = RENEWAL_LEAD_DAYS): AmcStatus {
  const d = daysUntil(amc.renewalDate);
  if (d < 0) return "expired";
  if (d <= leadDays) return "expiring_soon";
  return "active";
}

export const AMC_STATUS_META: Record<AmcStatus, { label: string; tone: BadgeTone }> = {
  active: { label: "Active", tone: "success" },
  expiring_soon: { label: "Expiring Soon", tone: "warning" },
  expired: { label: "Expired", tone: "error" },
};

export const AMC_PAYMENT_META: Record<Amc["paymentStatus"], { label: string; tone: BadgeTone }> = {
  paid: { label: "Paid", tone: "success" },
  due: { label: "Due", tone: "warning" },
  overdue: { label: "Overdue", tone: "error" },
};

export interface RenewalItem {
  amc: Amc;
  kind: "amc" | "hosting";
  date: string;
  inDays: number;
}

/** AMC + hosting renewals within `days`, soonest first. */
export function upcomingRenewals(amcs: Amc[], days: number): RenewalItem[] {
  const items: RenewalItem[] = [];
  for (const amc of amcs) {
    const amcDays = daysUntil(amc.renewalDate);
    if (amcDays <= days) items.push({ amc, kind: "amc", date: amc.renewalDate, inDays: amcDays });
    if (amc.hostingRenewalDate) {
      const hostDays = daysUntil(amc.hostingRenewalDate);
      if (hostDays <= days) items.push({ amc, kind: "hosting", date: amc.hostingRenewalDate, inDays: hostDays });
    }
  }
  return items.sort((a, b) => a.inDays - b.inDays);
}

export function amcsForClient(amcs: Amc[], clientId: string): Amc[] {
  return amcs.filter((a) => a.clientId === clientId);
}
