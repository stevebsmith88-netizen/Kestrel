// The arithmetic behind the admin numbers page, kept separate from the database so it can be tested.

export type Period = "30" | "90" | "year";
export const PERIODS: { value: Period; label: string }[] = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "year", label: "This year" },
];

export const parsePeriod = (value: string | undefined): Period => (value === "90" || value === "year" ? value : "30");

const DAY = 24 * 60 * 60 * 1000;

// The period asked for, and the one just before it of the same length, for "up on the last period".
export function periodRange(period: Period, now = new Date()) {
  const end = now.getTime();
  const start = period === "year" ? new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).getTime() : end - Number(period) * DAY;
  const length = end - start;
  return { start: new Date(start), end: new Date(end), previousStart: new Date(start - length), previousEnd: new Date(start) };
}

export const inRange = (iso: string | null | undefined, from: Date, to: Date) => {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t < to.getTime();
};

export const countIn = (dates: (string | null | undefined)[], from: Date, to: Date) => dates.filter((d) => inRange(d, from, to)).length;

// Jobs published in each of the last `weeks` weeks, oldest first. The last entry is the current week.
export function weeklyCounts(dates: (string | null | undefined)[], weeks = 12, now = new Date()) {
  const week = 7 * DAY;
  const out: { label: string; count: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const to = new Date(now.getTime() - i * week + 1);
    const from = new Date(to.getTime() - week);
    out.push({ label: `${from.getUTCDate()} ${from.toLocaleString("en-CA", { month: "short", timeZone: "UTC" })}`, count: countIn(dates, from, to) });
  }
  return out;
}

// Counts per value, biggest first, with the small ones gathered into "Other".
export function topCounts(values: (string | null | undefined)[], keep = 4) {
  const counts = new Map<string, number>();
  values.forEach((v) => v && counts.set(v, (counts.get(v) ?? 0) + 1));
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const head = sorted.slice(0, keep).map(([label, count]) => ({ label, count }));
  const rest = sorted.slice(keep).reduce((sum, [, n]) => sum + n, 0);
  return rest ? [...head, { label: "Other", count: rest }] : head;
}

export const ratio = (top: number, bottom: number, places = 1) => (bottom > 0 ? Math.round((top / bottom) * 10 ** places) / 10 ** places : null);
export const percent = (top: number, bottom: number) => (bottom > 0 ? Math.round((top / bottom) * 100) : null);

// "+18 on the last period", "down 3", or nothing to compare.
export function change(now: number, before: number) {
  if (before === 0 && now === 0) return "No change";
  const diff = now - before;
  if (diff === 0) return "Same as the last period";
  return diff > 0 ? `Up ${diff} on the last period` : `Down ${Math.abs(diff)} on the last period`;
}

export type JobRow = { employer_id: string; status: string; posted_at: string | null; province: string | null; created_at: string };

// The things an investor asks first, worked out from the jobs and the clinics.
export function investorNumbers(jobs: JobRow[], liveJobs: number, applications: number) {
  const everPublished = jobs.filter((j) => j.posted_at);
  const perClinic = new Map<string, number>();
  everPublished.forEach((j) => perClinic.set(j.employer_id, (perClinic.get(j.employer_id) ?? 0) + 1));
  const clinicsWithPosts = perClinic.size;
  const repeat = [...perClinic.values()].filter((n) => n >= 2).length;
  return {
    postsPerClinic: ratio(everPublished.length, clinicsWithPosts),
    clinicsThatRepost: percent(repeat, clinicsWithPosts),
    applicationsPerLiveJob: ratio(applications, liveJobs),
    clinicsWithPosts,
  };
}
