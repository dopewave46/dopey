import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchInput } from "@/components/ui/SearchInput";
import { InlineSelect } from "@/components/ui/InlineSelect";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaymentStatusBadge } from "@/components/finance/badges";
import { RecordPaymentModal } from "@/components/finance/RecordPaymentModal";
import { useFinance } from "@/hooks/useFinance";
import { useCrm } from "@/hooks/useCrm";
import { useProjects } from "@/hooks/useProjects";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useSimulatedLoad } from "@/hooks/useSimulatedLoad";
import { METHOD_LABELS } from "@/services/financeStore";
import { inRange, periodRange } from "@/utils/period";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Payment } from "@/services/types";

export function PaymentsPage() {
  const loading = useSimulatedLoad();
  const { payments, invoices } = useFinance();
  const { clients } = useCrm();
  const { projects } = useProjects();
  const recordModal = useDisclosure();

  const [query, setQuery] = useState("");
  const [clientId, setClientId] = useState("");
  const [method, setMethod] = useState("");
  const [range, setRange] = useState("");

  const clientLabel = (id: string) =>
    clients.find((c) => c.id === id)?.company || clients.find((c) => c.id === id)?.name || "—";
  const projectLabel = (id?: string) => projects.find((p) => p.id === id)?.name ?? "—";
  const invoiceLabel = (id?: string) => invoices.find((i) => i.id === id)?.invoiceNumber ?? "—";

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rng = range ? periodRange(range as "3m" | "6m" | "12m" | "ytd") : null;
    return payments.filter((pay) => {
      if (clientId && pay.clientId !== clientId) return false;
      if (method && pay.method !== method) return false;
      if (rng && !inRange(pay.paymentDate, rng.start, rng.end)) return false;
      if (!q) return true;
      return [clientLabel(pay.clientId), projectLabel(pay.projectId), invoiceLabel(pay.invoiceId), pay.reference ?? ""].some(
        (v) => v.toLowerCase().includes(q),
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, query, clientId, method, range, clients, projects, invoices]);

  const columns: Column<Payment>[] = [
    {
      key: "client",
      header: "Client",
      sortValue: (x) => clientLabel(x.clientId),
      render: (x) => <span style={{ fontWeight: 600 }}>{clientLabel(x.clientId)}</span>,
    },
    { key: "project", header: "Project", render: (x) => <span style={{ color: "var(--slate)" }}>{projectLabel(x.projectId)}</span> },
    { key: "invoice", header: "Invoice #", render: (x) => invoiceLabel(x.invoiceId) },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortValue: (x) => x.amount,
      render: (x) => <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{formatCurrency(x.amount)}</span>,
    },
    { key: "method", header: "Method", render: (x) => METHOD_LABELS[x.method] },
    { key: "status", header: "Status", sortValue: (x) => x.status, render: (x) => <PaymentStatusBadge status={x.status} /> },
    {
      key: "date",
      header: "Date",
      sortValue: (x) => x.paymentDate,
      render: (x) => <span style={{ color: "var(--slate)" }}>{formatDate(x.paymentDate)}</span>,
    },
  ];

  return (
    <>
      <Toolbar
        trailing={
          <Button iconLeft="plus" onClick={recordModal.open}>
            Record Payment
          </Button>
        }
      >
        <SearchInput value={query} onChange={setQuery} placeholder="Search client, project, invoice…" aria-label="Search payments" />
        <InlineSelect
          label="Client"
          value={clientId}
          onChange={setClientId}
          allLabel="All"
          options={clients.map((c) => ({ value: c.id, label: c.company || c.name }))}
        />
        <InlineSelect
          label="Method"
          value={method}
          onChange={setMethod}
          allLabel="All"
          options={(Object.keys(METHOD_LABELS) as Payment["method"][]).map((m) => ({ value: m, label: METHOD_LABELS[m] }))}
        />
        <InlineSelect
          label="Date"
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
        getRowId={(x) => x.id}
        defaultSort={{ key: "date", dir: "desc" }}
        minWidth="880px"
        emptyState={
          payments.length === 0 ? (
            <EmptyState
              icon="credit-card"
              title="No payments recorded yet"
              description="Record your first payment to start tracking revenue."
              action={
                <Button iconLeft="plus" onClick={recordModal.open}>
                  Record Payment
                </Button>
              }
            />
          ) : (
            <EmptyState compact icon="search" title="No payments match these filters" />
          )
        }
      />

      <RecordPaymentModal open={recordModal.isOpen} onClose={recordModal.close} />
    </>
  );
}
