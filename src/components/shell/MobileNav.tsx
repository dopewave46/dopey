import { useRef } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/icons/Icon";
import { NAV_ITEMS } from "@/config/navigation";
import { AGENCY, CURRENT_ADMIN, getInitials } from "@/services/session";
import { Portal, useBodyScrollLock, useOverlayKeys } from "@/components/ui/overlay-internals";
import { SidebarNavItem } from "./SidebarNavItem";
import { Clock } from "./Clock";
import styles from "./MobileNav.module.css";

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

/** Full-height slide-over navigation for tablet / mobile. */
export function MobileNav({ open, onClose }: MobileNavProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useBodyScrollLock(open);
  useOverlayKeys(open, panelRef, onClose);

  if (!open) return null;

  return (
    <Portal>
      <div className={styles.scrim} onClick={onClose}>
        <div
          ref={panelRef}
          className={styles.panel}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.head}>
            <Link to="/dashboard" className={styles.brand} onClick={onClose}>
              <span className={styles.glyph}>
                <Icon name="orca" size={17} weight={1.6} />
              </span>
              DopeOrca
            </Link>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close navigation">
              <Icon name="close" size={18} />
            </button>
          </div>

          <Clock variant="full" className={styles.clock} />

          <nav className={styles.nav} aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <SidebarNavItem
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                onNavigate={onClose}
              />
            ))}
          </nav>

          <div className={styles.footer}>
            <span className={styles.avatar} aria-hidden="true">
              {getInitials(CURRENT_ADMIN.name)}
            </span>
            <span className={styles.profileMeta}>
              <span className={styles.profileName}>{CURRENT_ADMIN.name}</span>
              <span className={styles.profileSub}>{AGENCY.agencyName}</span>
            </span>
          </div>
        </div>
      </div>
    </Portal>
  );
}
