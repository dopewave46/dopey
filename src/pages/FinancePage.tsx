import { PlaceholderModule } from "./PlaceholderModule";
import { StubActionButton } from "@/components/ui/StubActionButton";

export function FinancePage() {
  return (
    <PlaceholderModule
      title="Finance"
      icon="finance"
      description="A focused view of agency money — revenue, invoices, payments and expenses in ₹."
      actions={
        <>
          <StubActionButton variant="secondary" iconLeft="plus">
            Record Payment
          </StubActionButton>
          <StubActionButton iconLeft="plus">Create Invoice</StubActionButton>
        </>
      }
      planned={[
        "Revenue overview: earned vs received vs pending",
        "Invoices: Draft, Sent, Pending, Paid, Overdue, Cancelled",
        "Payments against invoices, with method and reference",
        "Expenses by category",
        "Estimated profit",
      ]}
    />
  );
}
