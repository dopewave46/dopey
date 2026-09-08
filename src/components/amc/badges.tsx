import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Amc } from "@/services/types";
import { amcStatus, AMC_STATUS_META, AMC_PAYMENT_META } from "@/services/amcSelectors";

export function AmcStatusBadge({ amc }: { amc: Amc }) {
  const meta = AMC_STATUS_META[amcStatus(amc)];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function AmcPaymentBadge({ status }: { status: Amc["paymentStatus"] }) {
  const meta = AMC_PAYMENT_META[status];
  return (
    <StatusBadge tone={meta.tone} hideDot>
      {meta.label}
    </StatusBadge>
  );
}
