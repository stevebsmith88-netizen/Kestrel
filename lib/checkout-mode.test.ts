// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { bandForRole, bandMismatchFlag, chargeNotice, jobPriceCents, paymentLine, paymentMode } from "./checkout-mode.ts";
import { ROLES } from "./waitlist.ts";
import { FIELD_ROLES } from "./jobs.ts";

test("each role lands in the band the pricing ladder names", () => {
  assert.equal(bandForRole("Optometrist"), "optometrists");
  assert.equal(bandForRole("Optician"), "opticians");
  assert.equal(bandForRole("Practice or clinic manager"), "opticians");
  assert.equal(bandForRole("Optometric assistant or technician"), "support");
  assert.equal(bandForRole("Patient care or reception"), "support");
});

test("every role has a price, and an unknown role is never cheaper than the middle band", () => {
  for (const role of [...ROLES, ...FIELD_ROLES]) assert.ok(jobPriceCents(role) >= 5900, role);
  assert.equal(jobPriceCents("Optometrist"), 9900);
  assert.equal(jobPriceCents("Optician"), 7900);
  assert.equal(jobPriceCents("Patient care or reception"), 5900);
  assert.equal(jobPriceCents(null), 7900);
  assert.equal(jobPriceCents("something new"), 7900);
});

test("no card is asked for during the free launch, or without a Stripe key", () => {
  assert.equal(paymentMode({ freeLaunchOpen: true, keyMode: "live", force: false }), "free");
  assert.equal(paymentMode({ freeLaunchOpen: true, keyMode: "test", force: false }), "free");
  assert.equal(paymentMode({ freeLaunchOpen: false, keyMode: null, force: true }), "free");
});

test("after the free launch a card is asked for with a live key only, unless checkout is forced for a trial", () => {
  assert.equal(paymentMode({ freeLaunchOpen: false, keyMode: "live", force: false }), "card");
  assert.equal(paymentMode({ freeLaunchOpen: false, keyMode: "test", force: false }), "free");
  assert.equal(paymentMode({ freeLaunchOpen: true, keyMode: "test", force: true }), "card");
});

test("the line beside the button says nothing is charged yet", () => {
  assert.match(chargeNotice(9900), /not charged now.*\$99 plus HST.*approves/);
  assert.match(chargeNotice(7900), /\$79 plus HST/);
});

test("a title that says optometrist under a lower band is flagged, from the title only", () => {
  assert.match(bandMismatchFlag("Associate Optometrist", "Optical assistant") ?? "", /Check the role/);
  assert.match(bandMismatchFlag("Full time OD wanted", "Optician") ?? "", /optometrist/);
  assert.equal(bandMismatchFlag("Associate Optometrist", "Optometrist"), null);
  assert.equal(bandMismatchFlag("Optometric assistant", "Optometric assistant or technician"), null);
  assert.equal(bandMismatchFlag("Optician", "Optician"), null);
});

test("the reviewer's payment line says what approving will do", () => {
  assert.match(paymentLine(null, "Optician"), /No payment recorded/);
  assert.match(paymentLine({ status: "card_saved", amount_cents: 7900, band: "opticians", failure_message: null }, "Optician"), /charges \$79 plus HST/);
  assert.match(paymentLine({ status: "card_saved", amount_cents: 5900, band: "support", failure_message: null }, "Optometrist"), /charges \$99.*role has changed/);
  assert.match(paymentLine({ status: "charged", amount_cents: 9900, band: "optometrists", failure_message: null }, "Optometrist"), /Charged \$99/);
  assert.match(paymentLine({ status: "failed", amount_cents: 7900, band: "opticians", failure_message: "Your card was declined." }, "Optician"), /refused \(Your card was declined/);
  assert.match(paymentLine({ status: "free_launch", amount_cents: 0, band: "opticians", failure_message: null }, "Optician"), /Free launch/);
});
