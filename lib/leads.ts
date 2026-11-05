// The rules for clinic leads from the province search: what Claude's web search returned, checked and tidied before the admin
// sees it. Kept free of imports from the app so it can be tested on its own (lib/leads.test.ts).
//
// A lead is a clinic that appears to be hiring, with where it was seen. It is not a listing: nothing is published from a lead.
// To list a job, the admin reads the clinic's own careers page with the reader. Leads only point to clinics.
//  * Never from Indeed, LinkedIn, Jobs4ECPs, college registers, social networks or anything mentioning Eye Recommend.
//  * Other job boards can show that a clinic is hiring, but a lead always needs the clinic's own website.
//  * Dates, pay and contact emails are only what a page says. "Not stated" is never filled in with a guess.

import { PRACTICE_TYPES, PROVINCES, ROLE_CATEGORIES } from "./jobs.ts";
import { hostOfUrl, isHiringSystem, isNeverHost, isOtherJobBoard, mentionsEyeRecommend, siteKey } from "./page-reader.ts";

export const SEARCHES_PER_DAY = 10;
export const MAX_LEADS = 30;

export type LeadSource = "own_site" | "hiring_system" | "job_board";
export type Lead = {
  clinicName: string;
  city: string;
  province: string;
  website: string; // the clinic's own home page, https://host
  careersUrl: string; // the clinic's own careers page, or its hiring system page, if one was found
  jobTitle: string;
  roleCategory: string;
  employmentType: string;
  postedText: string; // exactly as the page states it, or empty
  payAsWritten: string;
  sourceUrl: string; // where the opening was seen
  source: LeadSource;
  practiceType: string;
  note: string;
};

const cap = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");
const originOf = (v: unknown) => {
  try {
    const u = new URL(String(v ?? "").trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.origin : "";
  } catch {
    return "";
  }
};
const fullUrl = (v: unknown) => {
  try {
    const u = new URL(String(v ?? "").trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return "";
    u.hash = "";
    return u.toString().slice(0, 500);
  } catch {
    return "";
  }
};

export function sourceOf(url: string): LeadSource {
  const host = hostOfUrl(url);
  return isOtherJobBoard(host) ? "job_board" : isHiringSystem(host) ? "hiring_system" : "own_site";
}

// Pulls the JSON object out of Claude's answer, which may have a sentence before or after it.
export function jsonFromAnswer(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function normaliseLeads(raw: unknown, province: string): { leads: Lead[]; dropped: number } {
  const list = raw && typeof raw === "object" && Array.isArray((raw as { leads?: unknown }).leads) ? ((raw as { leads: unknown[] }).leads) : [];
  const seen = new Set<string>();
  const leads: Lead[] = [];
  let dropped = 0;
  for (const item of list) {
    const j = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const website = originOf(j.website);
    const key = siteKey(hostOfUrl(website));
    const sourceUrl = fullUrl(j.source_url);
    const careersUrl = fullUrl(j.careers_url);
    const hosts = [website, sourceUrl, careersUrl].filter(Boolean).map(hostOfUrl);
    const text = [j.clinic_name, j.job_title, j.note, website, sourceUrl, careersUrl].join(" ");
    const bad =
      !cap(j.clinic_name, 160) ||
      !website ||
      !key ||
      isHiringSystem(hostOfUrl(website)) ||
      isOtherJobBoard(hostOfUrl(website)) ||
      hosts.some(isNeverHost) ||
      mentionsEyeRecommend(text) ||
      seen.has(key);
    if (bad) {
      dropped += 1;
      continue;
    }
    seen.add(key);
    const careers = careersUrl && !isOtherJobBoard(hostOfUrl(careersUrl)) ? careersUrl : "";
    leads.push({
      clinicName: cap(j.clinic_name, 160),
      city: cap(j.city, 80),
      province: (PROVINCES as readonly string[]).includes(String(j.province)) ? String(j.province) : province,
      website,
      careersUrl: careers,
      jobTitle: cap(j.job_title, 120),
      roleCategory: (ROLE_CATEGORIES as readonly string[]).includes(String(j.role_category)) ? String(j.role_category) : "",
      employmentType: cap(j.employment_type, 30),
      postedText: cap(j.posted_text, 60),
      payAsWritten: cap(j.pay_as_written, 120),
      sourceUrl,
      source: sourceUrl ? sourceOf(sourceUrl) : careers ? sourceOf(careers) : "own_site",
      practiceType: PRACTICE_TYPES.some((p) => p.value === j.practice_type) ? String(j.practice_type) : "",
      note: cap(j.note, 300),
    });
    if (leads.length >= MAX_LEADS) break;
  }
  return { leads, dropped };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// What a saved lead needs. The contact email is optional, but if it is there it must come with the page it was found on.
export function validateLead(l: { clinicName: string; website: string; province: string; contactEmail: string; emailSourceUrl: string }) {
  const errors: Record<string, string> = {};
  if (!l.clinicName) errors.clinicName = "The clinic needs a name.";
  if (!originOf(l.website)) errors.website = "The clinic needs its own website.";
  if (!(PROVINCES as readonly string[]).includes(l.province)) errors.province = "Choose a province.";
  if (l.contactEmail && !EMAIL.test(l.contactEmail)) errors.contactEmail = "That email address does not look right.";
  if (l.contactEmail && !fullUrl(l.emailSourceUrl)) errors.contactEmail = "An email address is only kept with the page it was published on.";
  return errors;
}

export const leadWebsiteKey = (website: string) => siteKey(hostOfUrl(website));
