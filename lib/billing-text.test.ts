// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { paymentStatusLabel, totalPaidCents } from "./billing-text.ts";

test("each payment status has plain words", () => {
  assert.equal(paymentStatusLabel("charged"), "Paid");
  assert.equal(paymentStatusLabel("failed"), "Card refused");
  assert.equal(paymentStatusLabel("free_launch"), "Free launch, nothing to pay");
  assert.equal(paymentStatusLabel("something new"), "something new");
});

test("the total counts only what was charged", () => {
  const rows = [
    { status: "charged", amount_cents: 9900 },
    { status: "charged", amount_cents: 7900 },
    { status: "card_saved", amount_cents: 5900 },
    { status: "free_launch", amount_cents: 0 },
    { status: "failed", amount_cents: 9900 },
  ];
  assert.equal(totalPaidCents(rows), 17800);
  assert.equal(totalPaidCents([]), 0);
});
