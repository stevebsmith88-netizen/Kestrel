// How long Kestrel keeps things, in 1 place (Steve, 13th November 2026; the privacy policy's "How long we keep it" says the same).
// The daily job deletes what has passed its period (app/api/cron/daily/route.ts). Kept free of app imports so it can be tested on its own.
// Applications whose clinic left (migration 0044) are deleted 2 years after it left. Still to build, before any can fall due (the first
// would be in November 2028): deleting applications 2 years after an open job closes, and job posts 3 years after they close.
const DAY = 24 * 60 * 60 * 1000;

export const RETENTION_DAYS = {
  unconfirmedWaitlist: 30, // waitlist sign ups never confirmed
  inboxMessages: 365, // messages in a person's Kestrel inbox (Steve chose 12 months, 13th November 2026)
  reportsAndClaims: 730, // reports of a job, and claims of a listing: 2 years
  applicationsAfterClinicLeft: 730, // applications kept for the candidate after the clinic left (migration 0044): 2 years
  supportAndAdminRecords: 730, // help requests, feedback (0046) and Kestrel's record of changes made for a clinic (0045): 2 years
} as const;

// The moment before which each kind of record is deleted, as an ISO date for the database.
export function retentionCutoffs(now: Date) {
  const before = (days: number) => new Date(now.getTime() - days * DAY).toISOString();
  return {
    unconfirmedWaitlist: before(RETENTION_DAYS.unconfirmedWaitlist),
    inboxMessages: before(RETENTION_DAYS.inboxMessages),
    reportsAndClaims: before(RETENTION_DAYS.reportsAndClaims),
    applicationsAfterClinicLeft: before(RETENTION_DAYS.applicationsAfterClinicLeft),
    supportAndAdminRecords: before(RETENTION_DAYS.supportAndAdminRecords),
  };
}
