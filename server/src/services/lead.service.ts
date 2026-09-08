import { db } from "../repositories/index.js";
import type { Lead, LeadStage } from "../types/entities.js";
import { newId } from "../utils/ids.js";
import { nowISO } from "../utils/dates.js";
import { NotFoundError } from "../utils/errors.js";
import { logActivity } from "./activity.service.js";
import { onNewLead } from "./notification.service.js";
import { addFollowUp } from "./followup.service.js";

const STAGE_LABEL: Record<LeadStage, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export interface LeadFilter {
  stage?: LeadStage;
  source?: string;
  service?: string;
  q?: string;
  includeArchived?: boolean;
}

export async function listLeads(filter: LeadFilter = {}): Promise<Lead[]> {
  let rows = await db.leads.all();
  if (!filter.includeArchived) rows = rows.filter((l) => !l.archivedAt);
  if (filter.stage) rows = rows.filter((l) => l.stage === filter.stage);
  if (filter.source) rows = rows.filter((l) => l.source === filter.source);
  if (filter.service) rows = rows.filter((l) => l.serviceRequired === filter.service);
  if (filter.q) {
    const q = filter.q.toLowerCase();
    rows = rows.filter((l) =>
      [l.name, l.business, l.phone, l.email].some((v) => v?.toLowerCase().includes(q)),
    );
  }
  return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getLead(id: string): Promise<Lead> {
  const lead = await db.leads.getById(id);
  if (!lead) throw new NotFoundError("Lead");
  return lead;
}

export async function createLead(input: Omit<Lead, "id" | "createdAt" | "updatedAt" | "stage"> & { stage?: LeadStage }): Promise<Lead> {
  const now = nowISO();
  const lead: Lead = { ...input, id: newId("lead"), stage: input.stage ?? "new", createdAt: now, updatedAt: now };
  await db.leads.insert(lead);
  await logActivity("lead", lead.id, "lead_created", `Lead added — ${lead.business || lead.name}${lead.source ? ` (${lead.source})` : ""}`);
  await onNewLead(lead);
  if (lead.followUpDate) {
    await addFollowUp({
      parentType: "lead",
      parentId: lead.id,
      dueDate: lead.followUpDate,
      note: `Follow up with ${lead.business || lead.name}`,
    });
  }
  return lead;
}

export async function updateLead(id: string, patch: Partial<Lead>): Promise<Lead> {
  const before = await getLead(id);
  const updated = await db.leads.patch(id, patch);
  if (!updated) throw new NotFoundError("Lead");
  if (patch.stage && patch.stage !== before.stage) {
    await logActivity("lead", id, "stage_changed", `${updated.business || updated.name} moved to ${STAGE_LABEL[patch.stage]}`);
  }
  return updated;
}

export async function setLeadStage(id: string, stage: LeadStage): Promise<Lead> {
  return updateLead(id, { stage });
}

export async function logLeadCall(id: string, note: string): Promise<Lead> {
  const lead = await getLead(id);
  await logActivity("lead", id, "note_logged", `Call logged — ${lead.business || lead.name}: ${note}`);
  return (await db.leads.patch(id, { updatedAt: nowISO() }))!;
}

export async function archiveLead(id: string): Promise<Lead> {
  const lead = await getLead(id);
  await logActivity("lead", id, "lead_archived", `Lead archived — ${lead.business || lead.name}`);
  return (await db.leads.patch(id, { archivedAt: nowISO() }))!;
}

export async function deleteLead(id: string): Promise<void> {
  await getLead(id);
  await db.leads.remove(id);
}
