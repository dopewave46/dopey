import { PlaceholderModule } from "./PlaceholderModule";

export function AnalyticsPage() {
  return (
    <PlaceholderModule
      title="Analytics"
      icon="analytics"
      description="How the agency is actually performing — every chart answers a real question."
      planned={[
        "Revenue over time and monthly revenue",
        "Lead conversion rate",
        "Projects completed and currently active",
        "Average project value",
        "Expenses vs revenue and estimated profit trend",
      ]}
    />
  );
}
