// What the admin review queue says after approving or sending back a job. One list, used by the page (after a plain page reload) and by the
// buttons themselves (which show the message under the job without leaving the page). Pure, so it can be tested (lib/review-notices.test.ts).

export const REVIEW_NOTICES: Record<string, string> = {
  approved: "Approved. The job is live.",
  quebec: "Not approved. This job is in Quebec, and Kestrel can't post jobs in Quebec yet. Send it back to the clinic with a note.",
  rejected: "Sent back to the clinic with your note.",
  "need-note": "Please tell the clinic what to change before sending a job back.",
  "payment-failed": "Not published. The clinic's saved card was refused, so nothing was charged. We have asked the clinic to save a new card, and you can approve the job again once they have.",
  "payment-error": "Not published, and nothing was charged. The card could not be charged because of a problem on our side or in the Stripe set up, so the clinic has not been emailed. Fix the cause, then approve the job again.",
  error: "That didn't work. The job may already have been handled. Please refresh and try again.",
};

export const reviewSucceeded = (key: string) => key === "approved" || key === "rejected";

// The line to show for a result: the message, and for the 2 payment problems what Stripe said.
export function reviewMessage(key: string, why?: string | null): string {
  const base = REVIEW_NOTICES[key] ?? REVIEW_NOTICES.error;
  return (key === "payment-failed" || key === "payment-error") && why ? `${base} Reason: ${why}` : base;
}
