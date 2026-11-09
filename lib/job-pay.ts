// How a job's pay is worked out, checked, worded and handed to Google, in one place. Kept free of imports from the app so the rules can be
// tested on their own (lib/job-pay.test.ts). Every screen builds its pay wording here (payText and payChips), so none of them can show
// $0, $NaN, null or undefined. Pay is public on every job: nothing here hides pay behind a login.
//
// The five ways the pay can be worked out ("basis"):
//   year         a yearly salary
//   hour         an hourly wage
//   day          a daily rate
//   day_minimum  a guaranteed minimum per day, with or without a percentage on top (optometrist roles)
//   percent      a percentage of production, collections or billings (optometrist roles)
// A pay range is required for every basis. "Negotiable" on its own is never accepted.

export const HOURS_IN_A_YEAR = 2080;
const MAX_RANGE = 50000; // a year, up to this wide
const NO_LIMIT_ABOVE = 200000; // a year, no width limit when the top is over this
export const MAX_DAY_RANGE = 200; // a day: up to this wide (Steve, 9th November 2026)
export const MAX_PERCENT_RANGE = 10; // percentage points (Steve, 9th November 2026)

export type PayBasis = "year" | "hour" | "day" | "day_minimum" | "percent";

export const PAY_BASES = [
  { value: "year", label: "A yearly salary" },
  { value: "hour", label: "An hourly wage" },
  { value: "day", label: "A daily rate" },
  { value: "percent", label: "A percentage of production" },
  { value: "day_minimum", label: "A daily minimum guarantee" },
] as const;

// Only optometrist roles can use these. Widen the list here if Steve decides to.
export const OPTOMETRIST_ONLY_BASES: readonly string[] = ["day", "day_minimum", "percent"];
export const OPTOMETRIST_ROLE = "Optometrist";

export const PERCENT_OF = [
  { value: "production", label: "Production" },
  { value: "collections", label: "Collections" },
  { value: "billings", label: "Billings" },
] as const;

// The largest figure accepted, so a typing slip never reaches the database.
export const MAX_PAY: Record<string, number> = { year: 1_000_000, hour: 500, day: 5_000, day_minimum: 5_000 };

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
  pay_is_minimum?: boolean | null;
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

export function payBasisOf(f: PayFields): PayBasis | null {
  const min = num(f.pay_min);
  const max = num(f.pay_max);
  const money = min !== null && max !== null;
  const period = f.pay_period;
  if (money && period === "day" && f.pay_is_minimum === true) return "day_minimum";
  if (money && (period === "year" || period === "hour" || period === "day") && f.pay_is_minimum !== true) return period;
  if (!money && num(f.pay_percent_min) !== null && num(f.pay_percent_max) !== null) return "percent";
  return null;
}

// The basis to show when a job is opened for editing. A draft with nothing chosen yet opens as a yearly salary.
export function editBasis(f: PayFields): PayBasis {
  if (f.pay_is_minimum === true) return "day_minimum";
  if (f.pay_period === "year" || f.pay_period === "hour" || f.pay_period === "day") return f.pay_period;
  if (num(f.pay_percent_min) !== null || num(f.pay_percent_max) !== null) return "percent";
  return "year";
}

const money = (n: number) => `$${n.toLocaleString("en-CA", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
const pct = (n: number) => `${n.toLocaleString("en-CA", { maximumFractionDigits: 2 })}%`;
const range = (a: number, b: number, fmt: (n: number) => string) => (a === b ? fmt(a) : `${fmt(a)} to ${fmt(b)}`);
const UNIT: Record<string, string> = { year: "a year", hour: "an hour", day: "a day" };

function percentText(f: PayFields): string | null {
  const a = num(f.pay_percent_min);
  const b = num(f.pay_percent_max);
  if (a === null || b === null) return null;
  const of = PERCENT_OF.find((p) => p.value === f.pay_percent_of)?.value ?? "production";
  return `${range(a, b, pct)} of ${of}`;
}

export const PAY_NOT_STATED = "Pay not stated";

// The pay in full, as the job page, the review queue and the page description show it.
export function payText(f: PayFields): string {
  const basis = payBasisOf(f);
  if (!basis) return PAY_NOT_STATED;
  if (basis === "percent") return percentText(f) ?? PAY_NOT_STATED;
  const amount = range(Number(f.pay_min), Number(f.pay_max), money);
  if (basis === "day_minimum") {
    const share = percentText(f);
    return share ? `A guaranteed minimum of ${amount} a day, or ${share} when that comes to more` : `Guaranteed minimum ${amount} a day`;
  }
  return `${amount} ${UNIT[basis]}`;
}

// The pay as short chips for a job card: usually 1, 2 when a daily minimum comes with a percentage. Empty when pay is incomplete.
export function payChips(f: PayFields): string[] {
  const basis = payBasisOf(f);
  if (!basis) return [];
  if (basis === "day_minimum") {
    const chips = [`Minimum ${range(Number(f.pay_min), Number(f.pay_max), money)} a day`];
    const share = percentText(f);
    if (share) chips.push(share);
    return chips;
  }
  return [payText(f)];
}

// ---------------------------------------------------------------- Google's job markup

// What goes in baseSalary: dollars with a unit. A percentage can never go here, so a percentage only job gets none.
export function salaryForMarkup(f: PayFields): { min: number; max: number; unitText: "YEAR" | "HOUR" | "DAY" } | null {
  const basis = payBasisOf(f);
  if (!basis || basis === "percent") return null;
  const unit = basis === "day_minimum" ? "day" : basis;
  return { min: Number(f.pay_min), max: Number(f.pay_max), unitText: unit === "hour" ? "HOUR" : unit === "day" ? "DAY" : "YEAR" };
}

// For a pay basis with a percentage, the page and the markup description both carry this sentence, so the two say the same thing.
export function markupPayLine(f: PayFields): string | null {
  const basis = payBasisOf(f);
  if (basis === "percent" || (basis === "day_minimum" && percentText(f))) return `Pay: ${payText(f)}`;
  return null;
}

// ---------------------------------------------------------------- comparing pay (benchmark, recommendations)

// Yearly figures, only for pay that can honestly be turned into a year: salary and hourly. A daily rate, a daily minimum and a percentage
// return null, so the benchmark stays quiet and a candidate's minimum pay never drops them (a missing figure is not $0).
export function yearlyPay(f: PayFields): { min: number; max: number } | null {
  const basis = payBasisOf(f);
  if (basis !== "year" && basis !== "hour") return null;
  const factor = basis === "hour" ? HOURS_IN_A_YEAR : 1;
  return { min: Number(f.pay_min) * factor, max: Number(f.pay_max) * factor };
}

// ---------------------------------------------------------------- the clinic's form

export type PayInput = {
  payPeriod: string; // the basis: year, hour, day, day_minimum or percent
  payMin: string;
  payMax: string;
  payPercentMin: string;
  payPercentMax: string;
  payPercentOf: string;
  payPercentToo: string; // "yes" when a daily minimum also pays a percentage
  roleCategory: string;
};

const WORDS: Record<string, { noun: string; low: string; high: string }> = {
  year: { noun: "pay", low: "62,000", high: "74,000" },
  hour: { noun: "pay", low: "24", high: "28" },
  day: { noun: "daily rate", low: "900", high: "1,100" },
  day_minimum: { noun: "daily minimum", low: "600", high: "800" },
};
const WORDS_NOT_ACCEPTED = "Enter numbers only. A pay range is required on every post, so words such as \"negotiable\" are not accepted.";
const hasLetters = (s: string) => /[a-z]/i.test(s);

export function payColumns(j: PayInput) {
  const b = j.payPeriod;
  const hasMoney = b === "year" || b === "hour" || b === "day" || b === "day_minimum";
  const hasPercent = b === "percent" || (b === "day_minimum" && j.payPercentToo === "yes");
  return {
    pay_period: b === "day_minimum" ? "day" : hasMoney ? b : null,
    pay_min: hasMoney ? parseMoney(j.payMin) : null,
    pay_max: hasMoney ? parseMoney(j.payMax) : null,
    pay_is_minimum: b === "day_minimum",
    pay_percent_min: hasPercent ? parsePercent(j.payPercentMin) : null,
    pay_percent_max: hasPercent ? parsePercent(j.payPercentMax) : null,
    pay_percent_of: hasPercent && PERCENT_OF.some((p) => p.value === j.payPercentOf) ? j.payPercentOf : null,
  };
}

// Errors for the pay part of a post that is being submitted for review. Keys match the form fields.
export function validatePay(j: PayInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const b = j.payPeriod;
  if (!PAY_BASES.some((p) => p.value === b)) {
    errors.payPeriod = "Choose how the pay is worked out.";
    return errors;
  }
  if (OPTOMETRIST_ONLY_BASES.includes(b) && j.roleCategory && j.roleCategory !== OPTOMETRIST_ROLE) {
    errors.payPeriod = "Daily rates, daily minimums and percentages are for optometrist roles. Choose a yearly salary or an hourly wage.";
    return errors;
  }

  if (b !== "percent") {
    const w = WORDS[b];
    const min = parseMoney(j.payMin);
    const max = parseMoney(j.payMax);
    if (min === null) errors.payMin = hasLetters(j.payMin) ? WORDS_NOT_ACCEPTED : `Enter the lowest ${w.noun}, for example ${w.low}.`;
    else if (min > MAX_PAY[b]) errors.payMin = "That is more than Kestrel accepts. Please check for a typing slip.";
    if (max === null) errors.payMax = hasLetters(j.payMax) ? WORDS_NOT_ACCEPTED : `Enter the highest ${w.noun}, for example ${w.high}.`;
    else if (max > MAX_PAY[b]) errors.payMax = "That is more than Kestrel accepts. Please check for a typing slip.";
    if (min !== null && max !== null && !errors.payMin && !errors.payMax) {
      const period = b === "day_minimum" ? "day" : b;
      if (max < min) errors.payMax = "The highest pay can't be lower than the lowest pay.";
      else if (!payRangeAllowed(min, max, period)) {
        errors.payMax =
          period === "hour"
            ? "The range is too wide. Hourly ranges can be up to $24 an hour wide, unless the top is over $96 an hour."
            : period === "day"
              ? "The range is too wide. Daily ranges can be up to $200 a day wide, for example $900 to $1,100."
              : "The range is too wide. Pay ranges can be up to $50,000 wide, unless the top is over $200,000.";
      }
    }
  }

  if (b === "percent" || (b === "day_minimum" && j.payPercentToo === "yes")) {
    const min = parsePercent(j.payPercentMin);
    const max = parsePercent(j.payPercentMax);
    if (min === null) errors.payPercentMin = hasLetters(j.payPercentMin) ? WORDS_NOT_ACCEPTED : "Enter the lowest percentage, for example 28.";
    if (max === null) errors.payPercentMax = hasLetters(j.payPercentMax) ? WORDS_NOT_ACCEPTED : "Enter the highest percentage, for example 35.";
    if (min !== null && max !== null) {
      if (max < min) errors.payPercentMax = "The highest percentage can't be lower than the lowest percentage.";
      else if (!percentRangeAllowed(min, max)) errors.payPercentMax = "The range is too wide. Percentage ranges can be up to 10 points wide, for example 28% to 38%.";
    }
    if (!PERCENT_OF.some((p) => p.value === j.payPercentOf)) errors.payPercentOf = "Say what the percentage is of.";
  }
  return errors;
}

// ---------------------------------------------------------------- things the admin should look at

export function payFlags(f: PayFields): string[] {
  const flags: string[] = [];
  const min = num(f.pay_min);
  const max = num(f.pay_max);
  const pmin = num(f.pay_percent_min);
  const pmax = num(f.pay_percent_max);
  const period = f.pay_is_minimum === true ? "day" : f.pay_period;
  if (min !== null && max !== null && period && !payRangeAllowed(min, max, period)) flags.push("Pay range is too wide");
  // A typo such as $62 instead of $62,000, or 6 zeros too many, is far more likely than a real offer this low or high.
  if (min !== null && max !== null && period === "year" && (min < 25_000 || max > 500_000)) flags.push("Yearly pay looks unusually low or high. Check for a typing slip");
  if (min !== null && max !== null && period === "hour" && (min < 15 || max > 150)) flags.push("Hourly pay looks unusually low or high. Check for a typing slip");
  if (min !== null && max !== null && period === "day" && (min < 200 || max > 2_500)) flags.push("Daily pay looks unusually low or high. Check for a typing slip");
  if (pmin !== null && pmax !== null && !percentRangeAllowed(pmin, pmax)) flags.push("Percentage range is too wide");
  if (pmin !== null && pmax !== null && (pmin < 10 || pmax > 60)) flags.push("The percentage looks unusually low or high. Check for a typing slip");
  return flags;
}
