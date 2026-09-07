import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon, type IconName } from "@/components/icons/Icon";
import { SAMPLE_NOTIFICATIONS } from "@/data/sampleNotifications";
import type { AppNotification, NotificationType } from "@/services/types";
import { formatRelativeTime } from "@/utils/format";
import styles from "./NotificationsPage.module.css";

const TYPE_META: Record<NotificationType, { icon: IconName; tone: string }> = {
  invoice_overdue: { icon: "finance", tone: "error" },
  task_overdue: { icon: "tasks", tone: "error" },
  follow_up_due: { icon: "calendar", tone: "warning" },
  amc_renewal: { icon: "clock", tone: "warning" },
  project_deadline: { icon: "projects", tone: "warning" },
  payment_received: { icon: "check", tone: "success" },
  new_lead: { icon: "leads", tone: "info" },
  client_update: { icon: "crm", tone: "info" },
};

export function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>(SAMPLE_NOTIFICATIONS);
  const unread = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Follow-ups, overdue items, renewals and payments — kept low-noise."
        actions={
          unread > 0 ? (
            <Button
              variant="secondary"
              iconLeft="check"
              onClick={() => setItems((l) => l.map((n) => ({ ...n, isRead: true })))}
            >
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <Card padding="none">
        {items.length === 0 ? (
          <EmptyState icon="bell" title="You're all caught up" description="New notifications will appear here." />
        ) : (
          <ul className={styles.list}>
            {items.map((n) => {
              const meta = TYPE_META[n.type];
              return (
                <li
                  key={n.id}
                  className={n.isRead ? styles.item : `${styles.item} ${styles.unread}`}
                >
                  <span className={`${styles.icon} ${styles[meta.tone]}`}>
                    <Icon name={meta.icon} size={16} weight={1.9} />
                  </span>
                  <div className={styles.body}>
                    <p className={styles.title}>{n.title}</p>
                    <p className={styles.text}>{n.body}</p>
                  </div>
                  <time className={styles.time}>{formatRelativeTime(n.createdAt)}</time>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
