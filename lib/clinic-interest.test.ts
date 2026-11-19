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

import { matchPublicClinic } from "./clinic-interest.ts";

const places = [
  { id: "c1", clinic_name: "Brightview Optical", city: "Guelph", province: "Ontario" },
  { id: "c2", clinic_name: "Lenscrafters", city: "Mississauga", province: "Ontario" },
  { id: "c3", clinic_name: "Lenscrafters", city: "Lethbridge", province: "Alberta" },
];

test("a request is matched to the clinic that joined, ignoring spelling and capitals", () => {
  assert.equal(matchPublicClinic({ name_key: nameKey("brightview  optical", "guelph") }, places)?.id, "c1");
  assert.equal(matchPublicClinic({ name_key: nameKey("Brightview Optical", ""), province: "Ontario" }, places)?.id, "c1");
});

test("a town or province that does not match is not told", () => {
  assert.equal(matchPublicClinic({ name_key: nameKey("Brightview Optical", "Barrie") }, places), null);
  assert.equal(matchPublicClinic({ name_key: nameKey("Brightview Optical", ""), province: "Alberta" }, places), null);
  assert.equal(matchPublicClinic({ name_key: nameKey("Brightview", "Guelph") }, places), null, "a part of the name is not enough");
});

test("a chain with no town given is not guessed at, but one with a town or province is found", () => {
  assert.equal(matchPublicClinic({ name_key: nameKey("Lenscrafters", "") }, places), null);
  assert.equal(matchPublicClinic({ name_key: nameKey("Lenscrafters", "Lethbridge") }, places)?.id, "c3");
  assert.equal(matchPublicClinic({ name_key: nameKey("Lenscrafters", ""), province: "Alberta" }, places)?.id, "c3");
});

test("the daily job claims each request before telling anyone, so nobody is told twice", async () => {
  const { readFileSync } = await import("node:fs");
  const cron = readFileSync(new URL("../app/api/cron/daily/route.ts", import.meta.url), "utf8");
  const claim = cron.indexOf('from("employer_interest").update({ notified_at');
  const send = cron.indexOf("INTEREST_JOINED_TITLE(match.clinic_name), body:");
  assert.ok(claim > 0 && send > claim, "the claim comes first");
  assert.match(cron, /\.is\("notified_at", null\)\.select\("id"\)/);
});
