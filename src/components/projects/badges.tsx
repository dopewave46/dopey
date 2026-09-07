import { StatusBadge, PROJECT_STATUS_META } from "@/components/ui/StatusBadge";
import type { Project, ProjectStatus } from "@/services/types";
import { paymentStatusFor } from "@/services/projectSelectors";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const meta = PROJECT_STATUS_META[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function PaymentStatusBadge({ project }: { project: Project }) {
  const { label, tone } = paymentStatusFor(project);
  return (
    <StatusBadge tone={tone} hideDot>
      {label}
    </StatusBadge>
  );
}
