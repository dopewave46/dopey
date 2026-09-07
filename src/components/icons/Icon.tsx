import type { SVGProps } from "react";

export type IconName =
  | "dashboard"
  | "crm"
  | "building"
  | "leads"
  | "projects"
  | "tasks"
  | "finance"
  | "analytics"
  | "maintenance"
  | "settings"
  | "search"
  | "bell"
  | "plus"
  | "chevron-down"
  | "chevron-right"
  | "chevron-left"
  | "close"
  | "check"
  | "alert-triangle"
  | "alert-circle"
  | "inbox"
  | "refresh"
  | "panel-left"
  | "user"
  | "logout"
  | "calendar"
  | "clock"
  | "rupee"
  | "arrow-up"
  | "arrow-down"
  | "arrow-right"
  | "credit-card"
  | "trending-up"
  | "more"
  | "external-link"
  | "orca"
  | "circle-dot";

const PATHS: Record<IconName, JSX.Element> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  crm: (
    <>
      <path d="M16 19c0-2.8-2.7-5-6-5s-6 2.2-6 5" />
      <circle cx="10" cy="8" r="3.2" />
      <path d="M20 18.5c0-2-1.3-3.7-3.2-4.4" />
      <path d="M15.2 5.2A3 3 0 0 1 17 11" />
    </>
  ),
  building: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" />
    </>
  ),
  leads: (
    <>
      <path d="M14 19c0-2.8-2.5-5-5.5-5S3 16.2 3 19" />
      <circle cx="8.5" cy="8" r="3.2" />
      <path d="M18 8v6M15 11h6" />
    </>
  ),
  projects: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  tasks: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  finance: (
    <>
      <path d="M4 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1" />
      <path d="M4 7v10a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-3" />
      <path d="M20 11h-4a2 2 0 0 0 0 4h4a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1z" />
    </>
  ),
  analytics: (
    <>
      <path d="M4 20V4M4 20h16" />
      <rect x="7" y="12" width="3" height="5" />
      <rect x="12.5" y="8" width="3" height="9" />
      <rect x="18" y="14" width="3" height="3" />
    </>
  ),
  maintenance: <path d="M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5l-2.8 2.8-2.2-.6-.6-2.2z" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  "chevron-down": <path d="M6 9l6 6 6-6" />,
  "chevron-right": <path d="M9 6l6 6-6 6" />,
  "chevron-left": <path d="M15 6l-6 6 6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="M5 12l4.5 4.5L19 7" />,
  "alert-triangle": (
    <>
      <path d="M12 4 2.5 20h19z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  "alert-circle": (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4M12 16h.01" />
    </>
  ),
  inbox: <path d="M3 13h5l1.5 3h5L21 13M3 13l3.5-8h11L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />,
  refresh: <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.7 5.7L4 16M4 20v-4h4" />,
  "panel-left": (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M9 4v16" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </>
  ),
  logout: <path d="M15 5h3a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-3M10 12h9m0 0-3-3m3 3-3 3M9 12H3" />,
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2.5" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  rupee: <path d="M7 5h10M7 9h10M15 5c0 4-3 5-6 5l7 9M7 9h4" />,
  "arrow-up": <path d="M12 19V5M6 11l6-6 6 6" />,
  "arrow-down": <path d="M12 5v14M6 13l6 6 6-6" />,
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  "credit-card": (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3 10h18" />
    </>
  ),
  "trending-up": <path d="M4 17l6-6 4 4 6-7M15 8h5v5" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </>
  ),
  "external-link": <path d="M14 5h5v5M19 5l-8 8M12 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" />,
  orca: (
    <>
      <path d="M4 6c4 0 6 3 8 3s3-2 7-2c-1 4-4 9-9 9-4 0-6-3-6-6 0-2 0-3 0-4z" />
      <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  "circle-dot": (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </>
  ),
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  /** Stroke width; defaults to 1.7 (design-system line weight). */
  weight?: number;
}

export function Icon({ name, size = 18, weight = 1.7, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
