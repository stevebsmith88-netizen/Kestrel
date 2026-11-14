// The wording of the short messages in the in account inbox (Steve, 12th November 2026). One way only: Kestrel tells people what happened.
// Nothing here puts an applicant's personal details in a message, and a shortlist is never announced to a candidate, because shortlisting is
// the clinic's private working list. Plain wording, no dashes. Kept free of app imports so it can be tested on its own (lib/notify-text.test.ts).

export type NotifyMessage = { kind: string; title: string; body?: string; href?: string };

import { writtenBy } from "./clinic-message.ts";

const cut = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}...`);

// A candidate's application moved to a new step. `label` is the plain name of the step ("Interview", "Not selected").
// Returns null for the steps a candidate is never told about as their own news: a shortlist is private to the clinic.
export function applicationMoved(args: { jobTitle: string; clinicName: string; status: string; label: string; message?: string; applicationId: string }): NotifyMessage | null {
  if (args.status === "shortlisted") return null;
  return {
    kind: "application",
    title: cut(`${args.jobTitle}: ${args.label}`, 150),
    // The writer line is always kept whole, so a long message is shortened before it (P1-47).
    body: args.message ? `${cut(args.message, 477 - writtenBy(args.clinicName).length)} ${writtenBy(args.clinicName)}` : `${args.clinicName} updated your application.`,
    href: `/candidate/applications/${args.applicationId}`,
  };
}

// The job closed (or ended) while the application was still waiting, and the clinic gave no decision. Matches the email the same moment sends.
// `afterTalks` is for someone who was at Interview or Offer when the job simply ran out (review item X-04): kinder wording, since they had
// met the clinic, and a nudge to ask the clinic directly in case a decision was made and not recorded.
export function applicationNoUpdate(args: { jobTitle: string; clinicName: string; label: string; applicationId: string; afterTalks?: boolean }): NotifyMessage {
  return {
    kind: "application",
    title: cut(`${args.jobTitle}: ${args.label}`, 150),
    body: cut(args.afterTalks ? closedAfterTalksText(args.clinicName) : `The job at ${args.clinicName} has closed, and the clinic did not send a decision. Thank you for applying.`, 480),
    href: `/candidate/applications/${args.applicationId}`,
  };
}

export function newApplicant(args: { jobTitle: string; applicationId: string }): NotifyMessage {
  return { kind: "applicant", title: cut(`New application for ${args.jobTitle}`, 150), body: "Open it to read the cover letter and resume, and to let the candidate know where they stand.", href: `/clinic/applications/${args.applicationId}` };
}

// A candidate withdrew (Steve, 13th November 2026). Like a new application, it names the job, not the person.
export function applicantWithdrew(args: { jobTitle: string; applicationId: string }): NotifyMessage {
  return { kind: "applicant", title: cut(`An applicant withdrew from ${args.jobTitle}`, 150), body: "They are no longer interested in this job. There is nothing you need to do.", href: `/clinic/applications/${args.applicationId}` };
}

// A "view only" team member added a note (Steve, 14th November 2026): it goes to the owner to act on. It names the person and the job.
export function teamNoteAdded(args: { author: string; jobTitle: string; applicationId: string }): NotifyMessage {
  return { kind: "team_note", title: cut(`${args.author} added a note on an applicant for ${args.jobTitle}`, 150), body: "Open the application to read it and decide what happens next.", href: `/clinic/applications/${args.applicationId}` };
}

// Someone joined the clinic's team with their invite code.
export function teamMemberJoined(args: { name: string; level: string }): NotifyMessage {
  return { kind: "team", title: cut(`${args.name} joined your clinic team`, 150), body: `They can now sign in with the access you chose: ${args.level}.`, href: "/clinic/team" };
}

export function jobApproved(args: { jobTitle: string; jobId: string; wasEdit: boolean }): NotifyMessage {
  return {
    kind: "job",
    title: cut(args.wasEdit ? `Your changes to ${args.jobTitle} are live` : `${args.jobTitle} is live`, 150),
    body: "Candidates can now see it and apply.",
    href: `/jobs/${args.jobId}`,
  };
}

export function jobNeedsChange(args: { jobTitle: string; jobId: string; note: string }): NotifyMessage {
  return { kind: "job", title: cut(`Changes needed on ${args.jobTitle}`, 150), body: cut(args.note ? `What to change: ${args.note}` : "Open the job to see what to change.", 480), href: `/clinic/jobs/${args.jobId}` };
}

export function jobTakenDown(args: { jobTitle: string }): NotifyMessage {
  return { kind: "job", title: cut(`${args.jobTitle} was taken down`, 150), body: "Our team took this job down. Check your email for the reason.", href: "/clinic" };
}

// The card saved for a job was refused when Kestrel approved it, so the job waits for a new card. The link opens Stripe's card page.
export function cardRefused(args: { jobTitle: string; jobId: string }): NotifyMessage {
  return {
    kind: "job",
    title: cut(`${args.jobTitle}: we could not charge your card`, 150),
    body: "Your job is ready to go live, but the card was refused. Save a new card and we will publish it. You are not charged until then.",
    href: `/clinic/jobs/${args.jobId}/pay`,
  };
}

// Where Open takes the person: the message's own address if it is a page on this site, otherwise back to the inbox.
export function inboxTarget(href: string | null | undefined): string {
  return typeof href === "string" && href.startsWith("/") && !href.startsWith("//") ? href : "/account/inbox";
}

// The words for someone at Interview or Offer on a job that ran out with no decision recorded (X-04). Used in the inbox and the email.
export function closedAfterTalksText(clinicName: string): string {
  return `The job at ${clinicName} has closed, and the clinic did not record a final decision on Kestrel after your conversations with them. If you are still waiting to hear, it is fine to contact the clinic directly. Thank you for the time you put in.`;
}
