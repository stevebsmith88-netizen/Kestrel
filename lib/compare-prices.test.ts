// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { comparePageOn, ELUTA_SPONSORED, OJOBS_FEATURED, OJOBS_REGULAR } from "./compare-prices.ts";
import { CLINIC_PASS, CLINIC_PASS_PLUS, perPassPost } from "./pricing.ts";

test("OJobs totals are the slot price times the number of slots, and each extra slot is cheaper", () => {
  for (const table of [OJOBS_REGULAR, OJOBS_FEATURED]) {
    for (const row of table) assert.equal(row.each * row.slots, row.total);
    for (let i = 1; i < table.length; i++) assert.ok(table[i].each < table[i - 1].each);
  }
});

test("a featured slot costs more than a regular slot at every quantity", () => {
  OJOBS_REGULAR.forEach((r, i) => assert.ok(OJOBS_FEATURED[i].each > r.each));
});

test("longer Eluta postings cost more in total and less per 30 days", () => {
  for (let i = 1; i < ELUTA_SPONSORED.length; i++) {
    assert.ok(ELUTA_SPONSORED[i].total > ELUTA_SPONSORED[i - 1].total);
    assert.ok(ELUTA_SPONSORED[i].total / (ELUTA_SPONSORED[i].days / 30) < ELUTA_SPONSORED[i - 1].total / (ELUTA_SPONSORED[i - 1].days / 30));
  }
});

test("Kestrel's pass prices per post come from lib/pricing.ts", () => {
  assert.equal(perPassPost(CLINIC_PASS), "$39.80");
  assert.equal(perPassPost(CLINIC_PASS_PLUS), "$69.80");
});

test("the compare page is hidden on the live site unless ENABLE_COMPARE is yes, and shown on previews", () => {
  assert.equal(comparePageOn({ VERCEL_ENV: "production" }), false);
  assert.equal(comparePageOn({ VERCEL_ENV: "production", ENABLE_COMPARE: "true" }), false);
  assert.equal(comparePageOn({ VERCEL_ENV: "production", ENABLE_COMPARE: "yes" }), true);
  assert.equal(comparePageOn({ VERCEL_ENV: "preview" }), true);
  assert.equal(comparePageOn({}), true);
});
