import { cn } from "@/utils/cn";
import { Icon, type IconName } from "@/components/icons/Icon";
import { formatRelativeTime } from "@/utils/format";
import type { Activity } from "@/services/types";
import { EmptyState } from "./EmptyState";
import styles from "./ActivityTimeline.module.css";

type Tone = "crimson" | "success" | "neutral";

const TYPE_META: Record<string, { icon: IconName; tone: Tone }> = {
  lead_created: { icon: "leads", tone: "crimson" },
  lead_converted: { icon: "check", tone: "success" },
  lead_archived: { icon: "close", tone: "neutral" },
  stage_changed: { icon: "arrow-right", tone: "crimson" },
  note_logged: { icon: "clock", tone: "neutral" },
  client_created: { icon: "building", tone: "crimson" },
  client_updated: { icon: "building", tone: "neutral" },
  payment_received: { icon: "check", tone: "success" },
  project_created: { icon: "projects", tone: "crimson" },
  follow_up_scheduled: { icon: "calendar", tone: "neutral" },
};

function metaFor(a: Activity) {
  return TYPE_META[a.type] ?? { icon: "circle-dot" as IconName, tone: "neutral" as Tone };
}

export function ActivityTimeline({
  activities,
  emptyLabel = "No activity yet",
  limit,
}: {
  activities: Activity[];
  emptyLabel?: string;
  limit?: number;
}) {
  if (activities.length === 0) {
    return <EmptyState compact icon="clock" title={emptyLabel} />;
  }
  const items = limit ? activities.slice(0, limit) : activities;

  return (
    <div className={styles.list}>
      {items.map((a) => {
        const m = metaFor(a);
        return (
          <div key={a.id} className={styles.item}>
            <span className={cn(styles.dot, styles[m.tone])}>
              <Icon name={m.icon} size={14} weight={1.9} />
            </span>
            <div className={styles.body}>
              <div className={styles.text}>{a.summary}</div>
              <div className={styles.time}>{formatRelativeTime(a.createdAt)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
