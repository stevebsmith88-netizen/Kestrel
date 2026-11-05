// The branded email look approved on the "Kestrel launch flyer" design canvas: a navy banner with the logo centred and
// a 2 line headline, live text throughout (so it still reads when images are blocked), a chestnut button, the skyline,
// and a navy footer with the reason, the unsubscribe link and the mailing address that CASL requires.
// Used for outreach to clinics. Account emails keep the simpler emailLayout.
import { SITE_URL } from "./email-layout.ts";

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const SERIF = "'DM Serif Display',Georgia,'Times New Roman',serif";
export const SANS = "'Source Sans 3',Arial,Helvetica,sans-serif";
const ADDRESS = "Kestrel Eye Care Jobs, 6013 Yonge Street, 3rd Floor, North York, Ontario M2M 3W2, Canada.";

export type BrandEmail = {
  subject: string;
  preview: string;
  headline: [string, string];
  hook?: [string, string];
  paragraphs: string[];
  // Extra rows (already safe HTML) after the paragraphs, with a plain text version for the text part.
  extra?: { html: string; text: string[] };
  closing?: string;
  button: { text: string; url: string };
  links?: { text: string; url: string }[];
  bannerUrl: string;
  reason: string;
  unsubscribeUrl: string;
  footerNote?: string;
};

export function brandEmail(e: BrandEmail) {
  const links = e.links?.length ? e.links : [{ text: e.button.url.replace(/^https?:\/\//, ""), url: e.button.url }];
  const html = `<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(e.subject)}</title></head><body style="margin:0;padding:0;background-color:#F7F1E6;">
<div style="display:none;max-height:0;overflow:hidden;">${esc(e.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F7F1E6" style="background-color:#F7F1E6;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#FBF8F2;">
<tr><td bgcolor="#1B2B4B" style="background-color:#1B2B4B;padding:36px 40px 40px 40px;">
<a href="${esc(e.bannerUrl)}" style="text-decoration:none;"><img src="${SITE_URL}/brand/kestrel-lockup-full-reversed.png" width="246" alt="Kestrel Eye Care Jobs" style="display:block;margin:0 auto 26px auto;width:246px;max-width:100%;height:auto;border:0;"></a>
<p style="margin:0;font-family:${SERIF};font-size:42px;line-height:47px;color:#F7F1E6;">${esc(e.headline[0])}<br><span style="color:#D8B48A;">${esc(e.headline[1])}</span></p>
</td></tr>
${e.hook ? `<tr><td bgcolor="#F7F1E6" style="background-color:#F7F1E6;padding:24px 40px;border-bottom:1px solid #E3D9C8;"><p style="margin:0 0 4px 0;font-family:${SERIF};font-size:28px;line-height:32px;color:#A4502C;">${esc(e.hook[0])}</p><p style="margin:0;font-family:${SANS};font-size:17px;line-height:24px;color:#2B3F5F;">${esc(e.hook[1])}</p></td></tr>` : ""}
<tr><td style="padding:30px 40px 0 40px;font-family:${SANS};font-size:17px;line-height:26px;color:#2B3F5F;">${e.paragraphs.map((p) => `<p style="margin:0 0 14px 0;">${esc(p)}</p>`).join("")}</td></tr>
${e.extra?.html ?? ""}
${e.closing ? `<tr><td style="padding:24px 40px 0 40px;font-family:${SERIF};font-size:22px;line-height:29px;color:#1B2B4B;">${esc(e.closing)}</td></tr>` : ""}
<tr><td style="padding:28px 40px 0 40px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#A4502C" style="background-color:#A4502C;border-radius:4px;"><a href="${esc(e.button.url)}" style="display:inline-block;padding:16px 30px;font-family:${SANS};font-size:18px;font-weight:bold;color:#F7F1E6;text-decoration:none;">${esc(e.button.text)}</a></td></tr></table>
${links.map((l) => `<p style="margin:10px 0 0 0;font-family:${SANS};font-size:15px;"><a href="${esc(l.url)}" style="color:#A4502C;">${esc(l.text)}</a></p>`).join("")}</td></tr>
<tr><td style="padding:30px 40px 26px 40px;font-family:${SANS};font-size:17px;line-height:25px;color:#2B3F5F;"><p style="margin:0;">Thanks,<br><strong style="color:#1B2B4B;">The Kestrel team</strong></p></td></tr>
<tr><td><img src="${SITE_URL}/skyline.png" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></td></tr>
<tr><td bgcolor="#1B2B4B" style="background-color:#1B2B4B;padding:22px 40px 28px 40px;font-family:${SANS};font-size:13px;line-height:20px;color:#DCE3E6;">
<p style="margin:0 0 8px 0;">${esc(e.reason)} <a href="${esc(e.unsubscribeUrl)}" style="color:#D8B48A;">Unsubscribe</a> and we won't email you again.</p>
<p style="margin:0;">${e.footerNote ? `${esc(e.footerNote)} ` : ""}${ADDRESS}</p>
</td></tr>
</table></td></tr></table></body></html>`;
  const text = [
    `${e.headline[0]} ${e.headline[1]}`,
    "",
    ...(e.hook ? [`${e.hook[0]}, ${e.hook[1]}`, ""] : []),
    ...e.paragraphs.flatMap((p) => [p, ""]),
    ...(e.extra?.text.length ? [...e.extra.text, ""] : []),
    ...(e.closing ? [e.closing, ""] : []),
    `${e.button.text}: ${e.button.url}`,
    ...(e.links ?? []).map((l) => `${l.text}: ${l.url}`),
    "",
    "Thanks,",
    "The Kestrel team",
    "",
    e.reason,
    `Unsubscribe: ${e.unsubscribeUrl}`,
    `${e.footerNote ? `${e.footerNote} ` : ""}${ADDRESS}`,
  ].join("\n");
  return { subject: e.subject, html, text };
}
