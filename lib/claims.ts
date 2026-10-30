import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { FREE_EMAIL } from "./jobs.ts";

// The rules for claiming a listing, kept apart from the database so they can be tested.

export const CLAIM_ROLES = ["Owner", "Practice manager", "Hiring manager", "Other"] as const;

// Websites that belong to a service, not to the clinic, so an address there proves nothing.
const SHARED_SITES = new Set([
  "wixsite.com", "wix.com", "squarespace.com", "weebly.com", "godaddysites.com", "business.site", "sites.google.com",
  "google.com", "facebook.com", "instagram.com", "linkedin.com", "wordpress.com", "myshopify.com", "carrd.co", "square.site",
]);

export const hostOf = (url: string | null | undefined) => {
  try {
    return new URL(url ?? "").hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
};

// harbourside.ca, careers.harbourside.ca and www.harbourside.ca all count as harbourside.ca.
const registrable = (host: string) => host.split(".").slice(-2).join(".");

// Is this email address at the clinic's own website? Free email and shared website builders never count.
export function emailMatchesWebsite(email: string, website: string | null | undefined) {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  const host = hostOf(website);
  if (!domain || !host || FREE_EMAIL.test(`@${domain}.`)) return false;
  const site = registrable(host);
  if (SHARED_SITES.has(site) || SHARED_SITES.has(host)) return false;
  return registrable(domain) === site;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type ClaimInput = { workEmail: string; role: string; authorised: boolean; manual: boolean; note: string };

export function validateClaim(c: ClaimInput) {
  const errors: Record<string, string> = {};
  if (!EMAIL.test(c.workEmail)) errors.workEmail = "Enter your work email address.";
  if (!(CLAIM_ROLES as readonly string[]).includes(c.role)) errors.role = "Choose your role at the clinic.";
  if (!c.authorised) errors.authorised = "Please confirm that you are authorised to post for this clinic.";
  if (c.manual && c.note.trim().length < 20) errors.note = "Please tell us a little about how we can confirm that you work there.";
  return errors;
}

// The link in the verification email carries a random token. We keep only a hash of it.
export const newToken = () => randomBytes(24).toString("base64url");
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export function tokenMatches(hash: string | null | undefined, token: string) {
  if (!hash || !token) return false;
  const a = Buffer.from(hash);
  const b = Buffer.from(hashToken(token));
  return a.length === b.length && timingSafeEqual(a, b);
}
