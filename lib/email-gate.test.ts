// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { emailGate } from "./email-gate.ts";

// P1-23: the do not email list is checked for every email Kestrel sends. Password and sign in emails are sent by Supabase
// itself, never through lib/email.ts, so they are not affected.

test("an address that bounced or complained is skipped, whatever the email", () => {
  for (const reason of ["bounced", "complaint"]) {
    assert.equal(emailGate([reason], { marketing: false }), "skip", `${reason}, account email`);
    assert.equal(emailGate([reason], { marketing: true }), "skip", `${reason}, marketing email`);
  }
});

test("an address that unsubscribed still gets account emails, but no marketing", () => {
  for (const reason of ["unsubscribed", "asked_to_stop", "admin"]) {
    assert.equal(emailGate([reason], { marketing: false }), "send", `${reason}, account email`);
    assert.equal(emailGate([reason], { marketing: true }), "skip", `${reason}, marketing email`);
  }
});

test("an address that is not on the list is sent both kinds", () => {
  assert.equal(emailGate([], { marketing: false }), "send");
  assert.equal(emailGate([], { marketing: true }), "send");
});

test("if the list cannot be read, marketing is held back and account emails still go", () => {
  assert.equal(emailGate(null, { marketing: true }), "skip");
  assert.equal(emailGate(null, { marketing: false }), "send");
});

test("deliverEmail checks the list for every email, not only those with an unsubscribe link", () => {
  const source = readFileSync(new URL("./email.ts", import.meta.url), "utf8");
  assert.match(source, /emailGate\(await suppressionReasons\(to\), \{ marketing: Boolean\(unsubscribeUrl\) \}\)/);
  assert.doesNotMatch(source, /if \(unsubscribeUrl && \(await isSuppressed/);
});

test("the waitlist confirmation email passes its unsubscribe link through", () => {
  const source = readFileSync(new URL("../app/api/waitlist/route.ts", import.meta.url), "utf8");
  assert.match(source, /sendEmail\(\{ to: values\.email, subject: "Please confirm your email for the Kestrel waitlist", unsubscribeUrl, \.\.\.mail \}\)/);
});
