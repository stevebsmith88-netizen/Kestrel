// A cap on how many emails the daily job may send in one run. Every email Kestrel sends, including "confirm your email",
// shares one Resend account, and the free plan refuses everything after 100 in a day. The daily job stops at this number
// so it can never use up the day's allowance, and whatever is left waits for tomorrow. Since migration 0042 the emails people's
// clicks send come off the budget first (budgetAfterClicks), so the day's total stays within it (audit P1-24).
type Env = Record<string, string | undefined>;

export const DEFAULT_DAILY_BUDGET = 50;

export function dailyBudget(env: Env = process.env) {
  const given = Number(env.DAILY_EMAIL_BUDGET);
  return Number.isFinite(given) && given >= 0 && env.DAILY_EMAIL_BUDGET !== "" && env.DAILY_EMAIL_BUDGET !== undefined ? Math.min(Math.floor(given), 5000) : DEFAULT_DAILY_BUDGET;
}

export function makeBudget(limit: number) {
  let used = 0;
  return {
    // Ask before each send. False means the budget is spent.
    take() {
      if (used >= limit) return false;
      used += 1;
      return true;
    },
    // Give one back when an email turned out not to be sent on purpose (for example, the address asked us to stop).
    refund() {
      if (used > 0) used -= 1;
    },
    get used() {
      return used;
    },
    get left() {
      return limit - used;
    },
    limit,
  };
}

// Emails sent by people pressing buttons (a bulk decline, a new application) share 1 count with the daily job (audit P1-24, migration
// 0042). The daily job takes what is left of the day's budget after those. With no count to read (before the migration), it uses the
// whole budget, as before.
export function budgetAfterClicks(budget: number, sentToday: number | null) {
  if (sentToday === null) return budget;
  return Math.max(0, budget - sentToday);
}

// Steve is emailed once a day when the day's total reaches this many: 80% of the budget, rounded up, and at least 1.
// The database works the same figure out for itself (count_email_send in migration 0042).
export const warnAt = (budget: number) => Math.max(1, Math.ceil(Math.max(budget, 0) * 0.8));
