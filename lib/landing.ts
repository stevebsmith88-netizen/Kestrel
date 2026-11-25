// The role and province landing pages (/eye-care-jobs/ontario/optician). Kept free of imports from the app so the rules can be tested
// on their own (lib/landing.test.ts). A page is offered to Google only when it has live jobs, so an empty page never competes
// with a real one, and a page with real jobs becomes indexable on its own.

import { PROVINCES, QUEBEC } from "./waitlist.ts";

export const LANDING_BASE = "/eye-care-jobs";

// Kestrel is in English for now and does not take jobs in Quebec (decided 6th November 2026), so there is no Quebec page.
export const LANDING_PROVINCES: readonly string[] = PROVINCES.filter((p) => p !== QUEBEC);

export const slugify = (text: string) => text.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const provinceSlug = (province: string) => slugify(province);
export const provinceFromSlug = (slug: string) => LANDING_PROVINCES.find((p) => provinceSlug(p) === slug) ?? null;

// `role` is the value saved on a job (lib/jobs.ts ROLE_CATEGORIES). `plural` is how it reads in a heading: "Optician jobs".
export const LANDING_ROLES = [
  { slug: "optometrist", role: "Optometrist", name: "Optometrist" },
  { slug: "optician", role: "Optician", name: "Optician" },
  { slug: "optometric-assistant", role: "Optometric assistant or technician", name: "Optometric assistant and technician" },
  { slug: "practice-manager", role: "Practice or clinic manager", name: "Practice and clinic manager" },
  { slug: "patient-care", role: "Patient care or reception", name: "Patient care and reception" },
  { slug: "vision-therapist", role: "Vision therapist", name: "Vision therapist" },
  { slug: "sales-representative", role: "Sales or territory representative", name: "Sales and territory representative" },
  { slug: "trainer", role: "Trainer or clinical educator", name: "Trainer and clinical educator" },
  { slug: "field-technician", role: "Field service or equipment technician", name: "Field service and equipment technician" },
  { slug: "account-manager", role: "Account or practice development manager", name: "Account and practice development manager" },
] as const;

export type LandingRole = (typeof LANDING_ROLES)[number];
export const roleFromSlug = (slug: string): LandingRole | null => LANDING_ROLES.find((r) => r.slug === slug) ?? null;
export const roleLanding = (role: string): LandingRole | null => LANDING_ROLES.find((r) => r.role === role) ?? null;

export const provinceHref = (province: string) => `${LANDING_BASE}/${provinceSlug(province)}`;
export const comboHref = (province: string, role: LandingRole) => `${LANDING_BASE}/${provinceSlug(province)}/${role.slug}`;

export const comboKey = (province: string, role: string) => `${province}|${role}`;

// Only a page with at least 1 live job is offered to Google. Others can still be visited and followed.
export const landingIndexable = (jobCount: number) => jobCount > 0;

export const comboTitle = (role: LandingRole, province: string) => `${role.name} jobs in ${province}`;
export const provinceTitle = (province: string) => `Eye care jobs in ${province}`;

export function landingDescription(subject: string, jobCount: number) {
  const base = "Every job shows its pay, and a person reads every post before it goes live.";
  // Only the first letter is lowercased, so it reads on after the colon and the province keeps its capitals (audit P1-52).
  const after = subject.charAt(0).toLowerCase() + subject.slice(1);
  return jobCount > 0 ? `${jobCount} live ${jobCount === 1 ? "job" : "jobs"}: ${after}. ${base}` : `${subject} on Kestrel Eye Care Jobs. ${base}`;
}
