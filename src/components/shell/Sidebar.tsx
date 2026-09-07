import { Link } from "react-router-dom";
import { cn } from "@/utils/cn";
import { Icon } from "@/components/icons/Icon";
import { NAV_ITEMS } from "@/config/navigation";
import { AGENCY, CURRENT_ADMIN, getInitials } from "@/services/session";
import { SidebarNavItem } from "./SidebarNavItem";
import styles from "./Sidebar.module.css";

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Called after navigating — used to close the mobile drawer. */
  onNavigate?: () => void;
}

export function Sidebar({ collapsed, onToggleCollapsed, onNavigate }: SidebarProps) {
  return (
    <div className={cn(styles.sidebar, collapsed && styles.collapsed)}>
      <div className={styles.brand}>
        <Link to="/dashboard" className={styles.brandLink} onClick={onNavigate}>
          <span className={styles.glyph}>
            <Icon name="orca" size={17} weight={1.6} />
          </span>
          {!collapsed && <span className={styles.wordmark}>DopeOrca</span>}
        </Link>
      </div>

      <nav className={styles.nav} aria-label="Primary">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={cn(styles.profile, collapsed && styles.profileCollapsed)}>
          <span className={styles.avatar} aria-hidden="true">
            {getInitials(CURRENT_ADMIN.name)}
          </span>
          {!collapsed && (
            <span className={styles.profileMeta}>
              <span className={styles.profileName}>{CURRENT_ADMIN.name}</span>
              <span className={styles.profileStatus}>
                <span className={styles.statusDot} aria-hidden="true" />
                {AGENCY.agencyName}
              </span>
            </span>
          )}
        </div>

        <button
          type="button"
          className={styles.collapseBtn}
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={16} weight={2} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );
}
