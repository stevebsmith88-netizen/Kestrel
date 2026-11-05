// Compares a clinic profile before and after a save, so Steve can be told what changed on a clinic that has live jobs.
// The clinic name, website, About text and place all show on the live job pages without a review, so a change is worth a look.
import type { Change } from "./job-diff.ts";

const FIELDS: [string, string][] = [
  ["clinic_name", "Clinic name"],
  ["practice_type", "Practice type"],
  ["website", "Website"],
  ["province", "Province"],
  ["city", "City"],
  ["about", "About"],
];

const clean = (value: unknown) => (value === null || value === undefined ? "" : String(value).trim());
const show = (value: string) => (value === "" ? "(empty)" : value);

export function clinicChanges(before: Record<string, unknown>, after: Record<string, unknown>): Change[] {
  return FIELDS.filter(([key]) => clean(before[key]) !== clean(after[key])).map(([key, label]) => ({ label, before: show(clean(before[key])), after: show(clean(after[key])) }));
}

// The alert paragraphs for the admin email. Long About text is shortened so the email stays readable.
const short = (text: string) => (text.length > 300 ? `${text.slice(0, 300)}...` : text);
export function clinicChangeParagraphs(clinicName: string, changes: Change[]) {
  return [`${clinicName} changed its profile while it has live jobs. The change is already showing on its job pages.`, ...changes.map((c) => `${c.label}: was "${short(c.before)}", now "${short(c.after)}"`)];
}
