import type { IconName } from "@/components/icons/Icon";

export interface NavItem {
  label: string;
  to: string;
  icon: IconName;
  /** Shown in the mobile bottom bar (max 5). */
  primaryMobile?: boolean;
}

/**
 * Primary navigation — order and destinations are locked by
 * Prompt 03 §1 and the Master Product Specification.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: "dashboard", primaryMobile: true },
  { label: "CRM", to: "/crm", icon: "crm", primaryMobile: true },
  { label: "Leads", to: "/leads", icon: "leads", primaryMobile: true },
  { label: "Projects", to: "/projects", icon: "projects", primaryMobile: true },
  { label: "Tasks", to: "/tasks", icon: "tasks", primaryMobile: true },
  { label: "Finance", to: "/finance", icon: "finance" },
  { label: "Analytics", to: "/analytics", icon: "analytics" },
  { label: "Maintenance / AMC", to: "/maintenance", icon: "maintenance" },
  { label: "Settings", to: "/settings", icon: "settings" },
];

export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) => item.primaryMobile);
