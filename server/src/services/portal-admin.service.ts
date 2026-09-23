import { db } from "../repositories/index.js";
import type { PortalCredential } from "../types/entities.js";
import { newId } from "../utils/ids.js";
import { nowISO } from "../utils/dates.js";
import { hashPassword } from "../utils/password.js";
import { generatePortalPassword, generatePortalUsername } from "../utils/portal-credentials.js";
import { NotFoundError } from "../utils/errors.js";
import { getClient } from "./client.service.js";
import { logActivity } from "./activity.service.js";

/**
 * Admin-side management of client portal access (spec §4). This is the ONLY
 * place a plaintext password is ever produced — it's returned once to the
 * caller and never stored or logged again, only the bcrypt hash persists.
 */

export interface PortalCredentialInfo {
  username: string;
  enabled: boolean;
}

export async function getPortalCredentialInfo(clientId: string): Promise<PortalCredentialInfo | null> {
  const credential = await db.portalCredentials.find((c) => c.clientId === clientId);
  if (!credential) return null;
  return { username: credential.username, enabled: credential.enabled };
}

/** Create portal access for a client (or re-issue if it already exists). */
export async function createPortalCredentials(
  clientId: string,
  opts: { username?: string; password?: string } = {},
): Promise<{ credential: PortalCredentialInfo; password: string }> {
  const client = await getClient(clientId); // 404s if the client doesn't exist
  const existing = await db.portalCredentials.find((c) => c.clientId === clientId);
  const allCredentials = await db.portalCredentials.all();
  const takenUsernames = new Set(
    allCredentials.filter((c) => c.id !== existing?.id).map((c) => c.username),
  );

  const username =
    opts.username?.trim().toLowerCase() ||
    existing?.username ||
    generatePortalUsername(client.company || client.name, (candidate) => takenUsernames.has(candidate));
  const password = opts.password || generatePortalPassword();
  const passwordHash = await hashPassword(password);
  const now = nowISO();

  let row: PortalCredential;
  if (existing) {
    row = (await db.portalCredentials.patch(existing.id, { username, passwordHash, enabled: true }))!;
  } else {
    row = {
      id: newId("portalcred"),
      clientId,
      username,
      passwordHash,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };
    await db.portalCredentials.insert(row);
  }

  await logActivity("client", clientId, "portal_access_created", `Portal access created for ${client.company || client.name}`);
  return { credential: { username: row.username, enabled: row.enabled }, password };
}

export async function updatePortalCredentials(
  clientId: string,
  patch: { enabled?: boolean; resetPassword?: boolean; password?: string },
): Promise<{ credential: PortalCredentialInfo; password?: string }> {
  const existing = await db.portalCredentials.find((c) => c.clientId === clientId);
  if (!existing) throw new NotFoundError("Portal access");

  let password: string | undefined;
  const set: Partial<PortalCredential> = {};
  if (patch.enabled !== undefined) set.enabled = patch.enabled;
  if (patch.resetPassword || patch.password) {
    password = patch.password || generatePortalPassword();
    set.passwordHash = await hashPassword(password);
  }

  const row = (await db.portalCredentials.patch(existing.id, set))!;
  const client = await getClient(clientId);
  await logActivity(
    "client",
    clientId,
    "portal_access_updated",
    password
      ? `Portal password reset for ${client.company || client.name}`
      : `Portal access ${row.enabled ? "enabled" : "disabled"} for ${client.company || client.name}`,
  );
  return { credential: { username: row.username, enabled: row.enabled }, password };
}
