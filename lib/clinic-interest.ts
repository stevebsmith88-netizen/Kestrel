// "Tell us you would like to work for them" (Steve, 19th November 2026, migration 0055). A candidate who searches for a clinic or company that
// is not on Kestrel yet can say they would like to work for it. Only the clinic's name, town, province and website are kept, with who asked.
// Nothing is sent to the clinic. Kept free of app imports so it can be tested on its own (lib/clinic-interest.test.ts).
import { PROVINCES } from "./waitlist.ts";

export const INTEREST_LIMIT = 20;

export const INTEREST_THANKS = "Thank you. We have noted that you would like to work for them. If they join Kestrel we will let you know. We do not share your name or details with the clinic.";

export type InterestInput = { clinicName: string; town: string; province: string; website: string };

// The same spelling and spacing always give the same key, so asking twice about "Brightview  Optical" and "brightview optical" counts once.
export function nameKey(clinicName: string, town: string) {
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return `${norm(clinicName)}|${norm(town)}`.slice(0, 220);
}

export function cleanInterest(raw: Partial<Record<keyof InterestInput, unknown>>): { value: { clinicName: string; town: string | null; province: string | null; website: string | null; key: string }; errors?: undefined } | { value?: undefined; errors: Record<string, string> } {
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
  const clinicName = text(raw.clinicName, 120);
  const town = text(raw.town, 80);
  const province = text(raw.province, 40);
  const websiteTyped = text(raw.website, 200);
  const errors: Record<string, string> = {};
  if (clinicName.length < 2) errors.clinicName = "Type the name of the clinic or company.";
  if (province && !(PROVINCES as readonly string[]).includes(province)) errors.province = "Choose a province from the list.";
  let website: string | null = null;
  if (websiteTyped) {
    try {
      const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(websiteTyped) ? websiteTyped : `https://${websiteTyped}`);
      if ((url.protocol !== "https:" && url.protocol !== "http:") || !url.hostname.includes(".") || url.username || url.password) throw new Error("bad");
      website = `${url.protocol}//${url.hostname.toLowerCase()}`;
    } catch {
      errors.website = "That does not look like a website address. Leave it empty if you are not sure.";
    }
  }
  if (Object.keys(errors).length) return { errors };
  return { value: { clinicName, town: town || null, province: province || null, website, key: nameKey(clinicName, town) } };
}

export const INTEREST_JOINED_TITLE = (clinic: string) => `${clinic} has joined Kestrel`;
export const INTEREST_JOINED_BODY = "You told us you would like to work for them. Open their page to see their jobs, or follow them to hear about new ones.";

const normalise = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export type PublicPlace = { id: string; clinic_name: string; city: string | null; province: string | null };

// The clinic a saved request is about, once it has a public page. The name must match (spelling, capitals and punctuation aside). If the
// candidate gave a town it must match too, and if they gave a province it must match. If more than 1 clinic fits (a chain with no town given),
// nothing matches, so nobody is told about the wrong place.
export function matchPublicClinic<T extends PublicPlace>(interest: { name_key: string; province?: string | null }, clinics: T[]): T | null {
  const at = interest.name_key.lastIndexOf("|");
  const name = at < 0 ? interest.name_key : interest.name_key.slice(0, at);
  const town = at < 0 ? "" : interest.name_key.slice(at + 1);
  if (!name) return null;
  const fits = clinics.filter(
    (c) =>
      normalise(c.clinic_name) === name &&
      (!town || normalise(c.city ?? "") === town) &&
      (!interest.province || (c.province ?? "") === interest.province),
  );
  return fits.length === 1 ? fits[0] : null;
}
