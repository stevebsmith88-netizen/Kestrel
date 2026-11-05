// What a clinic can do as a job reaches the end of its 30 days: extend it, or close it and tell us how
// they filled the role. Kept free of the database so the rules can be tested.

export const EXTEND_DAYS = 30;
// A live job can be extended once it has this many days or fewer left.
export const EXTEND_WINDOW_DAYS = 7;
// An expired job can be brought back for this many days after it ended. This matches the daily job,
// which closes out waiting applications a week after a job ends, so nobody is told "no update" and then reopened.
export const EXTEND_GRACE_DAYS = 7;

const DAY = 24 * 60 * 60 * 1000;

export type EndingJob = { status: string; expires_at: string | null; is_seeded?: boolean | null };

export function canExtend(job: EndingJob, now = new Date()): boolean {
  if (job.is_seeded || !job.expires_at) return false;
  const ends = new Date(job.expires_at).getTime();
  if (Number.isNaN(ends)) return false;
  const left = ends - now.getTime();
  if (job.status === "live") return left <= EXTEND_WINDOW_DAYS * DAY;
  if (job.status === "expired") return left <= 0 && -left <= EXTEND_GRACE_DAYS * DAY;
  return false;
}

// A live job gets 30 more days on top of its end date. An expired one starts 30 fresh days from now.
export function extendedUntil(job: EndingJob, now = new Date()): Date {
  const ends = job.expires_at ? new Date(job.expires_at).getTime() : now.getTime();
  const from = job.status === "live" ? Math.max(ends, now.getTime()) : now.getTime();
  return new Date(from + EXTEND_DAYS * DAY);
}

export const FILL_SOURCES = [
  { value: "kestrel", label: "Kestrel Eye Care Jobs" },
  { value: "indeed", label: "Indeed" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "word_of_mouth", label: "Word of mouth or a referral" },
  { value: "own_website", label: "Our own website" },
  { value: "other", label: "Another way" },
] as const;

export type FillSource = (typeof FILL_SOURCES)[number]["value"];

export function parseFillSource(value: unknown, other: unknown): { via: FillSource | null; other: string | null } {
  const found = FILL_SOURCES.find((s) => s.value === String(value ?? ""));
  if (!found) return { via: null, other: null };
  const note = found.value === "other" ? String(other ?? "").replace(/\s+/g, " ").trim().slice(0, 200) : "";
  return { via: found.value, other: note || null };
}
