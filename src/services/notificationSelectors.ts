import type { AppNotification } from "./types";
import { SAMPLE_NOTIFICATIONS } from "@/data/sampleNotifications";
import { financeStore } from "./financeStore";
import { amcStore } from "./amcStore";
import { taskStore } from "./taskStore";
import { crmStore } from "./crmStore";
import { invoiceDisplayStatus, outstandingBalance } from "./financeSelectors";
import { amcStatus, daysUntil } from "./amcSelectors";
import { bucketOf } from "./taskSelectors";

/**
 * Live notifications — merges the sample "event" notices (payment received,
 * new lead) with rules derived from the current stores (Prompt 08 §5, and the
 * notification foundation from Prompt 03). No delivery — panel only.
 */
export function deriveNotifications(): AppNotification[] {
  const out: AppNotification[] = [];
  const clientName = (id: string) => {
    const c = crmStore.getSnapshot().clients.find((x) => x.id === id);
    return c?.company || c?.name || "Client";
  };

  // AMC renewals within the lead time / expired
  for (const amc of amcStore.getSnapshot().amcs) {
    const status = amcStatus(amc);
    if (status === "active") continue;
    const d = daysUntil(amc.renewalDate);
    out.push({
      id: `amc-${amc.id}`,
      type: "amc_renewal",
      title: status === "expired" ? "AMC expired" : "AMC renewal due",
      body:
        `${clientName(amc.clientId)} — ${amc.service}, ` +
        (d < 0 ? `${Math.abs(d)} days ago` : d === 0 ? "today" : `in ${d} days`),
      entityType: "amc",
      entityId: amc.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  // Overdue invoices
  const { invoices, payments } = financeStore.getSnapshot();
  for (const inv of invoices) {
    if (invoiceDisplayStatus(inv, payments) !== "overdue") continue;
    out.push({
      id: `inv-${inv.id}`,
      type: "invoice_overdue",
      title: "Invoice overdue",
      body: `${clientName(inv.clientId)} — ${inv.invoiceNumber} · ₹${outstandingBalance(inv, payments).toLocaleString("en-IN")}`,
      entityType: "invoice",
      entityId: inv.id,
      isRead: false,
      createdAt: inv.dueDate,
    });
  }

  // Overdue tasks (one summary)
  const overdueTasks = taskStore.getSnapshot().filter((t) => bucketOf(t) === "overdue");
  if (overdueTasks.length > 0) {
    out.push({
      id: "tasks-overdue",
      type: "task_overdue",
      title: `${overdueTasks.length} task${overdueTasks.length > 1 ? "s" : ""} overdue`,
      body: overdueTasks
        .slice(0, 2)
        .map((t) => t.title)
        .join(" · "),
      isRead: false,
      createdAt: new Date(Date.now() - 3_600_000).toISOString(),
    });
  }

  // Sample event notices that aren't derivable
  const events = SAMPLE_NOTIFICATIONS.filter((n) =>
    ["payment_received", "new_lead", "project_deadline", "client_update"].includes(n.type),
  );

  return [...out, ...events].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Where clicking a notification should take you. */
export function notificationHref(n: AppNotification): string {
  switch (n.entityType) {
    case "amc":
      return `/amc/${n.entityId}`;
    case "invoice":
      return `/finance/invoices/${n.entityId}`;
    case "client":
      return `/clients/${n.entityId}`;
    case "project":
      return `/projects/${n.entityId}`;
    case "lead":
      return `/leads/${n.entityId}`;
    default:
      return n.type === "task_overdue" ? "/tasks" : "/notifications";
  }
}
