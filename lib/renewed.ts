// Renewed jobs (Steve, 20th November 2026). Every extension moves a job back to the top of Newest. The database works out `sort_at` as the later of
// `posted_at` (when the job first went live, which never moves) and `last_extended_at` (migration 0061). Kept free of app imports so it can be tested.

// The date Newest goes by: when the job was last renewed if that is later, otherwise when it went live.
export function newestDate(job: { posted_at: string; sort_at?: string | null }): number {
  return Math.max(Date.parse(job.posted_at) || 0, Date.parse(job.sort_at ?? "") || 0);
}

// True when the job has been renewed since it was first posted (a minute of slack, so the 2 dates of a new job do not count).
export function isRenewed(job: { posted_at: string; sort_at?: string | null }): boolean {
  return newestDate(job) - (Date.parse(job.posted_at) || 0) > 60_000;
}

// What to show beside a job: the first posting date always, and when it has been renewed, the renewal date as well.
export function postedLines(job: { posted_at: string; sort_at?: string | null }, format: (iso: string) => string): { renewed: string | null; posted: string } {
  return { renewed: isRenewed(job) ? format(new Date(newestDate(job)).toISOString()) : null, posted: format(job.posted_at) };
}
