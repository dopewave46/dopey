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
};
