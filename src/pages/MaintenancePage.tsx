import { PlaceholderModule } from "./PlaceholderModule";
import { StubActionButton } from "@/components/ui/StubActionButton";

export function MaintenancePage() {
  return (
    <PlaceholderModule
      title="Maintenance / AMC"
      icon="maintenance"
      description="Ongoing services after delivery — contracts, renewals and hosting."
      actions={<StubActionButton iconLeft="plus">Add AMC</StubActionButton>}
      planned={[
        "Active AMCs by client and project",
        "Start date, renewal date and hosting renewal",
        "Payment status: Paid, Due, Overdue",
        "Upcoming renewals for the next 30 / 60 / 90 days",
        "Maintenance task checklist per contract",
      ]}
    />
  );
}
