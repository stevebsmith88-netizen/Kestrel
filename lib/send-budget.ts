// A cap on how many emails the daily job may send in one run. Every email Kestrel sends, including "confirm your email",
// shares one Resend account, and the free plan refuses everything after 100 in a day. The daily job stops at this number
// so it can never use up the day's allowance, and whatever is left waits for tomorrow.
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
