import { useId, useRef, type ReactNode } from "react";
import { Icon } from "@/components/icons/Icon";
import { Portal, useBodyScrollLock, useOverlayKeys } from "./overlay-internals";
import styles from "./Drawer.module.css";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/** Right-side drawer for quick detail views (lead / client / project preview). */
export function Drawer({ open, onClose, title, eyebrow, children, footer }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

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
          aria-labelledby={titleId}
          onClick={(e) => e.stopPropagation()}
        >
          <header className={styles.header}>
            <div className={styles.headingGroup}>
              {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
            </div>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close panel">
              <Icon name="close" size={18} />
            </button>
          </header>

          <div className={styles.body}>{children}</div>

          {footer && <footer className={styles.footer}>{footer}</footer>}
        </div>
      </div>
    </Portal>
  );
}
