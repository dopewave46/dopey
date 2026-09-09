import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/feedback/ToastProvider";
import { apiErrorMessage } from "@/utils/apiError";
import { useCrm } from "@/hooks/useCrm";
import { useProjects } from "@/hooks/useProjects";
import { financeStore } from "@/services/financeStore";
import type { Invoice } from "@/services/types";
import styles from "@/components/crm/LeadFormModal.module.css";

export interface InvoiceFormModalProps {
  open: boolean;
  onClose: () => void;
  invoice?: Invoice;
  prefill?: { projectId?: string; clientId?: string };
  navigateOnCreate?: boolean;
}

export function InvoiceFormModal({ open, onClose, invoice, prefill, navigateOnCreate }: InvoiceFormModalProps) {
  const toast = useToast();
  const navigate = useNavigate();
  const { clients } = useCrm();
  const { projects } = useProjects();
  const isEdit = Boolean(invoice);

  const [projectId, setProjectId] = useState("");
  const [amount, setAmount] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedProject = projects.find((p) => p.id === projectId);
  const clientLabel = useMemo(() => {
    const cid = selectedProject?.clientId ?? invoice?.clientId;
    return clients.find((c) => c.id === cid)?.company || clients.find((c) => c.id === cid)?.name;
  }, [clients, selectedProject, invoice]);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    const today = new Date();
    const due = new Date(today.getTime() + 14 * 86_400_000);
    if (invoice) {
      setProjectId(invoice.projectId ?? "");
      setAmount(String(invoice.amount));
      setIssueDate(invoice.issueDate.slice(0, 10));
      setDueDate(invoice.dueDate.slice(0, 10));
      setNotes(invoice.notes ?? "");
    } else {
      setProjectId(prefill?.projectId ?? "");
      const proj = projects.find((p) => p.id === prefill?.projectId);
      setAmount(proj?.value ? String(proj.value) : "");
      setIssueDate(today.toISOString().slice(0, 10));
      setDueDate(due.toISOString().slice(0, 10));
      setNotes("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice, prefill]);

  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const n = Number(amount.replace(/[,\s]/g, ""));
    if (!projectId) next.projectId = "Pick the project this invoice is for.";
    if (!amount || Number.isNaN(n) || n <= 0) next.amount = "Enter an amount in rupees.";
    if (!issueDate) next.issueDate = "Pick an issue date.";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    const project = projects.find((p) => p.id === projectId)!;
    const payload = {
      clientId: project.clientId,
      projectId,
      amount: n,
      issueDate: new Date(issueDate).toISOString(),
      dueDate: new Date(dueDate || issueDate).toISOString(),
      notes: notes.trim() || undefined,
    };

    setSaving(true);
    try {
      if (isEdit && invoice) {
        await financeStore.updateInvoice(invoice.id, payload);
        toast.success("Invoice updated", invoice.invoiceNumber);
      } else {
        const created = await financeStore.addInvoice(payload);
        toast.success("Invoice created", `${created.invoiceNumber} · saved as Draft`);
        if (navigateOnCreate) navigate(`/finance/invoices/${created.id}`);
      }
      onClose();
    } catch (err) {
      toast.error("Couldn't save the invoice", apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit invoice" : "Create invoice"}
      description={isEdit ? undefined : "Saved as a Draft — mark it Sent when it goes out."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="invoice-form" loading={saving} disabled={saving}>
            {isEdit ? "Save changes" : "Save invoice"}
          </Button>
        </>
      }
    >
      <form id="invoice-form" onSubmit={submit} className={styles.form}>
        <Select
          label="Project"
          required
          value={projectId}
          onChange={(e) => {
            setProjectId(e.target.value);
            setErrors((x) => ({ ...x, projectId: "" }));
          }}
          error={errors.projectId}
          hint={clientLabel ? `Client: ${clientLabel}` : undefined}
          disabled={isEdit}
        >
          <option value="">Select a project…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>

        <Input
          label="Amount (₹)"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          inputMode="numeric"
          placeholder="e.g. 60000"
        />

        <div className={styles.row}>
          <Input
            label="Issue date"
            type="date"
            required
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            error={errors.issueDate}
          />
          <Input label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </form>
    </Modal>
  );
}
