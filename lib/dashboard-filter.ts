// The filter behind the tiles on the clinic dashboard. Each tile links to the Your jobs list with `?show=...`, and the list shows only what the
// tile was counting. Kept free of imports from the app so it can be tested on its own (lib/dashboard-filter.test.ts).

export const SHOW_FILTERS = ["live", "applicants", "review", "drafts", "posted"] as const;
export type Show = (typeof SHOW_FILTERS)[number];

export function parseShow(value: unknown): Show | null {
  return typeof value === "string" && (SHOW_FILTERS as readonly string[]).includes(value) ? (value as Show) : null;
}

type JobLike = { id: string; status: string; posted_at?: string | null };
type Counts = Record<string, { fresh: number; total: number } | undefined>;

export function filterJobs<T extends JobLike>(jobs: T[], show: Show | null, applicants: Counts): T[] {
  if (!show) return jobs;
  switch (show) {
    case "live": return jobs.filter((j) => j.status === "live");
    case "review": return jobs.filter((j) => j.status === "in_review");
    case "drafts": return jobs.filter((j) => j.status === "draft" || j.status === "rejected");
    case "applicants": return jobs.filter((j) => (applicants[j.id]?.fresh ?? 0) > 0);
    case "posted": return jobs.filter((j) => Boolean(j.posted_at));
  }
}

// What the list is called while a filter is on, and what to say when nothing matches.
export const SHOW_LABELS: Record<Show, { title: string; empty: string }> = {
  live: { title: "Your live jobs", empty: "You have no live jobs right now. When a post is approved it appears here." },
  applicants: { title: "Jobs with new applicants", empty: "No new applicants are waiting to be opened. When someone applies, the job appears here." },
  review: { title: "Jobs with our team", empty: "Nothing is with our team right now. When you send a post for review it appears here." },
  drafts: { title: "Your drafts", empty: "You have no drafts. Choose Post a job to start one." },
  posted: { title: "Views and apply clicks by job", empty: "None of your jobs has been live yet, so there are no views to show." },
};

// Where the New applicants tile goes: straight to the applicants for the 1 job that has new ones, otherwise to the filtered list.
export function newApplicantsHref(jobs: JobLike[], applicants: Counts): string {
  const withNew = jobs.filter((j) => (applicants[j.id]?.fresh ?? 0) > 0);
  return withNew.length === 1 ? `/clinic/jobs/${withNew[0].id}/applicants` : "/clinic?show=applicants#your-jobs";
}
