import { useLocation } from "react-router-dom";
import { Icon } from "@/components/icons/Icon";
import { NAV_ITEMS } from "@/config/navigation";
import { Clock } from "./Clock";
import { GlobalSearch } from "./GlobalSearch";
import { GlobalActions } from "./GlobalActions";
import { NotificationBell } from "./NotificationBell";
import { ProfileMenu } from "./ProfileMenu";
import styles from "./Header.module.css";

export interface HeaderProps {
  onOpenMobileNav: () => void;
}

export function Header({ onOpenMobileNav }: HeaderProps) {
  const { pathname } = useLocation();
  const current = NAV_ITEMS.find((item) => pathname.startsWith(item.to));
  const context =
    current?.label ??
    (pathname.startsWith("/follow-ups")
      ? "Follow-ups"
      : pathname.startsWith("/notifications")
        ? "Notifications"
        : "DopeOrca OS");

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.menuBtn}
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
        >
          <Icon name="panel-left" size={18} />
        </button>
        <span className={styles.context}>{context}</span>
      </div>

      <div className={styles.center}>
        <GlobalSearch />
      </div>

      <div className={styles.right}>
        <div className={styles.actionSlot}>
          <GlobalActions compact />
        </div>
        <Clock className={styles.clock} />
        <Clock variant="compact" className={styles.clockCompact} />
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  );
}
