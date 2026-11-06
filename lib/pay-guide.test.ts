// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { JOB_BANK_WAGES } from "./pay-benchmark-data.ts";
import { payGuide, payGuideProvinces, payGuideRow } from "./pay-guide.ts";

test("the pay table lists the provinces that have Job Bank figures, and Ontario is one of them", () => {
  const provinces = payGuideProvinces();
  assert.ok(provinces.includes("Ontario") && provinces.includes("Alberta") && provinces.includes("British Columbia"));
  assert.deepEqual(provinces, [...provinces].sort((a, b) => a.localeCompare(b, "en-CA")));
  assert.ok(!provinces.includes("Prince Edward Island"), "a province with no published figure is not listed");
});

test("every figure in the Job Bank file appears in exactly one row", () => {
  const all = payGuide();
  const rows = Object.values(all).reduce((n, list) => n + list.length, 0);
  assert.equal(rows, JOB_BANK_WAGES.length);
  for (const [province, list] of Object.entries(all)) {
    assert.equal(new Set(list.map((r) => r.role)).size, list.length, `${province} repeats a role`);
  }
});

test("Ontario shows the optometrist first, yearly, and the optician hourly with a yearly equivalent", () => {
  const ontario = payGuide().Ontario;
  assert.equal(ontario[0].role, "Optometrist");
  assert.equal(ontario[0].median, "$78,000 a year");
  assert.equal(ontario[0].yearly, "");
  assert.equal(ontario[0].years, "2021 Census");
  const optician = ontario.find((r) => r.role === "Optician");
  assert.ok(optician);
  assert.equal(optician.median, "$24.04 an hour");
  assert.equal(optician.middleHalf, "$23.00 to $33.65 an hour");
  assert.equal(optician.yearly, "About $50,000 a year");
});

test("a role without a published quartile says so, and a closest match is flagged", () => {
  const row = payGuideRow({ role: "Optician", province: "Nowhere", noc: "32100", occupation: "Opticians", match: "closest", basis: "hour", q1: null, median: 30, q3: null, survey: "Labour Force Survey", period: "2023-2024" });
  assert.equal(row.middleHalf, "Not published");
  assert.equal(row.closest, true);
  assert.equal(row.years, "Labour Force Survey 2023 to 2024");
});

test("the wording never says national average", () => {
  const text = JSON.stringify(payGuide());
  assert.ok(!/national average/i.test(text));
});
