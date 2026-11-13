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
export function applicationNoUpdate(args: { jobTitle: string; clinicName: string; label: string; applicationId: string }): NotifyMessage {
  return {
    kind: "application",
    title: cut(`${args.jobTitle}: ${args.label}`, 150),
    body: cut(`The job at ${args.clinicName} has closed, and the clinic did not send a decision. Thank you for applying.`, 480),
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

// Where Open takes the person: the message's own address if it is a page on this site, otherwise back to the inbox.
export function inboxTarget(href: string | null | undefined): string {
  return typeof href === "string" && href.startsWith("/") && !href.startsWith("//") ? href : "/account/inbox";
}
