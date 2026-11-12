// A cap on how many applications 1 candidate can send in 24 hours (audit finding P1-48). It is far above what a real job search needs and is
// there so a script cannot flood clinics with applications. It is counted from the applications table, so there is no new table and no SQL.
// Withdrawn applications still count, because the clinic was already told about them.
export const MAX_APPLICATIONS_PER_DAY = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export const APPLY_LIMIT_TEXT = `You have reached today's limit of ${MAX_APPLICATIONS_PER_DAY} applications. You can apply again tomorrow, and your profile and saved letters will be waiting for you.`;

export function applyWindowStart(now: Date): Date {
  return new Date(now.getTime() - DAY_MS);
}

// sentAt holds the time each of this candidate's applications was sent. True when 30 or more fall inside the last 24 hours.
export function overApplyLimit(sentAt: readonly string[], now: Date): boolean {
  const start = applyWindowStart(now).getTime();
  let recent = 0;
  for (const when of sentAt) {
    const at = Date.parse(when);
    if (Number.isFinite(at) && at > start) recent++;
  }
  return recent >= MAX_APPLICATIONS_PER_DAY;
}
