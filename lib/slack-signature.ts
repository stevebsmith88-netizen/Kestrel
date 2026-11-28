import { createHmac, timingSafeEqual } from "node:crypto";

// Checks that a message to /api/slack/actions really came from Slack (Steve, 14th November 2026; plan in docs/plans/slack-approvals.md). Slack signs
// every message with the app's signing secret: HMAC SHA256 of "v0:<timestamp>:<exact body>". A message older than 5 minutes is refused, so a copy
// of an old one cannot be replayed. Without the secret every message is refused.
export const MAX_AGE_SECONDS = 5 * 60;

export function verifySlackSignature(args: { signingSecret: string | undefined; timestamp: string | null; signature: string | null; body: string; now?: Date }): boolean {
  const { signingSecret, timestamp, signature, body } = args;
  if (!signingSecret || !timestamp || !signature || !/^\d+$/.test(timestamp)) return false;
  const nowSeconds = Math.floor((args.now ?? new Date()).getTime() / 1000);
  if (Math.abs(nowSeconds - Number(timestamp)) > MAX_AGE_SECONDS) return false;
  const expected = `v0=${createHmac("sha256", signingSecret).update(`v0:${timestamp}:${body}`).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

// For the tests: how Slack would sign a body.
export const signForTest = (secret: string, timestamp: string, body: string) => `v0=${createHmac("sha256", secret).update(`v0:${timestamp}:${body}`).digest("hex")}`;
