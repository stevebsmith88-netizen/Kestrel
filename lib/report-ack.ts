import { SITE_URL, emailLayout } from "./email-layout.ts";

// The email a person gets after reporting a job, only if they left an address (Steve, 15th November 2026). It confirms the report was
// received and repeats the 2 business day promise on /fake-jobs. It says nothing about what they wrote, and nothing about the reason.
export function reportAckEmail(jobTitle: string) {
  return emailLayout({
    heading: "We have your report",
    paragraphs: [
      `Thank you for telling us about the job "${jobTitle}". A person at Kestrel reads every report within 2 business days, and may hide the job while we check it.`,
      "You do not need to do anything else.",
    ],
    buttonText: "How we handle reports",
    buttonUrl: `${SITE_URL}/fake-jobs`,
    note: "You are receiving this because this address was given when a job was reported on Kestrel Eye Care Jobs. If that was not you, you can ignore this email.",
  });
}
