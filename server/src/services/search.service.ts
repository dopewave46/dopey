import { db } from "../repositories/index.js";

export interface SearchResult {
  type: "lead" | "client" | "project" | "task" | "invoice";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

/** Fast global search across the entities the spec lists (Section 19). */
export async function search(query: string, limit = 20): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const [leads, clients, projects, tasks, invoices] = await Promise.all([
    db.leads.all(),
    db.clients.all(),
    db.projects.all(),
    db.tasks.all(),
    db.invoices.all(),
  ]);

  const results: SearchResult[] = [];
  const match = (...vals: (string | undefined)[]) => vals.some((v) => v?.toLowerCase().includes(q));

  for (const l of leads) {
    if (l.archivedAt) continue;
    if (match(l.name, l.business, l.email, l.phone))
      results.push({ type: "lead", id: l.id, title: l.business || l.name, subtitle: `Lead · ${l.stage}`, href: `/leads/${l.id}` });
  }
  for (const c of clients) {
    if (match(c.name, c.company, c.email, c.phone))
      results.push({ type: "client", id: c.id, title: c.company || c.name, subtitle: `Client · ${c.status}`, href: `/clients/${c.id}` });
  }
  for (const p of projects) {
    if (match(p.name))
      results.push({ type: "project", id: p.id, title: p.name, subtitle: `Project · ${p.status}`, href: `/projects/${p.id}` });
  }
  for (const t of tasks) {
    if (match(t.title))
      results.push({ type: "task", id: t.id, title: t.title, subtitle: `Task · ${t.status}`, href: `/tasks` });
  }
  for (const i of invoices) {
    if (match(i.invoiceNumber))
      results.push({ type: "invoice", id: i.id, title: i.invoiceNumber, subtitle: `Invoice · ${i.status}`, href: `/finance/invoices/${i.id}` });
  }

  return results.slice(0, limit);
}
