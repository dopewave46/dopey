import type { AgencySettings, User } from "./types";

/**
 * Session / agency context.
 *
 * Authentication is out of scope for the shell (Prompt 03, §22). This provides
 * the current admin + agency identity that the header and profile menu need,
 * from a single place a real auth layer can replace later.
 */

export const CURRENT_ADMIN: User = {
  id: "admin",
  name: "Shahid Khan",
  email: "hello@dopeorca.tech",
  role: "admin",
};

export const AGENCY: AgencySettings = {
  agencyName: "DopeOrca Technologies",
  location: "Mumbai, India",
  timezone: "Asia/Kolkata",
  currency: "INR",
  admin: CURRENT_ADMIN,
};

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
