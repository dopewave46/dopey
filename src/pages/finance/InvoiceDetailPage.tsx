import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InlineSelect } from "@/components/ui/InlineSelect";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/icons/Icon";
import { InvoiceStatusBadge } from "@/components/finance/badges";
import { InvoiceFormModal } from "@/components/finance/InvoiceFormModal";
import { RecordPaymentModal } from "@/components/finance/RecordPaymentModal";
import { useFinance } from "@/hooks/useFinance";
import { useCrm } from "@/hooks/useCrm";
import { useProjects } from "@/hooks/useProjects";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useToast } from "@/components/feedback/ToastProvider";
import { run } from "@/utils/runAction";
import {
  completedPaymentsFor,
  invoiceDisplayStatus,
  outstandingBalance,
} from "@/services/financeSelectors";
import { METHOD_LABELS } from "@/services/financeStore";
import { formatCurrency, formatDate } from "@/utils/format";
import s from "@/components/crm/detail.module.css";
import p from "@/pages/ProjectDetailPage.module.css";

export function InvoiceDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { invoices, payments, store } = useFinance();
  const { clients } = useCrm();
  const { projects } = useProjects();

  const invoice = invoices.find((i) => i.id === id);
  const editModal = useDisclosure();
  const payModal = useDisclosure();

  const linkedPayments = useMemo(
    () => (invoice ? completedPaymentsFor(payments, invoice.id) : []),
    [payments, invoice],
  );
  const allInvoicePayments = useMemo(
    () => (invoice ? payments.filter((pay) => pay.invoiceId === invoice.id) : []),
    [payments, invoice],
  );

  if (!invoice) {
    return (
      <>
        <PageHeader
          title="Invoice not found"
          breadcrumbs={[{ label: "Finance", to: "/finance" }, { label: "Invoices", to: "/finance/invoices" }, { label: "Not found" }]}
        />
        <EmptyState
          icon="search"
          title="This invoice doesn't exist"
          action={<Button onClick={() => navigate("/finance/invoices")}>Back to Invoices</Button>}
        />
      </>
    );
  }

  const client = clients.find((c) => c.id === invoice.clientId);
  const project = projects.find((pr) => pr.id === invoice.projectId);
  // The backend derives these (Prompt 09 invoice.service) and sends them on
  // every invoice — use them; the selector is only a fallback (Prompt 11 §7).
  const display = invoice.displayStatus ?? invoiceDisplayStatus(invoice, payments);
  const balance = invoice.balance ?? outstandingBalance(invoice, payments);

  return (
    <>
      <PageHeader
        title={invoice.invoiceNumber}
        breadcrumbs={[
          { label: "Finance", to: "/finance" },
          { label: "Invoices", to: "/finance/invoices" },
          { label: invoice.invoiceNumber },
        ]}
        actions={
          <>
            {invoice.status === "draft" && (
              <Button variant="secondary" iconLeft="user" onClick={editModal.open}>
                Edit
              </Button>
            )}
            {balance > 0 && invoice.status !== "cancelled" && (
              <Button iconLeft="plus" onClick={payModal.open}>
                Record Payment
              </Button>
            )}
          </>
        }
      />

      <div className={s.grid}>
        <div className={s.main}>
          <Card>
            <CardHeader title="Invoice" action={<InvoiceStatusBadge status={display} />} />
            <dl className={s.fields}>
              <dt>Client</dt>
              <dd>
                <Link to={`/clients/${invoice.clientId}`}>{client?.company || client?.name || "—"}</Link>
              </dd>
              <dt>Project</dt>
              <dd>
                {project ? <Link to={`/projects/${project.id}`}>{project.name}</Link> : "—"}
              </dd>
              <dt>Amount</dt>
              <dd>{formatCurrency(invoice.amount)}</dd>
              <dt>Issue date</dt>
              <dd>{formatDate(invoice.issueDate)}</dd>
              <dt>Due date</dt>
              <dd style={{ color: display === "overdue" ? "var(--error)" : undefined }}>
                {formatDate(invoice.dueDate)}
              </dd>
              <dt>Outstanding</dt>
              <dd style={{ fontWeight: 700 }}>{formatCurrency(balance)}</dd>
            </dl>
            {invoice.notes && <p className={s.prose} style={{ marginTop: "var(--s-3)" }}>{invoice.notes}</p>}
          </Card>

          <Card padding="none">
            <div className={p.tabHeader}>
              <h3 className={p.tabTitle}>Payments</h3>
              <span style={{ font: "var(--t-meta)", color: "var(--muted)" }}>
                {formatCurrency(linkedPayments.reduce((sum, x) => sum + x.amount, 0))} received
              </span>
            </div>
            {allInvoicePayments.length === 0 ? (
              <EmptyState compact icon="credit-card" title="No payments recorded against this invoice" />
            ) : (
              <ul className={p.financeRows}>
                {allInvoicePayments.map((pay) => (
                  <li key={pay.id} className={p.financeRow}>
                    <span className={p.financeRowIcon} data-kind="Payment">
                      <Icon name="check" size={14} weight={1.9} />
                    </span>
                    <span className={p.financeRowBody}>
                      <span className={p.financeRowLabel}>{METHOD_LABELS[pay.method]}</span>
                      <span className={p.financeRowMeta}>
                        {formatDate(pay.paymentDate)} · {pay.status === "completed" ? "Completed" : "Pending"}
                        {pay.reference ? ` · ${pay.reference}` : ""}
                      </span>
                    </span>
                    <span className={p.financeRowAmount}>{formatCurrency(pay.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className={s.side}>
          <Card>
            <CardHeader title="Status" />
            <InlineSelect
              label="Set to"
              value={invoice.status}
              onChange={(v) => {
                void run(
                  store.setInvoiceStatus(invoice.id, v as "draft" | "sent" | "paid" | "cancelled"),
                  toast,
                  "Couldn't update the invoice",
                ).then((ok) => ok && toast.success("Invoice updated"));
              }}
              options={[
                { value: "draft", label: "Draft" },
                { value: "sent", label: "Sent" },
                { value: "paid", label: "Paid" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
            <p style={{ font: "var(--t-meta)", color: "var(--muted)", marginTop: "var(--s-2)" }}>
              "Pending" and "Overdue" are set automatically from payments and the due date.
            </p>
          </Card>
          <Card>
            <CardHeader title="Balance" />
            <div className={p.payStat}>
              <span className={p.payValue}>{formatCurrency(invoice.amount - balance)}</span>
              <span className={p.payOf}>of {formatCurrency(invoice.amount)}</span>
            </div>
            <p className={p.payHint}>{formatCurrency(balance)} outstanding</p>
          </Card>
        </div>
      </div>

      <InvoiceFormModal open={editModal.isOpen} onClose={editModal.close} invoice={invoice} />
      <RecordPaymentModal open={payModal.isOpen} onClose={payModal.close} prefill={{ invoiceId: invoice.id }} />
    </>
  );
}
