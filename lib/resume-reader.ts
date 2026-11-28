// "Fill in from my resume" (Steve, 12th November 2026): reads the text of a resume and suggests profile answers. No AI. It is a fixed set of rules
// run on Kestrel's own server: look for a job title, add up the dates, look for a town and a phone number, and match words against our own lists.
// Nothing is saved and nothing leaves Kestrel: the person sees each suggestion with where it came from, and ticks what to keep. It will miss
// things on an unusual layout, and that is fine, because every answer is checked by the person. Kept free of app imports so it can be tested on
// its own (lib/resume-reader.test.ts).

import { SOFTWARE_TAGS } from "./job-tags.ts";
import { findPlace } from "./places.ts";

export type Found<T> = { value: T; why: string };
export type ResumeSuggestions = {
  profession?: Found<string>;
  yearsExperience?: Found<string>;
  licensedProvinces?: Found<string[]>;
  phone?: Found<string>;
  home?: Found<{ city: string; province: string }>;
  software?: Found<string[]>;
};

const PROVINCE_NAMES: Record<string, string> = {
  ontario: "Ontario",
  "british columbia": "British Columbia",
  alberta: "Alberta",
  saskatchewan: "Saskatchewan",
  manitoba: "Manitoba",
  quebec: "Quebec",
  "québec": "Quebec",
  "new brunswick": "New Brunswick",
  "nova scotia": "Nova Scotia",
  "prince edward island": "Prince Edward Island",
  "newfoundland and labrador": "Newfoundland and Labrador",
  "northwest territories": "Northwest Territories",
  nunavut: "Nunavut",
  yukon: "Yukon",
};
const PROVINCE_CODES: Record<string, string> = {
  ON: "Ontario", BC: "British Columbia", AB: "Alberta", SK: "Saskatchewan", MB: "Manitoba", QC: "Quebec", NB: "New Brunswick", NS: "Nova Scotia",
  PE: "Prince Edward Island", PEI: "Prince Edward Island", NL: "Newfoundland and Labrador", NT: "Northwest Territories", NU: "Nunavut", YT: "Yukon",
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// A province named in a piece of text: the full name in any case, or the 2 letter code in capitals.
function provinceIn(text: string): string | null {
  const t = text.trim().replace(/[.,]+$/, "");
  const lower = t.toLowerCase();
  if (PROVINCE_NAMES[lower]) return PROVINCE_NAMES[lower];
  const code = /^([A-Z]{2,3})\b/.exec(t)?.[1];
  return code && PROVINCE_CODES[code] ? PROVINCE_CODES[code] : null;
}

function provincesOnLine(line: string): string[] {
  const found = new Set<string>();
  for (const [name, canonical] of Object.entries(PROVINCE_NAMES)) if (new RegExp(`\\b${escape(name)}\\b`, "i").test(line)) found.add(canonical);
  for (const m of line.matchAll(/\b([A-Z]{2,3})\b/g)) if (PROVINCE_CODES[m[1]]) found.add(PROVINCE_CODES[m[1]]);
  return [...found];
}

const lines = (text: string) => text.replace(/\r/g, "\n").replace(/[ \t]/g, " ").split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);

// ---- phone ----
function findPhone(all: string[]): Found<string> | undefined {
  const pattern = /(?:\+?1[\s.-]?)?\(?([2-9]\d{2})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})(?!\d)/;
  for (const line of [...all.slice(0, 25), ...all.slice(25)]) {
    const m = pattern.exec(line.replace(/\b(19|20)\d{2}\s*[-–—]\s*(19|20)\d{2}\b/g, " "));
    if (m) return { value: `(${m[1]}) ${m[2]}-${m[3]}`, why: `A phone number near the top of your resume` };
  }
  return undefined;
}

// ---- town and province: an address in the first lines, like "Toronto, ON M5V 2T6" ----
function findHome(all: string[]): Found<{ city: string; province: string }> | undefined {
  for (const line of all.slice(0, 20)) {
    const parts = line.split(/[,|•·]/).map((p) => p.trim()).filter(Boolean);
    for (let i = 1; i < parts.length; i++) {
      const province = provinceIn(parts[i]);
      const city = parts[i - 1];
      if (!province || /\d/.test(city) || city.length < 2 || city.length > 40) continue;
      const place = findPlace(city, province);
      if (place) return { value: { city: place.name, province: place.province }, why: `The address near the top of your resume: ${city}, ${province}` };
    }
  }
  // Addresses written another way round, such as "unit 1210, Ontario. Toronto, M2N 7L4": on a line near the top that names a province,
  // try each piece without digits as a town in that province.
  for (const line of all.slice(0, 20)) {
    const named = provincesOnLine(line);
    if (named.length !== 1) continue;
    for (const piece of line.split(/[,|•·.;:]/).map((p) => p.trim()).filter(Boolean)) {
      if (/\d/.test(piece) || piece.length < 3 || piece.length > 40 || provinceIn(piece)) continue;
      const place = findPlace(piece, named[0]);
      if (place) return { value: { city: place.name, province: place.province }, why: `The address near the top of your resume: ${piece}, ${named[0]}` };
    }
  }
  return undefined;
}

// ---- role ----
type RolePattern = { role: string; patterns: RegExp[] };
const ROLE_PATTERNS: RolePattern[] = [
  { role: "Optometrist", patterns: [/\boptometrist\b/i, /\bdoctor of optometry\b/i, /\bO\.?D\.?,?(?=\s|$)/] },
  { role: "Optician", patterns: [/\boptician\b/i, /\bophthalmic dispenser\b/i, /\bdispensing optician\b/i, /\bcontact lens (fitter|technician|specialist)\b/i] },
  {
    role: "Optometric assistant or technician",
    patterns: [/\boptometric (assistant|technician)\b/i, /\bophthalmic (assistant|technician)\b/i, /\boptometry (assistant|technician)\b/i, /\bpre[- ]?test(ing)?\b/i, /\b(eye care|optical|clinic) (assistant|technician)\b/i],
  },
  { role: "Patient care or reception", patterns: [/\breceptionist\b/i, /\bfront (desk|office)\b/i, /\bpatient (care|service|services|experience) (coordinator|representative|specialist|advisor|associate)\b/i, /\bpatient coordinator\b/i] },
  { role: "Practice or clinic manager", patterns: [/\b(practice|clinic|office|optical|store|operations) manager\b/i] },
  { role: "Vision therapist", patterns: [/\bvision therapist\b/i, /\bvision therapy\b/i] },
  { role: "Sales or territory representative", patterns: [/\b(territory|sales) (manager|representative|rep|executive)\b/i, /\bsales associate\b/i] },
  { role: "Trainer or clinical educator", patterns: [/\bclinical educator\b/i, /\btrainer\b/i, /\btraining specialist\b/i] },
  { role: "Field service or equipment technician", patterns: [/\bfield service\b/i, /\b(service|equipment) technician\b/i] },
  { role: "Account or practice development manager", patterns: [/\baccount (manager|executive)\b/i, /\bpractice development\b/i] },
];

const HEADER_WORDS = /^(?:(?:work|professional|relevant|clinical|related)\s+)?(experience|employment|employment history|work history|career history|education|training|certifications?|certificates?|courses|qualifications|skills|references|awards|volunteer(?:ing)?(?: experience)?|summary|profile|objective|interests|languages|licen[cs]es?(?: and certifications?)?|registrations?)\s*:?$/i;
// Headings can be numbered ("① PROFILE", "4. Experience", "02 Skills"), so the number is set aside first (Steve's samples, 13th November 2026).
const headerText = (line: string) => line.replace(/^(?:[\u2460-\u2473\u2776-\u277F\u2780-\u2793]|\(?\d{1,2}[.)]?)\s+/, "").trim();
// A heading can join 2 sections with "and" or "&" ("Education AND ACCOMPLISHMENT:", "Skills & Qualifications"): the first part decides
// the section (Steve's second batch of samples, 13th November 2026).
const firstPart = (line: string) => headerText(line).replace(/\s*:\s*$/, "").split(/\s+(?:and|&)\s+/i)[0];
const isHeader = (line: string) => line.length <= 40 && (HEADER_WORDS.test(headerText(line)) || HEADER_WORDS.test(firstPart(line)));
// Side column headings: on a 2 column resume their text can come out in the middle of the job history, so they do not end it.
const SIDE_HEADINGS = /^(skills|languages|interests)\s*:?$/i;
const nextSection = (line: string, current: "experience" | "education" | "references" | "other") =>
  current === "experience" && SIDE_HEADINGS.test(firstPart(line)) ? current : sectionOf(firstPart(line));
const sectionOf = (line: string): "experience" | "education" | "references" | "other" => {
  const w = line.toLowerCase();
  if (/experience|employment|work history|career history/.test(w) && !/volunteer/.test(w)) return "experience";
  if (/education|training|certif|courses|qualification/.test(w)) return "education";
  if (/references/.test(w)) return "references";
  return "other";
};
const titleLike = (line: string) => line.length <= 70 && !/[.!?]$/.test(line) && line.split(" ").length <= 9;

function findRole(all: string[]): Found<string> | undefined {
  const scores = new Map<string, { score: number; hits: number; sample: string }>();
  let section: ReturnType<typeof sectionOf> = "other";
  all.forEach((line, i) => {
    if (isHeader(line)) section = nextSection(line, section);
    if (section === "references") return;
    const recency = 1 + (1 - i / Math.max(all.length, 1));
    for (const { role, patterns } of ROLE_PATTERNS) {
      const hit = patterns.find((p) => p.test(line));
      if (!hit) continue;
      const weight = (titleLike(line) ? 3 : 1) * recency;
      const current = scores.get(role) ?? { score: 0, hits: 0, sample: line };
      current.score += weight;
      current.hits += 1;
      if (titleLike(line) && current.sample.length > 70) current.sample = line;
      scores.set(role, current);
    }
  });
  const ranked = [...scores.entries()].sort((a, b) => b[1].score - a[1].score);
  if (!ranked.length || ranked[0][1].score < 2) return undefined;
  const [role, top] = ranked[0];
  const also = ranked.slice(1, 3).filter(([, s]) => s.score >= top.score * 0.6).map(([r]) => r);
  const where = top.sample.length > 70 ? "" : ` ("${top.sample}")`;
  return { value: role, why: `Found ${top.hits === 1 ? "1 mention" : `${top.hits} mentions`} of this role${where}${also.length ? `. It also mentions ${also.join(" and ")}, so check this one` : ""}` };
}

// ---- years of experience ----
const MONTHS = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
const monthIndex = (name: string) => ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(name.slice(0, 3).toLowerCase());
// The month may touch the year ("May2026"), but must start a word, so "Grammar 2019" is not read as March.
const POINT = `(?:(?:(?<![a-z])(${MONTHS})\\.?,?\\s*)?((?:19|20)\\d{2})|(\\d{1,2})[/.](20\\d{2}|19\\d{2}))`;
const END = `(?:${POINT}|(present|current|now|ongoing|today|to date))`;
const RANGE = new RegExp(`${POINT}\\s*(?:-|–|—|to|until|through)\\s*${END}`, "gi");
const EYE = /optic|optom|ophthalm|\beye\b|vision|lens|\becp\b|spectacle|glasses|frames|dispens|\bclinic\b|refract/i;

// When 2 jobs sit side by side, the second one's end year can drop onto the next line ("September 2013 — September" then "2015").
// A line ending in a dash or "to", with or without a month, is joined to a next line that starts with a year or "present".
const OPEN_END = new RegExp(`(?:-|\\u2013|\\u2014|\\bto)\\s*(?:(?:${MONTHS})\\.?)?\\s*$`, "i");
const CLOSES = /^(?:(?:19|20)\d{2}|present|current|now|today)\b/i;
function joinSplitDates(all: string[]): string[] {
  const out: string[] = [];
  for (const line of all) {
    const last = out[out.length - 1];
    if (last !== undefined && OPEN_END.test(last) && CLOSES.test(line)) out[out.length - 1] = `${last} ${line}`;
    else out.push(line);
  }
  return out;
}

export function monthsOfWork(input: string[], now: Date): { months: number; counted: number } {
  const all = joinSplitDates(input);
  const nowIndex = now.getFullYear() * 12 + now.getMonth();
  const hasExperienceSection = all.some((l) => isHeader(l) && sectionOf(firstPart(l)) === "experience");
  type Span = { from: number; to: number; eye: boolean };
  const spans: Span[] = [];
  let section: ReturnType<typeof sectionOf> = "other";
  all.forEach((line, i) => {
    if (isHeader(line)) {
      section = nextSection(line, section);
      return;
    }
    if (section === "education" || section === "references") return;
    if (hasExperienceSection && section !== "experience") return;
    for (const m of line.matchAll(RANGE)) {
      const [, startMonthName, startYear, startNumMonth, startNumYear, endMonthName, endYear, endNumMonth, endNumYear, endWord] = m as unknown as string[];
      const sy = Number(startYear ?? startNumYear);
      const sm = startMonthName ? monthIndex(startMonthName) : startNumMonth ? Number(startNumMonth) - 1 : 0;
      let ey: number;
      let em: number;
      if (endWord) {
        ey = now.getFullYear();
        em = now.getMonth();
      } else {
        ey = Number(endYear ?? endNumYear);
        em = endMonthName ? monthIndex(endMonthName) : endNumMonth ? Number(endNumMonth) - 1 : 11;
      }
      if (!Number.isFinite(sy) || !Number.isFinite(ey) || sy < 1970) continue;
      const from = sy * 12 + sm;
      const to = Math.min(ey * 12 + em, nowIndex);
      if (to <= from || to - from > 12 * 50) continue;
      const context = all.slice(Math.max(0, i - 2), i + 4).join(" ");
      spans.push({ from, to, eye: EYE.test(context) });
    }
  });
  const use = spans.some((s) => s.eye) ? spans.filter((s) => s.eye) : spans;
  const sorted = [...use].sort((a, b) => a.from - b.from);
  let months = 0;
  let end = -Infinity;
  for (const s of sorted) {
    const from = Math.max(s.from, end);
    if (s.to > from) months += s.to - from;
    end = Math.max(end, s.to);
  }
  return { months, counted: use.length };
}

export function yearsBand(months: number): string {
  return months < 12 ? "Under 1 year" : months < 60 ? "1 to 4 years" : months < 120 ? "5 to 9 years" : "10 or more years";
}

function findYears(all: string[], now: Date): Found<string> | undefined {
  const { months, counted } = monthsOfWork(all, now);
  if (months < 3 || counted === 0) return undefined;
  const years = months / 12;
  // The rounded number never contradicts the band: 9 years and 7 months reads "about 9 years" beside "5 to 9 years", not "about 10".
  const whole = yearsBand(Math.round(years) * 12) === yearsBand(months) ? Math.round(years) : Math.floor(years);
  const rounded = years < 1 ? "less than 1 year" : `about ${whole} year${whole === 1 ? "" : "s"}`;
  return { value: yearsBand(months), why: `Added up from the dates of ${counted} job${counted === 1 ? "" : "s"} on your resume: ${rounded}. Please check it` };
}

// ---- registration (only asked for optometrists and opticians) ----
function findRegistered(all: string[]): Found<string[]> | undefined {
  const keyword = /\b(registered|licen[cs]ed|licen[cs]ure|registration|member of|college of (?:optometrists|opticians))\b/i;
  const found = new Set<string>();
  // A province in a university's name ("University of British Columbia") says where someone studied, not where they are registered.
  const places = (line: string) => provincesOnLine(line.replace(/\buniversity of (?:the )?[a-z ]+/gi, " "));
  all.forEach((line, i) => {
    if (!keyword.test(line)) return;
    for (const p of places(line)) found.add(p);
    // The province can be on the next line ("Registered with the College of" / "Opticians of Ontario"), but not when that line is a new item.
    const next = all[i + 1] ?? "";
    if (!places(line).length && !/^[•●▪◦‣*-]|^\d+[.)]\s/.test(next)) for (const p of places(next)) found.add(p);
  });
  return found.size ? { value: [...found], why: "Provinces named next to the words registered or licensed on your resume. This is what you tell us, and Kestrel does not check it" } : undefined;
}

// ---- software ----
const SOFTWARE_WORDS: Record<string, string[]> = {
  "Visual Eyes": ["Visual Eyes", "VisualEyes"],
  RevolutionEHR: ["RevolutionEHR", "Revolution EHR"],
  Wink: ["Wink"],
  Acuitas: ["Acuitas"],
  eVision: ["eVision", "e-Vision"],
  iFile: ["iFile"],
  "OD Office Pro": ["OD Office Pro", "OD Office"],
  Optosys: ["Optosys"],
};
function findSoftware(text: string): Found<string[]> | undefined {
  const found = SOFTWARE_TAGS.filter((name) => (SOFTWARE_WORDS[name] ?? [name]).some((w) => new RegExp(`(^|[^A-Za-z])${escape(w)}(?![A-Za-z])`, name === "Wink" ? "" : "i").test(text)));
  return found.length ? { value: [...found], why: "Practice software named on your resume" } : undefined;
}

export function readResume(text: string, now: Date = new Date()): ResumeSuggestions {
  const all = lines(text.slice(0, 200_000));
  if (all.length === 0) return {};
  const out: ResumeSuggestions = {};
  const profession = findRole(all);
  if (profession) out.profession = profession;
  const years = findYears(all, now);
  if (years) out.yearsExperience = years;
  if (profession && (profession.value === "Optometrist" || profession.value === "Optician")) {
    const registered = findRegistered(all);
    if (registered) out.licensedProvinces = registered;
  }
  const phone = findPhone(all);
  if (phone) out.phone = phone;
  const home = findHome(all);
  if (home) out.home = home;
  const software = findSoftware(all.join("\n"));
  if (software) out.software = software;
  return out;
}
