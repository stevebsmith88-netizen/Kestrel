// Run with: npm test
// The pay bases for optometrist roles (daily rate, daily minimum, percentage), the width rules, the wording and the Google markup.
import assert from "node:assert/strict";
import { test } from "node:test";
import { jobFromForm } from "./job-form.ts";
import {
  MAX_PAY,
  PAY_NOT_STATED,
  parsePercent,
  payBasisOf,
  payChips,
  payColumns,
  payFlags,
  payRangeAllowed,
  payText,
  percentRangeAllowed,
  salaryForMarkup,
  validatePay,
  yearlyPay,
  type PayInput,
} from "./job-pay.ts";
import { cleanJob, jobPostingJsonLd, markupDescription, reviewFlags, validateJob } from "./jobs.ts";

const BAD = /\$0(?![\d,.])|NaN|null|undefined/;

const input = (over: Partial<PayInput> = {}): PayInput => ({
  payPeriod: "year", payMin: "", payMax: "", payPercentMin: "", payPercentMax: "", payPercentOf: "", payPercentToo: "", roleCategory: "Optometrist", ...over,
});

const filled = (over: Record<string, string> = {}, extra: [string, string][] = []) => {
  const form = new FormData();
  const values: Record<string, string> = {
    title: "Associate optometrist", roleCategory: "Optometrist", employmentType: "Full time", province: "Ontario", city: "Toronto",
    payPeriod: "year", payMin: "95000", payMax: "120000", existingVacancy: "yes", usesAi: "no", applyMethod: "kestrel", workArrangement: "on_site",
    description: "Join a friendly, busy independent clinic as our associate optometrist and work closely with our team.", ...over,
  };
  for (const [k, v] of Object.entries(values)) form.set(k, v);
  for (const [k, v] of extra) form.append(k, v);
  return form;
};

const publicJob = (row: Record<string, unknown>, extras: Record<string, unknown> = {}) => ({
  id: "abc", title: "Optometrist", description: "Join our team.", employment_type: "Full time", province: "Ontario", city: "Toronto",
  apply_method: "kestrel", apply_url: null, posted_at: "2026-11-01T00:00:00Z", expires_at: "2026-12-01T00:00:00Z", ...row, ...extras,
});

// ---------------------------------------------------------------- the 5 test cases

test("(a) a daily minimum range saves, shows and goes to Google as dollars a day", () => {
  const { row, errors } = jobFromForm(filled({ payPeriod: "day_minimum", payMin: "$600", payMax: "800" }), true);
  assert.deepEqual(errors, {});
  assert.equal(row.pay_period, "day");
  assert.equal(row.pay_is_minimum, true);
  assert.equal(row.pay_min, 600);
  assert.equal(row.pay_percent_min, null);
  assert.equal(payBasisOf(row), "day_minimum");
  assert.equal(payText(row), "Guaranteed minimum $600 to $800 a day");
  assert.deepEqual(payChips(row), ["Minimum $600 to $800 a day"]);
  assert.deepEqual(salaryForMarkup(row), { min: 600, max: 800, unitText: "DAY" });
  const ld = jobPostingJsonLd(publicJob(row), { clinic_name: "C", website: null }, "https://eyecarejobs.ca");
  assert.equal(ld.baseSalary?.value.unitText, "DAY");
  assert.equal(ld.baseSalary?.value.minValue, 600);
});

test("(b) a percentage range saves, shows, and is not given to Google as a salary", () => {
  const { row, errors } = jobFromForm(filled({ payPeriod: "percent", payPercentMin: "28%", payPercentMax: "35", payPercentOf: "production", payMin: "999", payMax: "9999" }), true);
  assert.deepEqual(errors, {});
  assert.equal(row.pay_period, null);
  assert.equal(row.pay_min, null, "money boxes are ignored for a percentage");
  assert.equal(row.pay_percent_min, 28);
  assert.equal(row.pay_percent_max, 35);
  assert.equal(row.pay_percent_of, "production");
  assert.equal(payBasisOf(row), "percent");
  assert.equal(payText(row), "28% to 35% of production");
  assert.deepEqual(payChips(row), ["28% to 35% of production"]);
  assert.equal(salaryForMarkup(row), null);
  const ld = jobPostingJsonLd(publicJob(row), { clinic_name: "C", website: null }, "https://eyecarejobs.ca");
  assert.equal("baseSalary" in ld, false, "a percentage can never be a salary figure");
  // the page and the markup say the same thing
  assert.ok(ld.description.includes(payText(row)));
});

test("(c) a daily minimum and a percentage together", () => {
  const { row, errors } = jobFromForm(filled({ payPeriod: "day_minimum", payMin: "600", payMax: "800", payPercentToo: "yes", payPercentMin: "28", payPercentMax: "35", payPercentOf: "collections" }), true);
  assert.deepEqual(errors, {});
  assert.equal(row.pay_is_minimum, true);
  assert.equal(row.pay_percent_of, "collections");
  assert.equal(payText(row), "A guaranteed minimum of $600 to $800 a day, or 28% to 35% of collections when that comes to more");
  assert.deepEqual(payChips(row), ["Minimum $600 to $800 a day", "28% to 35% of collections"]);
  assert.deepEqual(salaryForMarkup(row), { min: 600, max: 800, unitText: "DAY" });
  const ld = jobPostingJsonLd(publicJob(row), { clinic_name: "C", website: null }, "https://eyecarejobs.ca");
  assert.equal(ld.baseSalary?.value.unitText, "DAY");
  assert.ok(ld.description.includes(payText(row)), "the percentage sentence is in the markup text as well as on the page");
});

test("(c) the percentage boxes are ignored unless the daily minimum tick box is on", () => {
  const { row } = jobFromForm(filled({ payPeriod: "day_minimum", payMin: "600", payMax: "800", payPercentMin: "28", payPercentMax: "35", payPercentOf: "production" }), true);
  assert.equal(row.pay_percent_min, null);
  assert.equal(payText(row), "Guaranteed minimum $600 to $800 a day");
});

test("(d) hourly or salary plus a bonus note keeps the note and still needs the range", () => {
  const { row, errors } = jobFromForm(filled({ roleCategory: "Optician", payPeriod: "hour", payMin: "24", payMax: "28.50", payExtras: "Plus a yearly bonus and commission on frames" }), true);
  assert.deepEqual(errors, {});
  assert.equal(row.pay_extras, "Plus a yearly bonus and commission on frames");
  assert.equal(payText(row), "$24 to $28.50 an hour");
  const markup = markupDescription({ ...row, description: "Join us.", work_arrangement: "on_site" });
  assert.ok(markup.endsWith("Also part of the pay: Plus a yearly bonus and commission on frames"));
  assert.equal(markup.includes("Pay:"), false, "a plain hourly job has no extra pay sentence");
});

test("(e) blank or negotiable pay is refused for every way of working out pay", () => {
  for (const basis of ["year", "hour", "day", "day_minimum", "percent"]) {
    const errors = validatePay(input({ payPeriod: basis }));
    assert.ok(Object.keys(errors).length > 0, `${basis} blank is refused`);
  }
  const words = validatePay(input({ payPeriod: "year", payMin: "negotiable", payMax: "discussed at interview" }));
  assert.match(words.payMin, /negotiable/);
  assert.match(words.payMax, /required on every post/);
  const percentWords = validatePay(input({ payPeriod: "percent", payPercentMin: "competitive", payPercentMax: "", payPercentOf: "production" }));
  assert.match(percentWords.payPercentMin, /negotiable/);
  assert.ok(percentWords.payPercentMax);
  // a note that says "negotiable" never stands in for the range
  const { errors } = jobFromForm(filled({ payMin: "", payMax: "", payExtras: "Negotiable" }), true);
  assert.ok(errors.payMin && errors.payMax);
});

// ---------------------------------------------------------------- width rules

test("daily ranges: up to $200 a day wide, no exception", () => {
  assert.equal(payRangeAllowed(600, 800, "day"), true);
  assert.equal(payRangeAllowed(900, 1100, "day"), true);
  assert.equal(payRangeAllowed(550, 750, "day"), true);
  assert.equal(payRangeAllowed(1300, 1500, "day"), true);
  assert.equal(payRangeAllowed(600, 801, "day"), false);
  assert.equal(payRangeAllowed(500, 750, "day"), false);
  assert.equal(payRangeAllowed(1000, 1400, "day"), false, "a high top does not lift the limit for a daily range");
  assert.equal(payRangeAllowed(900, 900, "day"), true, "one set amount typed in both boxes");
  assert.ok(validatePay(input({ payPeriod: "day", payMin: "500", payMax: "750" })).payMax.includes("$200 a day wide"));
});

test("percentage ranges: up to 10 points wide", () => {
  assert.equal(percentRangeAllowed(28, 35), true);
  assert.equal(percentRangeAllowed(16, 20), true);
  assert.equal(percentRangeAllowed(25, 35), true);
  assert.equal(percentRangeAllowed(25, 36), false);
  assert.equal(percentRangeAllowed(20, 40), false);
  assert.equal(percentRangeAllowed(32.5, 42.5), true);
  assert.equal(percentRangeAllowed(30, 30), true);
  assert.ok(validatePay(input({ payPeriod: "percent", payPercentMin: "25", payPercentMax: "36", payPercentOf: "production" })).payPercentMax.includes("10 points"));
  assert.deepEqual(validatePay(input({ payPeriod: "percent", payPercentMin: "25", payPercentMax: "35", payPercentOf: "billings" })), {});
});

test("salary and hourly width rules are unchanged", () => {
  assert.equal(payRangeAllowed(40000, 90000, "year"), true);
  assert.equal(payRangeAllowed(40000, 90001, "year"), false);
  assert.equal(payRangeAllowed(120000, 250000, "year"), true);
  assert.equal(payRangeAllowed(24, 28, "hour"), true);
  assert.equal(payRangeAllowed(20, 50, "hour"), false);
});

test("a daily minimum with a percentage checks both ranges", () => {
  const ok = input({ payPeriod: "day_minimum", payMin: "600", payMax: "800", payPercentToo: "yes", payPercentMin: "28", payPercentMax: "35", payPercentOf: "production" });
  assert.deepEqual(validatePay(ok), {});
  assert.ok(validatePay({ ...ok, payPercentMax: "50" }).payPercentMax, "percentage too wide");
  assert.ok(validatePay({ ...ok, payMax: "900" }).payMax, "daily minimum too wide");
  assert.ok(validatePay({ ...ok, payPercentOf: "" }).payPercentOf, "must say what the percentage is of");
  assert.ok(validatePay({ ...ok, payPercentMin: "" }).payPercentMin, "tick box on means the percentage is required");
});

// ---------------------------------------------------------------- odd values

test("zero, negative, over 100, huge and very long values are refused with a plain message", () => {
  assert.ok(validatePay(input({ payPeriod: "day", payMin: "0", payMax: "800" })).payMin);
  assert.ok(validatePay(input({ payPeriod: "day", payMin: "-5", payMax: "800" })).payMin);
  assert.ok(validatePay(input({ payPeriod: "percent", payPercentMin: "0", payPercentMax: "5", payPercentOf: "production" })).payPercentMin);
  assert.ok(validatePay(input({ payPeriod: "percent", payPercentMin: "90", payPercentMax: "101", payPercentOf: "production" })).payPercentMax);
  assert.equal(parsePercent("100"), 100);
  assert.equal(parsePercent("100.5"), null);
  assert.ok(validatePay(input({ payPeriod: "year", payMin: "1000", payMax: String(MAX_PAY.year + 1) })).payMax);
  assert.ok(validatePay(input({ payPeriod: "day", payMin: "900", payMax: "5001" })).payMax);
  assert.ok(validatePay(input({ payPeriod: "hour", payMin: "10", payMax: "501" })).payMax);
  // the form cuts every box at 20 characters, so a huge value cannot reach the database
  const long = cleanJob({ payMin: "9".repeat(60), payPercentMin: "9".repeat(60) });
  assert.equal(long.payMin.length, 20);
  assert.equal(long.payPercentMin.length, 20);
  assert.ok(validatePay(input({ payPeriod: "year", payMin: "9".repeat(20), payMax: "9".repeat(20) })).payMin);
  assert.equal(cleanJob({ payExtras: "x".repeat(900) }).payExtras.length, 300);
});

test("daily rates and percentages are for optometrist roles only", () => {
  for (const basis of ["day", "day_minimum", "percent"]) {
    assert.ok(validatePay(input({ payPeriod: basis, roleCategory: "Optician", payMin: "900", payMax: "1000", payPercentMin: "28", payPercentMax: "35", payPercentOf: "production" })).payPeriod);
  }
  assert.deepEqual(validatePay(input({ payPeriod: "year", roleCategory: "Optician", payMin: "60000", payMax: "70000" })), {});
});

test("an unknown way of working out pay is refused", () => {
  assert.ok(validatePay(input({ payPeriod: "week", payMin: "1", payMax: "2" })).payPeriod);
  assert.ok(validatePay(input({ payPeriod: "" })).payPeriod);
});

test("a draft needs no pay, and a half finished percentage can still be saved as a draft", () => {
  const draft = new FormData();
  draft.set("title", "Draft");
  draft.set("payPeriod", "percent");
  draft.set("payPercentMin", "28");
  const { row, errors } = jobFromForm(draft, false);
  assert.deepEqual(errors, {});
  assert.equal(row.status, "draft");
  assert.equal(row.pay_percent_min, 28);
  assert.equal(row.pay_percent_max, null);
});

// ---------------------------------------------------------------- wording never breaks

test("no screen can show $0, NaN, null or undefined, whatever the row holds", () => {
  const rows: Record<string, unknown>[] = [
    {}, { pay_period: null }, { pay_period: "year" }, { pay_period: "year", pay_min: null, pay_max: null }, { pay_period: "year", pay_min: "abc", pay_max: "def" },
    { pay_period: "hour", pay_min: 0, pay_max: 0 }, { pay_period: "day", pay_min: 600 }, { pay_period: "day", pay_min: 600, pay_max: 800, pay_is_minimum: true, pay_percent_min: 28 },
    { pay_percent_min: 28 }, { pay_percent_min: 0, pay_percent_max: 0 }, { pay_percent_min: "x", pay_percent_max: "y" }, { pay_period: "week", pay_min: 5, pay_max: 6 },
    { pay_is_minimum: true }, { pay_period: "year", pay_min: undefined, pay_max: undefined, pay_percent_of: "gold" },
  ];
  for (const r of rows) {
    assert.doesNotMatch(payText(r), BAD, JSON.stringify(r));
    for (const c of payChips(r)) assert.doesNotMatch(c, BAD, JSON.stringify(r));
  }
  assert.equal(payText({}), PAY_NOT_STATED);
  assert.deepEqual(payChips({}), []);
  assert.equal(payText({ pay_percent_min: 28, pay_percent_max: 35 }), "28% to 35% of production", "a missing 'of' reads as production");
  assert.equal(payText({ pay_percent_min: 30, pay_percent_max: 30, pay_percent_of: "billings" }), "30% of billings");
  assert.equal(payText({ pay_percent_min: 32.5, pay_percent_max: 37.25, pay_percent_of: "production" }), "32.5% to 37.25% of production");
  assert.equal(payText({ pay_period: "day", pay_min: "900.00", pay_max: "1100.00" }), "$900 to $1,100 a day");
  assert.equal(payText({ pay_period: "year", pay_min: 62000, pay_max: 74000 }), "$62,000 to $74,000 a year");
});

test("old rows (no new columns at all) read exactly as before", () => {
  assert.equal(payText({ pay_period: "hour", pay_min: "24", pay_max: "28.5" }), "$24 to $28.50 an hour");
  assert.equal(payBasisOf({ pay_period: "year", pay_min: 1, pay_max: 2 }), "year");
  const ld = jobPostingJsonLd(publicJob({ pay_period: "year", pay_min: "62000", pay_max: "74000" }), { clinic_name: "C", website: null }, "https://x.ca");
  assert.equal(ld.baseSalary?.value.unitText, "YEAR");
  assert.equal(markupDescription({ description: "Hi.", pay_period: "year", pay_min: 1, pay_max: 2 }), "Hi.");
});

// ---------------------------------------------------------------- benchmark, matching and review flags

test("only salary and hourly pay can be turned into a year", () => {
  assert.deepEqual(yearlyPay({ pay_period: "hour", pay_min: 24, pay_max: 28 }), { min: 49920, max: 58240 });
  assert.deepEqual(yearlyPay({ pay_period: "year", pay_min: 90000, pay_max: 110000 }), { min: 90000, max: 110000 });
  assert.equal(yearlyPay({ pay_period: "day", pay_min: 900, pay_max: 1100 }), null);
  assert.equal(yearlyPay({ pay_period: "day", pay_min: 600, pay_max: 800, pay_is_minimum: true }), null);
  assert.equal(yearlyPay({ pay_percent_min: 28, pay_percent_max: 35, pay_percent_of: "production" }), null);
  assert.equal(yearlyPay({}), null);
});

test("review flags for the new pay bases", () => {
  const base = { title: "OD", description: "A friendly clinic." };
  assert.deepEqual(reviewFlags({ ...base, pay_period: "day", pay_min: 900, pay_max: 1100 }), []);
  assert.ok(reviewFlags({ ...base, pay_period: "day", pay_min: 20, pay_max: 100 }).some((f) => /Daily pay looks unusually/.test(f)));
  assert.ok(reviewFlags({ ...base, pay_period: "day", pay_min: 500, pay_max: 900 }).includes("Pay range is too wide"));
  assert.deepEqual(reviewFlags({ ...base, pay_percent_min: 28, pay_percent_max: 35, pay_percent_of: "production" }), []);
  assert.ok(payFlags({ pay_percent_min: 2, pay_percent_max: 4 }).some((f) => /percentage looks unusually/.test(f)));
  assert.ok(payFlags({ pay_percent_min: 30, pay_percent_max: 80 }).includes("Percentage range is too wide"));
});

test("a full validation of a submitted percentage job passes, and fails if the role is wrong", () => {
  const job = cleanJob({
    title: "Optometrist", roleCategory: "Optometrist", employmentType: "Full time", province: "Ontario", city: "Toronto", payPeriod: "percent",
    payPercentMin: "28", payPercentMax: "35", payPercentOf: "production", existingVacancy: "yes", usesAi: "no", applyMethod: "kestrel",
    description: "Join a friendly, busy independent clinic as our associate optometrist and work closely with our team.",
  });
  assert.deepEqual(validateJob(job, true), {});
  assert.ok(validateJob({ ...job, roleCategory: "Optician" }, true).payPeriod);
});

test("payColumns writes only the columns that belong to the chosen way of working out pay", () => {
  const c = payColumns(input({ payPeriod: "year", payMin: "95,000", payMax: "$120000", payPercentMin: "28", payPercentMax: "35", payPercentOf: "production", payPercentToo: "yes" }));
  assert.deepEqual(c, { pay_period: "year", pay_min: 95000, pay_max: 120000, pay_is_minimum: false, pay_percent_min: null, pay_percent_max: null, pay_percent_of: null });
});
