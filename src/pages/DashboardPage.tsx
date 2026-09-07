import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons/Icon";
import { formatCurrency } from "@/utils/format";
import {
  PROJECT_FLOW,
  INVOICE_SUMMARY,
  UPCOMING_RENEWALS,
  RECENT_TRANSACTIONS,
} from "@/data/sampleDashboard";
import styles from "./DashboardPage.module.css";

export function DashboardPage() {
  const [showNotice, setShowNotice] = useState(true);

  return (
    <>
      <PageHeader title="Dashboard" description="What's happening at DopeOrca today." />

      {showNotice && (
        <div className={styles.notice} role="note">
          <Icon name="alert-circle" size={16} weight={1.9} />
          <span>
            Preview data. Live figures connect as the CRM, Projects, and Finance modules are built.
          </span>
          <button
            type="button"
            onClick={() => setShowNotice(false)}
            aria-label="Dismiss notice"
            className={styles.noticeClose}
          >
            <Icon name="close" size={14} weight={2} />
          </button>
        </div>
      )}

      {/* Top metrics */}
      <section className={styles.metrics} aria-label="Key metrics">
        <StatCard
          label="Total Active Projects"
          value="14"
          icon="projects"
          trend={{ direction: "up", text: "+3 this month" }}
        />
        <StatCard
          label="Client Retention"
          value="92%"
          icon="crm"
          trend={{ direction: "up", text: "+4 pts" }}
        />
        <StatCard
          label="Revenue (received)"
          value={formatCurrency(425000)}
          icon="rupee"
          trend={{ direction: "up", text: "+12%" }}
        />
      </section>

      {/* Main sections */}
      <section className={styles.sections} aria-label="Overview">
        <Card>
          <CardHeader
            title="Project Flow"
            action={
              <Button variant="tertiary" size="sm" iconRight="arrow-right">
                Projects
              </Button>
            }
          />
          <ul className={styles.flow}>
            {PROJECT_FLOW.map((row) => (
              <li key={row.label} className={styles.flowRow}>
                <div className={styles.flowTop}>
                  <span className={styles.flowLabel}>{row.label}</span>
                  <span className={styles.flowCount}>{row.count}</span>
                </div>
                <span className={styles.track}>
                  <span className={styles.trackFill} style={{ width: `${row.percent}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Invoicing"
            action={
              <Button variant="tertiary" size="sm" iconRight="arrow-right">
                Finance
              </Button>
            }
          />
          <ul className={styles.invoiceList}>
            {INVOICE_SUMMARY.map((row) => (
              <li key={row.label} className={styles.invoiceRow}>
                <span className={styles.invoiceLabel}>{row.label}</span>
                <span className={styles.invoiceAmount}>{formatCurrency(row.amount)}</span>
                <StatusBadge tone={row.tone} hideDot>
                  {row.tone === "success" ? "Cleared" : row.tone === "warning" ? "Awaiting" : "Action"}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Maintenance &amp; Services"
            action={
              <Button variant="tertiary" size="sm" iconRight="arrow-right">
                AMC
              </Button>
            }
          />
          <ul className={styles.renewals}>
            {UPCOMING_RENEWALS.map((row) => (
              <li key={row.client} className={styles.renewalRow}>
                <span className={styles.renewalIcon}>
                  <Icon name="maintenance" size={15} weight={1.8} />
                </span>
                <span className={styles.renewalBody}>
                  <span className={styles.renewalClient}>{row.client}</span>
                  <span className={styles.renewalService}>{row.service}</span>
                </span>
                <StatusBadge tone={row.dueInDays <= 14 ? "warning" : "neutral"} hideDot>
                  {row.dueInDays}d
                </StatusBadge>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Recent transactions */}
      <section aria-label="Recent transactions">
        <Card padding="none">
          <div className={styles.txHeader}>
            <h3 className={styles.txTitle}>Recent Transactions</h3>
            <Button variant="tertiary" size="sm" iconRight="arrow-right">
              View all
            </Button>
          </div>
          <ul className={styles.txList}>
            {RECENT_TRANSACTIONS.map((tx) => (
              <li key={tx.id} className={styles.txRow}>
                <span
                  className={styles.txIcon}
                  data-direction={tx.direction}
                  aria-hidden="true"
                >
                  <Icon name={tx.direction === "in" ? "arrow-down" : "arrow-up"} size={14} weight={2.2} />
                </span>
                <span className={styles.txMain}>
                  <span className={styles.txClient}>{tx.client}</span>
                  <span className={styles.txKind}>{tx.kind}</span>
                </span>
                <span
                  className={styles.txAmount}
                  data-direction={tx.direction}
                >
                  {tx.direction === "in" ? "+" : "−"} {formatCurrency(tx.amount)}
                </span>
                <StatusBadge tone={tx.tone} hideDot>
                  {tx.status}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </>
  );
}
