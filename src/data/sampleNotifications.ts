import type { AppNotification } from "@/services/types";

/**
 * Sample notifications so the panel has realistic content to render.
 * Clearly example data — replaced by the notifications engine in a later prompt.
 */
export const SAMPLE_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    type: "invoice_overdue",
    title: "Invoice overdue",
    body: "Blue Fig Studio has an overdue payment of ₹85,000.",
    entityType: "invoice",
    entityId: "inv-0142",
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "n2",
    type: "payment_received",
    title: "Payment received",
    body: "Sea Salt Cafe paid ₹60,000 via UPI.",
    entityType: "payment",
    entityId: "pay-0088",
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "n3",
    type: "amc_renewal",
    title: "AMC renewal approaching",
    body: "Kadam & Co. hosting renews on 15 Sep 2026.",
    entityType: "amc",
    entityId: "amc-0021",
    isRead: false,
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "n4",
    type: "project_deadline",
    title: "Project deadline approaching",
    body: "Sea Salt Cafe — Website is due in 3 days.",
    entityType: "project",
    entityId: "prj-0033",
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "n5",
    type: "new_lead",
    title: "New lead added",
    body: "Highfield Realty enquired about a portal redesign.",
    entityType: "lead",
    entityId: "lead-0102",
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
