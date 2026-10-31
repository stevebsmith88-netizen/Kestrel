// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { joinAction, waitlistStatus } from "./waitlist-join.ts";

const NOW = Date.parse("2026-11-10T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW - h * 3600_000).toISOString();

test("a new address is added", () => {
  assert.equal(joinAction(null, NOW), "add");
});

test("an address already on the list is never changed from the public form", () => {
  assert.equal(joinAction({ confirmed_at: hoursAgo(500), confirmation_sent_at: hoursAgo(600), unsubscribed_at: null }, NOW), "nothing");
  assert.equal(joinAction({ confirmed_at: hoursAgo(500), confirmation_sent_at: hoursAgo(600), unsubscribed_at: hoursAgo(48) }, NOW), "nothing");
  assert.equal(joinAction({ confirmed_at: null, confirmation_sent_at: hoursAgo(1000), unsubscribed_at: hoursAgo(10) }, NOW), "nothing");
});

test("an unconfirmed address is sent a link, but no more than 1 an hour", () => {
  assert.equal(joinAction({ confirmed_at: null, confirmation_sent_at: hoursAgo(2), unsubscribed_at: null }, NOW), "send-confirmation");
  assert.equal(joinAction({ confirmed_at: null, confirmation_sent_at: null, unsubscribed_at: null }, NOW), "send-confirmation");
  assert.equal(joinAction({ confirmed_at: null, confirmation_sent_at: hoursAgo(0.5), unsubscribed_at: null }, NOW), "nothing");
});

test("only confirmed people who have not asked to stop are ready to email", () => {
  const blocked = new Set(["gone@clinic.ca", "@blocked.ca"]);
  assert.equal(waitlistStatus({ email: "a@clinic.ca", confirmed_at: "x", unsubscribed_at: null }, blocked), "ready");
  assert.equal(waitlistStatus({ email: "a@clinic.ca", confirmed_at: null, unsubscribed_at: null }, blocked), "not confirmed");
  assert.equal(waitlistStatus({ email: "a@clinic.ca", confirmed_at: "x", unsubscribed_at: "y" }, blocked), "unsubscribed");
  assert.equal(waitlistStatus({ email: "Gone@Clinic.ca", confirmed_at: "x", unsubscribed_at: null }, blocked), "do not email");
  assert.equal(waitlistStatus({ email: "anyone@blocked.ca", confirmed_at: "x", unsubscribed_at: null }, blocked), "do not email");
});
