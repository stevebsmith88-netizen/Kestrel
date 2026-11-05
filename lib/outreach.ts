import { brandEmail } from "./brand-email.ts";

// The first email to a clinic whose job Kestrel has listed from the clinic's own careers page, in the shared branded
// look (lib/brand-email.ts). Written to meet Canada's anti-spam law (CASL):
//  - it says who we are and gives our mailing address (in the footer),
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
  return brandEmail({
    subject: `Your ${jobTitle} job is now on Kestrel Eye Care Jobs`,
    preview: "Listed free, with every Apply button going to your own page.",
    headline: [`Your ${jobTitle} job`, "is on Kestrel."],
    hook: ["Listed free, and yours to claim", "Every Apply button goes to your own application page."],
    paragraphs: [
      `Hello ${clinicName} team,`,
      `Kestrel Eye Care Jobs is a Canada-wide job board for eye care. We found the ${jobTitle} job on your own careers page (${sourceUrl}) and listed it, so more eye care professionals can see it.`,
      "It's described in our own words and marked as not yet claimed. We haven't used your logo.",
      "Advertising a job in more than one place helps more of the right people see it. Being on Kestrel doesn't change anything on your own website or on other job boards, and there's nothing you need to do.",
      "If you claim the listing, you can update it, answer anything your page didn't say, and see who's interested. Or reply and ask us to take it down, and we will straight away.",
    ],
    button: { text: "Claim your listing", url: claimUrl },
    links: [{ text: "See your listing", url: listingUrl }],
    bannerUrl: listingUrl,
    reason: "You're receiving this because this address is published on your website for hiring enquiries, and this email is only about that job.",
    unsubscribeUrl,
  });
}
