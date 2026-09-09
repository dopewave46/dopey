import type { Activity, Client, FollowUp, Lead, LeadStage } from "./types";
import { api } from "./api";
import { notificationStore } from "./notificationStore";
import type { StoreStatus } from "./storeStatus";

/**
 * CRM store (Prompt 11) — API-backed.
 *
 * `hydrate()` loads leads / clients / follow-ups from the backend once, on app
 * boot. Every mutation goes through the API and then refreshes the affected
 * slice, so the Leads list, the pipeline board, the CRM hub, the Follow-ups
 * page and the client profile all stay consistent with PostgreSQL — the one
 * source of truth (Prompt 09 service layer).
 *
 * The subscribe / getSnapshot surface is unchanged, so `useCrm()` and every
 * component that reads it keep working as before.
 */

interface CrmState {
  leads: Lead[];
  clients: Client[];
  followUps: FollowUp[];
  activities: Activity[];
  status: StoreStatus;
  error: string | null;
}

let state: CrmState = {
  leads: [],
  clients: [],
  followUps: [],
  activities: [],
  status: "idle",
  error: null,
};

const listeners = new Set<() => void>();

function set(next: Partial<CrmState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function mergeActivities(incoming: Activity[]) {
  const byId = new Map(state.activities.map((a) => [a.id, a]));
  for (const a of incoming) byId.set(a.id, a);
  set({
    activities: [...byId.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
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

  async hydrate(): Promise<void> {
    if (state.status === "loading") return;
    set({ status: "loading", error: null });
    try {
      const [leads, clients, followUps] = await Promise.all([
        api.get<Lead[]>("/leads"),
        api.get<Client[]>("/clients"),
        api.get<{ flat: FollowUp[] }>("/follow-ups").then((r) => r.flat),
      ]);
      set({ leads, clients, followUps, status: "ready", error: null });
    } catch (err) {
      set({ status: "error", error: err instanceof Error ? err.message : "Failed to load CRM data" });
    }
  },

  async reloadLeads() {
    set({ leads: await api.get<Lead[]>("/leads") });
  },
  async reloadClients() {
    set({ clients: await api.get<Client[]>("/clients") });
  },
  async reloadFollowUps() {
    set({ followUps: await api.get<{ flat: FollowUp[] }>("/follow-ups").then((r) => r.flat) });
  },

  /* ---------------- Leads ---------------- */

  async addLead(input: Omit<Lead, "id" | "createdAt" | "updatedAt">): Promise<Lead> {
    const lead = await api.post<Lead>("/leads", input);
    set({ leads: [lead, ...state.leads] });
    // The backend auto-creates a follow-up when followUpDate is set, and fires
    // a "new lead" notification.
    if (lead.followUpDate) await crmStore.reloadFollowUps();
    void notificationStore.refresh();
    return lead;
  },

  async updateLead(leadId: string, patch: Partial<Lead>): Promise<Lead> {
    const updated = await api.patch<Lead>(`/leads/${leadId}`, patch);
    set({ leads: state.leads.map((l) => (l.id === leadId ? updated : l)) });
    return updated;
  },

  async setLeadStage(leadId: string, stage: LeadStage): Promise<void> {
    const lead = state.leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === stage) return;
    const updated = await api.post<Lead>(`/leads/${leadId}/stage`, { stage });
    set({ leads: state.leads.map((l) => (l.id === leadId ? updated : l)) });
  },

  async archiveLead(leadId: string): Promise<void> {
    const updated = await api.post<Lead>(`/leads/${leadId}/archive`, {});
    set({ leads: state.leads.map((l) => (l.id === leadId ? updated : l)) });
  },

  async logLeadNote(leadId: string, note: string): Promise<void> {
    const updated = await api.post<Lead>(`/leads/${leadId}/log-call`, { note });
    set({ leads: state.leads.map((l) => (l.id === leadId ? updated : l)) });
    await crmStore.loadActivitiesFor("lead", leadId);
  },

  async deleteLead(leadId: string): Promise<void> {
    await api.delete(`/leads/${leadId}`);
    set({ leads: state.leads.filter((l) => l.id !== leadId) });
  },

  /* ---------------- Clients ---------------- */

  async addClient(
    input: Omit<Client, "id" | "createdAt" | "updatedAt">,
  ): Promise<Client> {
    const client = await api.post<Client>("/clients", input);
    set({ clients: [client, ...state.clients] });
    return client;
  },

  async updateClient(clientId: string, patch: Partial<Client>): Promise<Client> {
    const updated = await api.patch<Client>(`/clients/${clientId}`, patch);
    set({ clients: state.clients.map((c) => (c.id === clientId ? updated : c)) });
    return updated;
  },

  /**
   * Lead → Client conversion via the backend endpoint (Prompt 09
   * conversion.service): the lead is marked Won + linked, never deleted, and
   * the client is pre-filled from lead data server-side. Returns the new client.
   */
  async convertLeadToClient(
    leadId: string,
    clientDraft: Omit<Client, "id" | "createdAt" | "updatedAt" | "sourceLeadId" | "status">,
  ): Promise<Client> {
    const { client } = await api.post<{ client: Client; project?: unknown }>(
      `/leads/${leadId}/convert`,
      { client: clientDraft },
    );
    await Promise.all([crmStore.reloadLeads(), crmStore.reloadClients()]);
    return client;
  },

  /* ---------------- Follow-ups ---------------- */

  async addFollowUp(
    input: Omit<FollowUp, "id" | "status"> & { status?: FollowUp["status"] },
  ): Promise<FollowUp> {
    const followUp = await api.post<FollowUp>("/follow-ups", input);
    set({ followUps: [...state.followUps, followUp] });
    return followUp;
  },

  async completeFollowUp(followUpId: string): Promise<void> {
    const updated = await api.post<FollowUp>(`/follow-ups/${followUpId}/complete`, {});
    set({ followUps: state.followUps.map((f) => (f.id === followUpId ? updated : f)) });
  },

  async rescheduleFollowUp(followUpId: string, dueDate: string): Promise<void> {
    const updated = await api.post<FollowUp>(`/follow-ups/${followUpId}/reschedule`, { dueDate });
    set({ followUps: state.followUps.map((f) => (f.id === followUpId ? updated : f)) });
  },

  /* ---------------- Activity (per-entity, loaded on demand) ---------------- */

  async loadActivitiesFor(entityType: "lead" | "client", entityId: string): Promise<void> {
    const rows = await api.get<Activity[]>(`/${entityType}s/${entityId}/activity`);
    mergeActivities(rows);
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

/** Lead form option lists (moved here from the removed sample data). */
export const LEAD_SOURCES = [
  "Referral",
  "Instagram",
  "Website enquiry",
  "Cold outreach",
  "WhatsApp",
  "Networking event",
  "Repeat client",
] as const;

export const SERVICES = [
  "Business website",
  "E-commerce store",
  "Landing page",
  "Website redesign",
  "Web app",
  "Branding + website",
  "Maintenance / AMC",
] as const;
