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

// The line clinics see wherever they are asked to look at applicants.
export const RESPONSE_DAYS = 5;
export const RESPONSE_NOTE = `Candidates are waiting to hear back. A reply within ${RESPONSE_DAYS} days, even a short no, keeps good people from accepting other offers.`;

export const FREQUENCIES = [
  { value: "each", label: "Every application, as it comes in" },
  { value: "few_days", label: "A summary every 2 to 3 days (recommended)" },
  { value: "weekly", label: "A summary once a week" },
  { value: "off", label: "No emails, I will check my dashboard" },
] as const;
export type Frequency = (typeof FREQUENCIES)[number]["value"];

export function cleanFrequency(value: unknown): Frequency {
  return FREQUENCIES.some((f) => f.value === value) ? (value as Frequency) : "each";
}

// How long to wait between summary emails. A little under the full period, so a daily job that runs a few minutes late still sends on time.
export const DIGEST_GAP_HOURS: Record<"few_days" | "weekly", number> = { few_days: 47, weekly: 167 };

// Is this clinic due a summary email today? Never sent before means yes.
export function digestDue(frequency: "few_days" | "weekly", last: Date | null, now: Date) {
  return !last || now.getTime() - last.getTime() >= DIGEST_GAP_HOURS[frequency] * 60 * 60 * 1000;
}

export function newApplicationEmail({ title, applicationId }: { title: string; applicationId: string }) {
  return {
    subject: `New application for ${title}`,
    ...emailLayout({
      heading: "A new application",
      paragraphs: [`Someone has applied for ${title}. Open it to read their cover note and CV.`, RESPONSE_NOTE, "The Kestrel team"],
      buttonText: "Open the application",
      buttonUrl: `${SITE}/clinic/applications/${applicationId}`,
    }),
  };
}

export function applicantDigestEmail({ jobs }: { jobs: { title: string; count: number }[] }) {
  const total = jobs.reduce((n, j) => n + j.count, 0);
  return {
    subject: `${total} new ${total === 1 ? "application" : "applications"} on Kestrel`,
    ...emailLayout({
      heading: total === 1 ? "1 new application" : `${total} new applications`,
      paragraphs: [
        "Since our last email, these have come in:",
        ...jobs.map((j) => `${j.title}: ${j.count} new`),
        RESPONSE_NOTE,
        `You can change how often we email you, or turn it off, in your account settings: ${SITE}/account`,
        "The Kestrel team",
      ],
      buttonText: "Open your dashboard",
      buttonUrl: `${SITE}/clinic`,
    }),
  };
}
