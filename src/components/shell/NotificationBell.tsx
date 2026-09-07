import { useMemo, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/icons/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { SAMPLE_NOTIFICATIONS } from "@/data/sampleNotifications";
import type { AppNotification, NotificationType } from "@/services/types";
import { formatRelativeTime } from "@/utils/format";
import styles from "./NotificationBell.module.css";

const TYPE_META: Record<NotificationType, { icon: IconName; tone: "error" | "success" | "warning" | "info" }> = {
  invoice_overdue: { icon: "finance", tone: "error" },
  task_overdue: { icon: "tasks", tone: "error" },
  follow_up_due: { icon: "calendar", tone: "warning" },
  amc_renewal: { icon: "clock", tone: "warning" },
  project_deadline: { icon: "projects", tone: "warning" },
  payment_received: { icon: "check", tone: "success" },
  new_lead: { icon: "leads", tone: "info" },
  client_update: { icon: "crm", tone: "info" },
};

export function NotificationBell() {
  const { isOpen, toggle, close } = useDisclosure();
  const [items, setItems] = useState<AppNotification[]>(SAMPLE_NOTIFICATIONS);
  const wrapRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(wrapRef, close, isOpen);

  const unread = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  const markAllRead = () => setItems((list) => list.map((n) => ({ ...n, isRead: true })));
  const markRead = (id: string) =>
    setItems((list) => list.map((n) => (n.id === id ? { ...n, isRead: true } : n)));

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.bell}
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      >
        <Icon name="bell" size={18} />
        {unread > 0 && <span className={styles.dot} aria-hidden="true" />}
      </button>

      {isOpen && (
        <div className={styles.panel} role="dialog" aria-label="Notifications">
          <header className={styles.header}>
            <span className={styles.title}>Notifications</span>
            {unread > 0 && (
              <button type="button" className={styles.markAll} onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </header>

          <div className={styles.list}>
            {items.length === 0 ? (
              <EmptyState compact icon="bell" title="You're all caught up" />
            ) : (
              items.map((n) => {
                const meta = TYPE_META[n.type];
                return (
                  <button
                    key={n.id}
                    type="button"
                    className={n.isRead ? styles.item : `${styles.item} ${styles.unread}`}
                    onClick={() => markRead(n.id)}
                  >
                    <span className={`${styles.itemIcon} ${styles[meta.tone]}`}>
                      <Icon name={meta.icon} size={15} weight={1.9} />
                    </span>
                    <span className={styles.itemBody}>
                      <span className={styles.itemTitle}>{n.title}</span>
                      <span className={styles.itemText}>{n.body}</span>
                      <span className={styles.itemTime}>{formatRelativeTime(n.createdAt)}</span>
                    </span>
                    {!n.isRead && <span className={styles.itemUnreadDot} aria-hidden="true" />}
                  </button>
                );
              })
            )}
          </div>

          <footer className={styles.footer}>
            <a href="/notifications" onClick={close}>
              View all notifications
            </a>
          </footer>
        </div>
      )}
    </div>
  );
}
