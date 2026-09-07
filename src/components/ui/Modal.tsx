import { useId, useRef, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Icon } from "@/components/icons/Icon";
import {
  Portal,
  useBodyScrollLock,
  useOverlayKeys,
} from "./overlay-internals";
import styles from "./Modal.module.css";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Footer actions — typically <Button> elements, primary last. */
  footer?: ReactNode;
  size?: "sm" | "md";
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useBodyScrollLock(open);
  useOverlayKeys(open, panelRef, onClose);

  if (!open) return null;

  return (
    <Portal>
      <div className={styles.scrim} onClick={onClose}>
        <div
          ref={panelRef}
          className={cn(styles.panel, styles[size])}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          <header className={styles.header}>
            <div className={styles.headingGroup}>
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
              {description && (
                <p id={descId} className={styles.description}>
                  {description}
                </p>
              )}
            </div>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close dialog">
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
