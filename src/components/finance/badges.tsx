import { StatusBadge, INVOICE_STATUS_META } from "@/components/ui/StatusBadge";
import type { Invoice, InvoiceStatus, Payment } from "@/services/types";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const meta = INVOICE_STATUS_META[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function PaymentStatusBadge({ status }: { status: Payment["status"] }) {
  return status === "completed" ? (
    <StatusBadge tone="success">Completed</StatusBadge>
  ) : (
    <StatusBadge tone="warning">Pending</StatusBadge>
  );
}

/** Placeholder-style "Paid / Partial / Pending" chip for project cards. */
export function ProjectPaymentBadge({
  status,
  label,
}: {
  status: "paid" | "partial" | "pending";
  label: string;
}) {
  const tone = status === "paid" ? "success" : status === "partial" ? "warning" : "neutral";
  return (
    <StatusBadge tone={tone} hideDot>
      {label}
    </StatusBadge>
  );
}

export type { Invoice };
