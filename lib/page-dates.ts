// The "last updated" date of each public page that shows one, as a real date, for the sitemap's last changed field. Search engines use that
// field to decide when to look at a page again, so it must be true: change the date here when the page's own "Last updated" line changes.
// lib/page-dates.test.ts checks that they agree.
export const PAGE_DATES = {
  privacy: "2026-11-13",
  terms: "2026-10-30",
  postingPolicy: "2026-11-12",
  security: "2026-11-12",
  resources: "2026-11-09",
  ontarioJobAds: "2026-11-08",
  compare: "2026-11-06",
  help: "2026-11-13",
} as const;

// The address of each page above, so the daily job can tell search engines about a page the day it changes.
const PAGE_PATHS: Record<keyof typeof PAGE_DATES, string> = {
  privacy: "/privacy",
  terms: "/terms",
  postingPolicy: "/posting-policy",
  security: "/security",
  resources: "/resources",
  ontarioJobAds: "/resources/ontario-job-ads",
  compare: "/compare",
  help: "/help",
};

// Pages whose date is within the last `days` days (3 by default, so a deploy a day after the change is still covered).
export function recentlyChangedPages(site: string, now: Date, days = 3): string[] {
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  return (Object.keys(PAGE_DATES) as (keyof typeof PAGE_DATES)[]).filter((k) => PAGE_DATES[k] >= since && PAGE_DATES[k] <= today).map((k) => `${site}${PAGE_PATHS[k]}`);
}
