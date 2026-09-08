import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ViewAllLink } from "@/components/ui/ViewAllLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonText } from "@/components/ui/Skeleton";
import { Icon } from "@/components/icons/Icon";
import { LeadStageBadge, ClientStatusBadge } from "@/components/crm/badges";
import { LeadFormModal } from "@/components/crm/LeadFormModal";
import { useCrm } from "@/hooks/useCrm";
import { useFinance } from "@/hooks/useFinance";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useSimulatedLoad } from "@/hooks/useSimulatedLoad";
import { resolveFollowUps, daysOverdue } from "@/services/crmSelectors";
import { clientFinance } from "@/services/financeSelectors";
import { formatCurrency, formatDate, formatRelativeTime } from "@/utils/format";
import styles from "./CrmPage.module.css";

export function CrmPage() {
  const navigate = useNavigate();
  const loading = useSimulatedLoad();
  const { leads, clients, followUps } = useCrm();
  const { invoices, payments } = useFinance();
  const addLead = useDisclosure();

  const clientHasOverdue = (clientId: string) => clientFinance(clientId, invoices, payments).hasOverdue;

  const recentLeads = useMemo(
    () =>
      [...leads]
        .filter((l) => !l.archivedAt)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 6),
    [leads],
  );
  const recentClients = useMemo(
    () => [...clients].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 6),
    [clients],
  );
  const upcoming = useMemo(() => {
    const g = resolveFollowUps(followUps, leads, clients);
    return [...g.overdue, ...g.today, ...g.week].slice(0, 6);
  }, [followUps, leads, clients]);

  const needsAttention = useMemo(
    () =>
      clients.filter((c) => {
        const stale = Date.now() - new Date(c.updatedAt).getTime() > 45 * 86_400_000;
        return clientHasOverdue(c.id) || c.status === "inactive" || stale;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clients, invoices, payments],
  );

  return (
    <>
      <PageHeader
        title="CRM"
        description="Every relationship DopeOrca has — or could have — in one place."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate("/follow-ups")}>
              Follow-ups
            </Button>
            <Button iconLeft="plus" onClick={addLead.open}>
              Add Lead
            </Button>
          </>
        }
      />

      <div className={styles.grid}>
        <Card>
          <CardHeader title="Recent leads" action={<ViewAllLink to="/leads" />} />
          {loading ? (
            <SkeletonText lines={4} />
          ) : recentLeads.length === 0 ? (
            <EmptyState compact icon="leads" title="No leads yet" />
          ) : (
            <ul className={styles.list}>
              {recentLeads.map((l) => (
                <li key={l.id}>
                  <button className={styles.row} onClick={() => navigate(`/leads/${l.id}`)}>
                    <span className={styles.rowMain}>
                      <span className={styles.rowTitle}>{l.business || l.name}</span>
                      <span className={styles.rowSub}>
                        {l.estimatedValue ? formatCurrency(l.estimatedValue) : "No estimate"} ·{" "}
                        {formatRelativeTime(l.createdAt)}
                      </span>
                    </span>
                    <LeadStageBadge stage={l.stage} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent clients" action={<ViewAllLink to="/clients" />} />
          {loading ? (
            <SkeletonText lines={4} />
          ) : recentClients.length === 0 ? (
            <EmptyState compact icon="building" title="No clients yet" description="Convert a lead to see it here." />
          ) : (
            <ul className={styles.list}>
              {recentClients.map((c) => (
                <li key={c.id}>
                  <button className={styles.row} onClick={() => navigate(`/clients/${c.id}`)}>
                    <span className={styles.rowMain}>
                      <span className={styles.rowTitle}>{c.company || c.name}</span>
                      <span className={styles.rowSub}>
                        {c.location || "—"} · since {formatDate(c.createdAt)}
                      </span>
                    </span>
                    <ClientStatusBadge status={c.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Upcoming follow-ups" action={<ViewAllLink to="/follow-ups" />} />
          {loading ? (
            <SkeletonText lines={4} />
          ) : upcoming.length === 0 ? (
            <EmptyState compact icon="calendar" title="You're all caught up" />
          ) : (
            <ul className={styles.list}>
              {upcoming.map(({ followUp, title, href, bucket }) => (
                <li key={followUp.id}>
                  <button className={styles.row} onClick={() => navigate(href)}>
                    <span className={styles.rowMain}>
                      <span className={styles.rowTitle}>{title}</span>
                      <span className={styles.rowSub}>{followUp.note}</span>
                    </span>
                    <span
                      className={styles.due}
                      data-overdue={bucket === "overdue"}
                    >
                      {bucket === "overdue"
                        ? `${daysOverdue(followUp.dueDate)}d late`
                        : formatDate(followUp.dueDate)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Clients needing attention" />
          {loading ? (
            <SkeletonText lines={4} />
          ) : needsAttention.length === 0 ? (
            <EmptyState compact icon="check" title="Nothing needs chasing" />
          ) : (
            <ul className={styles.list}>
              {needsAttention.map((c) => {
                const reason = clientHasOverdue(c.id)
                  ? "Overdue invoice"
                  : c.status === "inactive"
                    ? "Marked inactive"
                    : "No recent contact";
                return (
                  <li key={c.id}>
                    <button className={styles.row} onClick={() => navigate(`/clients/${c.id}`)}>
                      <span className={styles.rowMain}>
                        <span className={styles.rowTitle}>{c.company || c.name}</span>
                        <span className={styles.rowSub}>{reason}</span>
                      </span>
                      <Icon name="chevron-right" size={16} className={styles.chev} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className={styles.footNote}>Overdue invoices and stale contact drive this list.</p>
        </Card>
      </div>

      <LeadFormModal open={addLead.isOpen} onClose={addLead.close} />
    </>
  );
}
