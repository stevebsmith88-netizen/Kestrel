// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { CHECKED_ON, EYE_CARE_NUMBERS, NUMBER_SOURCES, formatCount } from "./eye-care-numbers.ts";

test("the figures on the home page are the ones in docs/market-sizing.md", () => {
  const byLabel = Object.fromEntries(EYE_CARE_NUMBERS.map((n) => [n.label, n]));
  assert.equal(byLabel["optometrists working in Canada"].value, 6400);
  assert.equal(byLabel["opticians working in Canada"].value, 11700);
  assert.equal(byLabel["optometry practices across the country"].value, 4000);
  assert.equal(byLabel["eye care roles advertised every year"].value, 2000);
});

test("a figure that is only an estimate is labelled as one, and shown as a floor", () => {
  for (const n of EYE_CARE_NUMBERS.filter((x) => x.estimate)) {
    assert.equal(n.source, "Kestrel estimate");
    assert.equal(n.suffix, "+");
  }
  assert.ok(EYE_CARE_NUMBERS.every((n) => n.source.length > 0));
});

test("every source is a secure link, and nothing uses an em dash", () => {
  assert.ok(NUMBER_SOURCES.length >= 4 && NUMBER_SOURCES.every((s) => s.url.startsWith("https://")));
  const text = JSON.stringify([EYE_CARE_NUMBERS, NUMBER_SOURCES, CHECKED_ON]);
  assert.ok(!text.includes("—"));
});

test("numbers are written with a comma, the Canadian way", () => {
  assert.equal(formatCount(11700), "11,700");
  assert.equal(formatCount(0), "0");
});
