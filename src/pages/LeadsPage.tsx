import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchInput } from "@/components/ui/SearchInput";
import { InlineSelect } from "@/components/ui/InlineSelect";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeadStageBadge } from "@/components/crm/badges";
import { LeadKanban } from "@/components/crm/LeadKanban";
import { LeadFormModal } from "@/components/crm/LeadFormModal";
import { ConvertLeadModal } from "@/components/crm/ConvertLeadModal";
import { useCrm, useActiveLeads } from "@/hooks/useCrm";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useSimulatedLoad } from "@/hooks/useSimulatedLoad";
import { useToast } from "@/components/feedback/ToastProvider";
import { lastContactAt, nextFollowUp } from "@/services/crmSelectors";
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER, LEAD_SOURCES, SERVICES } from "@/services/crmStore";
import { run } from "@/utils/runAction";
import { formatCurrency, formatDate, formatRelativeTime } from "@/utils/format";
import type { Lead } from "@/services/types";

type View = "list" | "pipeline";

export function LeadsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const loading = useSimulatedLoad();
  const { activities, followUps, store } = useCrm();
  const leads = useActiveLeads();

  const [view, setView] = useState<View>("list");
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const [source, setSource] = useState("");
  const [service, setService] = useState("");

  const addModal = useDisclosure();
  const [convertLead, setConvertLead] = useState<Lead | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (stage && l.stage !== stage) return false;
      if (source && l.source !== source) return false;
      if (service && l.serviceRequired !== service) return false;
      if (!q) return true;
      return [l.name, l.business, l.phone, l.email].some((v) => v?.toLowerCase().includes(q));
    });
  }, [leads, query, stage, source, service]);

  const columns: Column<Lead>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (l) => l.name.toLowerCase(),
      render: (l) => <span style={{ fontWeight: 600 }}>{l.name}</span>,
    },
    { key: "business", header: "Business", sortValue: (l) => (l.business ?? "").toLowerCase() },
    {
      key: "stage",
      header: "Status",
      sortValue: (l) => LEAD_STAGE_ORDER.indexOf(l.stage),
      render: (l) => <LeadStageBadge stage={l.stage} />,
    },
    {
      key: "estimatedValue",
      header: "Est. value",
      align: "right",
      sortValue: (l) => l.estimatedValue ?? 0,
      render: (l) =>
        l.estimatedValue ? (
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(l.estimatedValue)}</span>
        ) : (
          <span style={{ color: "var(--muted)" }}>—</span>
        ),
    },
    {
      key: "lastContact",
      header: "Last contact",
      sortValue: (l) => lastContactAt(activities, l.id) ?? l.updatedAt,
      render: (l) => {
        const at = lastContactAt(activities, l.id) ?? l.updatedAt;
        return <span style={{ color: "var(--slate)" }}>{formatRelativeTime(at)}</span>;
      },
    },
    {
      key: "nextFollowUp",
      header: "Next follow-up",
      sortValue: (l) => nextFollowUp(followUps, "lead", l.id)?.dueDate ?? "9999",
      render: (l) => {
        const fu = nextFollowUp(followUps, "lead", l.id);
        if (!fu) return <span style={{ color: "var(--muted)" }}>—</span>;
        const overdue = new Date(fu.dueDate) < new Date();
        return (
          <span style={{ color: overdue ? "var(--error)" : "var(--slate)", fontWeight: overdue ? 600 : 400 }}>
            {formatDate(fu.dueDate)}
          </span>
        );
      },
    },
  ];

  const stageOptions = LEAD_STAGE_ORDER.map((s) => ({ value: s, label: LEAD_STAGE_LABELS[s] }));

  return (
    <>
      <PageHeader
        title="Leads"
        description="Your pipeline from first contact to won — kept separate from clients."
        actions={
          <>
            <SegmentedControl
              aria-label="Lead view"
              value={view}
              onChange={setView}
              options={[
                { value: "list", label: "List" },
                { value: "pipeline", label: "Pipeline" },
              ]}
            />
            <Button iconLeft="plus" onClick={addModal.open}>
              Add Lead
            </Button>
          </>
        }
      />

      {leads.length === 0 && !loading ? (
        <EmptyState
          icon="leads"
          title="No leads yet"
          description="Add your first lead to start building your pipeline."
          action={
            <Button iconLeft="plus" onClick={addModal.open}>
              Add Lead
            </Button>
          }
        />
      ) : (
        <>
          <Toolbar>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search name, business, phone…"
              aria-label="Search leads"
            />
            <InlineSelect
              label="Stage"
              value={stage}
              onChange={setStage}
              allLabel="All stages"
              options={stageOptions}
            />
            <InlineSelect
              label="Source"
              value={source}
              onChange={setSource}
              allLabel="All sources"
              options={LEAD_SOURCES.map((s) => ({ value: s, label: s }))}
            />
            <InlineSelect
              label="Service"
              value={service}
              onChange={setService}
              allLabel="All services"
              options={SERVICES.map((s) => ({ value: s, label: s }))}
            />
          </Toolbar>

          {view === "list" ? (
            <DataTable
              columns={columns}
              rows={filtered}
              loading={loading}
              getRowId={(l) => l.id}
              onRowClick={(l) => navigate(`/leads/${l.id}`)}
              defaultSort={{ key: "nextFollowUp", dir: "asc" }}
              minWidth="820px"
              emptyState={
                <EmptyState
                  compact
                  icon="search"
                  title="No leads match these filters"
                  description="Try clearing the search or filters."
                />
              }
            />
          ) : (
            <LeadKanban
              leads={filtered}
              onOpenLead={(id) => navigate(`/leads/${id}`)}
              onStageChange={(leadId, s) => void run(store.setLeadStage(leadId, s), toast, "Couldn't move the lead")}
              onWin={(lead) => setConvertLead(lead)}
            />
          )}
        </>
      )}

      <LeadFormModal open={addModal.isOpen} onClose={addModal.close} />
      <ConvertLeadModal
        open={convertLead !== null}
        onClose={() => setConvertLead(null)}
        lead={convertLead}
      />
    </>
  );
}
