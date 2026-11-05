// The pay benchmark shown to a clinic while it posts a job. Kept free of imports from the app so the rules can be tested on their own
// (see lib/pay-benchmark.test.ts). It is guidance only: nothing here stops a post.
//
// Which figure is shown, in this order:
//   1. Official Job Bank wages (Government of Canada), where the role and province have them.
//   2. Kestrel's own posted pay, once the role and province have at least 10 posts from at least 3 clinics.
//   3. A labelled AI starting range (lib/pay-starting-ranges.ts), if one has been added and reviewed.
//   4. Nothing.
// All comparisons are made on a yearly basis (hourly pay x 2,080 hours, the same conversion as the pay range rule), and shown in the
// basis the clinic chose. Wording uses "typical" and "median", never "national average".

import { HOURS_IN_A_YEAR } from "./jobs.ts";
import { JOB_BANK_SOURCE, JOB_BANK_WAGES } from "./pay-benchmark-data.ts";
import { STARTING_RANGES } from "./pay-starting-ranges.ts";

export const OWN_DATA_MIN_POSTS = 10;
export const OWN_DATA_MIN_CLINICS = 3;
export const LICENCE_STATEMENT = "Contains information licensed under the Open Government Licence – Canada.";
export const LICENCE_URL = "https://open.canada.ca/en/open-government-licence-canada";

type Bands = { low: number | null; median: number | null; high: number | null }; // yearly dollars. low and high are the middle half of pay

export type OwnPayStat = { role: string; province: string; posts: number; clinics: number; low: number; median: number; high: number };

export type Benchmark =
  | { kind: "job_bank"; role: string; province: string; bands: Bands & { median: number }; occupation: string; noc: string; closest: boolean; survey: string; period: string; revised: string }
  | { kind: "kestrel"; role: string; province: string; bands: Bands & { median: number }; posts: number }
  | { kind: "starting"; role: string; province: string; bands: Bands; madeOn: string; basis: string };

export type PayEntry = { role: string; province: string; period: string; min: number; max: number };
export type Verdict = "below" | "in_line" | "above";

const toYear = (value: number, basis: string) => (basis === "hour" ? value * HOURS_IN_A_YEAR : value);
const orNull = (value: number | null, basis: string) => (value === null ? null : toYear(value, basis));

// Picks the figure to compare against. `own` is the list from ownPayStats (the server works it out from posted jobs).
export function findBenchmark(role: string, province: string, own: readonly OwnPayStat[] = []): Benchmark | null {
  const official = JOB_BANK_WAGES.find((w) => w.role === role && w.province === province);
  if (official) {
    return {
      kind: "job_bank",
      role,
      province,
      bands: { low: orNull(official.q1, official.basis), median: toYear(official.median, official.basis), high: orNull(official.q3, official.basis) },
      occupation: official.occupation,
      noc: official.noc,
      closest: official.match === "closest",
      survey: official.survey,
      period: official.period,
      revised: JOB_BANK_SOURCE.revised,
    };
  }
  const mine = own.find((o) => o.role === role && o.province === province && o.posts >= OWN_DATA_MIN_POSTS && o.clinics >= OWN_DATA_MIN_CLINICS);
  if (mine) return { kind: "kestrel", role, province, bands: { low: mine.low, median: mine.median, high: mine.high }, posts: mine.posts };
  const start = STARTING_RANGES.find((s) => s.role === role && s.province === province);
  if (start) return { kind: "starting", role, province, bands: { low: start.low, median: null, high: start.high }, madeOn: start.madeOn, basis: start.basis };
  return null;
}

// Below, in line with or above. The middle of the clinic's range is compared with the middle half of pay (first to third quartile).
// Where only a median is known, within 10% of it counts as in line.
export function compareRange(min: number, max: number, period: string, bands: Bands): Verdict {
  const mid = toYear((min + max) / 2, period);
  const low = bands.low ?? (bands.median !== null ? bands.median * 0.9 : null);
  const high = bands.high ?? (bands.median !== null ? bands.median * 1.1 : null);
  if (low === null || high === null) return "in_line";
  if (mid < low) return "below";
  if (mid > high) return "above";
  return "in_line";
}

const PEOPLE: Record<string, string> = {
  Optometrist: "optometrists",
  Optician: "opticians",
  "Optometric assistant or technician": "optometric assistants and technicians",
  "Practice or clinic manager": "practice and clinic managers",
  "Patient care or reception": "patient care and reception staff",
  "Vision therapist": "vision therapists",
};
const people = (role: string) => PEOPLE[role] ?? role.toLowerCase();

// Money in the basis the clinic is using. Yearly figures that came from an hourly wage are rounded to the nearest $100.
export function showMoney(yearly: number, period: string) {
  if (period === "hour") return `$${(yearly / HOURS_IN_A_YEAR).toFixed(2)} an hour`;
  return `$${(Math.round(yearly / 100) * 100).toLocaleString("en-CA")} a year`;
}

const ORDINAL = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export function plainDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${ORDINAL(d)} ${MONTHS[m - 1]} ${y}`;
}
const years = (period: string) => period.replace("-", " to ");

export type BenchmarkMessage = {
  verdict: Verdict | null; // null until the clinic has entered a usable range
  kind: Benchmark["kind"];
  heading: string; // "Pay guide" or "Starting point, from AI"
  lead: string; // the one line: how the range compares
  detail: string; // the typical figure
  short: string; // the one line always shown: where the figure is from
  source: string; // the full source, group and date, shown when the reader opens "Source"
  caution: string;
  licence: boolean; // whether the Open Government Licence statement must be shown
};

const VERDICT_TEXT: Record<Verdict, string> = {
  below: "below",
  in_line: "in line with",
  above: "above",
};

// The wording for the form. `entry.min` and `entry.max` are numbers (the form parses them first); when they are not usable the line
// shows the typical figure only.
export function describeBenchmark(entry: PayEntry, b: Benchmark): BenchmarkMessage {
  const usable = entry.min > 0 && entry.max >= entry.min;
  const verdict = usable ? compareRange(entry.min, entry.max, entry.period, b.bands) : null;
  const where = `${people(entry.role)} in ${entry.province}`;
  const lead = verdict ? `Your range is ${VERDICT_TEXT[verdict]} what is typical for ${where}.` : `Typical pay for ${where}.`;
  const mid = b.bands.low !== null && b.bands.high !== null ? `${showMoney(b.bands.low, entry.period)} to ${showMoney(b.bands.high, entry.period)}` : "";

  if (b.kind === "job_bank") {
    const detail = `The median is about ${showMoney(b.bands.median, entry.period)}${mid ? `, and the middle half of workers earn ${mid}` : ""}.`;
    const group = `${b.occupation} (NOC ${b.noc})`;
    const near = b.closest ? " Kestrel chose the closest Job Bank group for this role, so it may include related jobs." : "";
    return {
      verdict, kind: b.kind, heading: "Pay guide", lead, detail,
      short: "Source: Job Bank, Government of Canada. Guidance only.",
      source: `Job Bank wages, Government of Canada. Group: ${group}. ${b.survey}${b.survey.includes(b.period) ? "" : ` ${years(b.period)}`}. Job Bank file of ${plainDate(b.revised)}.${near}`,
      caution: `Guidance only. It does not stop you posting. These figures cover ${years(b.period)}, so pay today and pay in your town can differ.`,
      licence: true,
    };
  }
  if (b.kind === "kestrel") {
    const detail = `The median is about ${showMoney(b.bands.median, entry.period)}${mid ? `, and the middle half of posts range from ${mid}` : ""}.`;
    return {
      verdict, kind: b.kind, heading: "Pay guide", lead, detail,
      short: `Source: ${b.posts} posts on Kestrel. Guidance only.`,
      source: `${b.posts} posts on Kestrel for this role in ${entry.province}, shown as the middle of each posted range.`,
      caution: "Guidance only. It does not stop you posting. It reflects what clinics have posted here, not what people were finally paid.",
      licence: false,
    };
  }
  const detail = mid ? `A starting range is ${mid}.` : "";
  return {
    verdict, kind: b.kind, heading: "Starting point, from AI",
    lead: verdict ? `Your range is ${VERDICT_TEXT[verdict]} this starting range for ${where}.` : `A starting range for ${where}.`,
    detail,
    short: "Made by AI as a rough starting point, not fact. Guidance only.",
    source: `There is no official figure for this role and province yet. This range was made by AI on ${plainDate(b.madeOn)} from ${b.basis}.`,
    caution: "Guidance only. It does not stop you posting. It will be replaced by Kestrel's own posted pay once there are enough posts.",
    licence: false,
  };
}

// Kestrel's own posted pay, worked out from jobs that clinics posted and Kestrel approved. Only a role and province with enough posts
// from enough clinics is returned, so no single clinic's pay can be read off it. `rows` come from the database (see lib/pay-benchmark-server.ts).
export type PostedPayRow = { employer_id: string; role_category: string; province: string; pay_period: string; pay_min: number | string; pay_max: number | string };

function quantile(sorted: number[], q: number) {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base] + (sorted[base + 1] !== undefined ? rest * (sorted[base + 1] - sorted[base]) : 0);
}

export function ownPayStats(rows: readonly PostedPayRow[]): OwnPayStat[] {
  const groups = new Map<string, { role: string; province: string; clinics: Set<string>; mids: number[] }>();
  for (const r of rows) {
    const min = Number(r.pay_min);
    const max = Number(r.pay_max);
    if (!(min > 0) || !(max >= min) || (r.pay_period !== "hour" && r.pay_period !== "year")) continue;
    const key = `${r.role_category}|${r.province}`;
    const g = groups.get(key) ?? { role: r.role_category, province: r.province, clinics: new Set<string>(), mids: [] };
    g.clinics.add(r.employer_id);
    g.mids.push(toYear((min + max) / 2, r.pay_period));
    groups.set(key, g);
  }
  return [...groups.values()]
    .filter((g) => g.mids.length >= OWN_DATA_MIN_POSTS && g.clinics.size >= OWN_DATA_MIN_CLINICS)
    .map((g) => {
      const sorted = [...g.mids].sort((a, b) => a - b);
      return { role: g.role, province: g.province, posts: sorted.length, clinics: g.clinics.size, low: quantile(sorted, 0.25), median: quantile(sorted, 0.5), high: quantile(sorted, 0.75) };
    });
}
