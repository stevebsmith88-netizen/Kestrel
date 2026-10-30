// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cleanJob,
  daysLeft,
  expiryFrom,
  formatPay,
  jobPostingJsonLd,
  longDate,
  employerFlags,
  mentionsCanadianExperience,
  parseMoney,
  payRangeAllowed,
  reviewFlags,
  validateClinic,
  validateJob,
} from "./jobs.ts";

const good = cleanJob({
  title: "Optician",
  roleCategory: "Optician",
  employmentType: "Full time",
  province: "British Columbia",
  city: "Victoria",
  payPeriod: "year",
  payMin: "$62,000",
  payMax: "74000",
  existingVacancy: "yes",
  usesAi: "no",
  description: "Join a friendly, busy independent clinic as our full time optician and work closely with our team.",
  applyMethod: "kestrel",
});

test("a complete job passes", () => {
  assert.deepEqual(validateJob(good, true), {});
});

test("a draft only needs a title", () => {
  assert.deepEqual(validateJob(cleanJob({ title: "Draft" }), false), {});
  assert.ok(validateJob(cleanJob({}), false).title);
});

test("submitting without the two required questions is refused", () => {
  const errors = validateJob({ ...good, existingVacancy: "", usesAi: "" }, true);
  assert.ok(errors.existingVacancy);
  assert.ok(errors.usesAi);
});

test("pay range rules", () => {
  assert.equal(payRangeAllowed(62000, 74000, "year"), true);
  assert.equal(payRangeAllowed(40000, 90000, "year"), true); // exactly 50,000 wide
  assert.equal(payRangeAllowed(40000, 90001, "year"), false);
  assert.equal(payRangeAllowed(120000, 250000, "year"), true); // top over 200,000: no limit
  assert.equal(payRangeAllowed(24, 28, "hour"), true);
  assert.equal(payRangeAllowed(20, 50, "hour"), false);
  assert.equal(payRangeAllowed(80, 110, "hour"), true); // top over $96 an hour is over 200,000 a year
});

test("pay is checked when a job is submitted", () => {
  assert.ok(validateJob({ ...good, payMin: "40000", payMax: "95000" }, true).payMax);
  assert.ok(validateJob({ ...good, payMin: "80000", payMax: "70000" }, true).payMax);
  assert.ok(validateJob({ ...good, payMin: "abc" }, true).payMin);
});

test("Canadian experience is blocked", () => {
  for (const text of ["Canadian experience required", "must have Canadian work experience", "local experience is a must", "experience working in Canada"]) {
    assert.equal(mentionsCanadianExperience(text), true, text);
  }
  for (const text of ["Experience with progressive lenses", "We are a Canadian clinic", "Canada wide job board"]) {
    assert.equal(mentionsCanadianExperience(text), false, text);
  }
  assert.ok(validateJob({ ...good, description: `${good.description} Canadian experience required.` }, false).description);
});

test("an external application page must be a secure web address", () => {
  assert.ok(validateJob({ ...good, applyMethod: "external", applyUrl: "" }, true).applyUrl);
  assert.ok(validateJob({ ...good, applyMethod: "external", applyUrl: "http://example.com/jobs" }, true).applyUrl);
  assert.deepEqual(validateJob({ ...good, applyMethod: "external", applyUrl: "https://example.com/jobs" }, true), {});
});

test("clinic profile", () => {
  const clinic = { clinicName: "Harbourside Optical", practiceType: "independent", website: "https://example.ca", province: "Ontario", city: "Toronto", about: "", notifyEmail: "hiring@example.ca", directHire: true };
  assert.deepEqual(validateClinic(clinic), {});
  assert.ok(validateClinic({ ...clinic, directHire: false }).directHire);
  assert.ok(validateClinic({ ...clinic, notifyEmail: "nope" }).notifyEmail);
  assert.ok(validateClinic({ ...clinic, website: "javascript:alert(1)" }).website);
  assert.ok(validateClinic({ ...clinic, practiceType: "" }).practiceType);
});

test("review flags", () => {
  const flags = reviewFlags({ title: "Optician", description: "Email us at hr@clinic.ca. Canadian experience needed.", pay_period: "year", pay_min: 40000, pay_max: 99000 });
  assert.ok(flags.includes("Mentions Canadian experience"));
  assert.ok(flags.includes("Pay range is too wide"));
  assert.ok(flags.includes("Contains an email address or phone number"));
  assert.deepEqual(reviewFlags({ title: "Optician", description: "A friendly clinic.", pay_period: "year", pay_min: 60000, pay_max: 70000 }), []);
});

test("pay is shown in plain words", () => {
  assert.equal(formatPay(62000, 74000, "year"), "$62,000 to $74,000 a year");
  assert.equal(formatPay("24", "28.5", "hour"), "$24 to $28.50 an hour");
  assert.equal(parseMoney("$62,000"), 62000);
  assert.equal(parseMoney("0"), null);
  assert.equal(parseMoney("12abc"), null);
});

test("dates", () => {
  assert.equal(longDate("2026-11-01T12:00:00Z"), "1st November 2026");
  assert.equal(longDate("2026-11-22T12:00:00Z"), "22nd November 2026");
  assert.equal(longDate("2026-11-13T12:00:00Z"), "13th November 2026");
  const start = new Date("2026-11-01T00:00:00Z");
  assert.equal(expiryFrom(start).toISOString(), "2026-12-01T00:00:00.000Z");
  assert.equal(daysLeft("2026-11-14T00:00:00Z", new Date("2026-11-01T00:00:00Z")), 13);
  assert.equal(daysLeft("2026-10-01T00:00:00Z", new Date("2026-11-01T00:00:00Z")), 0);
});

test("structured data matches the page", () => {
  const data = jobPostingJsonLd(
    { id: "abc", title: "Optician", description: "Line one\nLine two", employment_type: "Full time", province: "British Columbia", city: "Victoria", pay_period: "year", pay_min: "62000", pay_max: "74000", apply_method: "kestrel", apply_url: null, posted_at: "2026-11-01T00:00:00Z", expires_at: "2026-12-01T00:00:00Z" },
    { clinic_name: "Harbourside Optical", website: "https://example.ca" },
    "https://eyecarejobs.ca",
  );
  assert.equal(data.employmentType, "FULL_TIME");
  assert.equal(data.jobLocation.address.addressRegion, "BC");
  assert.equal(data.baseSalary.value.minValue, 62000);
  assert.equal(data.baseSalary.value.unitText, "YEAR");
  assert.equal(data.datePosted, "2026-11-01");
  assert.equal(data.url, "https://eyecarejobs.ca/jobs/abc");
});

test("employerFlags points out clinics that look unlike a direct employer", () => {
  assert.deepEqual(employerFlags({ website: "https://a.ca", notifyEmail: "hiring@a.ca", directHireConfirmedAt: "2026-10-30" }), []);
  const flags = employerFlags({ website: "", notifyEmail: "someone@gmail.com", directHireConfirmedAt: null });
  assert.equal(flags.length, 3);
});

test("reviewFlags notices agency wording", () => {
  assert.ok(reviewFlags({ title: "Optician", description: "We are hiring on behalf of our client, a busy practice." }).includes("Wording that suggests a recruiter or agency"));
  assert.ok(!reviewFlags({ title: "Optician", description: "Join our friendly team." }).includes("Wording that suggests a recruiter or agency"));
});

test("reviewFlags notices wording that may break human rights rules", () => {
  const cases: [string, string][] = [
    ["Native English speakers only please.", "Language or accent wording that may exclude people"],
    ["Female candidates only.", "Wording that may point to sex or gender"],
    ["Canadian citizens only.", "Citizenship requirement, usually not allowed unless the law requires it"],
    ["We want a young and energetic person.", "Wording about age"],
    ["Christian values are important to us.", "Wording about religion"],
  ];
  for (const [description, flag] of cases) assert.ok(reviewFlags({ title: "Optician", description }).includes(flag), description);
  for (const fine of ["Fluent English or French is needed for patient care.", "We are a single location practice with a friendly team.", "Registered optician in good standing."]) {
    assert.deepEqual(reviewFlags({ title: "Optician", description: fine }).filter((f) => /Language|sex|family|Citizen|religion|appearance|age/i.test(f)), [], fine);
  }
});
