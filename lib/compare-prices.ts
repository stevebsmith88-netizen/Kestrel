// Competitor prices for the price comparison page (/compare). Read by hand from each service's public pricing page on 6th November 2026
// (see docs/competitor-pricing.md for the sources and the rules). Canadian dollars, before tax. Re-check every figure before the page goes live,
// and change COMPARE_CHECKED when you do. Nothing here comes from scraping. Kestrel's own prices come from lib/pricing.ts so they never drift.

export const COMPARE_CHECKED = "6th November 2026";
export const ELUTA_URL = "https://www.eluta.ca/postjobs";
export const OJOBS_URL = "https://www.ojobs.ca/pricing";

// Eluta, Sponsored Job (plus tax).
export const ELUTA_SPONSORED = [
  { days: 30, total: 199 },
  { days: 60, total: 375 },
  { days: 90, total: 550 },
] as const;

// OJobs, 30 day slots, bought together. `each` is the price per slot at that quantity.
export const OJOBS_REGULAR = [
  { slots: 1, each: 249, total: 249 },
  { slots: 2, each: 225, total: 450 },
  { slots: 3, each: 200, total: 600 },
  { slots: 4, each: 175, total: 700 },
  { slots: 5, each: 150, total: 750 },
] as const;

export const OJOBS_FEATURED = [
  { slots: 1, each: 299, total: 299 },
  { slots: 2, each: 270, total: 540 },
  { slots: 3, each: 245, total: 735 },
  { slots: 4, each: 220, total: 880 },
  { slots: 5, each: 200, total: 1000 },
] as const;

// Whether the page can be seen. It is live (Steve approved on 6th November 2026, prices read the same day). Set ENABLE_COMPARE to "no" in Vercel
// to switch it off at once, for example if a competitor's prices change and have not been re-checked.
export const comparePageOn = (env: Record<string, string | undefined> = process.env) => env.ENABLE_COMPARE !== "no";
