import { PlaceholderModule } from "./PlaceholderModule";

export function CrmPage() {
  return (
    <PlaceholderModule
      title="CRM"
      icon="crm"
      description="One place for every business relationship — leads, clients, and follow-ups."
      planned={[
        "Client list with search and filters",
        "Client profiles: contact, company, status, notes",
        "Aggregated projects, invoices, payments and tasks per client",
        "Follow-ups across leads and clients in one view",
        "Unified activity timeline",
      ]}
    />
  );
}
