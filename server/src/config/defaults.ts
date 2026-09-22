import { env } from "./env.js";
import { NOTIFICATION_TYPES, type NotificationType } from "../types/entities.js";

/**
 * Default values for the key/value settings store (spec Section G — Setting,
 * Section 18 — Settings). Locked defaults: INR, Asia/Kolkata, Mumbai.
 */
export const DEFAULT_SETTINGS: Record<string, unknown> = {
  "agency.name": "DopeOrca Technologies",
  "agency.location": "Mumbai, India",
  "agency.timezone": "Asia/Kolkata",
  "agency.currency": "INR",
  "agency.dateFormat": "d MMM yyyy",
  "agency.invoiceFooter": "",
  "notifications.renewalLeadDays": env.RENEWAL_LEAD_DAYS,
  "notifications.deadlineLeadDays": env.DEADLINE_LEAD_DAYS,
  "notifications.preferences": Object.fromEntries(
    NOTIFICATION_TYPES.map((t) => [t, true]),
  ) as Record<NotificationType, boolean>,
  "app.defaultLanding": "/dashboard",
  "app.listPageSize": 25,
  // 45-Day Mission (Outreach module) — `mission.startDate` is lazily set to
  // "today" on first read (mission.service.ts), not a static default.
  "mission.startDate": null,
  "mission.phase1TargetRevenue": 30_000,
  "mission.phase1EndDay": 15,
  "mission.phase2TargetRevenue": 60_000,
  "mission.phase2EndDay": 30,
  "mission.phase3TargetRevenue": 100_000,
  "mission.phase3EndDay": 45,
};
