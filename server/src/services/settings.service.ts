import { db } from "../repositories/index.js";
import { DEFAULT_SETTINGS } from "../config/defaults.js";
import type { AgencySettings, NotificationType } from "../types/entities.js";
import { getAdminUser } from "./auth.service.js";

/**
 * Settings live in a single key/value store (spec Section G). `getAgencySettings`
 * assembles the view the frontend consumes (Prompt 03/08).
 */

async function value<T>(key: string): Promise<T> {
  const stored = await db.settings.get<T>(key);
  return (stored ?? DEFAULT_SETTINGS[key]) as T;
}

export async function getSetting<T = unknown>(key: string): Promise<T> {
  return value<T>(key);
}

export async function setSetting(key: string, val: unknown): Promise<void> {
  if (!(key in DEFAULT_SETTINGS)) {
    throw new Error(`Unknown setting: ${key}`);
  }
  await db.settings.set(key, val);
}

export async function updateSettings(patch: Record<string, unknown>): Promise<AgencySettings> {
  for (const [key, val] of Object.entries(patch)) {
    await setSetting(key, val);
  }
  return getAgencySettings();
}

export async function getAgencySettings(): Promise<AgencySettings> {
  const admin = await getAdminUser();
  return {
    agencyName: await value<string>("agency.name"),
    location: await value<string>("agency.location"),
    timezone: await value<string>("agency.timezone"),
    currency: "INR",
    dateFormat: await value<string>("agency.dateFormat"),
    renewalLeadDays: await value<number>("notifications.renewalLeadDays"),
    deadlineLeadDays: await value<number>("notifications.deadlineLeadDays"),
    notificationPreferences: await value<Record<NotificationType, boolean>>("notifications.preferences"),
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatarUrl: admin.avatarUrl,
    },
  };
}

export async function renewalLeadDays(): Promise<number> {
  return value<number>("notifications.renewalLeadDays");
}
export async function deadlineLeadDays(): Promise<number> {
  return value<number>("notifications.deadlineLeadDays");
}
export async function notificationEnabled(type: NotificationType): Promise<boolean> {
  const prefs = await value<Record<NotificationType, boolean>>("notifications.preferences");
  return prefs?.[type] ?? true;
}
