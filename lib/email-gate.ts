// Whether an email may go to an address, given what the do not email list says about it (P1-23).
// `reasons` is every reason the list holds for the address or its domain, or null if the list could not be read.
// `marketing` is true for an email that carries an unsubscribe link (news, alerts, first week emails, the waitlist).

// An address that bounced or complained is never emailed again, whatever the email: repeated sends to dead or
// complaining addresses are what damage a sending domain's standing.
export const ALWAYS_SKIP = ["bounced", "complaint"];

export function emailGate(reasons: string[] | null, { marketing }: { marketing: boolean }): "send" | "skip" {
  // If the list cannot be read, holding back marketing is the safe choice. An account email (an application update,
  // a new applicant) still goes, because the person is waiting for it.
  if (reasons === null) return marketing ? "skip" : "send";
  if (reasons.some((r) => ALWAYS_SKIP.includes(r))) return "skip";
  // Anyone else on the list (unsubscribed, asked to stop, added by an admin) gets no marketing, but still gets account emails.
  if (marketing && reasons.length > 0) return "skip";
  return "send";
}
