import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchInput } from "@/components/ui/SearchInput";
import { InlineSelect } from "@/components/ui/InlineSelect";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ClientStatusBadge } from "@/components/crm/badges";
import { useCrm } from "@/hooks/useCrm";
import { useProjects } from "@/hooks/useProjects";
import { useFinance } from "@/hooks/useFinance";
import { useSimulatedLoad } from "@/hooks/useSimulatedLoad";
import { CLIENT_STATUS_META } from "@/components/ui/StatusBadge";
import { projectsForClient, isActiveStatus } from "@/services/projectSelectors";
import { clientFinance } from "@/services/financeSelectors";
import type { Client } from "@/services/types";

export function ClientsPage() {
  const navigate = useNavigate();
  const loading = useSimulatedLoad();
  const { clients } = useCrm();
  const { projects } = useProjects();
  const { invoices, payments } = useFinance();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [context, setContext] = useState("");

  const locations = useMemo(
    () => Array.from(new Set(clients.map((c) => c.location).filter(Boolean))) as string[],
    [clients],
  );

  const activeProjectFor = (clientId: string) =>
    projectsForClient(projects, clientId).find((p) => isActiveStatus(p.status));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (status && c.status !== status) return false;
      if (location && c.location !== location) return false;
      if (context === "active-project" && !activeProjectFor(c.id)) return false;
      if (context === "overdue-invoice" && !clientFinance(c.id, invoices, payments).hasOverdue) return false;
      if (!q) return true;
      return [c.name, c.company, c.email, c.phone].some((v) => v?.toLowerCase().includes(q));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, projects, invoices, payments, query, status, location, context]);

  const columns: Column<Client>[] = [
    {
      key: "company",
      header: "Client",
      sortValue: (c) => (c.company || c.name).toLowerCase(),
      render: (c) => (
        <div>
          <div style={{ fontWeight: 600 }}>{c.company || c.name}</div>
          {c.company && <div style={{ font: "var(--t-meta)", color: "var(--muted)" }}>{c.name}</div>}
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (c) => (
        <div style={{ color: "var(--slate)" }}>
          <div>{c.phone || "—"}</div>
          {c.email && <div style={{ font: "var(--t-meta)", color: "var(--muted)" }}>{c.email}</div>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (c) => c.status,
      render: (c) => <ClientStatusBadge status={c.status} />,
    },
    {
      key: "project",
      header: "Active project",
      render: (c) => {
        const active = activeProjectFor(c.id);
        return active ? (
          <span>{active.name}</span>
        ) : (
          <span style={{ color: "var(--muted)" }}>—</span>
        );
      },
    },
    {
      key: "location",
      header: "Location",
      sortValue: (c) => (c.location ?? "").toLowerCase(),
      render: (c) => <span style={{ color: "var(--slate)" }}>{c.location || "—"}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Clients"
        description="Everyone you've done business with — contact, status and project context."
      />

      {clients.length === 0 && !loading ? (
        <EmptyState
          icon="building"
          title="No clients yet"
          description="Convert a lead to see it here."
          action={<Button onClick={() => navigate("/leads")}>Go to Leads</Button>}
        />
      ) : (
        <>
          <Toolbar>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search client, contact, email…"
              aria-label="Search clients"
            />
            <InlineSelect
              label="Status"
              value={status}
              onChange={setStatus}
              allLabel="All statuses"
              options={Object.entries(CLIENT_STATUS_META).map(([value, m]) => ({ value, label: m.label }))}
            />
            <InlineSelect
              label="Location"
              value={location}
              onChange={setLocation}
              allLabel="All locations"
              options={locations.map((l) => ({ value: l, label: l }))}
            />
            <InlineSelect
              label="Context"
              value={context}
              onChange={setContext}
              allLabel="Any"
              options={[
                { value: "active-project", label: "Has active project" },
                { value: "overdue-invoice", label: "Has overdue invoice" },
              ]}
            />
          </Toolbar>

          <DataTable
            columns={columns}
            rows={filtered}
            loading={loading}
            getRowId={(c) => c.id}
            onRowClick={(c) => navigate(`/clients/${c.id}`)}
            defaultSort={{ key: "company", dir: "asc" }}
            minWidth="760px"
            emptyState={<EmptyState compact icon="search" title="No clients match these filters" />}
          />
        </>
      )}
    </>
  );
}
