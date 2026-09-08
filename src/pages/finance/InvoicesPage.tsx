import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchInput } from "@/components/ui/SearchInput";
import { InlineSelect } from "@/components/ui/InlineSelect";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { InvoiceStatusBadge } from "@/components/finance/badges";
import { InvoiceFormModal } from "@/components/finance/InvoiceFormModal";
import { useFinance } from "@/hooks/useFinance";
import { useCrm } from "@/hooks/useCrm";
import { useProjects } from "@/hooks/useProjects";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useSimulatedLoad } from "@/hooks/useSimulatedLoad";
import { invoiceDisplayStatus, INVOICE_STATUS_LABEL } from "@/services/financeSelectors";
import { inRange, periodRange } from "@/utils/period";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Invoice } from "@/services/types";

const STATUS_OPTIONS = ["draft", "sent", "pending", "paid", "overdue", "cancelled"] as const;

export function InvoicesPage() {
  const navigate = useNavigate();
  const loading = useSimulatedLoad();
  const { invoices, payments } = useFinance();
  const { clients } = useCrm();
  const { projects } = useProjects();
  const createModal = useDisclosure();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [clientId, setClientId] = useState("");
  const [range, setRange] = useState("");

  const clientLabel = (id: string) =>
    clients.find((c) => c.id === id)?.company || clients.find((c) => c.id === id)?.name || "—";
  const projectLabel = (id?: string) => projects.find((p) => p.id === id)?.name ?? "—";

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rng = range ? periodRange(range as "3m" | "6m" | "12m" | "ytd") : null;
    return invoices.filter((inv) => {
      const display = invoiceDisplayStatus(inv, payments);
      if (status && display !== status) return false;
      if (clientId && inv.clientId !== clientId) return false;
      if (rng && !inRange(inv.issueDate, rng.start, rng.end)) return false;
      if (!q) return true;
      return [inv.invoiceNumber, clientLabel(inv.clientId), projectLabel(inv.projectId)].some((v) =>
        v.toLowerCase().includes(q),
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, payments, query, status, clientId, range, clients, projects]);

  const columns: Column<Invoice>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice #",
      sortValue: (i) => i.invoiceNumber,
      render: (i) => <span style={{ fontWeight: 600 }}>{i.invoiceNumber}</span>,
    },
    { key: "client", header: "Client", sortValue: (i) => clientLabel(i.clientId), render: (i) => clientLabel(i.clientId) },
    {
      key: "project",
      header: "Project",
      render: (i) => <span style={{ color: "var(--slate)" }}>{projectLabel(i.projectId)}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortValue: (i) => i.amount,
      render: (i) => <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(i.amount)}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (i) => invoiceDisplayStatus(i, payments),
      render: (i) => <InvoiceStatusBadge status={invoiceDisplayStatus(i, payments)} />,
    },
    {
      key: "issueDate",
      header: "Issued",
      sortValue: (i) => i.issueDate,
      render: (i) => <span style={{ color: "var(--slate)" }}>{formatDate(i.issueDate)}</span>,
    },
    {
      key: "dueDate",
      header: "Due",
      sortValue: (i) => i.dueDate,
      render: (i) => {
        const overdue = invoiceDisplayStatus(i, payments) === "overdue";
        return (
          <span style={{ color: overdue ? "var(--error)" : "var(--slate)", fontWeight: overdue ? 600 : 400 }}>
            {formatDate(i.dueDate)}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <Toolbar
        trailing={
          <Button iconLeft="plus" onClick={createModal.open}>
            Create Invoice
          </Button>
        }
      >
        <SearchInput value={query} onChange={setQuery} placeholder="Search invoice, client, project…" aria-label="Search invoices" />
        <InlineSelect
          label="Status"
          value={status}
          onChange={setStatus}
          allLabel="All"
          options={STATUS_OPTIONS.map((s) => ({ value: s, label: INVOICE_STATUS_LABEL[s] }))}
        />
        <InlineSelect
          label="Client"
          value={clientId}
          onChange={setClientId}
          allLabel="All"
          options={clients.map((c) => ({ value: c.id, label: c.company || c.name }))}
        />
        <InlineSelect
          label="Issued"
          value={range}
          onChange={setRange}
          allLabel="Any time"
          options={[
            { value: "3m", label: "Last 3 months" },
            { value: "6m", label: "Last 6 months" },
            { value: "12m", label: "Last 12 months" },
          ]}
        />
      </Toolbar>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        getRowId={(i) => i.id}
        onRowClick={(i) => navigate(`/finance/invoices/${i.id}`)}
        defaultSort={{ key: "issueDate", dir: "desc" }}
        minWidth="880px"
        emptyState={
          invoices.length === 0 ? (
            <EmptyState
              icon="finance"
              title="No invoices yet"
              description="Create your first invoice to start billing."
              action={
                <Button iconLeft="plus" onClick={createModal.open}>
                  Create Invoice
                </Button>
              }
            />
          ) : (
            <EmptyState compact icon="search" title="No invoices match these filters" />
          )
        }
      />

      <InvoiceFormModal open={createModal.isOpen} onClose={createModal.close} navigateOnCreate />
    </>
  );
}
