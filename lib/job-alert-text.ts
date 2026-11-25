// The line for one job in a job alert email: title, clinic, place and the pay. Kept free of app imports so it can be tested
// on its own (lib/job-alert-text.test.ts). Every job shows its pay on the site, so the email does too.
import { payChips, payText, type PayFields } from "./job-pay.ts";

export const ALERT_PAY_COLUMNS = "pay_period, pay_min, pay_max, pay_is_minimum, pay_percent_min, pay_percent_max, pay_percent_of";

export type AlertJob = PayFields & { title: string; clinic: string; place: string };

export function alertLine(j: AlertJob): string {
  const chips = payChips(j);
  const pay = chips.length ? chips.join(" and ") : payText(j);
  return `${j.title}, ${j.clinic}, ${j.place}, ${pay}`;
}
