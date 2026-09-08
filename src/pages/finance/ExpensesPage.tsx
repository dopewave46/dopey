import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchInput } from "@/components/ui/SearchInput";
import { InlineSelect } from "@/components/ui/InlineSelect";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Menu } from "@/components/ui/Menu";
import { Icon } from "@/components/icons/Icon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExpenseFormModal } from "@/components/finance/ExpenseFormModal";
import { useFinance } from "@/hooks/useFinance";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useSimulatedLoad } from "@/hooks/useSimulatedLoad";
import { useToast } from "@/components/feedback/ToastProvider";
import { EXPENSE_CATEGORY_LABELS, financeStore } from "@/services/financeStore";
import { inRange, periodRange } from "@/utils/period";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Expense, ExpenseCategory } from "@/services/types";
import s from "./finance.module.css";

export function ExpensesPage() {
  const loading = useSimulatedLoad();
  const toast = useToast();
  const { expenses } = useFinance();
  const addModal = useDisclosure();
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [range, setRange] = useState("6m");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rng = range ? periodRange(range as "3m" | "6m" | "12m" | "ytd") : null;
    return expenses.filter((e) => {
      if (category && e.category !== category) return false;
      if (rng && !inRange(e.date, rng.start, rng.end)) return false;
      if (!q) return true;
      return e.name.toLowerCase().includes(q) || (e.notes ?? "").toLowerCase().includes(q);
    });
  }, [expenses, query, category, range]);

  const total = rows.reduce((sum, e) => sum + e.amount, 0);

  const columns: Column<Expense>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (e) => e.name.toLowerCase(),
      render: (e) => (
        <div>
          <div style={{ fontWeight: 600 }}>{e.name}</div>
          {e.notes && <div style={{ font: "var(--t-meta)", color: "var(--muted)" }}>{e.notes}</div>}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortValue: (e) => e.category,
      render: (e) => (
        <StatusBadge tone="neutral" hideDot>
          {EXPENSE_CATEGORY_LABELS[e.category]}
        </StatusBadge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortValue: (e) => e.amount,
      render: (e) => <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{formatCurrency(e.amount)}</span>,
    },
    {
      key: "date",
      header: "Date",
      sortValue: (e) => e.date,
      render: (e) => <span style={{ color: "var(--slate)" }}>{formatDate(e.date)}</span>,
    },
    {
      key: "actions",
      header: "",
      width: "44px",
      render: (e) => (
        <div onClick={(ev) => ev.stopPropagation()}>
          <Menu
            align="end"
            items={[
              { label: "Edit", icon: "user", onSelect: () => setEditing(e) },
              { label: "Delete", icon: "close", tone: "danger", onSelect: () => setDeleting(e) },
            ]}
            trigger={(props) => (
              <button
                type="button"
                aria-label="Expense actions"
                {...props}
                style={{
                  width: 28,
                  height: 28,
                  display: "grid",
                  placeItems: "center",
                  border: 0,
                  background: "transparent",
                  color: "var(--muted)",
                  borderRadius: "var(--r-tag)",
                  cursor: "pointer",
                }}
              >
                <Icon name="more" size={16} />
              </button>
            )}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <div className={s.toolbarRow}>
        <span className={s.totalPill}>
          Total this period <b>{formatCurrency(total)}</b>
        </span>
        <Button iconLeft="plus" onClick={addModal.open}>
          Add Expense
        </Button>
      </div>

      <Toolbar>
        <SearchInput value={query} onChange={setQuery} placeholder="Search expense…" aria-label="Search expenses" />
        <InlineSelect
          label="Category"
          value={category}
          onChange={setCategory}
          allLabel="All"
          options={(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((c) => ({
            value: c,
            label: EXPENSE_CATEGORY_LABELS[c],
          }))}
        />
        <InlineSelect
          label="Period"
          value={range}
          onChange={setRange}
          options={[
            { value: "3m", label: "Last 3 months" },
            { value: "6m", label: "Last 6 months" },
            { value: "12m", label: "Last 12 months" },
            { value: "ytd", label: "Year to date" },
          ]}
        />
      </Toolbar>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        getRowId={(e) => e.id}
        onRowClick={(e) => setEditing(e)}
        defaultSort={{ key: "date", dir: "desc" }}
        minWidth="680px"
        emptyState={
          expenses.length === 0 ? (
            <EmptyState
              icon="wallet"
              title="No expenses yet"
              description="Track hosting, domains, software and the rest here."
              action={
                <Button iconLeft="plus" onClick={addModal.open}>
                  Add Expense
                </Button>
              }
            />
          ) : (
            <EmptyState compact icon="search" title="No expenses match these filters" />
          )
        }
      />

      <ExpenseFormModal open={addModal.isOpen} onClose={addModal.close} />
      <ExpenseFormModal open={editing !== null} onClose={() => setEditing(null)} expense={editing ?? undefined} />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) financeStore.deleteExpense(deleting.id);
          toast.success("Expense deleted");
          setDeleting(null);
        }}
        title="Delete this expense?"
        message={deleting ? `"${deleting.name}" will be removed. This can't be undone.` : ""}
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}
