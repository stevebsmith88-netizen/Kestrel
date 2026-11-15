import assert from "node:assert/strict";
import { test } from "node:test";
import { AD_MAX, adLines, stripContacts } from "./slack-ad.ts";

const job = {
  title: "Optician", role_category: "Optician", employment_type: "Full time", city: "Guelph", province: "Ontario",
  is_existing_vacancy: true, uses_ai_screening: false, description: "Join our team.", pay_period: "year", pay_min: 55000, pay_max: 70000,
} as never;

test("emails, web addresses and phone numbers are cut out", () => {
  const out = stripContacts("Write to jobs@clinic.ca or visit https://clinic.ca/careers, or call 519-555-0142 or (519) 555 0142. Also www.example.com");
  assert.doesNotMatch(out, /@|https?:|www\.|555/);
  assert.match(out, /contact details removed/);
});

test("ordinary numbers such as pay and years are left alone", () => {
  assert.equal(stripContacts("$55,000 to $70,000, 3 years, 2027"), "$55,000 to $70,000, 3 years, 2027");
});

test("the ad lines give the facts and the ad", () => {
  const lines = adLines(job);
  assert.ok(lines.some((l) => l.startsWith("Pay: ")));
  assert.ok(lines.includes("Existing vacancy: yes. Uses AI to screen candidates: no."));
  assert.ok(lines.includes("Join our team."));
});

test("a long ad is shortened and points to the queue", () => {
  const lines = adLines({ ...(job as object), description: "word ".repeat(2000) } as never);
  const ad = lines[lines.length - 1];
  assert.ok(ad.length < AD_MAX + 100);
  assert.match(ad, /read the rest in the review queue/);
});
