import { db } from "../repositories/index.js";
import type { Client, ClientStatus } from "../types/entities.js";
import { newId } from "../utils/ids.js";
import { nowISO } from "../utils/dates.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";
import { logActivity } from "./activity.service.js";

export interface ClientFilter {
  status?: ClientStatus;
  location?: string;
  q?: string;
}

export async function listClients(filter: ClientFilter = {}): Promise<Client[]> {
  let rows = await db.clients.all();
  if (filter.status) rows = rows.filter((c) => c.status === filter.status);
  if (filter.location) rows = rows.filter((c) => c.location === filter.location);
  if (filter.q) {
    const q = filter.q.toLowerCase();
    rows = rows.filter((c) => [c.name, c.company, c.email, c.phone].some((v) => v?.toLowerCase().includes(q)));
  }
  return rows.sort((a, b) => (a.company || a.name).localeCompare(b.company || b.name));
}

export async function getClient(id: string): Promise<Client> {
  const client = await db.clients.getById(id);
  if (!client) throw new NotFoundError("Client");
  return client;
}

export async function createClient(input: Omit<Client, "id" | "createdAt" | "updatedAt" | "status"> & { status?: ClientStatus }): Promise<Client> {
  const now = nowISO();
  const client: Client = { ...input, id: newId("client"), status: input.status ?? "active", createdAt: now, updatedAt: now };
  await db.clients.insert(client);
  await logActivity("client", client.id, "client_created", `Client added — ${client.company || client.name}`);
  return client;
}

export async function updateClient(id: string, patch: Partial<Client>): Promise<Client> {
  await getClient(id);
  const updated = await db.clients.patch(id, patch);
  if (!updated) throw new NotFoundError("Client");
  await logActivity("client", id, "client_updated", `${updated.company || updated.name} — details updated`);
  return updated;
}

export async function deleteClient(id: string): Promise<void> {
  await getClient(id);
  const hasProjects = await db.projects.count((p) => p.clientId === id);
  const hasInvoices = await db.invoices.count((i) => i.clientId === id);
  if (hasProjects || hasInvoices) {
    throw new ConflictError("This client has projects or invoices. Archive it instead of deleting.");
  }
  await db.clients.remove(id);
}
