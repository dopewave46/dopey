import type { BadgeTone } from "@/components/ui/StatusBadge";

/**
 * Sample dashboard content. Clearly labelled in the UI as preview data — every
 * figure here is replaced by real aggregates once the feature modules land.
 */

export interface FlowRow {
  label: string;
  count: number;
  percent: number;
}

export const PROJECT_FLOW: FlowRow[] = [
  { label: "Planning", count: 2, percent: 15 },
  { label: "UI/UX", count: 3, percent: 40 },
  { label: "Development", count: 5, percent: 72 },
  { label: "Client Review", count: 2, percent: 88 },
  { label: "Ready for Launch", count: 2, percent: 96 },
];

export interface InvoiceSummaryRow {
  label: string;
  amount: number;
  tone: BadgeTone;
}

export const INVOICE_SUMMARY: InvoiceSummaryRow[] = [
  { label: "Received this month", amount: 425000, tone: "success" },
  { label: "Pending", amount: 186000, tone: "warning" },
  { label: "Overdue", amount: 85000, tone: "error" },
];

export interface RenewalRow {
  client: string;
  service: string;
  dueInDays: number;
}

export const UPCOMING_RENEWALS: RenewalRow[] = [
  { client: "Kadam & Co.", service: "Hosting + maintenance", dueInDays: 8 },
  { client: "Blue Fig Studio", service: "AMC — quarterly", dueInDays: 21 },
  { client: "Sea Salt Cafe", service: "Domain renewal", dueInDays: 34 },
];

export interface TransactionRow {
  id: string;
  client: string;
  kind: "Payment" | "Invoice" | "Expense";
  amount: number;
  direction: "in" | "out";
  date: string;
  status: string;
  tone: BadgeTone;
}

export const RECENT_TRANSACTIONS: TransactionRow[] = [
  {
    id: "t1",
    client: "Blue Fig Studio",
    kind: "Payment",
    amount: 85000,
    direction: "in",
    date: new Date(Date.now() - 2 * 3600_000).toISOString(),
    status: "Received",
    tone: "success",
  },
  {
    id: "t2",
    client: "Sea Salt Cafe",
    kind: "Invoice",
    amount: 120000,
    direction: "in",
    date: new Date(Date.now() - 26 * 3600_000).toISOString(),
    status: "Sent",
    tone: "progress",
  },
  {
    id: "t3",
    client: "DigitalOcean",
    kind: "Expense",
    amount: 3200,
    direction: "out",
    date: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    status: "Hosting",
    tone: "neutral",
  },
  {
    id: "t4",
    client: "Kadam & Co.",
    kind: "Payment",
    amount: 45000,
    direction: "in",
    date: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    status: "Received",
    tone: "success",
  },
  {
    id: "t5",
    client: "Highfield Realty",
    kind: "Invoice",
    amount: 340000,
    direction: "in",
    date: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    status: "Overdue",
    tone: "error",
  },
];
