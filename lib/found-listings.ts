// The rules for found listings: jobs Kestrel lists from a clinic's own careers page before the clinic has joined.
// Kept free of imports from the app so they can be tested on their own (lib/found-listings.test.ts).
//
// The rules (CLAUDE.md, Product rules, and the 30th October 2026 audit, R19):
//  * Only from the clinic's own website, with a link back to the clinic's application page.
//  * Live for 21 days at most, and labelled "Found on the clinic's website, not yet claimed".
//  * Facts in our own words. The summary may not repeat any run of 8 words from the page.
//  * Only roles whose page states the pay, because every live job on Kestrel shows a pay range.
//  * "Existing vacancy" and "uses AI to screen" are taken from the page only when it says so. Otherwise they are left
//    empty and shown as "Not stated by the clinic". Kestrel never guesses a fact for a clinic.
//  * Never for a clinic that already has its own Kestrel account, and never the clinic's logo.

import { EMPLOYMENT_TYPES, PRACTICE_TYPES, PROVINCES, QUEBEC, QUEBEC_JOB_MESSAGE, ROLE_CATEGORIES, mentionsCanadianExperience, parseMoney, payRangeAllowed } from "./jobs.ts";
import { copiedRun, hostOfUrl, isHiringSystem, refuseAddress } from "./page-reader.ts";

export const FOUND_LIFETIME_DAYS = 21;
// A reading is good for a week. After that the page may have changed, so it is read again before anything is published.
export const READING_GOOD_FOR_DAYS = 7;
export const READS_PER_DAY = 60;
export const MAX_JOBS_PER_PAGE = 10;

export const ANSWERS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not_stated", label: "Not stated" },
] as const;

const PAGE_KINDS = ["employer_careers_page", "single_job_page", "job_board_or_recruiter", "college_or_association", "not_about_jobs"] as const;
export type PageKind = (typeof PAGE_KINDS)[number];

// What Claude is asked to return, as a JSON schema (structured outputs). Every field is required, so "not stated" is said
// out loud instead of being left out.
const text = { type: "string" } as const;
const choice = (values: readonly string[]) => ({ type: "string", enum: [...values] }) as const;
export const READER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["page_kind", "clinic", "jobs", "notes"],
  properties: {
    page_kind: choice(PAGE_KINDS),
    clinic: {
      type: "object",
      additionalProperties: false,
      required: ["name", "practice_type", "website"],
      properties: { name: text, practice_type: choice(["independent", "corporate", "supplier", "unknown"]), website: text },
    },
    jobs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "role_category", "employment_type", "city", "province", "work_arrangement", "territory", "pay_as_written", "pay_period", "pay_min", "pay_max", "existing_vacancy", "ai_screening", "apply_url", "summary"],
        properties: {
          title: text,
          role_category: choice([...ROLE_CATEGORIES, "none"]),
          employment_type: choice([...EMPLOYMENT_TYPES, "not_stated"]),
          city: text,
          province: choice([...PROVINCES, "not_stated"]),
          work_arrangement: choice(["on_site", "field"]),
          territory: text,
          pay_as_written: text,
          pay_period: choice(["year", "hour", "not_stated"]),
          pay_min: { type: "number" },
          pay_max: { type: "number" },
          existing_vacancy: choice(["yes", "no", "not_stated"]),
          ai_screening: choice(["yes", "no", "not_stated"]),
          apply_url: text,
          summary: text,
        },
      },
    },
    notes: text,
  },
} as const;

// One found job, as the admin's form holds it. Every value is a string, ready for a form field.
export type FoundJob = {
  title: string;
  roleCategory: string;
  employmentType: string;
  province: string;
  city: string;
  workArrangement: string; // on_site | field
  territory: string;
  payPeriod: string; // year | hour | ""
  payMin: string;
  payMax: string;
  payAsWritten: string;
  existingVacancy: string; // yes | no | not_stated
  usesAi: string; // yes | no | not_stated
  applyUrl: string;
  summary: string;
};

export type FoundClinic = { name: string; practiceType: string; website: string };
export type Reading = { pageKind: PageKind; clinic: FoundClinic; jobs: FoundJob[]; notes: string };

// Our house style for anything the public reads: straight quotes, no em dashes, no hyphens as punctuation.
export function tidy(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[\u2018\u2019\u201b\u2032]/g, "'")
    .replace(/[\u201c\u201d\u201f\u2033]/g, "\"")
    .replace(/(\w)\u2013(\w)/g, "$1 to $2")
    .replace(/\s*[\u2014\u2013]\s*/g, ", ")
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/,\s*,/g, ",")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const str = (v: unknown, max: number) => (typeof v === "string" ? tidy(v).slice(0, max) : "");
const pick = (v: unknown, allowed: readonly string[], fallback = "") => (typeof v === "string" && allowed.includes(v) ? v : fallback);
const money = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 && v < 10_000_000 ? Math.round(v * 100) / 100 : 0);
const origin = (value: string) => {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? u.origin : "";
  } catch {
    return "";
  }
};

// The link to apply: a real web address on the page, never a job board. Otherwise the careers page itself, which is
// always the clinic's own.
function applyLink(value: unknown, pageUrl: string) {
  if (typeof value === "string" && value.trim()) {
    try {
      const u = new URL(value.trim(), pageUrl);
      if ((u.protocol === "https:" || u.protocol === "http:") && !refuseAddress(u.toString())) return u.toString().slice(0, 500);
    } catch {
      // fall through to the careers page
    }
  }
  return pageUrl.slice(0, 500);
}

// Turns what Claude returned into values the form can trust: only known roles, types and provinces, sensible numbers,
// and links that point somewhere real.
export function normaliseReading(raw: unknown, pageUrl: string): Reading {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const c = (r.clinic && typeof r.clinic === "object" ? r.clinic : {}) as Record<string, unknown>;
  const pageKind = pick(r.page_kind, PAGE_KINDS, "not_about_jobs") as PageKind;
  const pageHost = hostOfUrl(pageUrl);
  const statedSite = origin(str(c.website, 300));
  const website = !isHiringSystem(pageHost) ? origin(pageUrl) : statedSite && !refuseAddress(statedSite) && !isHiringSystem(hostOfUrl(statedSite)) ? statedSite : "";
  const clinic: FoundClinic = {
    name: str(c.name, 160),
    practiceType: pick(c.practice_type, PRACTICE_TYPES.map((p) => p.value), ""),
    website,
  };
  const list = Array.isArray(r.jobs) && (pageKind === "employer_careers_page" || pageKind === "single_job_page") ? r.jobs : [];
  const jobs = list.slice(0, MAX_JOBS_PER_PAGE).map((item): FoundJob => {
    const j = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const period = pick(j.pay_period, ["year", "hour"]);
    let min = period ? money(j.pay_min) : 0;
    let max = period ? money(j.pay_max) : 0;
    if (min && !max) max = min;
    if (max && !min) min = max;
    if (max < min) [min, max] = [max, min];
    const field = pick(j.work_arrangement, ["on_site", "field"], "on_site");
    return {
      title: str(j.title, 120),
      roleCategory: pick(j.role_category, ROLE_CATEGORIES),
      employmentType: pick(j.employment_type, EMPLOYMENT_TYPES),
      province: pick(j.province, PROVINCES),
      city: str(j.city, 80),
      workArrangement: field,
      territory: field === "field" ? str(j.territory, 200) : "",
      payPeriod: min ? period : "",
      payMin: min ? String(min) : "",
      payMax: max ? String(max) : "",
      payAsWritten: str(j.pay_as_written, 200),
      existingVacancy: pick(j.existing_vacancy, ["yes", "no"], "not_stated"),
      usesAi: pick(j.ai_screening, ["yes", "no"], "not_stated"),
      applyUrl: applyLink(j.apply_url, pageUrl),
      summary: str(j.summary, 3000),
    };
  });
  return { pageKind, clinic, jobs: jobs.filter((j) => j.title), notes: str(r.notes, 600) };
}

// What the admin sends back when saving one found job.
export type FoundInput = FoundJob & { clinicName: string; practiceType: string; website: string; checked: boolean };

const field = (raw: Record<string, unknown>, key: string, max: number) => (typeof raw[key] === "string" ? (raw[key] as string).replace(/\r\n/g, "\n").trim().slice(0, max) : "");

export function cleanFoundInput(raw: Record<string, unknown>): FoundInput {
  return {
    clinicName: field(raw, "clinicName", 160),
    practiceType: field(raw, "practiceType", 20),
    website: field(raw, "website", 300),
    title: field(raw, "title", 120),
    roleCategory: field(raw, "roleCategory", 80),
    employmentType: field(raw, "employmentType", 30),
    province: field(raw, "province", 40),
    city: field(raw, "city", 80),
    workArrangement: field(raw, "workArrangement", 10) === "field" ? "field" : "on_site",
    territory: field(raw, "territory", 200),
    payPeriod: field(raw, "payPeriod", 10),
    payMin: field(raw, "payMin", 20),
    payMax: field(raw, "payMax", 20),
    payAsWritten: field(raw, "payAsWritten", 200),
    existingVacancy: pick(field(raw, "existingVacancy", 12), ["yes", "no", "not_stated"], ""),
    usesAi: pick(field(raw, "usesAi", 12), ["yes", "no", "not_stated"], ""),
    applyUrl: field(raw, "applyUrl", 500),
    summary: tidy(field(raw, "summary", 3000)),
    checked: raw.checked === "yes" || raw.checked === true,
  };
}

const LINK_OR_CONTACT = /(^|\s)(https?:\/\/|www\.)\S+|[\w.+-]+@[\w-]+\.[\w.-]+|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/i;
const NO_CANADIAN_EXPERIENCE = "Take out any mention of Canadian experience. Kestrel does not allow it in job posts.";

// Everything a found job needs before it can be saved. `pagePrint` is the copy check for the page it came from.
export function validateFoundInput(f: FoundInput, pagePrint?: Iterable<number>) {
  const errors: Record<string, string> = {};
  if (!f.clinicName) errors.clinicName = "Enter the clinic's name.";
  if (!PRACTICE_TYPES.some((p) => p.value === f.practiceType)) errors.practiceType = "Choose independent, corporate or supplier.";
  const site = origin(f.website);
  if (!site) errors.website = "Enter the clinic's own website, starting with https://. It is used to check claims.";
  else if (refuseAddress(site) || isHiringSystem(hostOfUrl(site))) errors.website = "Enter the clinic's own website, not a job board or hiring system.";

  if (!f.title) errors.title = "Give the job a title.";
  if (!(ROLE_CATEGORIES as readonly string[]).includes(f.roleCategory)) errors.roleCategory = "Choose a role. If none fits, this job is not one Kestrel lists.";
  if (!(EMPLOYMENT_TYPES as readonly string[]).includes(f.employmentType)) errors.employmentType = "Choose an employment type. If the page does not say, check before listing.";
  if (!(PROVINCES as readonly string[]).includes(f.province)) errors.province = "Choose a province or territory.";
  else if (f.province === QUEBEC) errors.province = QUEBEC_JOB_MESSAGE;
  if (!f.city) errors.city = "Enter the city.";
  if (f.workArrangement === "field" && f.territory.length < 3) errors.territory = "Enter the area the person covers, as the page gives it.";

  const min = parseMoney(f.payMin);
  const max = parseMoney(f.payMax);
  if (f.payPeriod !== "year" && f.payPeriod !== "hour") errors.payPeriod = "Choose a year or an hour. A found job is only listed if the clinic's page states the pay.";
  if (min === null) errors.payMin = "Enter the lowest pay the page gives. A found job is only listed if the clinic's page states the pay.";
  if (max === null) errors.payMax = "Enter the highest pay the page gives. For a single figure, enter it in both boxes.";
  if (min !== null && max !== null && !errors.payPeriod) {
    if (max < min) errors.payMax = "The highest pay can't be lower than the lowest pay.";
    else if (!payRangeAllowed(min, max, f.payPeriod)) errors.payMax = "That range is wider than Kestrel allows, so this job can't be listed as found.";
  }

  if (!f.existingVacancy) errors.existingVacancy = "Choose Yes or No only if the page says so. Otherwise choose Not stated.";
  if (!f.usesAi) errors.usesAi = "Choose Yes or No only if the page says so. Otherwise choose Not stated.";

  try {
    const u = new URL(f.applyUrl);
    if (u.protocol !== "https:") errors.applyUrl = "The application link must start with https://.";
    else if (refuseAddress(u.toString())) errors.applyUrl = "The application link must be on the clinic's own site, not a job board.";
  } catch {
    errors.applyUrl = "Enter the full link to the clinic's application page, starting with https://.";
  }

  if (f.summary.length < 80) errors.summary = "Write a few lines about the job, at least 80 characters.";
  else if (LINK_OR_CONTACT.test(f.summary)) errors.summary = "Take out web addresses, email addresses and phone numbers. The Apply button links to the clinic's page.";
  if (mentionsCanadianExperience(`${f.title} ${f.summary}`)) errors.summary = NO_CANADIAN_EXPERIENCE;
  if (f.territory && mentionsCanadianExperience(f.territory)) errors.territory = NO_CANADIAN_EXPERIENCE;
  if (!errors.summary && pagePrint) {
    const copied = copiedRun(f.summary, pagePrint);
    if (copied) errors.summary = `This repeats the clinic's own wording ("${copied}"). Put it in our own words. Facts are fine, wording is not.`;
  }
  if (!f.checked) errors.checked = "Please confirm you have checked these facts against the clinic's page.";
  return errors;
}

const answer = (v: string) => (v === "yes" ? true : v === "no" ? false : null);

// The job as it is saved. It always applies on the clinic's own page, and is always marked as found.
export function foundJobRow(f: FoundInput) {
  return {
    title: f.title,
    role_category: f.roleCategory,
    employment_type: f.employmentType,
    province: f.province,
    city: f.city,
    work_arrangement: f.workArrangement,
    territory: f.workArrangement === "field" ? f.territory : null,
    pay_period: f.payPeriod,
    pay_min: parseMoney(f.payMin),
    pay_max: parseMoney(f.payMax),
    pay_extras: null,
    is_existing_vacancy: answer(f.existingVacancy),
    uses_ai_screening: answer(f.usesAi),
    description: f.summary,
    apply_method: "external",
    apply_url: f.applyUrl,
    is_seeded: true,
  };
}

// The clinic's website as it is saved: just the address of the home page.
export const websiteOf = origin;

export const foundExpiry = (from: Date) => new Date(from.getTime() + FOUND_LIFETIME_DAYS * 24 * 60 * 60 * 1000);

export const readingFresh = (readAt: string | Date, now = new Date()) => now.getTime() - new Date(readAt).getTime() <= READING_GOOD_FOR_DAYS * 24 * 60 * 60 * 1000;
