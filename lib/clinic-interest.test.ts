// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanInterest, nameKey } from "./clinic-interest.ts";

test("the same clinic typed 2 ways gets the same key", () => {
  assert.equal(nameKey("Brightview  Optical", "North York"), nameKey("brightview optical", "north-york"));
  assert.notEqual(nameKey("Brightview Optical", "Guelph"), nameKey("Brightview Optical", "Barrie"));
});

test("a clean answer keeps only what is needed", () => {
  const out = cleanInterest({ clinicName: "  Brightview Optical ", town: "Guelph", province: "Ontario", website: "brightview.ca/about?x=1" });
  assert.deepEqual(out.value, { clinicName: "Brightview Optical", town: "Guelph", province: "Ontario", website: "https://brightview.ca", key: "brightview optical|guelph" });
  assert.deepEqual(cleanInterest({ clinicName: "Lakeview" }).value, { clinicName: "Lakeview", town: null, province: null, website: null, key: "lakeview|" });
});

test("a missing name, a made up province or a bad website is refused", () => {
  assert.ok(cleanInterest({ clinicName: "x" }).errors?.clinicName);
  assert.ok(cleanInterest({ clinicName: "Lakeview", province: "Narnia" }).errors?.province);
  assert.ok(cleanInterest({ clinicName: "Lakeview", website: "not a site" }).errors?.website);
  assert.ok(cleanInterest({ clinicName: "Lakeview", website: "javascript:alert(1)" }).errors?.website);
});
