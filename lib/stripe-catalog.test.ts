// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { CATALOG, LAUNCH_COUPON, freeLaunchOpen, priceState, productIds, stateText } from "./stripe-catalog.ts";
import { CLINIC_PASS, CLINIC_PASS_PLUS, ROLE_BANDS } from "./pricing.ts";

const find = (key: string) => CATALOG.find((c) => c.lookupKey === key)!;

test("every price on the site is in the catalog, in cents", () => {
  assert.equal(CATALOG.length, 7);
  for (const band of ROLE_BANDS) assert.equal(find(`post_${band.key}_30d`).cents, band.price * 100);
  assert.equal(find("clinic_pass_monthly").cents, CLINIC_PASS.monthly * 100);
  assert.equal(find("clinic_pass_yearly").cents, CLINIC_PASS.yearly * 100);
  assert.equal(find("clinic_pass_plus_monthly").cents, CLINIC_PASS_PLUS.monthly * 100);
  assert.equal(find("clinic_pass_plus_yearly").cents, CLINIC_PASS_PLUS.yearly * 100);
});

test("single posts are 1 time and passes repeat", () => {
  for (const band of ROLE_BANDS) assert.equal(find(`post_${band.key}_30d`).every, undefined);
  assert.equal(find("clinic_pass_monthly").every, "month");
  assert.equal(find("clinic_pass_plus_yearly").every, "year");
});

test("lookup keys are unique, and a pass shares 1 product between its monthly and yearly price", () => {
  assert.equal(new Set(CATALOG.map((c) => c.lookupKey)).size, CATALOG.length);
  assert.equal(find("clinic_pass_monthly").productId, find("clinic_pass_yearly").productId);
  assert.equal(productIds().length, 5);
});

test("the launch coupon applies to single posts only, never to a pass", () => {
  assert.equal(LAUNCH_COUPON.appliesToProducts.length, 3);
  for (const id of LAUNCH_COUPON.appliesToProducts) assert.match(id, /^kestrel_post_/);
});

test("a price is checked against what Stripe holds", () => {
  const post = find("post_support_30d");
  assert.equal(priceState(post, undefined), "missing");
  assert.equal(priceState(post, { id: "p", unit_amount: 5900, currency: "cad", recurring: null }), "ok");
  assert.equal(priceState(post, { id: "p", unit_amount: 4900, currency: "cad", recurring: null }), "different");
  assert.equal(priceState(post, { id: "p", unit_amount: 5900, currency: "usd", recurring: null }), "different");
  assert.equal(priceState(post, { id: "p", unit_amount: 5900, currency: "cad", recurring: { interval: "month" } }), "different");
  assert.equal(priceState(post, { id: "p", unit_amount: 5900, currency: "cad", active: false }), "missing");
  assert.equal(priceState(find("clinic_pass_monthly"), { id: "p", unit_amount: 19900, currency: "cad", recurring: { interval: "month" } }), "ok");
  assert.match(stateText("different"), /different price/);
});

test("the free launch is open up to and including its last day, by Toronto time", () => {
  assert.equal(freeLaunchOpen(new Date("2027-07-31T20:00:00-04:00"), "2027-07-31"), true);
  assert.equal(freeLaunchOpen(new Date("2027-08-01T00:30:00-04:00"), "2027-07-31"), false);
  assert.equal(freeLaunchOpen(new Date("2026-11-14T12:00:00-05:00"), "2027-07-31"), true);
});
