// Job views and apply clicks: the counting rules, kept apart from the database so they can be tested.
// Counts are per job per day, with no cookie and no visitor address (migration 0030).

export type StatRow = { job_id: string; day: string; views: number; apply_clicks: number };
export type JobNumbers = { views30: number; clicks30: number; viewsTotal: number; clicksTotal: number };

export const EVENT_KINDS = ["view", "apply_click"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Crawlers, link previews and monitors should not count as people looking at a job.
const BOT_AGENT = /bot|crawl|spider|slurp|preview|fetch|monitor|uptime|headless|lighthouse|facebookexternalhit|whatsapp|curl|wget|python|go-http|java\//i;

export function isBotAgent(userAgent: string | null | undefined) {
  if (!userAgent) return true;
  return BOT_AGENT.test(userAgent);
}

// What the browser may send: a job id and one of the 2 kinds, nothing else.
export function parseEvent(raw: unknown): { jobId: string; kind: EventKind } | null {
  if (!raw || typeof raw !== "object") return null;
  const { job, kind } = raw as { job?: unknown; kind?: unknown };
  if (typeof job !== "string" || !UUID.test(job)) return null;
  if (typeof kind !== "string" || !(EVENT_KINDS as readonly string[]).includes(kind)) return null;
  return { jobId: job.toLowerCase(), kind: kind as EventKind };
}

const DAY_MS = 86_400_000;

// Totals for each job: the last 30 days (today and the 29 before it) and everything recorded.
export function summariseStats(rows: StatRow[], today: Date = new Date()): Record<string, JobNumbers> {
  const todayDay = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const out: Record<string, JobNumbers> = {};
  for (const row of rows) {
    const n = (out[row.job_id] ??= { views30: 0, clicks30: 0, viewsTotal: 0, clicksTotal: 0 });
    n.viewsTotal += row.views;
    n.clicksTotal += row.apply_clicks;
    const age = Math.round((todayDay - Date.parse(`${row.day}T00:00:00Z`)) / DAY_MS);
    if (age >= 0 && age < 30) {
      n.views30 += row.views;
      n.clicks30 += row.apply_clicks;
    }
  }
  return out;
}

export function sumNumbers(all: Record<string, JobNumbers>): JobNumbers {
  return Object.values(all).reduce(
    (t, n) => ({ views30: t.views30 + n.views30, clicks30: t.clicks30 + n.clicks30, viewsTotal: t.viewsTotal + n.viewsTotal, clicksTotal: t.clicksTotal + n.clicksTotal }),
    { views30: 0, clicks30: 0, viewsTotal: 0, clicksTotal: 0 },
  );
}

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("en-CA")} ${n === 1 ? one : many}`;

// The line under each job on the dashboard.
export function numbersLine(n: JobNumbers | undefined) {
  if (!n || (n.viewsTotal === 0 && n.clicksTotal === 0)) return "No views yet";
  return `${plural(n.viewsTotal, "view", "views")} · ${plural(n.clicksTotal, "apply click", "apply clicks")}`;
}
