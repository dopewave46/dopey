import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/feedback/ToastProvider";
import { projectStore } from "@/services/projectStore";
import { formatCurrency } from "@/utils/format";
import type { Project } from "@/services/types";

/**
 * Lightweight placeholder — full invoicing / payment records land in the
 * Finance module (Prompt 07). For now this logs a payment activity on the
 * project so the flow is real end-to-end.
 */
export function RecordPaymentModal({
  open,
  onClose,
  project,
  pending,
}: {
  open: boolean;
  onClose: () => void;
  project: Project;
  pending: number;
}) {
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (open) {
      setAmount(pending > 0 ? String(pending) : "");
      setError(undefined);
    }
  }, [open, pending]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(amount.replace(/[,\s]/g, ""));
    if (!amount || Number.isNaN(n) || n <= 0) {
      setError("Enter an amount in rupees.");
      return;
    }
    projectStore.recordPaymentPlaceholder(project.id, n);
    toast.success("Payment recorded", `${formatCurrency(n)} against ${project.name}`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record a payment"
      description="Placeholder — full invoicing and payment records arrive with Finance (Prompt 07)."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="record-payment-form">
            Record payment
          </Button>
        </>
      }
    >
      <form id="record-payment-form" onSubmit={submit}>
        <Input
          label="Amount (₹)"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError(undefined);
          }}
          error={error}
          inputMode="numeric"
          autoFocus
          hint={pending > 0 ? `${formatCurrency(pending)} outstanding` : "Project is fully paid"}
        />
      </form>
    </Modal>
  );
}
