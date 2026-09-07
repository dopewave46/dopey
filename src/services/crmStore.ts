import type { Activity, Client, FollowUp, Lead, LeadStage } from "./types";
import {
  SAMPLE_ACTIVITIES,
  SAMPLE_CLIENTS,
  SAMPLE_FOLLOW_UPS,
  SAMPLE_LEADS,
} from "@/data/sampleCrm";

/**
 * In-memory CRM store.
 *
 * This stands in for the backend until Prompt 09–11. Every mutation replaces
 * the relevant slice immutably and notifies subscribers, so the Leads list,
 * the pipeline board, the CRM hub and the Follow-ups page all stay in sync
 * within a session. Reads/writes are async-shaped to mirror the eventual API.
 */

interface CrmState {
  leads: Lead[];
  clients: Client[];
  followUps: FollowUp[];
  activities: Activity[];
}

let state: CrmState = {
  leads: SAMPLE_LEADS,
  clients: SAMPLE_CLIENTS,
  followUps: SAMPLE_FOLLOW_UPS,
  activities: SAMPLE_ACTIVITIES,
};

const listeners = new Set<() => void>();

function set(next: Partial<CrmState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function nowISO() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function pushActivity(entry: Omit<Activity, "id" | "createdAt">) {
  set({
    activities: [{ ...entry, id: id("act"), createdAt: nowISO() }, ...state.activities],
  });
}

export const crmStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },

  /* ---------------- Leads ---------------- */

  addLead(input: Omit<Lead, "id" | "createdAt" | "updatedAt">): Lead {
    const lead: Lead = { ...input, id: id("lead"), createdAt: nowISO(), updatedAt: nowISO() };
    set({ leads: [lead, ...state.leads] });
    pushActivity({
      type: "lead_created",
      entityType: "lead",
      entityId: lead.id,
      summary: `Lead added — ${lead.business || lead.name}${lead.source ? ` (${lead.source})` : ""}`,
    });
    if (lead.followUpDate) {
      crmStore.addFollowUp({
        parentType: "lead",
        parentId: lead.id,
        dueDate: lead.followUpDate,
        note: `Follow up with ${lead.business || lead.name}`,
      });
    }
    return lead;
  },

  updateLead(leadId: string, patch: Partial<Lead>) {
    set({
      leads: state.leads.map((l) =>
        l.id === leadId ? { ...l, ...patch, updatedAt: nowISO() } : l,
      ),
    });
  },

  setLeadStage(leadId: string, stage: LeadStage) {
    const lead = state.leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === stage) return;
    crmStore.updateLead(leadId, { stage });
    pushActivity({
      type: "stage_changed",
      entityType: "lead",
      entityId: leadId,
      summary: `${lead.business || lead.name} moved to ${stageLabel(stage)}`,
    });
  },

  archiveLead(leadId: string) {
    crmStore.updateLead(leadId, { archivedAt: nowISO() });
    const lead = state.leads.find((l) => l.id === leadId);
    pushActivity({
      type: "lead_archived",
      entityType: "lead",
      entityId: leadId,
      summary: `Lead archived — ${lead?.business || lead?.name || "lead"}`,
    });
  },

  logLeadNote(leadId: string, note: string) {
    const lead = state.leads.find((l) => l.id === leadId);
    if (!lead) return;
    crmStore.updateLead(leadId, { updatedAt: nowISO() });
    pushActivity({
      type: "note_logged",
      entityType: "lead",
      entityId: leadId,
      summary: `Call logged — ${lead.business || lead.name}: ${note}`,
    });
  },

  /* ---------------- Clients ---------------- */

  addClient(input: Omit<Client, "id" | "createdAt" | "updatedAt">): Client {
    const client: Client = { ...input, id: id("client"), createdAt: nowISO(), updatedAt: nowISO() };
    set({ clients: [client, ...state.clients] });
    pushActivity({
      type: "client_created",
      entityType: "client",
      entityId: client.id,
      summary: `Client added — ${client.company || client.name}`,
    });
    return client;
  },

  updateClient(clientId: string, patch: Partial<Client>) {
    set({
      clients: state.clients.map((c) =>
        c.id === clientId ? { ...c, ...patch, updatedAt: nowISO() } : c,
      ),
    });
  },

  /**
   * Lead → Client conversion. The lead is preserved and linked; it never gets
   * deleted (spec Section H). Returns the new client id.
   */
  convertLeadToClient(
    leadId: string,
    clientDraft: Omit<Client, "id" | "createdAt" | "updatedAt" | "sourceLeadId" | "status">,
  ): Client {
    const client = crmStore.addClient({
      ...clientDraft,
      status: "active",
      sourceLeadId: leadId,
    });
    set({
      leads: state.leads.map((l) =>
        l.id === leadId
          ? { ...l, stage: "won", convertedClientId: client.id, updatedAt: nowISO() }
          : l,
      ),
    });
    pushActivity({
      type: "lead_converted",
      entityType: "client",
      entityId: client.id,
      summary: `Lead converted — ${client.company || client.name} is now a client`,
    });
    return client;
  },

  /* ---------------- Follow-ups ---------------- */

  addFollowUp(input: Omit<FollowUp, "id" | "status"> & { status?: FollowUp["status"] }): FollowUp {
    const followUp: FollowUp = { ...input, id: id("fu"), status: input.status ?? "pending" };
    set({ followUps: [...state.followUps, followUp] });
    return followUp;
  },

  completeFollowUp(followUpId: string) {
    set({
      followUps: state.followUps.map((f) =>
        f.id === followUpId ? { ...f, status: "done", completedAt: nowISO() } : f,
      ),
    });
  },

  rescheduleFollowUp(followUpId: string, dueDate: string) {
    set({
      followUps: state.followUps.map((f) =>
        f.id === followUpId ? { ...f, dueDate, status: "pending", completedAt: undefined } : f,
      ),
    });
  },
};

export function stageLabel(stage: LeadStage): string {
  return LEAD_STAGE_LABELS[stage];
}

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

/** Pipeline column order, per the locked spec. */
export const LEAD_STAGE_ORDER: LeadStage[] = [
  "new",
  "contacted",
  "interested",
  "proposal",
  "negotiation",
  "won",
  "lost",
];
