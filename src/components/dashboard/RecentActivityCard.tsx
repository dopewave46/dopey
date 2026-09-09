import { Card, CardHeader } from "@/components/ui/Card";
import { ViewAllLink } from "@/components/ui/ViewAllLink";
import { Icon } from "@/components/icons/Icon";
import { cn } from "@/utils/cn";
import { formatRelativeTime } from "@/utils/format";
import type { ActivityItem } from "@/services/dashboardData";
import s from "./sections.module.css";

export function RecentActivityCard({ activity }: { activity: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader
        title="Recent Activity"
        subtitle="Across the agency"
        action={<ViewAllLink to="/notifications">View all activity</ViewAllLink>}
      />
      <div className={s.activityList}>
        {activity.slice(0, 6).map((item) => (
          <div key={item.id} className={s.activityItem}>
            <span className={cn(s.activityDot, s[item.tone])}>
              <Icon name={item.icon} size={14} weight={1.9} />
            </span>
            <div>
              <div className={s.activityText}>{item.text}</div>
              <div className={s.activityTime}>{formatRelativeTime(item.at)}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
