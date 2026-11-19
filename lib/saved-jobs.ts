// Saved jobs (Steve, 19th November 2026, migration 0059): a candidate saves a job to apply for later. Kept free of app imports so it can be tested
// on its own (lib/saved-jobs.test.ts).

export const SAVE_LIMIT = 100;
export const SAVE_LIMIT_TEXT = `You can save up to ${SAVE_LIMIT} jobs. Remove one to save another.`;

export type SaveState = "signed-out" | "hidden" | "saved" | "not-saved";

// Whether a saved job can still be applied for, and what to say if not.
export function openness(job: { status: string | null; expires_at: string | null } | null | undefined, now = new Date()): { open: boolean; text: string } {
  if (!job) return { open: false, text: "This job has been removed" };
  if (job.status === "live" && job.expires_at && new Date(job.expires_at) > now) return { open: true, text: "" };
  if (job.status === "closed") return { open: false, text: "No longer open: the role was filled or closed" };
  if (job.status === "expired" || (job.expires_at && new Date(job.expires_at) <= now)) return { open: false, text: "No longer open: the job has ended" };
  return { open: false, text: "Not open for applications" };
}

// Open jobs first (closing soonest first, so the ones to hurry for come first), then the ones that have ended, each newest saved first.
export function sortSaved<T extends { open: boolean; expires_at: string | null; saved_at: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (a.open !== b.open) return a.open ? -1 : 1;
    if (a.open) return String(a.expires_at).localeCompare(String(b.expires_at));
    return b.saved_at.localeCompare(a.saved_at);
  });
}

export function daysLeft(expiresAt: string | null, now = new Date()): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
}

export const closesText = (days: number | null) => (days === null ? "" : days <= 1 ? "Closes today or tomorrow" : days <= 7 ? `Closes in ${days} days` : "");
