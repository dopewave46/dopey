import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchInput } from "@/components/ui/SearchInput";
import { InlineSelect } from "@/components/ui/InlineSelect";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/icons/Icon";
import { AmcStatusBadge, AmcPaymentBadge } from "@/components/amc/badges";
import { AmcFormModal } from "@/components/amc/AmcFormModal";
import { useAmc } from "@/hooks/useAmc";
import { useCrm } from "@/hooks/useCrm";
import { useFinance } from "@/hooks/useFinance";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useSimulatedLoad } from "@/hooks/useSimulatedLoad";
import {
  amcStatus,
  daysUntil,
  upcomingRenewals,
  AMC_STATUS_META,
  AMC_PAYMENT_META,
  type AmcStatus,
} from "@/services/amcSelectors";
import { inRange, periodRange } from "@/utils/period";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Amc } from "@/services/types";
import styles from "./AmcPage.module.css";

const WINDOWS = [
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
];

export function AmcPage() {
  const navigate = useNavigate();
  const loading = useSimulatedLoad();
  const { amcs } = useAmc();
  const { clients } = useCrm();
  const { payments } = useFinance();
  const addModal = useDisclosure();

  const [window, setWindow] = useState("30");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [pay, setPay] = useState("");

  const windowDays = Number(window);
  const clientLabel = (id: string) =>
    clients.find((c) => c.id === id)?.company || clients.find((c) => c.id === id)?.name || "—";

  const activeCount = amcs.filter((a) => amcStatus(a) !== "expired").length;
  const expiringCount = amcs.filter((a) => {
    const d = daysUntil(a.renewalDate);
    return d >= 0 && d <= windowDays;
  }).length;
  const hostingDueCount = amcs.filter(
    (a) => a.hostingRenewalDate && daysUntil(a.hostingRenewalDate) >= 0 && daysUntil(a.hostingRenewalDate) <= windowDays,
  ).length;

  const amcProjectIds = new Set(amcs.map((a) => a.projectId).filter(Boolean));
  const { start, end } = periodRange("6m");
  const amcRevenue = payments
    .filter((p) => p.status === "completed" && p.projectId && amcProjectIds.has(p.projectId) && inRange(p.paymentDate, start, end))
    .reduce((s, p) => s + p.amount, 0);

  const renewals = useMemo(() => upcomingRenewals(amcs, windowDays), [amcs, windowDays]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return amcs.filter((a) => {
      if (status && amcStatus(a) !== status) return false;
      if (pay && a.paymentStatus !== pay) return false;
      if (!q) return true;
      return clientLabel(a.clientId).toLowerCase().includes(q) || a.service.toLowerCase().includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amcs, query, status, pay, clients]);

  const columns: Column<Amc>[] = [
    {
      key: "client",
      header: "Client",
      sortValue: (a) => clientLabel(a.clientId).toLowerCase(),
      render: (a) => <span style={{ fontWeight: 600 }}>{clientLabel(a.clientId)}</span>,
    },
    { key: "service", header: "Service", sortValue: (a) => a.service, render: (a) => a.service },
    {
      key: "status",
      header: "Status",
      sortValue: (a) => daysUntil(a.renewalDate),
      render: (a) => <AmcStatusBadge amc={a} />,
    },
    {
      key: "startDate",
      header: "Start",
      sortValue: (a) => a.startDate,
      render: (a) => <span style={{ color: "var(--slate)" }}>{formatDate(a.startDate)}</span>,
    },
    {
      key: "renewalDate",
      header: "Renewal",
      sortValue: (a) => a.renewalDate,
      render: (a) => {
        const d = daysUntil(a.renewalDate);
        const soon = d >= 0 && d <= 30;
        return (
          <span style={{ color: d < 0 ? "var(--error)" : soon ? "var(--warning)" : "var(--slate)", fontWeight: d < 0 || soon ? 600 : 400 }}>
            {formatDate(a.renewalDate)}
          </span>
        );
      },
    },
    { key: "paymentStatus", header: "Payment", sortValue: (a) => a.paymentStatus, render: (a) => <AmcPaymentBadge status={a.paymentStatus} /> },
    {
      key: "hostingRenewalDate",
      header: "Hosting renewal",
      sortValue: (a) => a.hostingRenewalDate ?? "9999",
      render: (a) => (
        <span style={{ color: "var(--slate)" }}>{a.hostingRenewalDate ? formatDate(a.hostingRenewalDate) : "—"}</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Maintenance / AMC"
        description="Ongoing client care — contracts, renewals and hosting."
        actions={
          <Button iconLeft="plus" onClick={addModal.open}>
            Add AMC / Maintenance Plan
          </Button>
        }
      />

      <section className={styles.statRow} aria-label="AMC summary">
        <StatCard label="Active AMCs" value={activeCount} icon="maintenance" loading={loading} />
        <StatCard
          label={`Expiring in ${windowDays} days`}
          value={expiringCount}
          icon="clock"
          tone={expiringCount > 0 ? "error" : "default"}
          loading={loading}
        />
        <StatCard label={`Hosting renewals (${windowDays}d)`} value={hostingDueCount} icon="refresh" loading={loading} />
        <StatCard label="AMC revenue" value={formatCurrency(amcRevenue)} icon="rupee" support="last 6 months" loading={loading} />
      </section>

      <Card className={styles.renewalCard}>
        <CardHeader
          title="Upcoming renewals"
          action={
            <SegmentedControl aria-label="Renewal window" value={window} onChange={setWindow} options={WINDOWS} />
          }
        />
        {renewals.length === 0 ? (
          <EmptyState compact icon="check" title={`Nothing renews in the next ${windowDays} days`} />
        ) : (
          <ul className={styles.renewalList}>
            {renewals.map((r) => (
              <li key={`${r.amc.id}-${r.kind}`}>
                <button className={styles.renewalRow} onClick={() => navigate(`/amc/${r.amc.id}`)}>
                  <span className={styles.renewalIcon} data-late={r.inDays < 0}>
                    <Icon name={r.kind === "hosting" ? "refresh" : "maintenance"} size={14} weight={1.9} />
                  </span>
                  <span className={styles.renewalBody}>
                    <span className={styles.renewalTitle}>
                      {clientLabel(r.amc.clientId)} — {r.kind === "hosting" ? "Hosting renewal" : r.amc.service}
                    </span>
                    <span className={styles.renewalMeta}>{formatDate(r.date)}</span>
                  </span>
                  <span className={styles.renewalDays} data-late={r.inDays < 0}>
                    {r.inDays < 0 ? `${Math.abs(r.inDays)}d ago` : r.inDays === 0 ? "today" : `in ${r.inDays}d`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {amcs.length === 0 && !loading ? (
        <EmptyState
          icon="maintenance"
          title="No maintenance plans yet"
          description="Add one to start tracking renewals."
          action={
            <Button iconLeft="plus" onClick={addModal.open}>
              Add AMC / Maintenance Plan
            </Button>
          }
        />
      ) : (
        <>
          <Toolbar>
            <SearchInput value={query} onChange={setQuery} placeholder="Search client or service…" aria-label="Search AMCs" />
            <InlineSelect
              label="Status"
              value={status}
              onChange={setStatus}
              allLabel="All"
              options={(Object.keys(AMC_STATUS_META) as AmcStatus[]).map((s) => ({ value: s, label: AMC_STATUS_META[s].label }))}
            />
            <InlineSelect
              label="Payment"
              value={pay}
              onChange={setPay}
              allLabel="All"
              options={Object.entries(AMC_PAYMENT_META).map(([value, m]) => ({ value, label: m.label }))}
            />
          </Toolbar>

          <DataTable
            columns={columns}
            rows={rows}
            loading={loading}
            getRowId={(a) => a.id}
            onRowClick={(a) => navigate(`/amc/${a.id}`)}
            defaultSort={{ key: "renewalDate", dir: "asc" }}
            minWidth="920px"
            emptyState={<EmptyState compact icon="search" title="No plans match these filters" />}
          />
        </>
      )}

      <AmcFormModal open={addModal.isOpen} onClose={addModal.close} navigateOnCreate />
    </>
  );
}
