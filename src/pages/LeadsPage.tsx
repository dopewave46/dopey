import { PlaceholderModule } from "./PlaceholderModule";
import { StubActionButton } from "@/components/ui/StubActionButton";

export function LeadsPage() {
  return (
    <PlaceholderModule
      title="Leads"
      icon="leads"
      description="Your pipeline from first contact to won — kept separate from clients."
      actions={<StubActionButton iconLeft="plus">Add Lead</StubActionButton>}
      planned={[
        "Pipeline board: New → Contacted → Interested → Proposal → Negotiation → Won / Lost",
        "Lead detail with notes, follow-ups and history",
        "Estimated project value and lead source tracking",
        "Convert a won lead into a client and a project",
        "Search and filter across the pipeline",
      ]}
    />
  );
}
