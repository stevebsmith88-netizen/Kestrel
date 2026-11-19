// Milestones worth a Slack cheer (Steve, 19th November 2026; next tasks item 19e). Pure rules, kept free of the database and the web so they
// can be tested (lib/milestones.test.ts). A milestone fires once: the keys already announced are kept by the daily job (lib/slack-milestones.ts).
import type { SlackChannel } from "./slack-channels.ts";

export type MilestoneCounts = { waitlist: number; clinics: number; candidates: number; liveJobs: number; applications: number; paidJobs: number };
type Metric = keyof MilestoneCounts;

export const MILESTONES: Record<Metric, { steps: number[]; channel: SlackChannel; thing: (n: number) => string }> = {
  waitlist: { steps: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000], channel: "signups", thing: (n) => `${ordinal(n)} waitlist sign up` },
  clinics: { steps: [1, 5, 10, 25, 50, 100, 250, 500], channel: "signups", thing: (n) => `${ordinal(n)} clinic account` },
  candidates: { steps: [1, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000], channel: "signups", thing: (n) => `${ordinal(n)} candidate account` },
  liveJobs: { steps: [1, 10, 25, 50, 100, 250, 500, 1000], channel: "jobs", thing: (n) => `${n} live ${n === 1 ? "job" : "jobs"} at the same time` },
  applications: { steps: [1, 10, 50, 100, 250, 500, 1000, 5000, 10000], channel: "jobs", thing: (n) => `${ordinal(n)} application` },
  paidJobs: { steps: [1, 10, 25, 50, 100, 250, 500], channel: "jobs", thing: (n) => `${ordinal(n)} paid job post` },
};

export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

export const milestoneKey = (metric: Metric, step: number) => `${metric}:${step}`;

// Every milestone the counts have reached, as keys.
export function reachedKeys(counts: MilestoneCounts): string[] {
  const out: string[] = [];
  for (const metric of Object.keys(MILESTONES) as Metric[]) for (const step of MILESTONES[metric].steps) if (counts[metric] >= step) out.push(milestoneKey(metric, step));
  return out;
}

// What to announce: only the highest new step for each metric (a jump from 9 to 26 sign ups is 1 message, for the 25th), never one already announced.
export function toAnnounce(counts: MilestoneCounts, already: string[]): { key: string; title: string; line: string; channel: SlackChannel }[] {
  const done = new Set(already);
  const out: { key: string; title: string; line: string; channel: SlackChannel }[] = [];
  for (const metric of Object.keys(MILESTONES) as Metric[]) {
    const fresh = MILESTONES[metric].steps.filter((s) => counts[metric] >= s && !done.has(milestoneKey(metric, s)));
    const top = fresh[fresh.length - 1];
    if (top === undefined) continue;
    const thing = MILESTONES[metric].thing(top);
    out.push({ key: milestoneKey(metric, top), title: `Milestone: ${thing}`, line: `Kestrel has reached its ${thing}.`, channel: MILESTONES[metric].channel });
  }
  return out;
}
