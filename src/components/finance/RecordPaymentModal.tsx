import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/feedback/ToastProvider";
import { useCrm } from "@/hooks/useCrm";
import { useProjects } from "@/hooks/useProjects";
import { useFinance } from "@/hooks/useFinance";
import { METHOD_LABELS } from "@/services/financeStore";
import { outstandingBalance } from "@/services/financeSelectors";
import { formatCurrency } from "@/utils/format";
import type { Payment } from "@/services/types";
import styles from "@/components/crm/LeadFormModal.module.css";

export interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  /** Lock or pre-select the invoice / project / client. */
  prefill?: { invoiceId?: string; projectId?: string; clientId?: string };
}

/**
 * THE shared "Record Payment" modal — used from the Payments page, the
 * Dashboard quick actions and the Project Detail Finance tab (Prompt 07 §5).
 * On save it reduces the invoice balance, flips it to Paid when settled, and
 * every derived figure (project, client, dashboard, analytics) updates because
 * they all read the same store.
 */
export function RecordPaymentModal({ open, onClose, prefill }: RecordPaymentModalProps) {
  const toast = useToast();
  const { clients } = useCrm();
  const { projects } = useProjects();
  const { invoices, payments, store } = useFinance();

  const [invoiceId, setInvoiceId] = useState("");
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [method, setMethod] = useState<Payment["method"]>("bank_transfer");
  const [status, setStatus] = useState<Payment["status"]>("completed");
  const [reference, setReference] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const invoiceOptions = useMemo(() => {
    return invoices
      .filter((i) => i.status !== "cancelled")
      .filter((i) => (prefill?.projectId ? i.projectId === prefill.projectId : true))
      .filter((i) => outstandingBalance(i, payments) > 0 || i.id === prefill?.invoiceId || i.id === invoiceId)
      .sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));
  }, [invoices, payments, prefill, invoiceId]);

  const selectedInvoice = invoices.find((i) => i.id === invoiceId);
  const lockedInvoice = Boolean(prefill?.invoiceId);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setDate(new Date().toISOString().slice(0, 10));
    setMethod("bank_transfer");
    setStatus("completed");
    setReference("");
    if (prefill?.invoiceId) {
      setInvoiceId(prefill.invoiceId);
      const inv = invoices.find((i) => i.id === prefill.invoiceId);
      setClientId(inv?.clientId ?? "");
      setAmount(inv ? String(outstandingBalance(inv, payments)) : "");
    } else {
      const first = invoiceOptions[0];
      setInvoiceId(first?.id ?? "");
      setClientId(first?.clientId ?? prefill?.clientId ?? "");
      setAmount(first ? String(outstandingBalance(first, payments)) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onInvoiceChange = (id: string) => {
    setInvoiceId(id);
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      setClientId(inv.clientId);
      setAmount(String(outstandingBalance(inv, payments)));
    }
    setErrors((e) => ({ ...e, invoiceId: "", clientId: "" }));
  };

  const projectFor = (id?: string) => projects.find((p) => p.id === id);
  const clientLabel = (id: string) => clients.find((c) => c.id === id)?.company || clients.find((c) => c.id === id)?.name || "—";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const n = Number(amount.replace(/[,\s]/g, ""));
    if (!invoiceId && !clientId) next.clientId = "Pick an invoice or a client.";
    if (!amount || Number.isNaN(n) || n <= 0) next.amount = "Enter an amount in rupees.";
    if (!date) next.date = "Pick a date.";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    const inv = invoices.find((i) => i.id === invoiceId);
    store.addPayment({
      clientId: inv?.clientId ?? clientId,
      projectId: inv?.projectId ?? prefill?.projectId,
      invoiceId: invoiceId || undefined,
      amount: n,
      paymentDate: new Date(date).toISOString(),
      method,
      status,
      reference: reference.trim() || undefined,
    });
    toast.success("Payment recorded", `${formatCurrency(n)} · ${METHOD_LABELS[method]}`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record a payment"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="record-payment-form">
            Save payment
          </Button>
        </>
      }
    >
      <form id="record-payment-form" onSubmit={submit} className={styles.form}>
        <Select
          label="Invoice"
          value={invoiceId}
          onChange={(e) => onInvoiceChange(e.target.value)}
          disabled={lockedInvoice}
          hint={
            selectedInvoice
              ? `${clientLabel(selectedInvoice.clientId)}${
                  projectFor(selectedInvoice.projectId) ? ` · ${projectFor(selectedInvoice.projectId)!.name}` : ""
                }`
              : "Or record an unlinked payment against a client"
          }
        >
          <option value="">No invoice (advance / retainer)</option>
          {invoiceOptions.map((i) => (
            <option key={i.id} value={i.id}>
              {i.invoiceNumber} · {formatCurrency(outstandingBalance(i, payments))} due
            </option>
          ))}
        </Select>

        {!invoiceId && (
          <Select
            label="Client"
            required
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            error={errors.clientId}
          >
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company || c.name}
              </option>
            ))}
          </Select>
        )}

        <div className={styles.row}>
          <Input
            label="Amount (₹)"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount}
            inputMode="numeric"
          />
          <Input
            label="Date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
          />
        </div>

        <div className={styles.row}>
          <Select label="Method" value={method} onChange={(e) => setMethod(e.target.value as Payment["method"])}>
            {(Object.keys(METHOD_LABELS) as Payment["method"][]).map((m) => (
              <option key={m} value={m}>
                {METHOD_LABELS[m]}
              </option>
            ))}
          </Select>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as Payment["status"])}>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </Select>
        </div>

        <Textarea
          label="Reference / note"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="UPI ref, transaction id, cheque no…"
        />
      </form>
    </Modal>
  );
}
