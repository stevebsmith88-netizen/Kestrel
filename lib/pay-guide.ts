// The public pay table on the Resources page: for each province, the typical pay for each role. It uses the same Job Bank figures as the
// pay benchmark on the post a job form (lib/pay-benchmark-data.ts), so the two never disagree. Guidance only. The wording is "typical" and
// "median", never "national average". Kept free of imports from the app so it can be tested on its own (lib/pay-guide.test.ts).

import { HOURS_IN_A_YEAR } from "./jobs.ts";
import { JOB_BANK_SOURCE, JOB_BANK_WAGES, type JobBankWage } from "./pay-benchmark-data.ts";
import { LICENCE_STATEMENT, LICENCE_URL, plainDate } from "./pay-benchmark.ts";

// Roles the public pay table leaves out (Steve's decision, 6th November 2026). The post a job form still compares optometrist pay.
export const LEFT_OUT_ROLES: readonly string[] = ["Optometrist"];
// Provinces the public pay table leaves out (Steve's decision, 6th November 2026).
export const LEFT_OUT_PROVINCES: readonly string[] = ["Quebec"];
const shown = (wages: readonly JobBankWage[]) => wages.filter((w) => !LEFT_OUT_ROLES.includes(w.role) && !LEFT_OUT_PROVINCES.includes(w.province));

const ROLE_ORDER = ["Optometrist", "Optician", "Optometric assistant or technician", "Patient care or reception", "Practice or clinic manager"];

export type PayGuideRow = {
  role: string;
  median: string; // "$24.04 an hour" or "$78,000 a year"
  yearly: string; // for an hourly role, the same median over a 2,080 hour year. Empty for a yearly role.
  middleHalf: string; // first to third quartile, or "Not published"
  group: string; // the Job Bank group's name
  years: string; // the survey and the years it covers
  closest: boolean; // Kestrel picked the nearest Job Bank group for this role
};

const dollars = (value: number, basis: JobBankWage["basis"]) => (basis === "hour" ? `$${value.toFixed(2)}` : `$${(Math.round(value / 100) * 100).toLocaleString("en-CA")}`);
const unit = (basis: JobBankWage["basis"]) => (basis === "hour" ? "an hour" : "a year");

export function payGuideRow(w: JobBankWage): PayGuideRow {
  const hasRange = w.q1 !== null && w.q3 !== null;
  return {
    role: w.role,
    median: `${dollars(w.median, w.basis)} ${unit(w.basis)}`,
    yearly: w.basis === "hour" ? `About ${dollars(w.median * HOURS_IN_A_YEAR, "year")} a year` : "",
    middleHalf: hasRange ? `${dollars(w.q1 as number, w.basis)} to ${dollars(w.q3 as number, w.basis)} ${unit(w.basis)}` : "Not published",
    group: w.occupation,
    years: w.survey.includes(w.period) ? w.survey : `${w.survey} ${w.period.replace("-", " to ")}`, // "2021 Census", not "2021 Census 2021"
    closest: w.match === "closest",
  };
}

// Provinces that have at least one figure, in alphabetical order.
export function payGuideProvinces(wages: readonly JobBankWage[] = JOB_BANK_WAGES): string[] {
  return [...new Set(shown(wages).map((w) => w.province))].sort((a, b) => a.localeCompare(b, "en-CA"));
}

// Every province's rows, roles in a fixed order. Roles in LEFT_OUT_ROLES and provinces in LEFT_OUT_PROVINCES are not included.
export function payGuide(wages: readonly JobBankWage[] = JOB_BANK_WAGES): Record<string, PayGuideRow[]> {
  const out: Record<string, PayGuideRow[]> = {};
  for (const province of payGuideProvinces(wages)) {
    out[province] = shown(wages)
      .filter((w) => w.province === province)
      .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))
      .map(payGuideRow);
  }
  return out;
}

// The Dataset structured data for the pay table on /resources (audit P1-52), so search engines and AI assistants can see where the figures
// come from, under what licence and how recent they are. It describes only what the table shows: the same provinces and roles, the median
// and the middle half of pay. Dates follow the Job Bank file the table is built from.
export function payDatasetJsonLd(site: string) {
  const provinces = payGuideProvinces();
  const roles = [...new Set(Object.values(payGuide()).flat().map((r) => r.role))];
  const fileDate = plainDate(JOB_BANK_SOURCE.revised);
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Typical pay for eye care roles in Canada, by province",
    description: `The median and the middle half of pay (first to third quartile) for eye care roles in each province where Job Bank publishes a figure, with hourly pay also shown over a 2,080 hour year. Adapted by Kestrel Eye Care Jobs from ${JOB_BANK_SOURCE.name}, file of ${fileDate}. Guidance only, and not endorsed by the Government of Canada.`,
    url: `${site}/resources#pay`,
    inLanguage: "en-CA",
    dateModified: JOB_BANK_SOURCE.revised,
    keywords: ["eye care pay", "Canada", ...roles],
    variableMeasured: ["Median pay", "First quartile of pay", "Third quartile of pay"],
    spatialCoverage: provinces.map((name) => ({ "@type": "Place", name })),
    creator: { "@type": "Organization", name: "Kestrel Eye Care Jobs", url: site },
    creditText: `Source: ${JOB_BANK_SOURCE.name}, file of ${fileDate}. ${LICENCE_STATEMENT}`,
    isBasedOn: {
      "@type": "Dataset",
      name: JOB_BANK_SOURCE.name,
      url: JOB_BANK_SOURCE.dataset,
      dateModified: JOB_BANK_SOURCE.revised,
      license: LICENCE_URL,
      publisher: { "@type": "Organization", name: "Employment and Social Development Canada" },
    },
  };
}
