import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Icon, type IconName } from "@/components/icons/Icon";
import styles from "./StatCard.module.css";

export type TrendDirection = "up" | "down" | "flat";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: IconName;
  trend?: {
    direction: TrendDirection;
    text: string;
  };
  /** Optional supporting element on the right of the footer (e.g. a sparkline). */
  visual?: ReactNode;
  /** Tints the value — use sparingly for genuinely urgent figures. */
  tone?: "default" | "error";
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  visual,
  tone = "default",
  loading = false,
}: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.label}>
        {icon && <Icon name={icon} size={15} weight={1.9} />}
        <span>{label}</span>
      </div>

      {loading ? (
        <div className={styles.valueSkeleton} aria-hidden="true" />
      ) : (
        <div className={cn(styles.value, tone === "error" && styles.valueError)}>{value}</div>
      )}

      {(trend || visual) && !loading && (
        <div className={styles.footer}>
          {trend && (
            <span className={cn(styles.trend, styles[`trend_${trend.direction}`])}>
              {trend.direction !== "flat" && (
                <Icon
                  name={trend.direction === "up" ? "arrow-up" : "arrow-down"}
                  size={13}
                  weight={2.4}
                />
              )}
              {trend.text}
            </span>
          )}
          {visual && <div className={styles.visual}>{visual}</div>}
        </div>
      )}
    </div>
  );
}
