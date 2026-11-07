// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { dueStep, onboardingEmail, type Facts } from "./onboarding-emails.ts";

const created = new Date("2026-12-01T12:00:00Z");
const at = (days: number) => new Date(created.getTime() + days * 24 * 60 * 60 * 1000);
const none = new Set<string>();
const clinic = (over: Partial<Extract<Facts, { role: "clinic" }>> = {}): Facts => ({ role: "clinic", hasProfile: false, hasSubmitted: false, hasLive: false, applications: 0, ...over });
const candidate = (over: Partial<Extract<Facts, { role: "candidate" }>> = {}): Facts => ({ role: "candidate", profileReady: false, hasAlert: false, applications: 0, ...over });

test("nothing is sent in the first day, or after the catch up window", () => {
  assert.equal(dueStep({ createdAt: created, now: at(0.5), sent: none, facts: clinic() }), null);
  assert.equal(dueStep({ createdAt: created, now: at(1.2), sent: none, facts: clinic() }), "clinic_day1");
  assert.equal(dueStep({ createdAt: created, now: at(30), sent: none, facts: clinic() }), null);
});

test("a step is never sent twice", () => {
  assert.equal(dueStep({ createdAt: created, now: at(1.2), sent: new Set(["clinic_day1"]), facts: clinic() }), null);
  assert.equal(dueStep({ createdAt: created, now: at(3.1), sent: new Set(["clinic_day1"]), facts: clinic() }), "clinic_day3");
});

test("a clinic that has already posted is not told to post", () => {
  assert.equal(dueStep({ createdAt: created, now: at(1.2), sent: none, facts: clinic({ hasProfile: true, hasSubmitted: true }) }), null);
});

test("a clinic with applications only gets the reply reminder, on day 7", () => {
  const f = clinic({ hasProfile: true, hasSubmitted: true, hasLive: true, applications: 2 });
  assert.equal(dueStep({ createdAt: created, now: at(3.1), sent: none, facts: f }), null);
  assert.equal(dueStep({ createdAt: created, now: at(7.1), sent: none, facts: f }), "clinic_day7");
  assert.match(onboardingEmail({ step: "clinic_day7", firstName: "Sam", facts: f, unsubscribeUrl: "https://x.test/u" }).subject, /Reply to your applicants/);
});

test("the clinic wording follows what the clinic has done", () => {
  const u = "https://x.test/u";
  assert.match(onboardingEmail({ step: "clinic_day1", firstName: "Sam", facts: clinic(), unsubscribeUrl: u }).subject, /clinic profile/);
  assert.match(onboardingEmail({ step: "clinic_day1", firstName: "Sam", facts: clinic({ hasProfile: true }), unsubscribeUrl: u }).subject, /first job post/);
  assert.match(onboardingEmail({ step: "clinic_day3", firstName: "Sam", facts: clinic({ hasProfile: true, hasSubmitted: true }), unsubscribeUrl: u }).subject, /with our team/);
  assert.match(onboardingEmail({ step: "clinic_day3", firstName: "Sam", facts: clinic({ hasProfile: true, hasSubmitted: true, hasLive: true }), unsubscribeUrl: u }).subject, /first applications/);
});

test("a candidate who has applied gets nothing, and one with an alert skips the alert email", () => {
  assert.equal(dueStep({ createdAt: created, now: at(1.2), sent: none, facts: candidate({ applications: 1 }) }), null);
  assert.equal(dueStep({ createdAt: created, now: at(3.1), sent: new Set(["candidate_day1"]), facts: candidate({ hasAlert: true }) }), null);
  assert.equal(dueStep({ createdAt: created, now: at(3.1), sent: new Set(["candidate_day1"]), facts: candidate() }), "candidate_day3");
});

test("every email names the person, links into the site and carries an unsubscribe link and the mailing address", () => {
  for (const facts of [clinic(), candidate()]) {
    for (const day of [1, 3, 7]) {
      const mail = onboardingEmail({ step: `${facts.role}_day${day}`, firstName: "Sam", facts, unsubscribeUrl: "https://x.test/unsub" });
      assert.match(mail.html, /Hello Sam/);
      assert.match(mail.html, /https:\/\/x\.test\/unsub/);
      assert.match(mail.html, /6013 Yonge Street/);
      assert.match(mail.html, /href="https:\/\/eyecarejobs\.ca\//);
      assert.ok(!/—/.test(mail.html + mail.text), "no em dashes");
    }
  }
});

test("a missing first name reads as 'there'", () => {
  assert.match(onboardingEmail({ step: "candidate_day1", firstName: " ", facts: candidate(), unsubscribeUrl: "https://x.test/u" }).html, /Hello there/);
});
