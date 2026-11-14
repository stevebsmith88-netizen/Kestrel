// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { foundingOfferOpen, foundingReminderEmail, foundingThanksEmail, foundingWelcomeEmail, lockEnds, placesLeft, reminderDue, yearlyOffered, yearlySaving } from "./founding.ts";

test("the founding offer is open while the free launch is, up to and including its last day", () => {
  assert.equal(foundingOfferOpen(new Date("2027-07-31T20:00:00-04:00"), "2027-07-31"), true);
  assert.equal(foundingOfferOpen(new Date("2027-08-01T01:00:00-04:00"), "2027-07-31"), false);
});

test("the lock ends 12 months after the pass starts, and never on a day that does not exist", () => {
  assert.equal(lockEnds(new Date("2027-03-15T12:00:00Z")).toISOString().slice(0, 10), "2028-03-15");
  assert.equal(lockEnds(new Date("2027-02-28T12:00:00Z")).toISOString().slice(0, 10), "2028-02-28");
  assert.equal(lockEnds(new Date("2028-02-29T12:00:00Z")).toISOString().slice(0, 10), "2029-02-28");
  assert.equal(lockEnds(new Date("2027-01-31T12:00:00Z"), 1).toISOString().slice(0, 10), "2027-02-28");
});

test("the 30 days notice is due from 30 days before the lock ends until it ends", () => {
  const end = new Date("2028-03-15T12:00:00Z");
  assert.equal(reminderDue(end, new Date("2028-02-14T11:59:59Z")), false);
  assert.equal(reminderDue(end, new Date("2028-02-14T12:00:00Z")), true);
  assert.equal(reminderDue(end, new Date("2028-02-15T12:00:00Z")), true);
  assert.equal(reminderDue(end, new Date("2028-03-14T12:00:00Z")), true);
  assert.equal(reminderDue(end, new Date("2028-03-15T12:00:00Z")), false);
});

test("only a Founding clinic can take the yearly option, and only while the offer is open", () => {
  assert.equal(yearlyOffered({ founding: true, offerOpen: true }), true);
  assert.equal(yearlyOffered({ founding: true, offerOpen: false }), false);
  assert.equal(yearlyOffered({ founding: false, offerOpen: true }), false);
  assert.deepEqual(yearlySaving(199, 1990), { twelveMonths: 2388, saved: 398 });
  assert.equal(placesLeft(12), 38);
  assert.equal(placesLeft(60), 0);
});

test("the 3 emails say what they promise", async () => {
  const welcome = foundingWelcomeEmail({ clinicName: "Riverside Eye Care", number: 7 });
  assert.match(welcome.subject, /first 50/);
  assert.ok(welcome.html.includes("Founding clinic number 7 of 50"));
  const thanks = foundingThanksEmail({ planName: "Clinic pass", interval: "month", priceDollars: 199, lockedUntil: new Date("2028-03-15T12:00:00Z") });
  assert.ok(thanks.html.includes("$199 a month plus HST") && thanks.html.includes("locked until March 15, 2028"));
  const yearly = foundingThanksEmail({ planName: "Clinic pass", interval: "year", priceDollars: 1990, lockedUntil: null });
  assert.ok(yearly.html.includes("$1,990 a year") && yearly.html.includes("stays the same each year"));
  const reminder = foundingReminderEmail({ planName: "Clinic pass", lockEnd: new Date("2028-03-15T12:00:00Z"), newPriceDollars: 199 });
  assert.ok(reminder.html.includes("30 days notice") && reminder.html.includes("$199 a month plus HST"));
});
