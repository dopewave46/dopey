import type { AgencySettings, User } from "./types";

/**
 * Session / agency context.
 *
 * Prompt 11: these are populated by `AuthProvider` from `GET /api/auth/me` and
 * `GET /api/settings` once the session is confirmed. They stay as plain module
 * values (not a hook) so the ~10 components that read `CURRENT_ADMIN` / `AGENCY`
 * synchronously during render don't have to change — by the time any page
 * mounts inside the authed shell, both are set.
 */

const FALLBACK_ADMIN: User = {
  id: "admin",
  name: "Shahid Khan",
  email: "hello@dopeorca.tech",
  role: "admin",
};

const FALLBACK_AGENCY: AgencySettings = {
  agencyName: "DopeOrca Technologies",
  location: "Mumbai, India",
  timezone: "Asia/Kolkata",
  currency: "INR",
  admin: FALLBACK_ADMIN,
};

export let CURRENT_ADMIN: User = FALLBACK_ADMIN;
export let AGENCY: AgencySettings = FALLBACK_AGENCY;

export function setCurrentAdmin(user: User): void {
  CURRENT_ADMIN = user;
}

export function setAgency(agency: AgencySettings): void {
  AGENCY = agency;
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
