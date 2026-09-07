import {
  StatusBadge,
  LEAD_STAGE_META,
  CLIENT_STATUS_META,
} from "@/components/ui/StatusBadge";
import type { ClientStatus, LeadStage } from "@/services/types";

export function LeadStageBadge({ stage }: { stage: LeadStage }) {
  const meta = LEAD_STAGE_META[stage];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const meta = CLIENT_STATUS_META[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}
