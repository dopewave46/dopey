import { StatusBadge, PROJECT_STATUS_META } from "@/components/ui/StatusBadge";
import type { ProjectStatus } from "@/services/types";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const meta = PROJECT_STATUS_META[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}
