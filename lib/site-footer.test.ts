// Run with: npm test
// The shared footer (components/AppFooter.tsx) and the Data sources credits it links to.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const footer = readFileSync("components/AppFooter.tsx", "utf8");
const hrefs = [...footer.matchAll(/href[:=]\s*"(\/[^"]*)"/g)].map((m) => m[1]);

function pageExists(href: string): boolean {
  const path = href.split("#")[0].replace(/^\//, "");
  if (path === "") return true;
  const walk = (dir: string, rest: string[]): boolean => {
    if (rest.length === 0) return existsSync(join(dir, "page.tsx"));
    const [head, ...tail] = rest;
    return existsSync(join(dir, head)) && statSync(join(dir, head)).isDirectory() && walk(join(dir, head), tail);
  };
  return walk("app", path.split("/"));
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return full.endsWith(".tsx") ? [full] : [];
  });
}

test("the footer has all the agreed links, and each one goes to a page that exists", () => {
  for (const want of ["/jobs", "/eye-care-jobs", "/blog", "/clinics", "/resources", "/help", "/contact", "/security", "/resources#data-sources", "/privacy", "/terms", "/posting-policy"]) {
    assert.ok(hrefs.includes(want), `the footer is missing ${want}`);
  }
  for (const h of hrefs) assert.ok(pageExists(h), `${h} is not a page`);
});

test("Find your fit and Compare prices show only while their pages are switched on", () => {
  assert.match(footer, /findYourFitOn\(\)\s*\?/);
  assert.match(footer, /comparePageOn\(\)\s*\?/);
});

test("the street address is not on the website", () => {
  assert.ok(!/Yonge/i.test(footer));
});

test("no page carries its own footer, so every page shows the shared one", () => {
  for (const f of [...sourceFiles("app"), ...sourceFiles("components")]) {
    if (f.endsWith("AppFooter.tsx")) continue;
    assert.ok(!/<footer[\s>]/.test(readFileSync(f, "utf8")), `${f} has its own footer`);
  }
});

test("the Data sources block credits GeoNames and Job Bank with their licence links", () => {
  const page = readFileSync("app/resources/page.tsx", "utf8");
  assert.match(page, /id="data-sources"/);
  assert.match(page, /adapted from/i);
  assert.ok(page.includes("https://www.geonames.org/"));
  assert.ok(page.includes("https://creativecommons.org/licenses/by/4.0/"));
  assert.ok(page.includes("https://www.jobbank.gc.ca/"));
  assert.ok(page.includes("https://open.canada.ca/en/open-government-licence-canada"));
  assert.ok(!/[–—]/.test(page.slice(page.indexOf('id="data-sources"'))), "no dash used as punctuation in the credits");
});

test("the old grey GeoNames line is gone from the jobs page and its style from the stylesheet", () => {
  assert.ok(!/GeoNames/.test(readFileSync("app/jobs/page.tsx", "utf8")));
  assert.ok(!/creditline/.test(readFileSync("app/globals.css", "utf8")));
});

test("the Job Bank credit still sits beside the pay table, the landing pages and the post a job form", () => {
  assert.match(readFileSync("app/resources/page.tsx", "utf8"), /LICENCE_STATEMENT/);
  assert.match(readFileSync("components/LandingView.tsx", "utf8"), /Open Government Licence/);
  assert.match(readFileSync("components/PayBenchmark.tsx", "utf8"), /LICENCE_STATEMENT/);
});
