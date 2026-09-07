import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/layouts/AppShell";
import { RouteError } from "@/components/shell/RouteError";
import { DashboardPage } from "@/pages/DashboardPage";
import { CrmPage } from "@/pages/CrmPage";
import { LeadsPage } from "@/pages/LeadsPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { TasksPage } from "@/pages/TasksPage";
import { FinancePage } from "@/pages/FinancePage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { MaintenancePage } from "@/pages/MaintenancePage";
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
      { path: "projects", element: <ProjectsPage /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "finance", element: <FinancePage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "maintenance", element: <MaintenancePage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
