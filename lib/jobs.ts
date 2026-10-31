// The rules for clinics and jobs, in one place: what a clinic can enter, what makes a
// post valid, and how a job is shown. Kept free of imports from the app so the rules
// can be tested on their own (see lib/jobs.test.ts).

import { PROVINCES, ROLES } from "./waitlist.ts";

export { PROVINCES };
// Roles that work from clinics. The waitlist uses this list too, so it is kept as it is.
export const CLINIC_ROLES = ROLES;
// Roles that usually travel to clinics, for suppliers, manufacturers and labs. To add another role, add it
// here and in the role checks in supabase/migrations/0013_field_roles.sql.
export const FIELD_ROLES = [
  "Sales or territory representative",
  "Trainer or clinical educator",
  "Field service or equipment technician",
  "Account or practice development manager",
] as const;
export const ROLE_CATEGORIES = [...CLINIC_ROLES, ...FIELD_ROLES] as const;
export const EMPLOYMENT_TYPES = ["Full time", "Part time", "Locum", "Contract"] as const;
export const PRACTICE_TYPES = [
  { value: "independent", label: "Independent" },
  { value: "corporate", label: "Corporate" },
  { value: "supplier", label: "Supplier or manufacturer" },
] as const;
export const practiceLabel = (type: string | null | undefined) => PRACTICE_TYPES.find((p) => p.value === type)?.label ?? "Independent";
export const WORK_ARRANGEMENTS = [
  { value: "on_site", label: "On site" },
  { value: "field", label: "Field based, travelling to clinics" },
] as const;
export const PAY_PERIODS = [
  { value: "year", label: "A year" },
  { value: "hour", label: "An hour" },
] as const;

export const JOB_LIFETIME_DAYS = 30;
const HOURS_IN_A_YEAR = 2080;
const MAX_RANGE = 50000;
const NO_LIMIT_ABOVE = 200000;

export type JobStatus = "draft" | "in_review" | "live" | "rejected" | "closed" | "expired";

export const STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  live: "Live",
  rejected: "Needs changes",
  closed: "Closed",
  expired: "Expired",
};

export type JobInput = {
  title: string;
  roleCategory: string;
  employmentType: string;
  province: string;
  city: string;
  payPeriod: string;
  payMin: string;
  payMax: string;
  existingVacancy: string; // "yes" | "no" | ""
  usesAi: string; // "yes" | "no" | ""
  description: string;
  applyMethod: string; // "kestrel" | "external"
  applyUrl: string;
  workArrangement: string; // "on_site" | "field"
  territory: string;
  payExtras: string;
};

export type JobFormState = { error?: string; message?: string; errors?: Record<string, string>; ad?: string };

export type ClinicInput = {
  clinicName: string;
  practiceType: string;
  website: string;
  province: string;
  city: string;
  about: string;
  notifyEmail: string;
  directHire: boolean;
};

export const ALERT_FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Wording that is not allowed in a post: any requirement of Canadian experience. This covers Ontario's rules from 1st January 2026.
// It looks for three shapes, and is a safety net, because the admin reads every post as well:
//  1. a place word near "experience": "Canadian experience", "Canadian clinical experience", "Canadian-experience preferred",
//     "Cdn experience", "North American experience", "local work history". Only job words may sit between the two,
//     so "We are a Canadian clinic offering experience with lenses" is allowed.
//  2. experience then "in" a place: "experience in Canada", "experience gained in Canada", "experience in a Canadian clinic".
//  3. "worked in Canada", "practising in Canada". Not when it is about a licence ("licensed to practise in Canada").
const PLACE = "(?:canad\\w*|cdn|north\\s+americ\\w*|local)";
const EXPERIENCE = "(?:experienc\\w*|work\\s+history|employment\\s+history)";
const JOB_WORDS = new Set("clinical clinic optometry optometric optical optician opticians dispensing retail eye care eyecare vision work working job professional industry relevant related prior previous practice practising practicing field employment health healthcare".split(" "));
const NEAR_PLACE = new RegExp(`\\b${PLACE}\\b((?:[\\s-]+[\\w']+){0,3}?)[\\s-]+${EXPERIENCE}\\b`, "gi");
const EXPERIENCE_IN = new RegExp(`\\bexperienc\\w*(?:\\s+[\\w']+){0,3}?\\s+(?:in|within|across|throughout|from)\\s+(?:a\\s+|the\\s+)?(?:canad\\w*|north\\s+americ\\w*)\\b`, "i");
const WORKED_IN = /\b(?:work(?:ed|ing)?|practi[sc](?:e|ed|ing)|employed)\s+(?:[\w']+\s+){0,2}?(?:in|within)\s+(?:a\s+|the\s+)?canad\w*\b/gi;
const ABOUT_A_LICENCE = /licen[cs]|regist|eligib|entitled|authori[sz]ed|permitted/i;

// Finds the first match that passes `accept`. After a rejected match the search resumes 1 character later, so a rejected
// longer match can never hide a real one inside it ("Canada hire Canadian experience").
function firstAccepted(pattern: RegExp, text: string, accept: (match: RegExpExecArray) => boolean) {
  const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
  for (let match = re.exec(text); match; match = re.exec(text)) {
    if (accept(match)) return true;
    re.lastIndex = match.index + 1;
  }
  return false;
}

export function mentionsCanadianExperience(text: string) {
  const onlyJobWords = (m: RegExpExecArray) => m[1].split(/[\s-]+/).filter(Boolean).every((w) => JOB_WORDS.has(w.toLowerCase()));
  const notAboutALicence = (m: RegExpExecArray) => !ABOUT_A_LICENCE.test(text.slice(Math.max(0, m.index - 30), m.index));
  return firstAccepted(NEAR_PLACE, text, onlyJobWords) || EXPERIENCE_IN.test(text) || firstAccepted(WORKED_IN, text, notAboutALicence);
}

// Parses "62,000", "$62000" or "24.50". Returns null for anything else.
export function parseMoney(value: string): number | null {
  const cleaned = value.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return n > 0 ? n : null;
}

// True when a pay range is allowed: up to $50,000 wide a year (hourly pay is
// converted to a year), unless the top of the range is over $200,000.
export function payRangeAllowed(min: number, max: number, period: string) {
  const factor = period === "hour" ? HOURS_IN_A_YEAR : 1;
  return factor * (max - min) <= MAX_RANGE || factor * max > NO_LIMIT_ABOVE;
}

export function cleanJob(raw: Partial<Record<keyof JobInput, unknown>>): JobInput {
  return {
    title: clean(raw.title, 120),
    roleCategory: clean(raw.roleCategory, 80),
    employmentType: clean(raw.employmentType, 30),
    province: clean(raw.province, 40),
    city: clean(raw.city, 80),
    payPeriod: clean(raw.payPeriod, 10),
    payMin: clean(raw.payMin, 20),
    payMax: clean(raw.payMax, 20),
    existingVacancy: clean(raw.existingVacancy, 3),
    usesAi: clean(raw.usesAi, 3),
    description: typeof raw.description === "string" ? raw.description.replace(/\r\n/g, "\n").trim().slice(0, 8000) : "",
    applyMethod: clean(raw.applyMethod, 10) === "external" ? "external" : "kestrel",
    applyUrl: clean(raw.applyUrl, 500),
    workArrangement: clean(raw.workArrangement, 10) === "field" ? "field" : "on_site",
    territory: clean(raw.territory, 200),
    payExtras: clean(raw.payExtras, 300),
  };
}

// A draft only needs a title. Submitting for review needs everything.
export function validateJob(job: JobInput, submit: boolean) {
  const errors: Record<string, string> = {};
  if (!job.title) errors.title = "Give the job a title.";
  if (job.description && mentionsCanadianExperience(`${job.title} ${job.description}`)) {
    errors.description = "Please take out any mention of Canadian experience. We do not allow it in job posts.";
  }
  if (job.territory && mentionsCanadianExperience(job.territory)) errors.territory = "Please take out any mention of Canadian experience. We do not allow it in job posts.";
  if (job.payExtras && mentionsCanadianExperience(job.payExtras)) errors.payExtras = "Please take out any mention of Canadian experience. We do not allow it in job posts.";
  if (!submit) return errors;

  if (!(ROLE_CATEGORIES as readonly string[]).includes(job.roleCategory)) errors.roleCategory = "Choose a role.";
  if (!(EMPLOYMENT_TYPES as readonly string[]).includes(job.employmentType)) errors.employmentType = "Choose an employment type.";
  if (!(PROVINCES as readonly string[]).includes(job.province)) errors.province = "Choose a province or territory.";
  if (!job.city) errors.city = job.workArrangement === "field" ? "Enter the city you are based in." : "Enter the city.";
  if (job.workArrangement === "field" && job.territory.length < 3) errors.territory = "Tell us the area the person covers, for example Southern Ontario.";

  if (!PAY_PERIODS.some((p) => p.value === job.payPeriod)) errors.payPeriod = "Choose whether the pay is a year or an hour.";
  const min = parseMoney(job.payMin);
  const max = parseMoney(job.payMax);
  if (min === null) errors.payMin = "Enter the lowest pay, for example 62,000.";
  if (max === null) errors.payMax = "Enter the highest pay, for example 74,000.";
  if (min !== null && max !== null && !errors.payPeriod) {
    if (max < min) errors.payMax = "The highest pay can't be lower than the lowest pay.";
    else if (!payRangeAllowed(min, max, job.payPeriod)) {
      errors.payMax =
        job.payPeriod === "hour"
          ? "The range is too wide. Hourly ranges can be up to $24 an hour wide, unless the top is over $96 an hour."
          : "The range is too wide. Pay ranges can be up to $50,000 wide, unless the top is over $200,000.";
    }
  }

  if (job.existingVacancy !== "yes" && job.existingVacancy !== "no") errors.existingVacancy = "Tell us whether this is an existing vacancy.";
  if (job.usesAi !== "yes" && job.usesAi !== "no") errors.usesAi = "Tell us whether you use AI to screen candidates.";
  if (job.description.length < 50) errors.description = errors.description ?? "Describe the job in a few lines, at least 50 characters.";

  if (job.applyMethod === "external") {
    try {
      const url = new URL(job.applyUrl);
      if (url.protocol !== "https:") throw new Error("not https");
    } catch {
      errors.applyUrl = "Enter the full web address of your application page, starting with https://.";
    }
  }
  return errors;
}

export function cleanClinic(raw: Partial<Record<keyof ClinicInput, unknown>>): ClinicInput {
  return {
    clinicName: clean(raw.clinicName, 160),
    practiceType: clean(raw.practiceType, 20),
    website: clean(raw.website, 300),
    province: clean(raw.province, 40),
    city: clean(raw.city, 80),
    about: typeof raw.about === "string" ? raw.about.replace(/\r\n/g, "\n").trim().slice(0, 3000) : "",
    notifyEmail: clean(raw.notifyEmail, 254).toLowerCase(),
    directHire: raw.directHire === true,
  };
}

export function validateClinic(c: ClinicInput) {
  const errors: Record<string, string> = {};
  if (!c.clinicName) errors.clinicName = "Enter your clinic's name.";
  if (!PRACTICE_TYPES.some((p) => p.value === c.practiceType)) errors.practiceType = "Choose independent, corporate or supplier.";
  if (!(PROVINCES as readonly string[]).includes(c.province)) errors.province = "Choose a province or territory.";
  if (!c.city) errors.city = "Enter the city.";
  if (c.about && mentionsCanadianExperience(c.about)) errors.about = "Please take out any mention of Canadian experience. We do not allow it on Kestrel.";
  if (c.website) {
    try {
      const url = new URL(c.website);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("bad");
    } catch {
      errors.website = "Enter the full web address, starting with https://.";
    }
  }
  if (!EMAIL.test(c.notifyEmail)) errors.notifyEmail = "Enter an email address like hiring@yourclinic.ca.";
  if (!c.directHire) errors.directHire = "Please confirm that you are hiring directly for your own practice.";
  return errors;
}

// Things the admin should look at before approving a post.
export function reviewFlags(job: { title?: string | null; description?: string | null; territory?: string | null; pay_extras?: string | null; pay_period?: string | null; pay_min?: number | string | null; pay_max?: number | string | null; apply_url?: string | null }) {
  const flags: string[] = [];
  const text = `${job.title ?? ""} ${job.description ?? ""} ${job.territory ?? ""} ${job.pay_extras ?? ""}`;
  if (mentionsCanadianExperience(text)) flags.push("Mentions Canadian experience");
  const min = Number(job.pay_min);
  const max = Number(job.pay_max);
  if (min > 0 && max > 0 && job.pay_period && !payRangeAllowed(min, max, job.pay_period)) flags.push("Pay range is too wide");
  // A typo such as $62 instead of $62,000, or 6 zeros too many, is far more likely than a real offer this low or high.
  if (min > 0 && max > 0 && job.pay_period === "year" && (min < 25_000 || max > 500_000)) flags.push("Yearly pay looks unusually low or high. Check for a typing slip");
  if (min > 0 && max > 0 && job.pay_period === "hour" && (min < 15 || max > 150)) flags.push("Hourly pay looks unusually low or high. Check for a typing slip");
  if (/\b(young|youthful|recent graduate only|digital native)\b/i.test(text)) flags.push("Wording that may point to age");
  for (const [pattern, message] of RIGHTS_WORDING) if (pattern.test(text)) flags.push(message);
  if (/(^|\s)(https?:\/\/|www\.)\S+/i.test(job.description ?? "")) flags.push("Contains a web link");
  if (/[\w.+-]+@[\w-]+\.[\w.-]+/.test(job.description ?? "") || /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/.test(job.description ?? "")) {
    flags.push("Contains an email address or phone number");
  }
  if (RECRUITER_WORDING.test(text)) flags.push("Wording that suggests a recruiter or agency");
  return flags;
}

// Wording that can break human rights rules. These only point the admin to a closer look; a person decides.
const RIGHTS_WORDING: [RegExp, string][] = [
  [/\b(native (english|french) speakers?|native speakers? of|no accent|accent[- ]free|mother tongue)\b/i, "Language or accent wording that may exclude people"],
  [/\b(male|female|men|women|man|woman)\s+(only|preferred|candidates? only)\b|\b(only|prefer)\s+(a\s+)?(male|female|men|women)\b/i, "Wording that may point to sex or gender"],
  [/\b(unmarried|childless|no (young |small )?children|not (be )?pregnant|family status)\b/i, "Wording that may point to family status"],
  [/\b(canadian citizens? only|citizens? only|must be a (canadian )?citizen|citizenship required)\b/i, "Citizenship requirement, usually not allowed unless the law requires it"],
  [/\b(christian|muslim|catholic|jewish|hindu|sikh|buddhist)\s+(only|preferred|candidates?|values)\b|\bshare our faith\b/i, "Wording about religion"],
  [/\b(good[- ]looking|attractive|pleasant appearance|well[- ]groomed appearance|height|weight)\s+(required|preferred|needed)\b|\battractive\b/i, "Wording about appearance"],
  [/\b(under|over|between)\s+\d{2}\s+(years|yrs)?\s*(old|of age)\b|\b\d{2}\s*(to|-)\s*\d{2}\s*years old\b|\benergetic young\b|\byoung and energetic\b/i, "Wording about age"],
];

const RECRUITER_WORDING = /\b(our client|on behalf of|recruitment agency|recruiting agency|staffing (agency|firm|company)|placement fee|headhunt\w*|confidential (employer|client|practice))\b/i;
export const FREE_EMAIL = /@(gmail|googlemail|yahoo|hotmail|outlook|live|msn|icloud|me|aol|proton|protonmail)\./i;

// Things the admin should know about the clinic behind a post.
export function employerFlags(employer: { website?: string | null; notifyEmail?: string | null; directHireConfirmedAt?: string | null }) {
  const flags: string[] = [];
  if (!employer.directHireConfirmedAt) flags.push("Has not confirmed they hire directly");
  if (!employer.website) flags.push("No clinic website given");
  if (employer.notifyEmail && FREE_EMAIL.test(employer.notifyEmail)) flags.push("Alerts go to a free email address, not a clinic one");
  return flags;
}

const money = (n: number) => {
  const whole = Number.isInteger(n);
  return `$${n.toLocaleString("en-CA", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}`;
};

export function formatPay(min: number | string, max: number | string, period: string) {
  const unit = period === "hour" ? "an hour" : "a year";
  return `${money(Number(min))} to ${money(Number(max))} ${unit}`;
}

export function expiryFrom(date: Date, days = JOB_LIFETIME_DAYS) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function daysLeft(expiresAt: string | Date, now = new Date()) {
  const ms = new Date(expiresAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

// Plain dates in the house style: 1st January 2027.
export function longDate(value: string | Date) {
  const d = new Date(value);
  const day = d.getUTCDate();
  const suffix = day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  const month = d.toLocaleString("en-CA", { month: "long", timeZone: "UTC" });
  return `${day}${suffix} ${month} ${d.getUTCFullYear()}`;
}

const REGION_CODES: Record<string, string> = {
  Alberta: "AB", "British Columbia": "BC", Manitoba: "MB", "New Brunswick": "NB", "Newfoundland and Labrador": "NL",
  "Northwest Territories": "NT", "Nova Scotia": "NS", Nunavut: "NU", Ontario: "ON", "Prince Edward Island": "PE",
  Quebec: "QC", Saskatchewan: "SK", Yukon: "YT",
};

const SCHEMA_EMPLOYMENT: Record<string, string> = { "Full time": "FULL_TIME", "Part time": "PART_TIME", Locum: "TEMPORARY", Contract: "CONTRACTOR" };

type PublicJob = {
  id: string; title: string; description: string; employment_type: string; province: string; city: string;
  pay_period: string; pay_min: number | string; pay_max: number | string; apply_method: string; apply_url: string | null;
  posted_at: string; expires_at: string;
};
type PublicClinic = { clinic_name: string; website: string | null };

// Google's structured data for a job. Everything here is also shown on the page,
// because Google requires the two to match exactly.
export function jobPostingJsonLd(job: PublicJob, clinic: PublicClinic, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description.replace(/\n/g, "<br>"),
    datePosted: new Date(job.posted_at).toISOString().slice(0, 10),
    validThrough: new Date(job.expires_at).toISOString(),
    employmentType: SCHEMA_EMPLOYMENT[job.employment_type] ?? "OTHER",
    hiringOrganization: { "@type": "Organization", name: clinic.clinic_name, ...(clinic.website ? { sameAs: clinic.website } : {}) },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: job.city, addressRegion: REGION_CODES[job.province] ?? job.province, addressCountry: "CA" },
    },
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "CAD",
      value: { "@type": "QuantitativeValue", minValue: Number(job.pay_min), maxValue: Number(job.pay_max), unitText: job.pay_period === "hour" ? "HOUR" : "YEAR" },
    },
    directApply: job.apply_method === "kestrel",
    url: `${siteUrl}/jobs/${job.id}`,
    identifier: { "@type": "PropertyValue", name: "Kestrel Eye Care Jobs", value: job.id },
  };
}
