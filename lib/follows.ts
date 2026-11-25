// Following a clinic or company (Steve, 19th November 2026, migration 0057). A candidate follows a clinic or supplier that has a public page and
// hears about its new jobs in the same daily email as their job alerts. Kept free of app imports so it can be tested on its own (lib/follows.test.ts).

export const FOLLOW_LIMIT = 50;

export const FOLLOW_THANKS = "You are following them. We will email you when they post a new job, in the same email as your job alerts.";
export const FOLLOW_LIMIT_TEXT = `You can follow up to ${FOLLOW_LIMIT} clinics and companies. Unfollow one to add another.`;

// The heading of the daily email, which holds job alert matches, jobs from places the person follows, and saved jobs that are about to close.
export function alertHeading(total: number, fromFollowed: number, closing = 0): string {
  if (total === 0) return "";
  if (closing > 0) {
    if (closing === total) return total === 1 ? "A job you saved is closing soon" : `${total} saved jobs are closing soon`;
    return `${total} jobs for you`;
  }
  if (fromFollowed === 0) return total === 1 ? "A new job matches your alert" : `${total} new jobs match your alerts`;
  if (fromFollowed === total) return total === 1 ? "A clinic you follow has posted a job" : `${total} new jobs from places you follow`;
  return `${total} new jobs for you`;
}

export function alertSubject(total: number, fromFollowed: number, closing = 0): string {
  if (closing > 0) return closing === total ? (total === 1 ? "A saved job is closing soon" : `${total} saved jobs are closing soon`) : `Job update: ${total} jobs for you`;
  if (fromFollowed === total && total > 0) return total === 1 ? "A clinic you follow posted a job" : `${total} new jobs from places you follow`;
  return total === 1 ? "New job alert: 1 new job" : `New job alert: ${total} new jobs`;
}

// A saved job that ends within this many days is mentioned in the daily email, once.
export const CLOSING_SOON_DAYS = 3;
export const closingLine = (line: string) => `Closing soon, saved by you: ${line}`;

// A line for a job found because of a follow, so the person can tell why it was sent.
export const followedLine = (line: string) => `From a place you follow: ${line}`;

export type FollowState = "signed-out" | "hidden" | "not-following" | "following";
