// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { CLINIC_PASS, ROLE_BANDS, dollars, perDay, perPassPost } from "./pricing.ts";

test("each role band works out to around a coffee a day", () => {
  assert.deepEqual(ROLE_BANDS.map((b) => perDay(b.price)), ["$1.97", "$2.63", "$3.30"]);
});

test("the clinic pass is cheaper per post than any single post", () => {
  assert.equal(perPassPost(), "$39.80");
  for (const band of ROLE_BANDS) assert.ok(CLINIC_PASS.monthly / CLINIC_PASS.livePosts < band.price);
});

test("the yearly pass is 2 months free and shows with a comma", () => {
  assert.equal(CLINIC_PASS.monthly * 10, CLINIC_PASS.yearly);
  assert.equal(dollars(CLINIC_PASS.yearly), "$1,990");
});
