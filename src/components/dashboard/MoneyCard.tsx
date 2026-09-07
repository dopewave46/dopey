import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ViewAllLink } from "@/components/ui/ViewAllLink";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";
import type { MoneyPosition } from "@/data/sampleDashboard";
import s from "./sections.module.css";

export function MoneyCard({ money }: { money: MoneyPosition }) {
  const pct = money.target > 0 ? (money.collected / money.target) * 100 : 0;
  const remaining = Math.max(0, money.target - money.collected);

  const items: Array<{ k: string; v: number; className?: string }> = [
    { k: "Revenue", v: money.revenue },
    { k: "Collected", v: money.collected, className: s.collected },
    { k: "Pending", v: money.pending, className: s.pending },
  ];

  return (
    <Card>
      <CardHeader
        title="This Month"
        subtitle="Financial position"
        action={<ViewAllLink to="/finance">Finance</ViewAllLink>}
      />

      <div className={s.moneyGrid}>
        {items.map((item) => (
          <div key={item.k} className={s.moneyItem}>
            <span className={s.moneyK}>{item.k}</span>
            <span className={cn(s.moneyV, item.className)}>{formatCurrency(item.v)}</span>
          </div>
        ))}
      </div>

      <div className={s.targetBlock}>
        <div className={s.targetTop}>
          <span className={s.targetLabel}>Collected vs target</span>
          <span className={s.figure}>
            {formatCurrency(money.collected)}{" "}
            <span className={s.figureMuted}>/ {formatCurrency(money.target)}</span>
          </span>
        </div>
        <ProgressBar value={pct} label={`Collected ${Math.round(pct)}% of the monthly target`} />
        <p className={s.targetHint}>{formatCurrency(remaining)} to go this month</p>
      </div>
    </Card>
  );
}
