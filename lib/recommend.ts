// "Recommended for you": the jobs that fit a candidate, worked out by plain rules (no AI). Kept free of app imports so the rules can be tested
// on their own (lib/recommend.test.ts).
//
// Two steps. First, hard filters: a job is left out if it is not a role the candidate wants, not an employment type they asked for, not the
// kind of practice they asked for, pays less than their minimum even at the top of its range, is outside where they would work, or they have
// already applied to it or said they are not interested. Second, the jobs that remain are scored, and each one carries the plain reasons it
// fits, so the candidate can see why it was suggested. Nothing here is hidden or learned: the same profile and the same jobs always give the
// same list.

import { employmentLabel } from "./jobs.ts";
import { canApplyForRole } from "./role-fit.ts";
import { HOURS_IN_A_YEAR, yearlyPay, type PayFields } from "./job-pay.ts";
import { distanceKm, findPlace, nearbyKeys, placeKey } from "./places.ts";

export type Prefs = {
  profession: string | null;
  otherRoles: string[]; // other roles they would also consider
  licensedProvinces: string[];
  homeCity: string | null;
  homeProvince: string | null;
  radiusKm: number;
  extraProvinces: string[]; // provinces they would work in, wherever in the province (for example, if they plan to move)
  employmentTypes: string[]; // empty means any
  minPay: number | null;
  payPeriod: "hour" | "year" | null;
  practice: "independent" | "corporate" | null; // null means either
  software: string[]; // practice software they use. Private to them, and used only to order their own list
};

export type MatchJob = {
  id: string;
  role_category: string;
  employment_type: string;
  province: string;
  city: string;
  posted_at: string;
  tags_software?: string[] | null;
  employers: { practice_type: string } | null;
} & PayFields;

export type Recommendation<J extends MatchJob> = { job: J; score: number; reasons: string[] };

const LICENSED_ROLES = ["Optometrist", "Optician"];
const DAY = 86_400_000;

export function hasWhere(p: Prefs) {
  return Boolean((p.homeCity && p.homeProvince) || p.extraProvinces.length > 0);
}

export function recommend<J extends MatchJob>(
  prefs: Prefs,
  jobs: readonly J[],
  opts: { now?: Date; hidden?: ReadonlySet<string>; applied?: ReadonlySet<string>; max?: number } = {},
): Recommendation<J>[] {
  if (!prefs.profession) return [];
  const now = (opts.now ?? new Date()).getTime();
  // The list uses the apply rule itself (lib/role-fit.ts), so it can never show a job the person cannot apply for, and never hides one they can
  // (an assistant sees reception jobs and the other way round; other roles saved before a rule changed are checked again).
  const home = prefs.homeCity && prefs.homeProvince ? findPlace(prefs.homeCity, prefs.homeProvince) : null;
  const near = home ? nearbyKeys(home, prefs.radiusKm) : null;
  // With no place and no provinces chosen, the provinces they are registered in stand in, so an optician in Ontario is not shown Alberta jobs.
  const provinces = prefs.extraProvinces.length > 0 || home ? prefs.extraProvinces : prefs.licensedProvinces;
  const minYear = prefs.minPay && prefs.payPeriod ? (prefs.payPeriod === "hour" ? prefs.minPay * HOURS_IN_A_YEAR : prefs.minPay) : null;

  const out: Recommendation<J>[] = [];
  for (const job of jobs) {
    if (opts.hidden?.has(job.id) || opts.applied?.has(job.id)) continue;
    if (!canApplyForRole(prefs.profession, prefs.otherRoles, job.role_category)) continue;
    if (prefs.employmentTypes.length > 0 && !prefs.employmentTypes.includes(job.employment_type)) continue;
    if (prefs.practice && job.employers?.practice_type !== prefs.practice) continue;

    // Only salary and hourly pay can be turned into a year. A daily rate, a daily minimum or a percentage is never compared with a minimum
    // pay (and a missing figure is never treated as $0), so those jobs stay in the list.
    const pay = yearlyPay(job);
    if (minYear !== null && pay && pay.max < minYear) continue;

    const inRadius = near ? near.has(placeKey(job.city, job.province)) : false;
    const inProvince = provinces.includes(job.province);
    const limited = Boolean(home) || provinces.length > 0;
    if (limited && !inRadius && !inProvince) continue;

    let score = 0;
    const reasons: string[] = [];

    if (job.role_category === prefs.profession) {
      score += 40;
      reasons.push(`${job.role_category} role`);
    } else {
      score += 25;
      reasons.push(`A role you would consider: ${job.role_category}`);
    }

    if (home && inRadius) {
      const there = findPlace(job.city, job.province);
      const km = there ? Math.round(distanceKm(home, there)) : null;
      if (km === null) {
        score += 10;
        reasons.push(`Within ${prefs.radiusKm} km of ${home.name}`);
      } else if (km <= 1) {
        score += 25;
        reasons.push(`In ${home.name}`);
      } else {
        score += Math.max(10, 25 - Math.round((km / prefs.radiusKm) * 15));
        reasons.push(`About ${km} km from ${home.name}`);
      }
    } else if (inProvince) {
      score += 10;
      reasons.push(`In ${job.province}`);
    }

    if (minYear !== null && pay) {
      if (pay.min >= minYear) {
        score += 15;
        reasons.push("Pay starts at or above your minimum");
      } else {
        score += 6;
        reasons.push("The top of the pay range meets your minimum");
      }
    }

    const shared = (job.tags_software ?? []).filter((name) => prefs.software.includes(name));
    if (shared.length > 0) {
      score += 10;
      reasons.push(`Uses ${shared.join(" and ")}, which you use`);
    }

    if (prefs.employmentTypes.length > 0) {
      score += 5;
      reasons.push(employmentLabel(job.employment_type));
    }
    if (prefs.practice) {
      score += 5;
      reasons.push(prefs.practice === "independent" ? "Independent practice" : "Corporate practice");
    }
    if (LICENSED_ROLES.includes(job.role_category) && prefs.licensedProvinces.includes(job.province)) {
      score += 8;
      reasons.push(`You are registered in ${job.province}`);
    }

    const days = (now - Date.parse(job.posted_at)) / DAY;
    if (days <= 7) {
      score += 8;
      reasons.push("Posted this week");
    } else if (days <= 14) {
      score += 4;
    }

    out.push({ job, score, reasons });
  }

  out.sort((a, b) => b.score - a.score || Date.parse(b.job.posted_at) - Date.parse(a.job.posted_at));
  return out.slice(0, opts.max ?? 8);
}
