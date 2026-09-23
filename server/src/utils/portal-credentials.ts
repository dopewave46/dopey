import { randomInt } from "node:crypto";

/**
 * Portal username/password generation (client portal §2 defaults).
 *
 * Username: lowercase slug of the client's business name, with a random
 * 3-digit suffix appended only on collision. Password: a random 10-character
 * alphanumeric string with ambiguous characters (0/O, l/1/I) removed, since
 * it's read aloud/typed on a phone after being sent over WhatsApp.
 */

const PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyzACDEFGHJKMNPQRSTUVWXY23456789";

function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);
  return slug || "client";
}

export function generatePortalUsername(businessName: string, isTaken: (candidate: string) => boolean): string {
  const base = slugify(businessName);
  if (!isTaken(base)) return base;
  let candidate = base;
  do {
    const suffix = String(randomInt(100, 1000));
    candidate = `${base}${suffix}`;
  } while (isTaken(candidate));
  return candidate;
}

export function generatePortalPassword(length = 10): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += PASSWORD_ALPHABET[randomInt(0, PASSWORD_ALPHABET.length)];
  }
  return out;
}
