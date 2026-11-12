// The rules for clinics and jobs, in one place: what a clinic can enter, what makes a
// post valid, and how a job is shown. Kept free of imports from the app so the rules
// can be tested on their own (see lib/jobs.test.ts).

import { PROVINCES, QUEBEC, QUEBEC_JOB_MESSAGE, ROLES } from "./waitlist.ts";
import { HOURS_IN_A_YEAR, markupPayLine, parseMoney, payFlags, payRangeAllowed, payText, salaryForMarkup, validatePay, type PayFields } from "./job-pay.ts";
import { tidyTitle } from "./job-title.ts";
import { cleanTags, EQUIPMENT_TAGS, SOFTWARE_TAGS, SPECIALTY_TAGS } from "./job-tags.ts";

export { HOURS_IN_A_YEAR, parseMoney, payRangeAllowed };

export { PROVINCES, QUEBEC, QUEBEC_JOB_MESSAGE };
// Whether a saved job is in Quebec, whatever the capitals or accent. The form only ever saves "Quebec", but approving and extending re-check
// with this in case a job reached the database another way (audit P1-28). The database holds the same rule (migration 0040).
export const isQuebecJob = (job: { province?: string | null }) => ["quebec", "qu\u00e9bec", "qc"].includes((job.province ?? "").trim().toLowerCase());
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
export const EMPLOYMENT_TYPES = ["Full time", "Part time", "Contract", "Locum"] as const;

// "Contract" is the value saved in the database. People see "Fixed term": a role with an end, such as maternity cover or seasonal work.
// Search addresses can carry one type or several. Only known types get through, once each.
export function cleanEmploymentTypes(value: string | string[] | undefined): (typeof EMPLOYMENT_TYPES)[number][] {
  const list = (Array.isArray(value) ? value : [value ?? ""]).map((x) => x.trim());
  return EMPLOYMENT_TYPES.filter((t) => list.includes(t));
}

export function employmentLabel(type: string | null | undefined): string {
  return type === "Contract" ? "Fixed term" : type ?? "";
}

// A short explanation shown beside "Fixed term" wherever people choose it or read it, opened with a tap or by hovering (Steve, 12th November 2026).
export const FIXED_TERM_EXPLAINER = "A job for a set period with an end date, such as maternity cover or a seasonal role. The person is an employee of the clinic for that time, not self employed.";
export function employmentExplainer(type: string | null | undefined): string | null {
  return type === "Contract" ? FIXED_TERM_EXPLAINER : null;
}
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
  // payPeriod is the unit of the dollar boxes (year, hour or day). Dollars, a percentage or both can be given: see lib/job-pay.ts.
  payIsMinimum: string; // "yes" when the dollar amounts are a guaranteed minimum
  payDays: string; // days a week, for a daily rate
  payPercentMin: string;
  payPercentMax: string;
  payPercentOf: string;
  tagsSoftware: string[];
  tagsEquipment: string[];
  tagsSpecialties: string[];
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
  employeeBand: string; // how many people work at the clinic. Private: shown to Admin only. Changes no rule.
};

// Stored values for the employee count band. The 25 band matters because Ontario's pay range rule starts at 25 employees, but nothing
// in Kestrel changes with the answer: every post still needs a pay range.
export const EMPLOYEE_BANDS = [
  { value: "1_9", label: "1 to 9" },
  { value: "10_24", label: "10 to 24" },
  { value: "25_99", label: "25 to 99" },
  { value: "100_plus", label: "100 or more" },
] as const;
export const employeeBandLabel = (value: string | null | undefined) => EMPLOYEE_BANDS.find((b) => b.value === value)?.label ?? "Not given";

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

export function cleanJob(raw: Partial<Record<keyof JobInput, unknown>>): JobInput {
  return {
    title: tidyTitle(clean(raw.title, 120)),
    roleCategory: clean(raw.roleCategory, 80),
    employmentType: clean(raw.employmentType, 30),
    province: clean(raw.province, 40),
    city: clean(raw.city, 80),
    payPeriod: clean(raw.payPeriod, 12),
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
    payPercentMin: clean(raw.payPercentMin, 20),
    payPercentMax: clean(raw.payPercentMax, 20),
    payPercentOf: clean(raw.payPercentOf, 12),
    payIsMinimum: clean(raw.payIsMinimum, 3) === "yes" ? "yes" : "",
    payDays: clean(raw.payDays, 2),
    tagsSoftware: cleanTags(raw.tagsSoftware, SOFTWARE_TAGS),
    tagsEquipment: cleanTags(raw.tagsEquipment, EQUIPMENT_TAGS),
    tagsSpecialties: cleanTags(raw.tagsSpecialties, SPECIALTY_TAGS),
  };
}

// A draft only needs a title. Submitting for review needs everything.
export function validateJob(job: JobInput, submit: boolean) {
  const errors: Record<string, string> = {};
  if (!job.title) errors.title = "Give the job a title.";
  if (job.description && mentionsCanadianExperience(`${job.title} ${job.description}`)) {
    errors.description = "Please take out any mention of Canadian experience, even to say you do not ask for it. We do not allow the phrase in job posts.";
  }
  if (job.territory && mentionsCanadianExperience(job.territory)) errors.territory = "Please take out any mention of Canadian experience, even to say you do not ask for it. We do not allow the phrase in job posts.";
  if (job.payExtras && mentionsCanadianExperience(job.payExtras)) errors.payExtras = "Please take out any mention of Canadian experience, even to say you do not ask for it. We do not allow the phrase in job posts.";
  if (job.province === QUEBEC) errors.province = QUEBEC_JOB_MESSAGE; // refused for drafts too, so a Quebec job never gets as far as review
  if (!submit) return errors;

  if (!(ROLE_CATEGORIES as readonly string[]).includes(job.roleCategory)) errors.roleCategory = "Choose a role.";
  if (!(EMPLOYMENT_TYPES as readonly string[]).includes(job.employmentType)) errors.employmentType = "Choose an employment type.";
  if (!(PROVINCES as readonly string[]).includes(job.province)) errors.province = "Choose a province or territory.";
  if (!job.city) errors.city = job.workArrangement === "field" ? "Enter the city you are based in." : "Enter the city.";
  if (job.workArrangement === "field" && job.territory.length < 3) errors.territory = "Tell us the area the person covers, for example Southern Ontario.";

  Object.assign(errors, validatePay(job));

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
    employeeBand: EMPLOYEE_BANDS.some((b) => b.value === raw.employeeBand) ? String(raw.employeeBand) : "",
  };
}

export function validateClinic(c: ClinicInput, opts: { requireBand?: boolean } = {}) {
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
  if (opts.requireBand && !c.employeeBand) errors.employeeBand = "Choose how many people work at your clinic.";
  if (!c.directHire) errors.directHire = "Please confirm that you are hiring directly for your own practice.";
  return errors;
}

// Things the admin should look at before approving a post.
export function reviewFlags(job: PayFields & { title?: string | null; description?: string | null; territory?: string | null; pay_extras?: string | null; apply_url?: string | null }) {
  const flags: string[] = [];
  const text = `${job.title ?? ""} ${job.description ?? ""} ${job.territory ?? ""} ${job.pay_extras ?? ""}`;
  if (mentionsCanadianExperience(text)) flags.push("Mentions Canadian experience");
  flags.push(...payFlags(job));
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

// Pay as a range with a unit. Anything that is not a proper range reads "Pay not stated", never $0 or $NaN. For a whole job (daily minimums
// and percentages too) use payText from lib/job-pay.ts.
export function formatPay(min: number | string, max: number | string, period: string) {
  return payText({ pay_period: period, pay_min: min, pay_max: max });
}

// The 2 questions every post answers. A found listing (from a clinic's own careers page) leaves them empty when the clinic's
// page does not say, because Kestrel never states a fact for a clinic.
export function answerLabel(value: boolean | null | undefined) {
  return value === true ? "Yes" : value === false ? "No" : "Not stated by the clinic";
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

// Locum work is temporary and usually done as a contractor, so both are given. Google accepts a list. Fixed term ("Contract") is an
// employee for a set period, so it is TEMPORARY; CONTRACTOR means self employed (audit P1-52, Steve agreed 12th November 2026).
const SCHEMA_EMPLOYMENT: Record<string, string | string[]> = { "Full time": "FULL_TIME", "Part time": "PART_TIME", Locum: ["TEMPORARY", "CONTRACTOR"], Contract: "TEMPORARY" };

type PublicJob = PayFields & {
  id: string; title: string; description: string; employment_type: string; province: string; city: string;
  apply_method: string; apply_url: string | null;
  posted_at: string; expires_at: string; territory?: string | null; pay_extras?: string | null; work_arrangement?: string | null;
};
type PublicClinic = { clinic_name: string; website: string | null };

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// The job's text as Google reads it: special characters made safe first (so "<2 years" is not read as a tag), then line
// breaks, then the 2 facts the page shows beside the ad for field roles and extra pay, so the markup says what the page says.
export function markupDescription(job: Pick<PublicJob, "description" | "territory" | "pay_extras" | "work_arrangement"> & PayFields) {
  const extras = [
    job.work_arrangement === "field" && job.territory ? `Area covered: ${job.territory}` : "",
    // A percentage cannot go in baseSalary, so the page's pay sentence is given here instead (see lib/job-pay.ts).
    markupPayLine(job) ?? "",
    job.pay_extras ? `Also part of the pay: ${job.pay_extras}` : "",
  ].filter(Boolean);
  return [escapeHtml(job.description).replace(/\n/g, "<br>"), ...extras.map(escapeHtml)].join("<br><br>");
}

// Google's structured data for a job. Everything here is also shown on the page,
// because Google requires the two to match exactly.
export function jobPostingJsonLd(job: PublicJob, clinic: PublicClinic, siteUrl: string) {
  const salary = salaryForMarkup(job);
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: markupDescription(job),
    datePosted: new Date(job.posted_at).toISOString().slice(0, 10),
    validThrough: new Date(job.expires_at).toISOString(),
    employmentType: SCHEMA_EMPLOYMENT[job.employment_type] ?? "OTHER",
    // The clinic website is not shown on the job page, so it is not given to Google either.
    hiringOrganization: { "@type": "Organization", name: clinic.clinic_name },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: job.city, addressRegion: REGION_CODES[job.province] ?? job.province, addressCountry: "CA" },
    },
    // A percentage can never be a salary figure, so a percentage only job has no baseSalary (its pay is in the description instead).
    ...(salary
      ? { baseSalary: { "@type": "MonetaryAmount", currency: "CAD", value: { "@type": "QuantitativeValue", minValue: salary.min, maxValue: salary.max, unitText: salary.unitText } } }
      : {}),
    directApply: job.apply_method === "kestrel",
    url: `${siteUrl}/jobs/${job.id}`,
    identifier: { "@type": "PropertyValue", name: "Kestrel Eye Care Jobs", value: job.id },
  };
}
