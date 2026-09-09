import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonText } from "@/components/ui/Skeleton";
import { Icon } from "@/components/icons/Icon";
import { RescheduleModal } from "@/components/crm/RescheduleModal";
import { useCrm } from "@/hooks/useCrm";
import { useSimulatedLoad } from "@/hooks/useSimulatedLoad";
import { useToast } from "@/components/feedback/ToastProvider";
import { run } from "@/utils/runAction";
import { resolveFollowUps, daysOverdue, type FollowUpBucket } from "@/services/crmSelectors";
import { formatDate } from "@/utils/format";
import type { FollowUp } from "@/services/types";
import styles from "./FollowUpsPage.module.css";

const BUCKETS: Array<{ key: FollowUpBucket; label: string; tone: "error" | "warning" | "neutral" }> = [
  { key: "overdue", label: "Overdue", tone: "error" },
  { key: "today", label: "Today", tone: "warning" },
  { key: "week", label: "This week", tone: "neutral" },
  { key: "later", label: "Later", tone: "neutral" },
];

export function FollowUpsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const loading = useSimulatedLoad();
  const { leads, clients, followUps, store } = useCrm();
  const [reschedule, setReschedule] = useState<FollowUp | null>(null);

  const groups = useMemo(
    () => resolveFollowUps(followUps, leads, clients),
    [followUps, leads, clients],
  );
  const total = BUCKETS.reduce((n, b) => n + groups[b.key].length, 0);

  return (
    <>
      <PageHeader
        title="Follow-ups"
        description="Everyone who needs a call, grouped by when. Leads and clients together."
      />

      {loading ? (
        <Card>
          <SkeletonText lines={6} />
        </Card>
      ) : total === 0 ? (
        <EmptyState icon="calendar" title="You're all caught up" description="No follow-ups scheduled." />
      ) : (
        <div className={styles.stack}>
          {BUCKETS.map((bucket) => {
            const items = groups[bucket.key];
            if (items.length === 0) return null;
            return (
              <section key={bucket.key}>
                <h2 className={styles.groupTitle} data-tone={bucket.tone}>
                  {bucket.label}
                  <span className={styles.groupCount}>{items.length}</span>
                </h2>
                <Card padding="none">
                  <ul className={styles.list}>
                    {items.map(({ followUp, title, href }) => {
                      const overdueDays = bucket.key === "overdue" ? daysOverdue(followUp.dueDate) : 0;
                      return (
                        <li key={followUp.id} className={styles.item}>
                          <button
                            type="button"
                            className={styles.itemMain}
                            onClick={() => navigate(href)}
                          >
                            <span className={styles.itemIcon} data-tone={bucket.tone}>
                              <Icon
                                name={followUp.parentType === "lead" ? "leads" : "building"}
                                size={15}
                                weight={1.9}
                              />
                            </span>
                            <span className={styles.itemBody}>
                              <span className={styles.itemTitle}>{title}</span>
                              <span className={styles.itemNote}>{followUp.note}</span>
                              <span className={styles.itemDue} data-tone={bucket.tone}>
                                {formatDate(followUp.dueDate)}
                                {overdueDays > 0 && ` · ${overdueDays} day${overdueDays > 1 ? "s" : ""} overdue`}
                              </span>
                            </span>
                          </button>
                          <div className={styles.itemActions}>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                void run(store.completeFollowUp(followUp.id), toast, "Couldn't update the follow-up").then(
                                  (ok) => ok && toast.success("Follow-up done", title),
                                );
                              }}
                            >
                              Mark done
                            </Button>
                            <Button size="sm" variant="tertiary" onClick={() => setReschedule(followUp)}>
                              Reschedule
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </section>
            );
          })}
        </div>
      )}

      <RescheduleModal followUp={reschedule} onClose={() => setReschedule(null)} />
    </>
  );
}
