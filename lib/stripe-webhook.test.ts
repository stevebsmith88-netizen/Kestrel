// Run with: npm test
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { verifyStripeSignature } from "./stripe-webhook.ts";

const secret = "whsec_testsecret";
const body = '{"id":"evt_1","type":"checkout.session.completed"}';
const sign = (t: number, b = body, s = secret) => `t=${t},v1=${createHmac("sha256", s).update(`${t}.${b}`).digest("hex")}`;

test("a message signed with the secret is accepted", () => {
  assert.equal(verifyStripeSignature(body, sign(1000), secret, 1000), true);
  assert.equal(verifyStripeSignature(body, sign(1000), secret, 1200), true);
});

test("a changed body, a wrong secret or a missing header is refused", () => {
  assert.equal(verifyStripeSignature(body + " ", sign(1000), secret, 1000), false);
  assert.equal(verifyStripeSignature(body, sign(1000, body, "whsec_other"), secret, 1000), false);
  assert.equal(verifyStripeSignature(body, null, secret, 1000), false);
  assert.equal(verifyStripeSignature(body, "garbage", secret, 1000), false);
  assert.equal(verifyStripeSignature(body, sign(1000), "", 1000), false);
});

test("an old message is refused, so a copy cannot be replayed", () => {
  assert.equal(verifyStripeSignature(body, sign(1000), secret, 1000 + 301), false);
  assert.equal(verifyStripeSignature(body, sign(1000), secret, 1000 - 301), false);
});

test("a header with several signatures passes when 1 matches", () => {
  const good = sign(1000).split(",")[1];
  assert.equal(verifyStripeSignature(body, `t=1000,v1=${"0".repeat(64)},${good}`, secret, 1000), true);
});
