// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanFoundInput, foundExpiry, foundJobRow, normaliseReading, READER_SCHEMA, readingFresh, tidy, validateFoundInput, type FoundInput } from "./found-listings.ts";
import { fingerprint } from "./page-reader.ts";

const PAGE = "https://www.harbourside.ca/careers";

const claudeSaid = {
  page_kind: "employer_careers_page",
  clinic: { name: "Harbourside Optical", practice_type: "independent", website: "" },
  jobs: [
    {
      title: "Optician \u2013 Full Time",
      role_category: "Optician",
      employment_type: "Full time",
      city: "Halifax",
      province: "Nova Scotia",
      work_arrangement: "on_site",
      territory: "should be dropped for an on site job",
      pay_as_written: "$28 to $32 per hour",
      pay_period: "hour",
      pay_min: 32,
      pay_max: 28,
      existing_vacancy: "not_stated",
      ai_screening: "no",
      apply_url: "/careers/optician/apply",
      summary: "Harbourside Optical is hiring a full time optician in Halifax \u2014 fitting frames and helping patients choose lenses. \u201cFriendly\u201d team.",
    },
    { ...{ title: "", role_category: "none" } },
  ],
  notes: "",
};

test("what Claude returns is checked and tidied before the admin sees it", () => {
  const r = normaliseReading(claudeSaid, PAGE);
  assert.equal(r.pageKind, "employer_careers_page");
  assert.deepEqual(r.clinic, { name: "Harbourside Optical", practiceType: "independent", website: "https://www.harbourside.ca" });
  assert.equal(r.jobs.length, 1, "a job without a title is dropped");
  const j = r.jobs[0];
  assert.equal(j.title, "Optician, Full Time");
  assert.equal(j.payMin, "28", "a range given the wrong way round is put right");
  assert.equal(j.payMax, "32");
  assert.equal(j.payPeriod, "hour");
  assert.equal(j.territory, "", "an on site job has no area");
  assert.equal(j.existingVacancy, "not_stated");
  assert.equal(j.usesAi, "no");
  assert.equal(j.applyUrl, "https://www.harbourside.ca/careers/optician/apply");
  assert.doesNotMatch(j.summary, /[\u2014\u2013\u201c\u201d]/);
});

test("nothing is listed from a job board page, and odd values never get through", () => {
  assert.equal(normaliseReading({ ...claudeSaid, page_kind: "job_board_or_recruiter" }, PAGE).jobs.length, 0);
  assert.equal(normaliseReading(null, PAGE).jobs.length, 0);
  const odd = normaliseReading({ ...claudeSaid, jobs: [{ ...claudeSaid.jobs[0], role_category: "Wizard", province: "Atlantis", pay_period: "week", pay_min: 900, apply_url: "https://ca.indeed.com/apply/1", existing_vacancy: "maybe" }] }, PAGE).jobs[0];
  assert.equal(odd.roleCategory, "");
  assert.equal(odd.province, "");
  assert.equal(odd.payPeriod, "", "a weekly figure is not pay we can show");
  assert.equal(odd.payMin, "");
  assert.equal(odd.applyUrl, PAGE, "a job board apply link falls back to the clinic's own page");
  assert.equal(odd.existingVacancy, "not_stated");
});

test("a page on a hiring system does not become the clinic's website", () => {
  const r = normaliseReading({ ...claudeSaid, clinic: { ...claudeSaid.clinic, website: "https://harbourside.ca/home" } }, "https://harbourside.bamboohr.com/careers/12");
  assert.equal(r.clinic.website, "https://harbourside.ca");
  const none = normaliseReading(claudeSaid, "https://harbourside.bamboohr.com/careers/12");
  assert.equal(none.clinic.website, "");
});

const good: FoundInput = {
  clinicName: "Harbourside Optical",
  practiceType: "independent",
  website: "https://www.harbourside.ca",
  title: "Optician",
  roleCategory: "Optician",
  employmentType: "Full time",
  province: "Nova Scotia",
  city: "Halifax",
  workArrangement: "on_site",
  territory: "",
  payPeriod: "hour",
  payMin: "28",
  payMax: "32",
  payAsWritten: "$28 to $32 per hour",
  existingVacancy: "not_stated",
  usesAi: "no",
  applyUrl: "https://www.harbourside.ca/careers/optician/apply",
  summary: "Harbourside Optical is hiring a full time optician in Halifax. The role covers fitting frames, taking measurements and helping patients choose lenses.",
  checked: true,
};

test("a complete found job passes", () => {
  assert.deepEqual(validateFoundInput(good), {});
});

test("pay is required, because a found job is only listed when the clinic's page states it", () => {
  const e = validateFoundInput({ ...good, payPeriod: "", payMin: "", payMax: "" });
  assert.ok(e.payPeriod && e.payMin && e.payMax);
  assert.ok(validateFoundInput({ ...good, payMin: "40", payMax: "32" }).payMax);
  assert.ok(validateFoundInput({ ...good, payPeriod: "year", payMin: "50000", payMax: "120000" }).payMax, "too wide");
  assert.deepEqual(validateFoundInput({ ...good, payMin: "30", payMax: "30" }), {}, "a single figure is fine");
});

test("the 2 questions must be answered Yes, No or Not stated", () => {
  assert.ok(validateFoundInput({ ...good, existingVacancy: "" }).existingVacancy);
  assert.ok(validateFoundInput({ ...good, usesAi: "" }).usesAi);
});

test("the summary is our own words, with no contact details and no Canadian experience", () => {
  const page = "We are looking for a full time optician to join our friendly team in beautiful downtown Halifax.";
  const copied = validateFoundInput({ ...good, summary: `Harbourside is looking for a full time optician to join our friendly team in beautiful downtown Halifax, Nova Scotia.` }, fingerprint(page));
  assert.match(copied.summary, /own wording/);
  assert.deepEqual(validateFoundInput(good, fingerprint(page)), {});
  assert.ok(validateFoundInput({ ...good, summary: `${good.summary} Email jobs@harbourside.ca to apply.` }).summary);
  assert.ok(validateFoundInput({ ...good, summary: `${good.summary} See www.harbourside.ca for more.` }).summary);
  assert.ok(validateFoundInput({ ...good, summary: `${good.summary} Canadian experience is required.` }).summary);
  assert.ok(validateFoundInput({ ...good, summary: "Too short." }).summary);
});

test("the clinic's website must be its own, and applications go to its own https page", () => {
  assert.ok(validateFoundInput({ ...good, website: "" }).website);
  assert.ok(validateFoundInput({ ...good, website: "https://ca.indeed.com" }).website);
  assert.ok(validateFoundInput({ ...good, website: "https://harbourside.bamboohr.com" }).website);
  assert.ok(validateFoundInput({ ...good, applyUrl: "http://www.harbourside.ca/apply" }).applyUrl);
  assert.ok(validateFoundInput({ ...good, applyUrl: "https://www.linkedin.com/jobs/1" }).applyUrl);
  assert.ok(validateFoundInput({ ...good, checked: false }).checked);
  assert.ok(validateFoundInput({ ...good, roleCategory: "" }).roleCategory);
  assert.ok(validateFoundInput({ ...good, workArrangement: "field", territory: "" }).territory);
});

test("a found job is saved as found, applying on the clinic's page, with Not stated left empty", () => {
  const row = foundJobRow(good);
  assert.equal(row.is_seeded, true);
  assert.equal(row.apply_method, "external");
  assert.equal(row.is_existing_vacancy, null);
  assert.equal(row.uses_ai_screening, false);
  assert.equal(row.pay_min, 28);
  assert.equal(row.territory, null);
});

test("the form is read safely", () => {
  const f = cleanFoundInput({ ...good, checked: "yes", existingVacancy: "not_stated", usesAi: "perhaps", workArrangement: "anything", summary: "  Line one \u2014 line two  " });
  assert.equal(f.checked, true);
  assert.equal(f.existingVacancy, "not_stated");
  assert.equal(f.usesAi, "");
  assert.equal(f.workArrangement, "on_site");
  assert.equal(f.summary, "Line one, line two");
  assert.equal(cleanFoundInput({}).checked, false);
});

test("21 days live, and a reading is good for a week", () => {
  const from = new Date("2026-11-04T12:00:00Z");
  assert.equal(foundExpiry(from).toISOString(), "2026-11-25T12:00:00.000Z");
  assert.equal(readingFresh("2026-10-30T12:00:00Z", from), true);
  assert.equal(readingFresh("2026-10-27T11:00:00Z", from), false);
});

test("house style: dashes, curly quotes and markdown are tidied", () => {
  assert.equal(tidy("Monday\u2013Friday, 9\u20135"), "Monday to Friday, 9 to 5");
  assert.equal(tidy("A role \u2014 with \u201cquotes\u201d and **bold**"), "A role, with \"quotes\" and bold");
});

test("the schema Claude answers to requires every field, so nothing is silently left out", () => {
  const job = READER_SCHEMA.properties.jobs.items;
  assert.deepEqual([...job.required].sort(), Object.keys(job.properties).sort());
  assert.deepEqual([...READER_SCHEMA.required].sort(), Object.keys(READER_SCHEMA.properties).sort());
  assert.equal(job.additionalProperties, false);
});
