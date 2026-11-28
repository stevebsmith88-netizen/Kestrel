// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { REVIEW_NOTICES, reviewMessage, reviewSucceeded } from "./review-notices.ts";

test("only approving and sending back count as done", () => {
  assert.equal(reviewSucceeded("approved"), true);
  assert.equal(reviewSucceeded("rejected"), true);
  for (const key of ["quebec", "need-note", "payment-failed", "payment-error", "error"]) assert.equal(reviewSucceeded(key), false, key);
});

test("a payment problem carries its short reason, and nothing else does", () => {
  assert.match(reviewMessage("payment-error", "Invalid mode: setup"), /Reason: Invalid mode: setup/);
  assert.match(reviewMessage("payment-failed", "Insufficient funds"), /Reason: Insufficient funds/);
  assert.equal(reviewMessage("approved", "ignored"), REVIEW_NOTICES.approved);
  assert.equal(reviewMessage("payment-error"), REVIEW_NOTICES["payment-error"]);
});

test("an unknown key falls back to the general message", () => {
  assert.equal(reviewMessage("nonsense"), REVIEW_NOTICES.error);
});
