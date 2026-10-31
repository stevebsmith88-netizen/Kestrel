import { emailLayout } from "./email-layout.ts";

// The two emails a clinic gets when a person at Kestrel has looked at a job. Both are about the clinic's own account,
// so they are always sent, and they carry no unsubscribe link. The sign off is the Kestrel team.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

export function jobLiveEmail({ title, jobId, expiresLabel, wasEdit }: { title: string; jobId: string; expiresLabel: string | null; wasEdit: boolean }) {
  return {
    subject: wasEdit ? `Your changes to ${title} are live` : `Your ${title} job is live`,
    ...emailLayout({
      heading: wasEdit ? "Your changes are live" : "Your job is live",
      paragraphs: [
        wasEdit ? `We have approved your changes to the ${title} job, and the new wording is now on Kestrel.` : `We have approved your ${title} job, and candidates can see it on Kestrel now.`,
        expiresLabel ? `It stays up until ${expiresLabel}. Applications will appear in your dashboard, and we will email you if you have chosen to hear about them.` : "Applications will appear in your dashboard.",
        "The Kestrel team",
      ],
      buttonText: "See your job",
      buttonUrl: `${SITE}/jobs/${jobId}`,
    }),
  };
}

export function jobNeedsChangeEmail({ title, jobId, note }: { title: string; jobId: string; note: string }) {
  return {
    subject: `Your ${title} job needs a change`,
    ...emailLayout({
      heading: "Your job needs a change",
      paragraphs: [
        `We looked at your ${title} job and need one thing changed before it can go live. Here is what our team wrote:`,
        note,
        "Once you have made the change, you can send it to us again from your dashboard. We usually reply within 1 business day.",
        "The Kestrel team",
      ],
      buttonText: "Change my job",
      buttonUrl: `${SITE}/clinic/jobs/${jobId}`,
    }),
  };
}
