// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PAGE_DATES, recentlyChangedPages } from "./page-dates.ts";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const iso = (text: string) => {
  const m = text.match(/(\d{1,2})(?:st|nd|rd|th) ([A-Z][a-z]+) (\d{4})/);
  assert.ok(m, `no date found in: ${text}`);
  return `${m![3]}-${String(MONTHS.indexOf(m![2]) + 1).padStart(2, "0")}-${m![1].padStart(2, "0")}`;
};
const shown = (file: string) => iso(readFileSync(file, "utf8").match(/const (?:UPDATED|COMPARE_CHECKED) = "([^"]+)"/)![1]);

test("the sitemap dates match the 'last updated' line on each page", () => {
  assert.equal(PAGE_DATES.privacy, shown("app/privacy/page.tsx"));
  assert.equal(PAGE_DATES.terms, shown("app/terms/page.tsx"));
  assert.equal(PAGE_DATES.postingPolicy, shown("app/posting-policy/page.tsx"));
  assert.equal(PAGE_DATES.security, shown("app/security/page.tsx"));
  assert.equal(PAGE_DATES.resources, shown("app/resources/page.tsx"));
  assert.equal(PAGE_DATES.ontarioJobAds, shown("app/resources/ontario-job-ads/page.tsx"));
  assert.equal(PAGE_DATES.compare, shown("lib/compare-prices.ts"));
});

test("a page changed in the last 3 days is sent to search engines, and an old one is not", () => {
  const now = new Date("2026-11-09T09:00:00Z");
  const urls = recentlyChangedPages("https://eyecarejobs.ca", now);
  assert.ok(urls.includes("https://eyecarejobs.ca/resources/ontario-job-ads"));
  assert.ok(urls.includes("https://eyecarejobs.ca/resources"));
  assert.ok(!urls.includes("https://eyecarejobs.ca/terms"));
  assert.deepEqual(recentlyChangedPages("https://eyecarejobs.ca", new Date("2027-03-01T09:00:00Z")), []);
});
