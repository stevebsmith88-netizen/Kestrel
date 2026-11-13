// How long Kestrel keeps things, in 1 place (Steve, 13th November 2026; the privacy policy's "How long we keep it" says the same).
// The daily job deletes what has passed its period (app/api/cron/daily/route.ts). Kept free of app imports so it can be tested on its own.
// Still to build, before any can fall due (the first would be in November 2028): deleting applications 2 years after the job closes, and
// job posts 3 years after they close. They come with keeping applications when a clinic deletes its account (post audit review X-01).
const DAY = 24 * 60 * 60 * 1000;

export const RETENTION_DAYS = {
  unconfirmedWaitlist: 30, // waitlist sign ups never confirmed
  inboxMessages: 365, // messages in a person's Kestrel inbox (Steve chose 12 months, 13th November 2026)
  reportsAndClaims: 730, // reports of a job, and claims of a listing: 2 years
} as const;

// The moment before which each kind of record is deleted, as an ISO date for the database.
export function retentionCutoffs(now: Date) {
  const before = (days: number) => new Date(now.getTime() - days * DAY).toISOString();
  return {
    unconfirmedWaitlist: before(RETENTION_DAYS.unconfirmedWaitlist),
    inboxMessages: before(RETENTION_DAYS.inboxMessages),
    reportsAndClaims: before(RETENTION_DAYS.reportsAndClaims),
  };
}
