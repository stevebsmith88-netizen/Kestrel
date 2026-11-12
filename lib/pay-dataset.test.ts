// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { JOB_BANK_SOURCE } from "./pay-benchmark-data.ts";
import { LICENCE_STATEMENT, LICENCE_URL } from "./pay-benchmark.ts";
import { payDatasetJsonLd, payGuide, payGuideProvinces } from "./pay-guide.ts";

// Audit P1-52 (a): the pay table on /resources carries Dataset data naming the Job Bank source, its licence and its date, and it describes
// only what the table shows (the provinces and roles in it, the median and the middle half of pay).
const SITE = "https://eyecarejobs.ca";

test("the pay table's data set names its Job Bank source, licence and date", () => {
  const d = payDatasetJsonLd(SITE) as Record<string, any>;
  assert.equal(d["@type"], "Dataset");
  assert.equal(d.url, `${SITE}/resources#pay`);
  assert.equal(d.isBasedOn.url, JOB_BANK_SOURCE.dataset);
  assert.equal(d.isBasedOn.license, LICENCE_URL);
  assert.equal(d.isBasedOn.dateModified, JOB_BANK_SOURCE.revised);
  assert.equal(d.dateModified, JOB_BANK_SOURCE.revised);
  assert.ok(d.creditText.includes(LICENCE_STATEMENT));
  assert.match(d.description, /19th November 2025/);
  assert.ok(d.name.length > 0 && d.description.length >= 50 && d.description.length <= 5000);
});

test("it covers exactly the provinces and roles the table shows", () => {
  const d = payDatasetJsonLd(SITE) as Record<string, any>;
  const provinces = payGuideProvinces();
  assert.deepEqual(d.spatialCoverage.map((p: { name: string }) => p.name), provinces);
  const roles = [...new Set(Object.values(payGuide()).flat().map((r) => r.role))].sort();
  assert.deepEqual([...d.keywords].filter((k: string) => roles.includes(k)).sort(), roles);
  assert.ok(!JSON.stringify(d).includes("Optometrist"), "optometrists are left out of the public table");
  assert.ok(!JSON.stringify(d).includes("Quebec"), "Quebec is left out of the public table");
});

test("the resources page puts the data set on the page", () => {
  assert.match(readFileSync("app/resources/page.tsx", "utf8"), /payDatasetJsonLd\(/);
});
