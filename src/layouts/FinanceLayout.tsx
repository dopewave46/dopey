import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";

const TABS = [
  { value: "revenue", label: "Revenue", to: "/finance" },
  { value: "invoices", label: "Invoices", to: "/finance/invoices" },
  { value: "payments", label: "Payments", to: "/finance/payments" },
  { value: "expenses", label: "Expenses", to: "/finance/expenses" },
];

/** Shared Finance frame — one page header + a route-driven tab bar. */
export function FinanceLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const active =
    pathname.startsWith("/finance/invoices")
      ? "invoices"
      : pathname.startsWith("/finance/payments")
        ? "payments"
        : pathname.startsWith("/finance/expenses")
          ? "expenses"
          : "revenue";

  return (
    <>
      <PageHeader
        title="Finance"
        description="Revenue, invoices, payments and expenses — everything in ₹."
      />
      <Tabs
        tabs={TABS}
        value={active}
        aria-label="Finance sections"
        onChange={(v) => navigate(TABS.find((t) => t.value === v)!.to)}
      />
      <div style={{ paddingTop: "var(--s-5)" }}>
        <Outlet />
      </div>
    </>
  );
}
