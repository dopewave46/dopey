import { NavLink } from "react-router-dom";
import { cn } from "@/utils/cn";
import { Icon, type IconName } from "@/components/icons/Icon";
import styles from "./SidebarNavItem.module.css";

export interface SidebarNavItemProps {
  to: string;
  label: string;
  icon: IconName;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNavItem({ to, label, icon, collapsed = false, onNavigate }: SidebarNavItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) => cn(styles.item, isActive && styles.active, collapsed && styles.collapsed)}
      title={collapsed ? label : undefined}
    >
      {({ isActive }) => (
        <>
          <span className={styles.icon}>
            <Icon name={icon} size={19} weight={isActive ? 1.9 : 1.7} />
          </span>
          {!collapsed && <span className={styles.label}>{label}</span>}
        </>
      )}
    </NavLink>
  );
}
