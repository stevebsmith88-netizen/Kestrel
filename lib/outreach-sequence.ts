// The clinic outreach sequence: 4 emails over about 5 weeks, each from a different angle, to a clinic address
// published for hiring or business enquiries. Kept free of the database so the emails and the timing can be tested.
// Nothing sends these unless ENABLE_OUTREACH is "yes", and that stays off until Steve's disclosure conversation.
// See docs/casl-outreach.md.
import { SITE_URL } from "./email-layout.ts";
import { CLINIC_PASS, ROLE_BANDS, dollars, perDay, perPassPost } from "./pricing.ts";

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

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const SERIF = "'DM Serif Display',Georgia,'Times New Roman',serif";
const SANS = "'Source Sans 3',Arial,Helvetica,sans-serif";
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
          `Hiring often? The clinic pass is ${dollars(CLINIC_PASS.monthly)} a month for up to ${CLINIC_PASS.livePosts} live posts, and founding clinics keep that price for ${CLINIC_PASS.lockMonths} months.`,
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
<p style="margin:0 0 8px 0;font-size:18px;"><strong>Clinic pass</strong>&nbsp; <span style="font-family:${SERIF};font-size:30px;color:#D8B48A;">${dollars(CLINIC_PASS.monthly)}</span> a month</p>
<p style="margin:0 0 12px 0;font-size:16px;line-height:23px;color:#DCE3E6;">Up to ${CLINIC_PASS.livePosts} live posts at once, ${perPassPost()} a post, plus a featured clinic profile.</p>
<p style="margin:0;padding-top:12px;border-top:1px solid #4A5A7A;font-size:16px;line-height:23px;"><strong style="color:#D8B48A;">Founding clinics</strong> keep ${dollars(CLINIC_PASS.monthly)} a month for ${CLINIC_PASS.lockMonths} months, or until you cancel. Or pay ${dollars(CLINIC_PASS.yearly)} for the year, which is 2 months free.</p>
</td></tr></table>
</td></tr>`;
}

// One email of the sequence, in the look approved on the design canvas: navy banner with the logo centred,
// live text throughout (so it reads with images blocked), a "Join the waitlist" button, the skyline, and a footer
// with the reason, the unsubscribe link and the mailing address that CASL requires.
export function outreachSequenceEmail({ step, clinicName, unsubscribeUrl }: { step: number; clinicName: string; unsubscribeUrl: string }) {
  const c = content(step, clinicName);
  const reason = `You're receiving this because ${clinicName}'s email address is published on its website for business enquiries, and this is about hiring at your practice.`;
  const html = `<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.subject)}</title></head><body style="margin:0;padding:0;background-color:#F7F1E6;">
<div style="display:none;max-height:0;overflow:hidden;">${esc(c.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F7F1E6" style="background-color:#F7F1E6;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#FBF8F2;">
<tr><td bgcolor="#1B2B4B" style="background-color:#1B2B4B;padding:36px 40px 40px 40px;">
<a href="${JOIN_URL}" style="text-decoration:none;"><img src="${SITE_URL}/brand/kestrel-lockup-full-reversed.png" width="246" alt="Kestrel Eye Care Jobs" style="display:block;margin:0 auto 26px auto;width:246px;max-width:100%;height:auto;border:0;"></a>
<p style="margin:0;font-family:${SERIF};font-size:42px;line-height:47px;color:#F7F1E6;">${esc(c.headline[0])}<br><span style="color:#D8B48A;">${esc(c.headline[1])}</span></p>
</td></tr>
${c.hook ? `<tr><td bgcolor="#F7F1E6" style="background-color:#F7F1E6;padding:24px 40px;border-bottom:1px solid #E3D9C8;"><p style="margin:0 0 4px 0;font-family:${SERIF};font-size:28px;line-height:32px;color:#A4502C;">${esc(c.hook[0])}</p><p style="margin:0;font-family:${SANS};font-size:17px;line-height:24px;color:#2B3F5F;">${esc(c.hook[1])}</p></td></tr>` : ""}
<tr><td style="padding:30px 40px 0 40px;font-family:${SANS};font-size:17px;line-height:26px;color:#2B3F5F;">${c.paragraphs.map((p) => `<p style="margin:0 0 14px 0;">${esc(p)}</p>`).join("")}</td></tr>
${c.prices ? pricesHtml() : ""}
${c.closing ? `<tr><td style="padding:24px 40px 0 40px;font-family:${SERIF};font-size:22px;line-height:29px;color:#1B2B4B;">${esc(c.closing)}</td></tr>` : ""}
<tr><td style="padding:28px 40px 0 40px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#A4502C" style="background-color:#A4502C;border-radius:4px;"><a href="${JOIN_URL}" style="display:inline-block;padding:16px 30px;font-family:${SANS};font-size:18px;font-weight:bold;color:#F7F1E6;text-decoration:none;">Join the waitlist</a></td></tr></table>
<p style="margin:10px 0 0 0;font-family:${SANS};font-size:15px;"><a href="${JOIN_URL}" style="color:#A4502C;">eyecarejobs.ca/clinics</a></p></td></tr>
<tr><td style="padding:30px 40px 26px 40px;font-family:${SANS};font-size:17px;line-height:25px;color:#2B3F5F;"><p style="margin:0;">Thanks,<br><strong style="color:#1B2B4B;">The Kestrel team</strong></p></td></tr>
<tr><td><img src="${SITE_URL}/skyline.png" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></td></tr>
<tr><td bgcolor="#1B2B4B" style="background-color:#1B2B4B;padding:22px 40px 28px 40px;font-family:${SANS};font-size:13px;line-height:20px;color:#DCE3E6;">
<p style="margin:0 0 8px 0;">${esc(reason)} <a href="${esc(unsubscribeUrl)}" style="color:#D8B48A;">Unsubscribe</a> and we won't email you again.</p>
<p style="margin:0;">Prices in Canadian dollars, before HST. Kestrel Eye Care Jobs, 6013 Yonge Street, 3rd Floor, North York, Ontario M2M 3W2, Canada.</p>
</td></tr>
</table></td></tr></table></body></html>`;
  const text = [
    `${c.headline[0]} ${c.headline[1]}`,
    "",
    ...(c.hook ? [`${c.hook[0]}, ${c.hook[1]}`, ""] : []),
    ...c.paragraphs.flatMap((p) => [p, ""]),
    ...(c.prices
      ? [
          "After launch, per 30 day post:",
          ...ROLE_BANDS.map((b) => `${b.label}: ${dollars(b.price)} (${perDay(b.price)} a day)`),
          `Clinic pass: ${dollars(CLINIC_PASS.monthly)} a month for up to ${CLINIC_PASS.livePosts} live posts, ${perPassPost()} a post. Founding clinics keep this price for ${CLINIC_PASS.lockMonths} months, or pay ${dollars(CLINIC_PASS.yearly)} for the year.`,
          "",
        ]
      : []),
    ...(c.closing ? [c.closing, ""] : []),
    `Join the waitlist: ${JOIN_URL}`,
    "",
    "Thanks,",
    "The Kestrel team",
    "",
    reason,
    `Unsubscribe: ${unsubscribeUrl}`,
    "Prices in Canadian dollars, before HST. Kestrel Eye Care Jobs, 6013 Yonge Street, 3rd Floor, North York, Ontario M2M 3W2, Canada.",
  ].join("\n");
  return { subject: c.subject, html, text };
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
