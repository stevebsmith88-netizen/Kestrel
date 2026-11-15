// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { reportAckEmail } from "./report-ack.ts";

test("the acknowledgement repeats the 2 business day promise and links to the policy", () => {
  const m = reportAckEmail("Optician");
  assert.match(m.text, /within 2 business days/);
  assert.match(m.text, /\/fake-jobs/);
  assert.match(m.html, /If that was not you, you can ignore this email/);
});

test("it does not repeat the reason or the details the person wrote", () => {
  const m = reportAckEmail("Optician");
  assert.doesNotMatch(m.text, /scam|details|reason/i);
});

test("it is sent only when an address was left, and at most once a day for each address", () => {
  const source = readFileSync(new URL("./report-actions.ts", import.meta.url), "utf8");
  assert.match(source, /if \(sendAck\) await sendEmail\(/);
  assert.match(source, /\.eq\("reporter_email", email\)\.gte\("created_at", since\)/);
});
