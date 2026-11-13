// The yearly eye care pay summary at /resources/eye-care-pay-summary: for each role on the public pay table, the provinces with the highest
// and lowest Job Bank median and the gap between them. Built from the same figures as the pay table (lib/pay-guide.ts), with the same roles
// and provinces left out, so the summary, the table and the post a job form never disagree. Every number on the page comes from here.

import { HOURS_IN_A_YEAR } from "./jobs.ts";
import { JOB_BANK_WAGES, type JobBankWage } from "./pay-benchmark-data.ts";
import { LEFT_OUT_PROVINCES, LEFT_OUT_ROLES } from "./pay-guide.ts";

const ROLE_ORDER = ["Optician", "Optometric assistant or technician", "Patient care or reception", "Practice or clinic manager"];

export type RoleSummary = {
  role: string;
  provinces: number; // how many provinces have a figure for this role
  highest: { province: string; median: number };
  lowest: { province: string; median: number };
  gap: number; // highest minus lowest, dollars an hour
  gapPercent: number; // the gap as a share of the lowest, rounded to a whole number
  closest: boolean; // Kestrel picked the nearest Job Bank group for this role
  occupation: string;
};

const hourly = (wages: readonly JobBankWage[]) =>
  wages.filter((w) => w.basis === "hour" && !LEFT_OUT_ROLES.includes(w.role) && !LEFT_OUT_PROVINCES.includes(w.province));

export function roleSummaries(wages: readonly JobBankWage[] = JOB_BANK_WAGES): RoleSummary[] {
  const shown = hourly(wages);
  const roles = [...new Set(shown.map((w) => w.role))].sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b));
  return roles.map((role) => {
    const rows = shown.filter((w) => w.role === role).sort((a, b) => b.median - a.median || a.province.localeCompare(b.province, "en-CA"));
    const top = rows[0];
    const bottom = rows[rows.length - 1];
    const gap = Math.round((top.median - bottom.median) * 100) / 100;
    return {
      role,
      provinces: rows.length,
      highest: { province: top.province, median: top.median },
      lowest: { province: bottom.province, median: bottom.median },
      gap,
      gapPercent: Math.round((gap / bottom.median) * 100),
      closest: rows.some((w) => w.match === "closest"),
      occupation: top.occupation,
    };
  });
}

// How many roles each province tops. Ties for the highest figure count for every province that shares it.
export function provincesOnTop(wages: readonly JobBankWage[] = JOB_BANK_WAGES): { province: string; roles: number }[] {
  const shown = hourly(wages);
  const counts = new Map<string, number>();
  for (const role of new Set(shown.map((w) => w.role))) {
    const rows = shown.filter((w) => w.role === role);
    const best = Math.max(...rows.map((w) => w.median));
    for (const w of rows.filter((r) => r.median === best)) counts.set(w.province, (counts.get(w.province) ?? 0) + 1);
  }
  return [...counts].map(([province, roles]) => ({ province, roles })).sort((a, b) => b.roles - a.roles || a.province.localeCompare(b.province, "en-CA"));
}

export const money = (n: number) => `$${n.toFixed(2)}`;
export const yearly = (n: number) => `$${(Math.round((n * HOURS_IN_A_YEAR) / 100) * 100).toLocaleString("en-CA")}`;
