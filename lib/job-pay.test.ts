// Run with: npm test
// Pay for optometrist roles (daily rate, guaranteed minimum, percentage, or dollars and a percentage together), the width rules, the
// yearly estimate for a daily rate, the wording and the Google markup. At least one of dollars or a percentage must be filled in.
import assert from "node:assert/strict";
import { test } from "node:test";
import { jobFromForm } from "./job-form.ts";
import {
  MAX_PAY,
  PAY_NOT_STATED,
  dailyEstimate,
  estimateText,
  markupPayLine,
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
  payPeriod: "year", payMin: "", payMax: "", payIsMinimum: "", payDays: "", payPercentMin: "", payPercentMax: "", payPercentOf: "", roleCategory: "Optometrist", ...over,
});

const filled = (over: Record<string, string> = {}) => {
  const form = new FormData();
  const values: Record<string, string> = {
    title: "Associate optometrist", roleCategory: "Optometrist", employmentType: "Full time", province: "Ontario", city: "Toronto",
    payPeriod: "year", payMin: "95000", payMax: "120000", existingVacancy: "yes", usesAi: "no", applyMethod: "kestrel", workArrangement: "on_site",
    description: "Join a friendly, busy independent clinic as our associate optometrist and work closely with our team.", ...over,
  };
  for (const [k, v] of Object.entries(values)) form.set(k, v);
  return form;
};

const publicJob = (row: Record<string, unknown>) => ({
  id: "abc", title: "Optometrist", description: "Join our team.", employment_type: "Full time", province: "Ontario", city: "Toronto",
  apply_method: "kestrel", apply_url: null, posted_at: "2026-11-01T00:00:00Z", expires_at: "2026-12-01T00:00:00Z", ...row,
});
const ld = (row: Record<string, unknown>) => jobPostingJsonLd(publicJob(row), { clinic_name: "C", website: null }, "https://eyecarejobs.ca");

// ---------------------------------------------------------------- the 5 test cases

test("(a) a daily minimum range saves, shows and goes to Google as dollars a day", () => {
  const { row, errors } = jobFromForm(filled({ payPeriod: "day", payMin: "$600", payMax: "800", payIsMinimum: "yes" }), true);
  assert.deepEqual(errors, {});
  assert.equal(row.pay_period, "day");
  assert.equal(row.pay_is_minimum, true);
  assert.equal(row.pay_min, 600);
  assert.equal(row.pay_percent_min, null);
  assert.equal(payBasisOf(row), "minimum");
  assert.equal(payText(row), "Guaranteed minimum $600 to $800 a day");
  assert.deepEqual(payChips(row), ["Minimum $600 to $800 a day"]);
  assert.deepEqual(salaryForMarkup(row), { min: 600, max: 800, unitText: "DAY" });
  assert.equal(ld(row).baseSalary?.value.unitText, "DAY");
});

test("(b) a percentage range alone needs the clinic's expected earnings, which show beside it and go to Google", () => {
  const without = jobFromForm(filled({ payMin: "", payMax: "", payPercentMin: "28%", payPercentMax: "35", payPercentOf: "production" }), true);
  assert.ok(without.errors.payExpectedMin, "a percentage on its own is refused without expected earnings (Steve, 12th November 2026)");
  const { row, errors } = jobFromForm(filled({ payMin: "", payMax: "", payPercentMin: "28%", payPercentMax: "35", payPercentOf: "production", payExpectedPeriod: "day", payExpectedMin: "800", payExpectedMax: "$1,000" }), true);
  assert.deepEqual(errors, {});
  assert.equal(row.pay_period, null, "no dollar range was entered, so no unit is saved");
  assert.equal(row.pay_min, null);
  assert.equal(row.pay_percent_min, 28);
  assert.equal(row.pay_percent_max, 35);
  assert.equal(row.pay_expected_min, 800);
  assert.equal(row.pay_expected_max, 1000);
  assert.equal(row.pay_expected_period, "day");
  assert.equal(payBasisOf(row), "percent");
  assert.equal(payText(row), "28% to 35% of production, expected earnings $800 to $1,000 a day (the clinic's estimate)");
  assert.deepEqual(payChips(row), ["28% to 35% of production", "Expected $800 to $1,000 a day"]);
  assert.deepEqual(salaryForMarkup(row), { min: 800, max: 1000, unitText: "DAY" });
  const data = ld(row);
  assert.ok("baseSalary" in data, "the clinic's expected earnings are the dollar figure Google is given");
  assert.ok(data.description.includes(payText(row)), "the markup says it is the clinic's estimate, as the page does");
});

test("expected earnings: a day or a year, the usual width rules, and only with a percentage on its own", () => {
  const pct = { payPercentMin: "28", payPercentMax: "35", payPercentOf: "production" };
  assert.deepEqual(validatePay(input({ ...pct, payExpectedPeriod: "year", payExpectedMin: "150000", payExpectedMax: "190000" })), {});
  assert.ok(validatePay(input({ ...pct, payExpectedPeriod: "day", payExpectedMin: "700", payExpectedMax: "1000" })).payExpectedMax?.includes("$200 a day"));
  assert.ok(validatePay(input({ ...pct, payExpectedPeriod: "year", payExpectedMin: "100000", payExpectedMax: "180000" })).payExpectedMax?.includes("$50,000"));
  assert.ok(validatePay(input({ ...pct, payExpectedPeriod: "hour", payExpectedMin: "60", payExpectedMax: "70" })).payExpectedPeriod);
  assert.ok(validatePay(input({ ...pct, payExpectedPeriod: "day", payExpectedMin: "lots", payExpectedMax: "1000" })).payExpectedMin);
  assert.ok(validatePay(input({ ...pct, payExpectedPeriod: "day", payExpectedMin: "1000", payExpectedMax: "800" })).payExpectedMax);
  // With a dollar range as well, expected earnings are not needed and are not kept.
  const both = { ...pct, payPeriod: "day", payMin: "600", payMax: "800", payExpectedPeriod: "day", payExpectedMin: "900", payExpectedMax: "1000" };
  assert.deepEqual(validatePay(input(both)), {});
  assert.equal(payColumns(input(both)).pay_expected_min, null);
  // Old rows with a percentage and no expected earnings still read as before, and the review flags them.
  const old = { pay_percent_min: 28, pay_percent_max: 35, pay_percent_of: "production" };
  assert.equal(payText(old), "28% to 35% of production");
  assert.equal(salaryForMarkup(old), null);
  assert.ok(payFlags(old).some((f) => /no expected earnings/.test(f)));
});

test("(c) a guaranteed daily minimum and a percentage together", () => {
  const { row, errors } = jobFromForm(filled({ payPeriod: "day", payMin: "600", payMax: "800", payIsMinimum: "yes", payPercentMin: "28", payPercentMax: "35", payPercentOf: "collections" }), true);
  assert.deepEqual(errors, {});
  assert.equal(payBasisOf(row), "both");
  assert.equal(payText(row), "A guaranteed minimum of $600 to $800 a day, or 28% to 35% of collections when that comes to more");
  assert.deepEqual(payChips(row), ["Minimum $600 to $800 a day", "28% to 35% of collections"]);
  assert.equal(ld(row).baseSalary?.value.unitText, "DAY");
  assert.ok(ld(row).description.includes(payText(row)), "the percentage sentence is in the markup text as well as on the page");
});

test("(c) a salary with a percentage paid on top, and an hourly wage with a percentage", () => {
  const salary = jobFromForm(filled({ payMin: "90000", payMax: "110000", payPercentMin: "8", payPercentMax: "12", payPercentOf: "billings" }), true);
  assert.deepEqual(salary.errors, {});
  assert.equal(payText(salary.row), "$90,000 to $110,000 a year, plus 8% to 12% of billings");
  assert.equal(salaryForMarkup(salary.row)?.unitText, "YEAR");
  const exam = jobFromForm(filled({ payPeriod: "hour", payMin: "60", payMax: "70", payPercentMin: "40", payPercentMax: "50", payPercentOf: "exam_fees" }), true);
  assert.deepEqual(exam.errors, {});
  assert.equal(payText(exam.row), "$60 to $70 an hour, plus 40% to 50% of exam fees");
});

test("only one part needs to be filled: the other is left empty and ignored", () => {
  const money = jobFromForm(filled({ payPercentMin: "", payPercentMax: "", payPercentOf: "billings" }), true);
  assert.deepEqual(money.errors, {});
  assert.equal(money.row.pay_percent_of, null, "the 'of' choice is not saved without a percentage");
  assert.equal(payText(money.row), "$95,000 to $120,000 a year");
  const percent = payColumns(input({ payPeriod: "day", payDays: "4", payIsMinimum: "yes", payPercentMin: "30", payPercentMax: "35" }));
  assert.equal(percent.pay_period, null, "days and the minimum tick are ignored when there are no dollars");
  assert.equal(percent.pay_days_per_week, null);
  assert.equal(percent.pay_is_minimum, false);
  assert.equal(percent.pay_percent_of, "production", "a percentage with no 'of' chosen reads as production");
});

test("(d) hourly or salary plus a bonus note keeps the note and still needs the range", () => {
  const { row, errors } = jobFromForm(filled({ roleCategory: "Optician", payPeriod: "hour", payMin: "24", payMax: "28.50", payExtras: "Plus a yearly bonus and commission on frames" }), true);
  assert.deepEqual(errors, {});
  assert.equal(payText(row), "$24 to $28.50 an hour");
  const markup = markupDescription({ ...row, description: "Join us.", work_arrangement: "on_site" });
  assert.ok(markup.endsWith("Also part of the pay: Plus a yearly bonus and commission on frames"));
  assert.equal(markup.includes("Pay:"), false, "dollars only has no extra pay sentence");
});

test("(e) blank or negotiable pay is refused, in every unit and for every role", () => {
  for (const period of ["year", "hour", "day"]) {
    const errors = validatePay(input({ payPeriod: period }));
    assert.ok(errors.payMin, `${period} blank is refused`);
  }
  assert.ok(validatePay(input({ roleCategory: "Optician" })).payMin);
  assert.ok(validatePay(input({ roleCategory: "" })).payMin);
  const words = validatePay(input({ payMin: "negotiable", payMax: "discussed at interview" }));
  assert.match(words.payMin, /negotiable/);
  assert.match(words.payMax, /required on every post/);
  const percentWords = validatePay(input({ payPercentMin: "competitive", payPercentMax: "" }));
  assert.match(percentWords.payPercentMin, /negotiable/);
  assert.ok(percentWords.payPercentMax);
  const { errors } = jobFromForm(filled({ payMin: "", payMax: "", payExtras: "Negotiable" }), true);
  assert.ok(errors.payMin, "a note that says negotiable never stands in for the range");
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
  assert.equal(payRangeAllowed(900, 900, "day"), true);
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
  assert.ok(validatePay(input({ payPercentMin: "25", payPercentMax: "36" })).payPercentMax.includes("10 points"));
  assert.deepEqual(validatePay(input({ payPercentMin: "25", payPercentMax: "35", payPercentOf: "billings", payExpectedPeriod: "day", payExpectedMin: "800", payExpectedMax: "1000" })), {});
});

test("salary and hourly width rules are unchanged", () => {
  assert.equal(payRangeAllowed(40000, 90000, "year"), true);
  assert.equal(payRangeAllowed(40000, 90001, "year"), false);
  assert.equal(payRangeAllowed(120000, 250000, "year"), true);
  assert.equal(payRangeAllowed(24, 28, "hour"), true);
  assert.equal(payRangeAllowed(20, 50, "hour"), false);
});

test("when both parts are given, each is checked on its own", () => {
  const ok = input({ payPeriod: "day", payMin: "600", payMax: "800", payIsMinimum: "yes", payPercentMin: "28", payPercentMax: "35", payPercentOf: "production" });
  assert.deepEqual(validatePay(ok), {});
  assert.ok(validatePay({ ...ok, payPercentMax: "50" }).payPercentMax, "percentage too wide");
  assert.ok(validatePay({ ...ok, payMax: "900" }).payMax, "dollars too wide");
  assert.ok(validatePay({ ...ok, payPercentMax: "" }).payPercentMax, "half a percentage range is refused");
  assert.ok(validatePay({ ...ok, payMax: "" }).payMax, "half a dollar range is refused");
});

// ---------------------------------------------------------------- odd values

test("zero, negative, over 100, huge and very long values are refused with a plain message", () => {
  assert.ok(validatePay(input({ payPeriod: "day", payMin: "0", payMax: "800" })).payMin);
  assert.ok(validatePay(input({ payPeriod: "day", payMin: "-5", payMax: "800" })).payMin);
  assert.ok(validatePay(input({ payPercentMin: "0", payPercentMax: "5" })).payPercentMin);
  assert.ok(validatePay(input({ payPercentMin: "90", payPercentMax: "101" })).payPercentMax);
  assert.equal(parsePercent("100"), 100);
  assert.equal(parsePercent("100.5"), null);
  assert.ok(validatePay(input({ payMin: "1000", payMax: String(MAX_PAY.year + 1) })).payMax);
  assert.ok(validatePay(input({ payPeriod: "day", payMin: "900", payMax: "5001" })).payMax);
  assert.ok(validatePay(input({ payPeriod: "hour", payMin: "10", payMax: "501" })).payMax);
  const long = cleanJob({ payMin: "9".repeat(60), payPercentMin: "9".repeat(60), payDays: "123456" });
  assert.equal(long.payMin.length, 20);
  assert.equal(long.payPercentMin.length, 20);
  assert.equal(long.payDays.length, 2);
  assert.ok(validatePay(input({ payMin: "9".repeat(20), payMax: "9".repeat(20) })).payMin);
  assert.equal(cleanJob({ payExtras: "x".repeat(900) }).payExtras.length, 300);
});

test("a daily rate and a percentage are for optometrist roles only", () => {
  assert.ok(validatePay(input({ roleCategory: "Optician", payPeriod: "day", payMin: "900", payMax: "1000" })).payPeriod);
  assert.ok(validatePay(input({ roleCategory: "Optician", payMin: "60000", payMax: "70000", payPercentMin: "28", payPercentMax: "35" })).payPercentMin);
  assert.deepEqual(validatePay(input({ roleCategory: "Optician", payMin: "60000", payMax: "70000" })), {});
  assert.deepEqual(validatePay(input({ roleCategory: "", payPercentMin: "28", payPercentMax: "35", payExpectedPeriod: "day", payExpectedMin: "800", payExpectedMax: "1000" })), {}, "before a role is chosen nothing is refused for the role");
});

test("an unknown unit is refused", () => {
  assert.ok(validatePay(input({ payPeriod: "week", payMin: "1", payMax: "2" })).payPeriod);
  assert.ok(validatePay(input({ payPeriod: "", payMin: "1", payMax: "2" })).payPeriod);
});

test("a draft needs no pay, and a half finished percentage can still be saved as a draft", () => {
  const draft = new FormData();
  draft.set("title", "Draft");
  draft.set("payPercentMin", "28");
  const { row, errors } = jobFromForm(draft, false);
  assert.deepEqual(errors, {});
  assert.equal(row.status, "draft");
  assert.equal(row.pay_percent_min, 28);
  assert.equal(row.pay_percent_max, null);
});

// ---------------------------------------------------------------- yearly estimate for a daily rate

test("a daily rate with the days a week given gets a labelled yearly estimate (48 working weeks)", () => {
  const row = { pay_period: "day", pay_min: 900, pay_max: 1100, pay_days_per_week: 4 };
  assert.deepEqual(dailyEstimate(row), { min: 172800, max: 211200, days: 4 });
  assert.equal(estimateText(row), "About $172,800 to $211,200 a year at 4 days a week (our estimate, over 48 working weeks)");
  assert.deepEqual(yearlyPay(row), { min: 172800, max: 211200 });
  assert.equal(estimateText({ ...row, pay_days_per_week: 1 }), "About $43,200 to $52,800 a year at 1 day a week (our estimate, over 48 working weeks)");
  assert.equal(estimateText({ ...row, pay_days_per_week: null }), null, "no days, no estimate");
  assert.equal(estimateText({ ...row, pay_days_per_week: 9 }), null);
  assert.equal(estimateText({ pay_period: "year", pay_min: 1, pay_max: 2, pay_days_per_week: 4 }), null, "only a daily rate is estimated");
  // the estimate is never the salary given to Google
  assert.deepEqual(salaryForMarkup(row), { min: 900, max: 1100, unitText: "DAY" });
  assert.equal(payText(row), "$900 to $1,100 a day");
});

test("the days a week are saved only with a daily rate", () => {
  assert.equal(payColumns(input({ payPeriod: "day", payMin: "900", payMax: "1100", payDays: "4" })).pay_days_per_week, 4);
  assert.equal(payColumns(input({ payPeriod: "year", payMin: "9", payMax: "10", payDays: "4" })).pay_days_per_week, null);
  assert.equal(payColumns(input({ payPeriod: "day", payMin: "900", payMax: "1100", payDays: "9" })).pay_days_per_week, null);
  assert.ok(validatePay(input({ payPeriod: "day", payMin: "900", payMax: "1100", payDays: "9" })).payDays);
  assert.deepEqual(validatePay(input({ payPeriod: "day", payMin: "900", payMax: "1100", payDays: "" })), {}, "days a week is optional");
});

// ---------------------------------------------------------------- wording never breaks

test("no screen can show $0, NaN, null or undefined, whatever the row holds", () => {
  const rows: Record<string, unknown>[] = [
    {}, { pay_period: null }, { pay_period: "year" }, { pay_period: "year", pay_min: null, pay_max: null }, { pay_period: "year", pay_min: "abc", pay_max: "def" },
    { pay_period: "hour", pay_min: 0, pay_max: 0 }, { pay_period: "day", pay_min: 600 }, { pay_period: "day", pay_min: 600, pay_max: 800, pay_is_minimum: true, pay_percent_min: 28 },
    { pay_percent_min: 28 }, { pay_percent_min: 0, pay_percent_max: 0 }, { pay_percent_min: "x", pay_percent_max: "y" }, { pay_period: "week", pay_min: 5, pay_max: 6 },
    { pay_is_minimum: true }, { pay_period: "year", pay_min: undefined, pay_max: undefined, pay_percent_of: "gold" }, { pay_days_per_week: 4 },
    { pay_period: "day", pay_min: 900, pay_max: 1100, pay_days_per_week: "x" }, { pay_period: "day", pay_min: 900, pay_max: 1100, pay_days_per_week: 0 },
  ];
  for (const r of rows) {
    for (const text of [payText(r), ...payChips(r), estimateText(r) ?? "", markupPayLine(r) ?? ""]) assert.doesNotMatch(text, BAD, JSON.stringify(r));
  }
  assert.equal(payText({}), PAY_NOT_STATED);
  assert.deepEqual(payChips({}), []);
  assert.equal(payText({ pay_percent_min: 28, pay_percent_max: 35 }), "28% to 35% of production", "a missing 'of' reads as production");
  assert.equal(payText({ pay_percent_min: 30, pay_percent_max: 30, pay_percent_of: "billings" }), "30% of billings");
  assert.equal(payText({ pay_percent_min: 32.5, pay_percent_max: 37.25, pay_percent_of: "production" }), "32.5% to 37.25% of production");
  assert.equal(payText({ pay_percent_min: 40, pay_percent_max: 50, pay_percent_of: "exam_fees" }), "40% to 50% of exam fees");
  assert.equal(payText({ pay_period: "day", pay_min: "900.00", pay_max: "1100.00" }), "$900 to $1,100 a day");
  assert.equal(payText({ pay_period: "year", pay_min: 62000, pay_max: 74000, pay_is_minimum: true }), "Guaranteed minimum $62,000 to $74,000 a year");
});

test("old rows (no new columns at all) read exactly as before", () => {
  assert.equal(payText({ pay_period: "hour", pay_min: "24", pay_max: "28.5" }), "$24 to $28.50 an hour");
  assert.equal(payBasisOf({ pay_period: "year", pay_min: 1, pay_max: 2 }), "year");
  assert.equal(ld({ pay_period: "year", pay_min: "62000", pay_max: "74000" }).baseSalary?.value.unitText, "YEAR");
  assert.equal(markupDescription({ description: "Hi.", pay_period: "year", pay_min: 1, pay_max: 2 }), "Hi.");
});

// ---------------------------------------------------------------- benchmark, matching and review flags

test("only pay that can honestly be turned into a year is compared", () => {
  assert.deepEqual(yearlyPay({ pay_period: "hour", pay_min: 24, pay_max: 28 }), { min: 49920, max: 58240 });
  assert.deepEqual(yearlyPay({ pay_period: "year", pay_min: 90000, pay_max: 110000 }), { min: 90000, max: 110000 });
  assert.equal(yearlyPay({ pay_period: "day", pay_min: 900, pay_max: 1100 }), null, "a daily rate without the days a week");
  assert.equal(yearlyPay({ pay_period: "day", pay_min: 600, pay_max: 800, pay_is_minimum: true, pay_days_per_week: 4 }), null, "a guaranteed minimum is a floor, not a typical figure");
  assert.equal(yearlyPay({ pay_period: "year", pay_min: 90000, pay_max: 110000, pay_percent_min: 8, pay_percent_max: 12 }), null, "dollars plus a percentage");
  assert.equal(yearlyPay({ pay_percent_min: 28, pay_percent_max: 35, pay_percent_of: "production" }), null);
  assert.equal(yearlyPay({}), null);
});

test("review flags for the new pay", () => {
  const base = { title: "OD", description: "A friendly clinic." };
  assert.deepEqual(reviewFlags({ ...base, pay_period: "day", pay_min: 900, pay_max: 1100 }), []);
  assert.ok(reviewFlags({ ...base, pay_period: "day", pay_min: 20, pay_max: 100 }).some((f) => /Daily pay looks unusually/.test(f)));
  assert.ok(reviewFlags({ ...base, pay_period: "day", pay_min: 500, pay_max: 900 }).includes("Pay range is too wide"));
  assert.deepEqual(reviewFlags({ ...base, pay_percent_min: 28, pay_percent_max: 35, pay_percent_of: "production", pay_expected_min: 800, pay_expected_max: 1000, pay_expected_period: "day" }), []);
  assert.ok(payFlags({ pay_percent_min: 2, pay_percent_max: 4 }).some((f) => /percentage looks unusually/.test(f)));
  assert.ok(payFlags({ pay_percent_min: 30, pay_percent_max: 80 }).includes("Percentage range is too wide"));
});

test("a full validation of a submitted percentage job passes, and fails if the role is wrong", () => {
  const job = cleanJob({
    title: "Optometrist", roleCategory: "Optometrist", employmentType: "Full time", province: "Ontario", city: "Toronto",
    payPercentMin: "28", payPercentMax: "35", payPercentOf: "production", payExpectedPeriod: "day", payExpectedMin: "800", payExpectedMax: "1000", existingVacancy: "yes", usesAi: "no", applyMethod: "kestrel",
    description: "Join a friendly, busy independent clinic as our associate optometrist and work closely with our team.",
  });
  assert.deepEqual(validateJob(job, true), {});
  assert.ok(validateJob({ ...job, roleCategory: "Optician" }, true).payPercentMin);
});

test("payColumns writes only the parts that were filled in", () => {
  const c = payColumns(input({ payPeriod: "year", payMin: "95,000", payMax: "$120000" }));
  assert.deepEqual(c, { pay_period: "year", pay_min: 95000, pay_max: 120000, pay_is_minimum: false, pay_days_per_week: null, pay_percent_min: null, pay_percent_max: null, pay_percent_of: null, pay_expected_min: null, pay_expected_max: null, pay_expected_period: null });
});
