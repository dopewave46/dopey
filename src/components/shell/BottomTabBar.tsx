import { NavLink } from "react-router-dom";
import { cn } from "@/utils/cn";
import { Icon } from "@/components/icons/Icon";
import { MOBILE_NAV_ITEMS } from "@/config/navigation";
import styles from "./BottomTabBar.module.css";

/** Persistent bottom navigation on mobile — the five most-used destinations. */
export function BottomTabBar() {
  return (
    <nav className={styles.bar} aria-label="Primary (mobile)">
      {MOBILE_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => cn(styles.tab, isActive && styles.active)}
        >
          <Icon name={item.icon} size={20} weight={1.8} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
