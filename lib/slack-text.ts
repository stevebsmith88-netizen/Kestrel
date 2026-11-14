// The wording of the Slack alerts (Steve, 14th November 2026). Pure, so it can be tested (lib/slack-text.test.ts). Alerts carry counts, clinic names, job
// titles and towns only: never an applicant's or a candidate's name, email address, phone number or resume.

type Env = Record<string, string | undefined>;

// Which copy of the site sent it, so demo activity is never mistaken for the real thing.
export function siteLabel(env: Env): string {
  if (env.DEMO_MODE === "yes") return "demo";
  if (env.VERCEL_ENV === "production") return "live";
  if (env.VERCEL_ENV === "preview") return "preview";
  return "local";
}

// Slack reads &, < and > as its own markup, so text that comes from a person is escaped.
export const slackEscape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// One alert: a bold first line with the site label, then a line for each detail.
export function formatAlert(label: string, title: string, lines: string[] = []): string {
  return [`*[${label}] ${slackEscape(title)}*`, ...lines.filter(Boolean).map((l) => slackEscape(l))].join("\n");
}

// Only a real Slack incoming webhook address is ever used, so a mistyped or swapped setting cannot send alerts to another place.
export const isSlackWebhook = (url: string | undefined): url is string => Boolean(url && /^https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/_-]+$/.test(url));

export type DigestNumbers = {
  liveJobs: number;
  waitingForReview: number;
  openReports: number;
  newClinics: number;
  newCandidates: number;
  newApplications: number;
  newWaitlist: number;
  paymentsToday: number; // how many charged in the last 24 hours
  paidTodayCents: number;
  paidTotalCents: number;
};

const money = (cents: number) => "$" + (cents / 100).toLocaleString("en-CA", { minimumFractionDigits: cents % 100 ? 2 : 0 });
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// The morning summary: what happened in the last 24 hours, then where things stand.
export function digestMessage(label: string, n: DigestNumbers): string {
  return formatAlert(label, "Daily summary", [
    `Last 24 hours: ${plural(n.newClinics, "new clinic account", "new clinic accounts")}, ${plural(n.newCandidates, "new candidate account", "new candidate accounts")}, ${plural(n.newApplications, "application", "applications")}, ${plural(n.newWaitlist, "waitlist sign up", "waitlist sign ups")}.`,
    `Payments: ${plural(n.paymentsToday, "payment", "payments")} taken, ${money(n.paidTodayCents)} before HST. ${money(n.paidTotalCents)} in total.`,
    `Now: ${plural(n.liveJobs, "live job", "live jobs")}, ${n.waitingForReview} waiting for review, ${plural(n.openReports, "open report", "open reports")}.`,
  ]);
}

// What the Admin check says about the setting, without ever showing the address itself.
export function slackStatus(url: string | undefined): { ok: boolean; detail: string } {
  if (!url) return { ok: false, detail: "Not set. Add SLACK_WEBHOOK_URL in Vercel for Production and Preview, then redeploy without the build cache." };
  if (url !== url.trim()) return { ok: false, detail: "There is a space or line break at the start or end of the address. Paste it again with nothing around it." };
  if (!isSlackWebhook(url)) return { ok: false, detail: "It does not look like a Slack incoming webhook address. It should start with https://hooks.slack.com/services/." };
  return { ok: true, detail: "Set, and it looks like a Slack incoming webhook address." };
}
