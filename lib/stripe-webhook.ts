// Checks that a message really came from Stripe. Stripe signs each message with the webhook's signing secret: the header holds a time
// and one or more signatures, each an HMAC SHA256 of "time.body". A message more than 5 minutes old is refused, so a copy cannot be
// replayed later. Pure, so it can be tested (lib/stripe-webhook.test.ts).

import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyStripeSignature(body: string, header: string | null, secret: string, nowSeconds: number = Math.floor(Date.now() / 1000), toleranceSeconds = 300): boolean {
  if (!header || !secret) return false;
  const parts = header.split(",").map((p) => p.trim().split("="));
  const t = parts.find(([k]) => k === "t")?.[1];
  const signatures = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || !/^\d+$/.test(t) || !signatures.length) return false;
  if (Math.abs(nowSeconds - Number(t)) > toleranceSeconds) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${body}`).digest();
  return signatures.some((s) => {
    if (!/^[0-9a-f]{64}$/i.test(s)) return false;
    return timingSafeEqual(Buffer.from(s, "hex"), expected);
  });
}
