import { db } from "../repositories/index.js";
import type { Client, Project } from "../types/entities.js";
import { ConflictError } from "../utils/errors.js";
import { logActivity } from "./activity.service.js";
import { getLead } from "./lead.service.js";
import { createClient } from "./client.service.js";
import { createProject } from "./project.service.js";

/**
 * Lead → Client → Project conversion (spec Section H, Prompt 05 §8).
 *
 * The lead is never deleted — it is marked Won + Converted and linked via
 * `converted_client_id` / `source_lead_id`. The client is pre-filled from the
 * lead by the caller (nothing is re-typed). A project can be created in the
 * same step, its value pre-filled from the lead's estimate.
 */
export async function convertLeadToClient(
  leadId: string,
  clientDraft: Omit<Client, "id" | "createdAt" | "updatedAt" | "sourceLeadId" | "status">,
  project?: { name: string; value?: number; startDate?: string; deadline?: string; requirements?: string },
): Promise<{ client: Client; project?: Project }> {
  const lead = await getLead(leadId);
  if (lead.convertedClientId) throw new ConflictError("This lead has already been converted.");

  const client = await createClient({ ...clientDraft, sourceLeadId: leadId, status: "active" });

  await db.leads.patch(leadId, { stage: "won", convertedClientId: client.id });
  await logActivity("client", client.id, "lead_converted", `Lead converted — ${client.company || client.name} is now a client`);

  let created: Project | undefined;
  if (project) {
    created = await createProject({
      clientId: client.id,
      name: project.name,
      value: project.value ?? lead.estimatedValue ?? 0,
      startDate: project.startDate,
      deadline: project.deadline,
      requirements: project.requirements ?? lead.requirements,
      status: "planning",
    });
  }

  return { client, project: created };
}
