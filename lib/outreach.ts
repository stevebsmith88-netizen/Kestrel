import { emailLayout } from "./email-layout.ts";

// The first email to a clinic whose job Kestrel has listed from the clinic's own careers page.
// Written to meet Canada's anti-spam law (CASL):
//  - it says who we are and gives our mailing address (added by emailLayout),
//  - it has a working unsubscribe link,
//  - it is only about the recipient's business role (hiring), and
//  - it is only ever sent to an address the clinic has published for hiring or business enquiries.
// Nothing sends this yet. Clinic outreach stays switched off until Steve confirms his disclosure
// conversation has happened. See docs/casl-outreach.md.
export function outreachEmail({
  clinicName,
  jobTitle,
  sourceUrl,
  listingUrl,
  claimUrl,
  unsubscribeUrl,
}: {
  clinicName: string;
  jobTitle: string;
  sourceUrl: string;
  listingUrl: string;
  claimUrl: string;
  unsubscribeUrl: string;
}) {
  const subject = `Your ${jobTitle} job is now on Kestrel Eye Care Jobs`;
  const mail = emailLayout({
    heading: `Your ${jobTitle} job is on Kestrel`,
    paragraphs: [
      `Hello ${clinicName} team,`,
      `We are Kestrel Eye Care Jobs, a job board for eye care across Canada. We found the ${jobTitle} job on your own careers page (${sourceUrl}), and we have listed it on Kestrel so more eye care professionals can see it.`,
      "The listing is free. It is described in our own words, it is marked as not yet claimed, and every Apply button sends people straight to your own application page. We have not used your logo.",
      "Advertising a job in more than one place helps more of the right people see it. Being on Kestrel does not replace or change anything on your own website or on other job boards, and there is nothing you need to do.",
      "You can claim the listing to update it, add your pay range and see who is interested, or ask us to take it down and we will do so straight away. Just reply to this email.",
      `We are writing to you because this address is published on your website for hiring and business enquiries, and this message is only about that job. If you would rather not hear from us, use the link at the bottom and we will stop.`,
    ],
    items: [{ text: "See your listing", url: listingUrl }],
    buttonText: "Claim your listing",
    buttonUrl: claimUrl,
    unsubscribeUrl,
    reason: "You are receiving this because this address is published on your website for hiring enquiries.",
  });
  return { subject, ...mail };
}
