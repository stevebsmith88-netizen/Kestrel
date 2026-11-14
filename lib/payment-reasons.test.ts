// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { plainReason } from "./payment-reasons.ts";

const card = (declineCode: string | null, code: string | null = "card_declined") => plainReason({ status: 402, type: "card_error", code, declineCode });

test("a refused card gets 1 of a few plain reasons, and the clinic is asked for a new card", () => {
  assert.deepEqual(card("insufficient_funds"), { label: "Insufficient funds", cardRefused: true });
  assert.deepEqual(card(null, "expired_card"), { label: "Card expired", cardRefused: true });
  assert.deepEqual(card("lost_card"), { label: "Card declined", cardRefused: true });
  assert.deepEqual(card("generic_decline"), { label: "Card declined", cardRefused: true });
  assert.deepEqual(card(null, "authentication_required"), { label: "Card needs the cardholder to confirm", cardRefused: true });
});

test("Stripe or the network not answering is the payment system being down, and is not the clinic's to fix", () => {
  assert.deepEqual(plainReason({ status: null, type: null, code: null, declineCode: null }), { label: "Payment system down", cardRefused: false });
  assert.deepEqual(plainReason({ status: 503, type: "api_error", code: null, declineCode: null }), { label: "Payment system down", cardRefused: false });
  assert.deepEqual(plainReason({ status: 429, type: "rate_limit_error", code: null, declineCode: null }), { label: "Payment system down", cardRefused: false });
});

test("a mistake in our request is a set up problem, never a card problem", () => {
  assert.deepEqual(plainReason({ status: 400, type: "invalid_request_error", code: "parameter_unknown", declineCode: null }), { label: "Set up problem", cardRefused: false });
  assert.deepEqual(plainReason({ status: 401, type: "invalid_request_error", code: "api_key_invalid", declineCode: null }), { label: "Set up problem", cardRefused: false });
});
