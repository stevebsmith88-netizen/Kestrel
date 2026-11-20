// The free second chance (Steve, 20th November 2026): a clinic can post a job again once, free, when the older one ran 3 months and no hire was
// marked through Kestrel. Kept free of the database so the rules can be tested (lib/free-repost.test.ts). The website's server asks the questions
// (lib/free-repost-data.ts) and is the only thing that can save the marker, so a clinic cannot give itself one.

export const FREE_REPOST_AFTER_DAYS = 90;
const DAY = 24 * 60 * 60 * 1000;

export type FreeRepostJob = {
  status: string;
  posted_at: string | null;
  filled_via: string | null;
  filled_application_id: string | null;
  is_seeded: boolean | null;
  // Set when this job is itself a free second chance for an older one.
  free_repost_of: string | null;
};

export type FreeRepostWhy = "found-listing" | "never-live" | "is-free-copy" | "already-used" | "still-running" | "too-soon" | "filled-on-kestrel";
export type FreeRepostVerdict = { ok: true } | { ok: false; why: FreeRepostWhy };

// `alreadyHasFreeCopy` is true when another job already carries this one's id as its free second chance.
export function freeRepostVerdict(job: FreeRepostJob, alreadyHasFreeCopy: boolean, now = new Date()): FreeRepostVerdict {
  if (job.is_seeded) return { ok: false, why: "found-listing" };
  if (!job.posted_at) return { ok: false, why: "never-live" };
  // The free chance is not passed on from a free copy to another copy: once per job.
  if (job.free_repost_of) return { ok: false, why: "is-free-copy" };
  if (alreadyHasFreeCopy) return { ok: false, why: "already-used" };
  if (job.status !== "closed" && job.status !== "expired") return { ok: false, why: "still-running" };
  const posted = Date.parse(job.posted_at);
  if (Number.isNaN(posted) || now.getTime() - posted < FREE_REPOST_AFTER_DAYS * DAY) return { ok: false, why: "too-soon" };
  // "Filled" means a hire marked through Kestrel: closed as filled with Kestrel as the source, or an application chosen as the hire.
  if (job.filled_via === "kestrel" || job.filled_application_id) return { ok: false, why: "filled-on-kestrel" };
  return { ok: true };
}

// Free only for the same role: switching the role (and so the price band) on the copy makes it an ordinary paid post.
export function freeRepostStillApplies(copyRole: string | null | undefined, originalRole: string | null | undefined): boolean {
  return Boolean(copyRole) && copyRole === originalRole;
}
