import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/layouts/AppShell";
import { RouteError } from "@/components/shell/RouteError";
import { DashboardPage } from "@/pages/DashboardPage";
import { CrmPage } from "@/pages/CrmPage";
import { LeadsPage } from "@/pages/LeadsPage";
import { LeadDetailPage } from "@/pages/LeadDetailPage";
import { ClientsPage } from "@/pages/ClientsPage";
import { ClientDetailPage } from "@/pages/ClientDetailPage";
import { FollowUpsPage } from "@/pages/FollowUpsPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage";
import { TasksPage } from "@/pages/TasksPage";
import { FinanceLayout } from "@/layouts/FinanceLayout";
import { RevenuePage } from "@/pages/finance/RevenuePage";
import { InvoicesPage } from "@/pages/finance/InvoicesPage";
import { InvoiceDetailPage } from "@/pages/finance/InvoiceDetailPage";
import { PaymentsPage } from "@/pages/finance/PaymentsPage";
import { ExpensesPage } from "@/pages/finance/ExpensesPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { AmcPage } from "@/pages/AmcPage";
import { AmcDetailPage } from "@/pages/AmcDetailPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "crm", element: <CrmPage /> },
      { path: "leads", element: <LeadsPage /> },
      { path: "leads/:id", element: <LeadDetailPage /> },
      { path: "clients", element: <ClientsPage /> },
      { path: "clients/:id", element: <ClientDetailPage /> },
      { path: "follow-ups", element: <FollowUpsPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "projects/:id", element: <ProjectDetailPage /> },
      { path: "tasks", element: <TasksPage /> },
      {
        path: "finance",
        element: <FinanceLayout />,
        children: [
          { index: true, element: <RevenuePage /> },
          { path: "invoices", element: <InvoicesPage /> },
          { path: "payments", element: <PaymentsPage /> },
          { path: "expenses", element: <ExpensesPage /> },
        ],
      },
      { path: "finance/invoices/:id", element: <InvoiceDetailPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "amc", element: <AmcPage /> },
      { path: "amc/:id", element: <AmcDetailPage /> },
      { path: "maintenance", element: <Navigate to="/amc" replace /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
