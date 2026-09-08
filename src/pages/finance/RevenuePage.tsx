import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { InlineSelect } from "@/components/ui/InlineSelect";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { BarChart } from "@/components/charts/BarChart";
import { useFinance } from "@/hooks/useFinance";
import { useCrm } from "@/hooks/useCrm";
import { useSimulatedLoad } from "@/hooks/useSimulatedLoad";
import {
  revenueSummary,
  currentMonthProgress,
  breakdownByClient,
  moneyByMonth,
} from "@/services/financeSelectors";
import { PERIOD_OPTIONS, type PeriodKey } from "@/utils/period";
import { formatCurrency, formatCurrencyShort } from "@/utils/format";
import s from "./finance.module.css";

export function RevenuePage() {
  const loading = useSimulatedLoad();
  const navigate = useNavigate();
  const { invoices, payments, expenses } = useFinance();
  const { clients } = useCrm();
  const [period, setPeriod] = useState<PeriodKey>("6m");

  const summary = useMemo(
    () => revenueSummary(invoices, payments, expenses, period),
    [invoices, payments, expenses, period],
  );
  const month = useMemo(() => currentMonthProgress(invoices, payments), [invoices, payments]);
  const byClient = useMemo(() => breakdownByClient(invoices, payments), [invoices, payments]);
  const byMonth = useMemo(
    () => moneyByMonth(invoices, payments, expenses, period),
    [invoices, payments, expenses, period],
  );

  const clientLabel = (id: string) =>
    clients.find((c) => c.id === id)?.company || clients.find((c) => c.id === id)?.name || "Unknown";

  if (loading) {
    return (
      <div className={s.statRow}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (invoices.length === 0 && payments.length === 0 && expenses.length === 0) {
    return (
      <ErrorState
        title="No finance data yet"
        message="Create an invoice or record a payment to see your revenue position."
        retryLabel="Create invoice"
        onRetry={() => navigate("/finance/invoices")}
      />
    );
  }

  return (
    <>
      <div className={s.periodInline} style={{ marginBottom: "var(--s-4)" }}>
        <InlineSelect
          label="Period"
          value={period}
          onChange={(v) => setPeriod(v as PeriodKey)}
          options={PERIOD_OPTIONS}
        />
      </div>

      <section className={s.statRow} aria-label="Revenue position">
        <StatCard label="Revenue Earned" value={formatCurrency(summary.earned)} icon="finance" support="Invoiced this period" />
        <StatCard
          label="Received"
          value={formatCurrency(summary.received)}
          icon="check"
          support="Collected this period"
        />
        <StatCard label="Pending" value={formatCurrency(summary.pending)} icon="clock" support="Invoiced, unpaid" />
        <StatCard
          label="Overdue"
          value={formatCurrency(summary.overdue)}
          tone={summary.overdue > 0 ? "error" : "default"}
          icon="alert-triangle"
          support="Past due date"
        />
        <StatCard label="Expenses" value={formatCurrency(summary.expenses)} icon="wallet" support="This period" />
        <StatCard
          label="Estimated Profit"
          value={formatCurrency(summary.profit)}
          icon="trending-up"
          support="Received − expenses"
          trend={{
            direction: summary.profit >= 0 ? "up" : "down",
            text: summary.profit >= 0 ? "In the black" : "In the red",
          }}
        />
      </section>

      <Card className={s.progressCard}>
        <CardHeader title={`This month — ${month.label}`} subtitle="Received vs invoiced" />
        <div className={s.progressTop}>
          <span className={s.progressFigure}>
            {formatCurrency(month.received)}
            <small>received</small>
          </span>
          <span className={s.progressFigure} style={{ color: "var(--muted)" }}>
            {formatCurrency(month.earned)}
            <small>invoiced</small>
          </span>
        </div>
        <ProgressBar
          value={month.earned > 0 ? (month.received / month.earned) * 100 : 0}
          label="Received vs invoiced this month"
        />
        <p className={s.progressHint}>
          {month.earned > month.received
            ? `${formatCurrency(month.earned - month.received)} still to collect this month`
            : "Everything invoiced this month is collected"}
        </p>
      </Card>

      <div className={s.split2}>
        <Card>
          <CardHeader
            title="By client"
            action={
              <Button variant="tertiary" size="sm" iconRight="arrow-right" onClick={() => navigate("/finance/invoices")}>
                Invoices
              </Button>
            }
          />
          <table className={s.miniTable}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Invoiced</th>
                <th>Received</th>
                <th>Pending</th>
              </tr>
            </thead>
            <tbody>
              {byClient.map((row) => (
                <tr key={row.clientId}>
                  <td>{clientLabel(row.clientId)}</td>
                  <td>{formatCurrency(row.invoiced)}</td>
                  <td style={{ color: "var(--success)" }}>{formatCurrency(row.received)}</td>
                  <td style={{ color: row.pending > 0 ? "var(--warning)" : "var(--muted)" }}>
                    {formatCurrency(row.pending)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHeader
            title="By month"
            action={
              <Button variant="tertiary" size="sm" iconRight="arrow-right" onClick={() => navigate("/finance/payments")}>
                Payments
              </Button>
            }
          />
          <BarChart
            data={byMonth.map((m) => ({ label: m.label, values: { earned: m.earned, received: m.received } }))}
            series={[
              { key: "earned", label: "Invoiced", color: "var(--border-strong)" },
              { key: "received", label: "Received", color: "var(--crimson)" },
            ]}
            height={190}
            formatValue={formatCurrencyShort}
          />
        </Card>
      </div>
    </>
  );
}
