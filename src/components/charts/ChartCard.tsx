import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import styles from "./charts.module.css";

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  /** Big headline figure shown above the chart. */
  headline?: ReactNode;
  headlineNote?: ReactNode;
  /** When false, render the "not enough data" empty state instead of the chart. */
  hasData?: boolean;
  emptyMessage?: string;
  children: ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  headline,
  headlineNote,
  hasData = true,
  emptyMessage = "Not enough data yet for this period.",
  children,
}: ChartCardProps) {
  return (
    <Card className={styles.card}>
      <h4>{title}</h4>
      {subtitle && <p className={styles.sub}>{subtitle}</p>}
      {hasData ? (
        <>
          {headline !== undefined && (
            <div className={styles.headline}>
              {headline}
              {headlineNote && <small>{headlineNote}</small>}
            </div>
          )}
          {children}
        </>
      ) : (
        <EmptyState compact icon="analytics" title={emptyMessage} />
      )}
    </Card>
  );
}
