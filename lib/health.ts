// Pure checks behind /api/health, kept apart so they can be tested without a database.
type Env = Record<string, string | undefined>;

// Settings whose absence would fail quietly on the live site. Names only, never values.
export const REQUIRED_IN_PRODUCTION = ["CRON_SECRET", "ADMIN_ALERT_EMAIL", "RESEND_API_KEY", "TURNSTILE_SECRET_KEY", "NEXT_PUBLIC_TURNSTILE_SITE_KEY"];

export const missingSettings = (env: Env = process.env) => REQUIRED_IN_PRODUCTION.filter((name) => !env[name]);

export const DAILY_LATE_HOURS = 36;

// "ok": it finished well recently. "late": it has not finished well for over 36 hours. "none": it has never run
// (a new site, or the schedule was never turned on), which is reported but does not fail the check.
export function dailyStatus(lastOkAt: string | null | undefined, now = new Date()) {
  if (!lastOkAt) return "none" as const;
  return now.getTime() - new Date(lastOkAt).getTime() > DAILY_LATE_HOURS * 60 * 60 * 1000 ? ("late" as const) : ("ok" as const);
}
