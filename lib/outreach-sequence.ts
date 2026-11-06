// The clinic outreach sequence: 4 emails over about 5 weeks, each from a different angle, to a clinic address
// published for hiring or business enquiries. Kept free of the database so the emails and the timing can be tested.
// Nothing sends these unless ENABLE_OUTREACH is "yes", and that stays off until Steve's disclosure conversation.
// See docs/casl-outreach.md.
import { SANS, SERIF, brandEmail, esc } from "./brand-email.ts";
import { SITE_URL } from "./email-layout.ts";
import { CLINIC_PASS, CLINIC_PASS_PLUS, ROLE_BANDS, dollars, perDay, perPassPost } from "./pricing.ts";

const DAY = 24 * 60 * 60 * 1000;

// Day 1, day 8, day 18, day 32. The gap is the wait after the email before it.
export const SEQUENCE = [
  { step: 1, angle: "main", gapDays: 0 },
  { step: 2, angle: "lost", gapDays: 7 },
  { step: 3, angle: "price", gapDays: 10 },
  { step: 4, angle: "time", gapDays: 14 },
] as const;

export const LAST_STEP = SEQUENCE.length;

// When the next email is due after sending `stepSent`, or null when the sequence is finished.
export function nextDueAt(stepSent: number, sentAt: Date): Date | null {
  const next = SEQUENCE.find((s) => s.step === stepSent + 1);
  return next ? new Date(sentAt.getTime() + next.gapDays * DAY) : null;
}

export type StopReason = "unsubscribed" | "replied" | "joined" | "claimed" | "bounced" | "manual";

// Why a clinic should get no more of the sequence, checked before every send. The first reason found wins.
export function stopReason(c: { suppressed: boolean; onWaitlist: boolean; hasAccount: boolean; claimed: boolean }): StopReason | null {
  if (c.suppressed) return "unsubscribed";
  if (c.onWaitlist || c.hasAccount) return "joined";
  if (c.claimed) return "claimed";
  return null;
}

const JOIN_URL = `${SITE_URL}/clinics`;

type Content = {
  subject: string;
  preview: string;
  headline: [string, string];
  hook?: [string, string];
  paragraphs: string[];
  prices?: boolean;
  closing?: string;
};

function content(step: number, clinicName: string): Content {
  const hello = `Hello ${clinicName} team,`;
  switch (step) {
    case 1:
      return {
        subject: "Post eye care jobs free while we launch",
        preview: "One price per 30 day post, built for Canadian clinics.",
        headline: ["Hire in eye care.", "One price. 30 days."],
        hook: ["Free to post while we launch", "for the opening 30 to 60 days."],
        paragraphs: [
          hello,
          "Kestrel Eye Care Jobs is a new Canada-wide job board built only for eye care: optometrists, opticians, assistants, technicians and practice managers, in independent and corporate practices alike.",
          `Posting is free while we launch, and we'd like ${clinicName} to be one of the first clinics on it. Clinics on the waitlist are the first invited to post.`,
        ],
        prices: true,
        closing: "One price covers all 30 days. No charge by the click. A person reads every post.",
      };
    case 2:
      return {
        subject: "Your job ad, seen by eye care people",
        preview: "A job board with eye care jobs only.",
        headline: ["Eye care jobs.", "Nothing else."],
        paragraphs: [
          hello,
          "Does your optician ad get lost among hundreds of jobs that have nothing to do with eye care?",
          "Kestrel Eye Care Jobs lists eye care jobs only, so the people browsing are opticians, optometrists, assistants and practice managers. They choose a role, a province and the kind of practice they want before they see your post.",
          "Posting is free while we launch, and clinics on the waitlist are the first invited.",
        ],
      };
    case 3: {
      const [support, opticians, optometrists] = ROLE_BANDS;
      return {
        subject: "Know what you'll pay before you post",
        preview: "One price per 30 day post. Free while we launch.",
        headline: ["Know what you'll pay.", "Before you post."],
        paragraphs: [
          hello,
          "Paying by the click means you never quite know what a hire will cost until the bill arrives.",
          `On Kestrel, one price covers a 30 day post: ${dollars(support.price)} for support and patient care, ${dollars(opticians.price)} for opticians and practice leads, and ${dollars(optometrists.price)} for optometrists. That's around the price of a coffee a day, and posting is free while we launch.`,
          `Hiring often? The clinic pass starts at ${dollars(CLINIC_PASS.monthly)} a month for up to ${CLINIC_PASS.livePosts} live posts, or ${dollars(CLINIC_PASS_PLUS.monthly)} on Plus with optometrists included. Founding clinics keep their price for ${CLINIC_PASS.lockMonths} months.`,
        ],
      };
    }
    default:
      return {
        subject: "We'll write the first draft of your job ad",
        preview: "Answer a few questions and your ad is drafted for you.",
        headline: ["Your job ad,", "drafted for you."],
        paragraphs: [
          hello,
          "Writing a job ad takes time most clinics don't have.",
          "Answer a few questions about the role and the Kestrel ad builder writes the first draft, with the pay range and the questions provincial rules now require already in place. You check it, change what you like, and post.",
          "Whenever you're next hiring, we'd be glad to help. Posting is free while we launch.",
        ],
      };
  }
}

function pricesHtml() {
  const rows = ROLE_BANDS.map(
    (b, i) =>
      `<tr><td style="padding:10px 0;border-top:1px solid #D6C9B2;${i === ROLE_BANDS.length - 1 ? "border-bottom:1px solid #D6C9B2;" : ""}font-family:${SANS};font-size:16px;color:#1B2B4B;">${esc(b.label)}</td><td align="right" style="padding:10px 0;border-top:1px solid #D6C9B2;${i === ROLE_BANDS.length - 1 ? "border-bottom:1px solid #D6C9B2;" : ""}font-family:${SANS};font-size:14px;color:#5A6672;white-space:nowrap;">${perDay(b.price)} a day&nbsp;&nbsp;<span style="font-family:${SERIF};font-size:24px;color:#1B2B4B;">${dollars(b.price)}</span></td></tr>`,
  ).join("");
  return `<tr><td style="padding:24px 40px 0 40px;">
<p style="margin:0 0 16px 0;font-family:${SERIF};font-size:28px;line-height:33px;color:#1B2B4B;">After launch, a 30 day post costs around the price of a coffee a day.</p>
<p style="margin:0 0 6px 0;font-family:${SANS};font-size:12px;line-height:16px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#8C4024;">Per 30 day post</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;"><tr><td bgcolor="#1B2B4B" style="background-color:#1B2B4B;padding:22px 24px;border-radius:6px;font-family:${SANS};color:#F7F1E6;">
<p style="margin:0 0 8px 0;font-size:18px;"><strong>Clinic pass</strong>&nbsp; from <span style="font-family:${SERIF};font-size:30px;color:#D8B48A;">${dollars(CLINIC_PASS.monthly)}</span> a month</p>
<p style="margin:0 0 12px 0;font-size:16px;line-height:23px;color:#DCE3E6;">Up to ${CLINIC_PASS.livePosts} live posts at once and a featured clinic profile. Choose the one that matches the roles you hire for.</p>
<p style="margin:0;padding-top:12px;border-top:1px solid #4A5A7A;font-size:16px;line-height:23px;color:#DCE3E6;"><strong style="color:#F7F1E6;">Clinic pass ${dollars(CLINIC_PASS.monthly)} a month:</strong> ${perPassPost()} a post, for support, patient care, optician and practice lead roles.</p>
<p style="margin:12px 0 0 0;padding-top:12px;border-top:1px solid #4A5A7A;font-size:16px;line-height:23px;color:#DCE3E6;"><strong style="color:#F7F1E6;">Clinic pass Plus ${dollars(CLINIC_PASS_PLUS.monthly)} a month:</strong> ${perPassPost(CLINIC_PASS_PLUS)} a post, for every role above and optometrists too.</p>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;"><tr><td bgcolor="#F7F1E6" style="background-color:#F7F1E6;padding:18px 24px;border:1px solid #D6C9B2;border-radius:6px;font-family:${SANS};color:#1B2B4B;">
<p style="margin:0 0 6px 0;font-family:${SERIF};font-size:22px;color:#8C4024;">Founding clinics</p>
<p style="margin:0;font-size:16px;line-height:23px;">Join during launch and keep your pass price for ${CLINIC_PASS.lockMonths} months, or until you cancel. Or pay for the year up front, ${dollars(CLINIC_PASS.yearly)} on the Clinic pass or ${dollars(CLINIC_PASS_PLUS.yearly)} on Plus, which is 2 months free.</p>
</td></tr></table>
</td></tr>`;
}

// One email of the sequence, in the shared branded look (lib/brand-email.ts).
export function outreachSequenceEmail({ step, clinicName, unsubscribeUrl }: { step: number; clinicName: string; unsubscribeUrl: string }) {
  const c = content(step, clinicName);
  return brandEmail({
    subject: c.subject,
    preview: c.preview,
    headline: c.headline,
    hook: c.hook,
    paragraphs: c.paragraphs,
    extra: c.prices
      ? {
          html: pricesHtml(),
          text: [
            "After launch, per 30 day post:",
            ...ROLE_BANDS.map((b) => `${b.label}: ${dollars(b.price)} (${perDay(b.price)} a day)`),
            `Clinic pass, from ${dollars(CLINIC_PASS.monthly)} a month, with up to ${CLINIC_PASS.livePosts} live posts at once and a featured clinic profile. Clinic pass ${dollars(CLINIC_PASS.monthly)} a month: ${perPassPost()} a post, for support, patient care, optician and practice lead roles. Clinic pass Plus ${dollars(CLINIC_PASS_PLUS.monthly)} a month: ${perPassPost(CLINIC_PASS_PLUS)} a post, for every role above and optometrists too. Founding clinics keep their pass price for ${CLINIC_PASS.lockMonths} months, or pay for the year up front, ${dollars(CLINIC_PASS.yearly)} on the Clinic pass or ${dollars(CLINIC_PASS_PLUS.yearly)} on Plus.`,
          ],
        }
      : undefined,
    closing: c.closing,
    button: { text: "Join the waitlist", url: JOIN_URL },
    bannerUrl: JOIN_URL,
    reason: `You're receiving this because ${clinicName}'s email address is published on its website for business enquiries, and this is about hiring at your practice.`,
    unsubscribeUrl,
    footerNote: "Prices in Canadian dollars, before HST.",
  });
}

// How to recognise the same clinic elsewhere on Kestrel (a clinic account, a claim). A clinic's own domain covers
// everyone at that clinic, but a free mail domain is shared by thousands of clinics, so there only the exact address counts.
const SHARED_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.ca", "outlook.com", "live.com", "live.ca", "msn.com",
  "yahoo.com", "yahoo.ca", "icloud.com", "me.com", "mac.com", "aol.com", "shaw.ca", "telus.net", "rogers.com",
  "sympatico.ca", "bell.net", "videotron.ca", "cogeco.ca", "eastlink.ca", "sasktel.net", "protonmail.com", "proton.me",
]);

export function sameClinicPattern(email: string): string {
  const clean = email.trim().toLowerCase();
  const domain = clean.split("@")[1] ?? "";
  return !domain || SHARED_DOMAINS.has(domain) ? clean : `%@${domain}`;
}
