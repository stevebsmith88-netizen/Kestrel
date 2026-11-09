// How a job's pay is worked out, checked, worded and handed to Google, in one place. Kept free of imports from the app so the rules can be
// tested on their own (lib/job-pay.test.ts). Every screen builds its pay wording here (payText and payChips), so none of them can show
// $0, $NaN, null or undefined. Pay is public on every job: nothing here hides pay behind a login.
//
// A job's pay has up to two parts, and at least one must be filled in (Steve, 9th November 2026):
//   money        a range in dollars a year, an hour or a day (optometrist roles can use a day). Optionally "a guaranteed minimum".
//   percentage   a range of a percentage of production, collections, billings or exam fees (optometrist roles only)
// Both together read "money, plus the percentage", or, when the money is a guaranteed minimum, "the minimum, or the percentage when that
// comes to more". "Negotiable" on its own is never accepted.

export const HOURS_IN_A_YEAR = 2080;
export const WORKING_WEEKS = 48; // for estimating a yearly figure from a daily rate (Steve, 9th November 2026)
const MAX_RANGE = 50000; // a year, up to this wide
const NO_LIMIT_ABOVE = 200000; // a year, no width limit when the top is over this
export const MAX_DAY_RANGE = 200; // a day: up to this wide (Steve, 9th November 2026)
export const MAX_PERCENT_RANGE = 10; // percentage points (Steve, 9th November 2026)

export const MONEY_PERIODS = [
  { value: "year", label: "A year" },
  { value: "hour", label: "An hour" },
  { value: "day", label: "A day" },
] as const;

// Only optometrist roles can use these. Widen the list here if Steve decides to.
export const OPTOMETRIST_ONLY_PERIODS: readonly string[] = ["day"];
export const OPTOMETRIST_ROLE = "Optometrist";

export const PERCENT_OF = [
  { value: "production", label: "Production" },
  { value: "collections", label: "Collections" },
  { value: "billings", label: "Billings" },
  { value: "exam_fees", label: "Exam fees" },
] as const;
const OF_WORDS: Record<string, string> = { production: "production", collections: "collections", billings: "billings", exam_fees: "exam fees" };

// The largest figure accepted, so a typing slip never reaches the database.
export const MAX_PAY: Record<string, number> = { year: 1_000_000, hour: 500, day: 5_000 };

// Parses "62,000", "$62000" or "24.50". Returns null for anything else.
export function parseMoney(value: string): number | null {
  const cleaned = value.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return n > 0 ? n : null;
}

// Parses "28", "28%" or "32.5". Returns null for anything else, and for 0 or more than 100.
export function parsePercent(value: string): number | null {
  const cleaned = value.replace(/[%\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return n > 0 && n <= 100 ? n : null;
}

// True when a money range is allowed. A year or an hour: up to $50,000 wide a year (hourly pay is converted to a year), unless the top
// is over $200,000. A day: up to $200 wide, with no exception.
export function payRangeAllowed(min: number, max: number, period: string) {
  if (period === "day") return max - min <= MAX_DAY_RANGE;
  const factor = period === "hour" ? HOURS_IN_A_YEAR : 1;
  return factor * (max - min) <= MAX_RANGE || factor * max > NO_LIMIT_ABOVE;
}

export const percentRangeAllowed = (min: number, max: number) => Math.round((max - min) * 100) / 100 <= MAX_PERCENT_RANGE;

// ---------------------------------------------------------------- reading pay from a database row

// The pay columns of a job (or a template). Everything is optional because a draft may have none of it.
export type PayFields = {
  pay_period?: string | null;
  pay_min?: number | string | null;
  pay_max?: number | string | null;
  pay_is_minimum?: boolean | null; // the money is a guaranteed minimum
  pay_days_per_week?: number | string | null; // for a daily rate: days worked a week, used only for a yearly estimate
  pay_percent_min?: number | string | null;
  pay_percent_max?: number | string | null;
  pay_percent_of?: string | null;
};

// A usable positive number, or null (so a missing figure is never treated as 0).
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

type Money = { period: "year" | "hour" | "day"; min: number; max: number };
type Share = { min: number; max: number; of: string };

function moneyOf(f: PayFields): Money | null {
  const min = num(f.pay_min);
  const max = num(f.pay_max);
  const p = f.pay_period;
  return min !== null && max !== null && (p === "year" || p === "hour" || p === "day") ? { period: p, min, max } : null;
}
function shareOf(f: PayFields): Share | null {
  const min = num(f.pay_percent_min);
  const max = num(f.pay_percent_max);
  return min !== null && max !== null ? { min, max, of: OF_WORDS[f.pay_percent_of ?? ""] ? (f.pay_percent_of as string) : "production" } : null;
}

// "year", "hour" or "day" for dollars only; "minimum" for a guaranteed minimum only; "percent" for a percentage only; "both" for the two together.
export type PayBasis = "year" | "hour" | "day" | "minimum" | "percent" | "both";
export function payBasisOf(f: PayFields): PayBasis | null {
  const m = moneyOf(f);
  const s = shareOf(f);
  if (m && s) return "both";
  if (s) return "percent";
  if (m) return f.pay_is_minimum === true ? "minimum" : m.period;
  return null;
}

const money = (n: number) => `$${n.toLocaleString("en-CA", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
const pct = (n: number) => `${n.toLocaleString("en-CA", { maximumFractionDigits: 2 })}%`;
const range = (a: number, b: number, fmt: (n: number) => string) => (a === b ? fmt(a) : `${fmt(a)} to ${fmt(b)}`);
const UNIT: Record<string, string> = { year: "a year", hour: "an hour", day: "a day" };

const moneyText = (m: Money) => `${range(m.min, m.max, money)} ${UNIT[m.period]}`;
const shareText = (s: Share) => `${range(s.min, s.max, pct)} of ${OF_WORDS[s.of] ?? "production"}`;

export const PAY_NOT_STATED = "Pay not stated";

// The pay in full, as the job page, the review queue and the page description show it.
export function payText(f: PayFields): string {
  const m = moneyOf(f);
  const s = shareOf(f);
  const guaranteed = f.pay_is_minimum === true;
  if (m && s) return guaranteed ? `A guaranteed minimum of ${moneyText(m)}, or ${shareText(s)} when that comes to more` : `${moneyText(m)}, plus ${shareText(s)}`;
  if (s) return shareText(s);
  if (m) return guaranteed ? `Guaranteed minimum ${moneyText(m)}` : moneyText(m);
  return PAY_NOT_STATED;
}

// The pay as short chips for a job card: 1, or 2 when dollars and a percentage are both given. Empty when pay is incomplete.
export function payChips(f: PayFields): string[] {
  const m = moneyOf(f);
  const s = shareOf(f);
  const chips: string[] = [];
  if (m) chips.push(f.pay_is_minimum === true ? `Minimum ${moneyText(m)}` : moneyText(m));
  if (s) chips.push(shareText(s));
  return chips;
}

// ---------------------------------------------------------------- yearly estimate for a daily rate

const daysOf = (f: PayFields): number | null => {
  const d = num(f.pay_days_per_week);
  return d !== null && Number.isInteger(d) && d <= 7 ? d : null;
};

// A daily rate with the days a week given is turned into a yearly estimate: the daily amount x the days a week x 48 working weeks.
// It is an estimate for comparing jobs, so it is always labelled as one and is never given to Google as the salary.
export function dailyEstimate(f: PayFields): { min: number; max: number; days: number } | null {
  const m = moneyOf(f);
  const days = daysOf(f);
  if (!m || m.period !== "day" || days === null) return null;
  return { min: m.min * days * WORKING_WEEKS, max: m.max * days * WORKING_WEEKS, days };
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function estimateText(f: PayFields): string | null {
  const e = dailyEstimate(f);
  if (!e) return null;
  const a = roundTo(e.min, 100);
  const b = roundTo(e.max, 100);
  return `About ${range(a, b, money)} a year at ${e.days} ${e.days === 1 ? "day" : "days"} a week (our estimate, over ${WORKING_WEEKS} working weeks)`;
}

// ---------------------------------------------------------------- Google's job markup

// What goes in baseSalary: the dollar part, with a unit. A percentage can never go here, and neither can the yearly estimate.
export function salaryForMarkup(f: PayFields): { min: number; max: number; unitText: "YEAR" | "HOUR" | "DAY" } | null {
  const m = moneyOf(f);
  if (!m) return null;
  return { min: m.min, max: m.max, unitText: m.period === "hour" ? "HOUR" : m.period === "day" ? "DAY" : "YEAR" };
}

// When there is a percentage, the page and the markup description both carry this sentence, so the two say the same thing.
export function markupPayLine(f: PayFields): string | null {
  return shareOf(f) ? `Pay: ${payText(f)}` : null;
}

// ---------------------------------------------------------------- comparing pay (benchmark, recommendations)

// Yearly figures, only for pay that can honestly be turned into a year: salary, hourly, and a daily rate with the days a week given.
// A guaranteed minimum or any pay with a percentage returns null, so the benchmark stays quiet and a candidate's minimum pay never drops
// the job (a missing figure is not $0).
export function yearlyPay(f: PayFields): { min: number; max: number } | null {
  const m = moneyOf(f);
  if (!m || shareOf(f) || f.pay_is_minimum === true) return null;
  if (m.period === "year") return { min: m.min, max: m.max };
  if (m.period === "hour") return { min: m.min * HOURS_IN_A_YEAR, max: m.max * HOURS_IN_A_YEAR };
  const e = dailyEstimate(f);
  return e ? { min: e.min, max: e.max } : null;
}

// ---------------------------------------------------------------- the clinic's form

export type PayInput = {
  payPeriod: string; // year, hour or day (the unit of the dollar boxes)
  payMin: string;
  payMax: string;
  payIsMinimum: string; // "yes" when the dollar amounts are a guaranteed minimum
  payDays: string; // days a week, for a daily rate
  payPercentMin: string;
  payPercentMax: string;
  payPercentOf: string;
  roleCategory: string;
};

const WORDS: Record<string, { noun: string; low: string; high: string }> = {
  year: { noun: "pay", low: "62,000", high: "74,000" },
  hour: { noun: "pay", low: "24", high: "28" },
  day: { noun: "daily rate", low: "900", high: "1,100" },
};
const WORDS_NOT_ACCEPTED = "Enter numbers only. A pay range is required on every post, so words such as \"negotiable\" are not accepted.";
const hasLetters = (s: string) => /[a-z]/i.test(s);
const filledIn = (...values: string[]) => values.some((v) => v.trim() !== "");

export function payColumns(j: PayInput) {
  const hasMoney = filledIn(j.payMin, j.payMax) && MONEY_PERIODS.some((p) => p.value === j.payPeriod);
  const hasShare = filledIn(j.payPercentMin, j.payPercentMax);
  const days = Number(j.payDays);
  return {
    pay_period: hasMoney ? j.payPeriod : null,
    pay_min: hasMoney ? parseMoney(j.payMin) : null,
    pay_max: hasMoney ? parseMoney(j.payMax) : null,
    pay_is_minimum: hasMoney && j.payIsMinimum === "yes",
    pay_days_per_week: hasMoney && j.payPeriod === "day" && Number.isInteger(days) && days >= 1 && days <= 7 ? days : null,
    pay_percent_min: hasShare ? parsePercent(j.payPercentMin) : null,
    pay_percent_max: hasShare ? parsePercent(j.payPercentMax) : null,
    pay_percent_of: hasShare ? (OF_WORDS[j.payPercentOf] ? j.payPercentOf : "production") : null,
  };
}

// Errors for the pay part of a post that is being submitted for review. Keys match the form fields.
export function validatePay(j: PayInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const optometrist = j.roleCategory === OPTOMETRIST_ROLE;
  const roleChosen = j.roleCategory !== "";
  const hasMoney = filledIn(j.payMin, j.payMax);
  const hasShare = filledIn(j.payPercentMin, j.payPercentMax);

  if (!hasMoney && !hasShare) {
    errors.payMin = roleChosen && !optometrist ? "Enter the lowest pay, for example 62,000. A pay range is required on every post." : "Enter a pay range: dollars, a percentage, or both. A pay range is required on every post.";
    if (!roleChosen || optometrist) errors.payPercentMin = "Or enter a percentage range here.";
    return errors;
  }

  if (hasMoney) {
    const b = j.payPeriod;
    const w = WORDS[b];
    if (!w) {
      errors.payPeriod = "Choose whether the pay is a year, an hour or a day.";
    } else if (OPTOMETRIST_ONLY_PERIODS.includes(b) && roleChosen && !optometrist) {
      errors.payPeriod = "A daily rate is for optometrist roles. Choose a year or an hour.";
    } else {
      const min = parseMoney(j.payMin);
      const max = parseMoney(j.payMax);
      if (min === null) errors.payMin = hasLetters(j.payMin) ? WORDS_NOT_ACCEPTED : `Enter the lowest ${w.noun}, for example ${w.low}.`;
      else if (min > MAX_PAY[b]) errors.payMin = "That is more than Kestrel accepts. Please check for a typing slip.";
      if (max === null) errors.payMax = hasLetters(j.payMax) ? WORDS_NOT_ACCEPTED : `Enter the highest ${w.noun}, for example ${w.high}.`;
      else if (max > MAX_PAY[b]) errors.payMax = "That is more than Kestrel accepts. Please check for a typing slip.";
      if (min !== null && max !== null && !errors.payMin && !errors.payMax) {
        if (max < min) errors.payMax = "The highest pay can't be lower than the lowest pay.";
        else if (!payRangeAllowed(min, max, b)) {
          errors.payMax =
            b === "hour"
              ? "The range is too wide. Hourly ranges can be up to $24 an hour wide, unless the top is over $96 an hour."
              : b === "day"
                ? "The range is too wide. Daily ranges can be up to $200 a day wide, for example $900 to $1,100."
                : "The range is too wide. Pay ranges can be up to $50,000 wide, unless the top is over $200,000.";
        }
      }
      const days = j.payDays.trim();
      if (b === "day" && days && !/^[1-7]$/.test(days)) errors.payDays = "Enter the days a week as a whole number from 1 to 7, or leave it blank.";
    }
  }

  if (hasShare) {
    if (roleChosen && !optometrist) {
      errors.payPercentMin = "A percentage is for optometrist roles. Enter a dollar range instead.";
    } else {
      const min = parsePercent(j.payPercentMin);
      const max = parsePercent(j.payPercentMax);
      if (min === null) errors.payPercentMin = hasLetters(j.payPercentMin) ? WORDS_NOT_ACCEPTED : "Enter the lowest percentage, for example 28.";
      if (max === null) errors.payPercentMax = hasLetters(j.payPercentMax) ? WORDS_NOT_ACCEPTED : "Enter the highest percentage, for example 35.";
      if (min !== null && max !== null) {
        if (max < min) errors.payPercentMax = "The highest percentage can't be lower than the lowest percentage.";
        else if (!percentRangeAllowed(min, max)) errors.payPercentMax = "The range is too wide. Percentage ranges can be up to 10 points wide, for example 28% to 38%.";
      }
      if (j.payPercentOf && !OF_WORDS[j.payPercentOf]) errors.payPercentOf = "Say what the percentage is of.";
    }
  }
  return errors;
}

// ---------------------------------------------------------------- things the admin should look at

export function payFlags(f: PayFields): string[] {
  const flags: string[] = [];
  const m = moneyOf(f);
  const s = shareOf(f);
  if (m && !payRangeAllowed(m.min, m.max, m.period)) flags.push("Pay range is too wide");
  // A typo such as $62 instead of $62,000, or 6 zeros too many, is far more likely than a real offer this low or high.
  if (m && m.period === "year" && (m.min < 25_000 || m.max > 500_000)) flags.push("Yearly pay looks unusually low or high. Check for a typing slip");
  if (m && m.period === "hour" && (m.min < 15 || m.max > 150)) flags.push("Hourly pay looks unusually low or high. Check for a typing slip");
  if (m && m.period === "day" && (m.min < 200 || m.max > 2_500)) flags.push("Daily pay looks unusually low or high. Check for a typing slip");
  if (s && !percentRangeAllowed(s.min, s.max)) flags.push("Percentage range is too wide");
  if (s && (s.min < 10 || s.max > 60)) flags.push("The percentage looks unusually low or high. Check for a typing slip");
  return flags;
}
