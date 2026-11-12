// Changing your name (Steve, 12th November 2026): the first change is free, and each change starts a 30 day hold before the next one. A person who
// needs an earlier change (a typo, a legal name change) writes to hello@ and Kestrel unlocks it by hand. The point is that a clinic does not see
// the same applicant arrive under different names across its jobs. Changing a name to what it already is does not count. Kestrel's server sets
// name_changed_at, and nobody can set it themselves. Kept free of app imports so it can be tested on its own (lib/name-hold.test.ts).

export const NAME_HOLD_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

// When the next change is allowed, or null if one is allowed now. `changedAt` is when the name was last changed, or null if it never has been.
export function nameLockedUntil(changedAt: string | Date | null | undefined, now: Date = new Date()): Date | null {
  if (!changedAt) return null;
  const until = new Date(new Date(changedAt).getTime() + NAME_HOLD_DAYS * DAY);
  return Number.isNaN(until.getTime()) || until.getTime() <= now.getTime() ? null : until;
}

// Whether the name is actually different. Capital letters and extra spaces do not count as a change.
export function nameDiffers(current: { first: string; last: string }, next: { first: string; last: string }): boolean {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  return norm(current.first) !== norm(next.first) || norm(current.last) !== norm(next.last);
}
