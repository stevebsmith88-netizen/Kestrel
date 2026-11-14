export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// The preview line inboxes show after the subject (Steve, 14th November 2026). Without one, Gmail and Outlook show the first words of the
// email, usually the heading again. By default it is the first real sentence of the message (a greeting such as "Hi Sam," is skipped),
// cut at a word to about 110 characters.
export function previewText(paragraphs: string[], max = 110) {
  const first = paragraphs.map((p) => p.replace(/\s+/g, " ").trim()).find((p) => p && !/^(hi|hello|dear)\b[^.!?]{0,40},$/i.test(p) && p !== "The Kestrel team") ?? "";
  if (first.length <= max) return first;
  const cut = first.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 40 ? cut.lastIndexOf(" ") : max).replace(/[,;:]$/, "")}...`;
}

// A short, branded email in the same look as the sign up emails.
export function emailLayout({ heading, paragraphs, items, buttonText, buttonUrl, unsubscribeUrl, reason, preview }: { heading: string; paragraphs: string[]; items?: { text: string; url: string }[]; buttonText?: string; buttonUrl?: string; unsubscribeUrl?: string; reason?: string; preview?: string }) {
  // Marketing emails carry an unsubscribe link and the mailing address, as Canada's anti-spam law requires.
  const footerNote = unsubscribeUrl
    ? `${esc(reason ?? "You are receiving this because you asked to hear from Kestrel Eye Care Jobs.")} <a href="${esc(unsubscribeUrl)}" style="color:#8C4024;">Unsubscribe</a> at any time.`
    : "This email is about your Kestrel account or an application.";
  // The layout signs off itself ("Warm regards, The Kestrel team"), so a sign off written into the message is dropped instead of showing twice.
  paragraphs = paragraphs.filter((p) => p.trim() !== "The Kestrel team");
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px 0;">${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  const list = items?.length
    ? `<tr><td style="padding:0 36px 8px 36px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#1B2B4B;">${items.map((i) => `<p style="margin:0 0 12px 0;"><a href="${esc(i.url)}" style="color:#8C4024;font-weight:bold;">${esc(i.text)}</a></p>`).join("")}</td></tr>`
    : "";
  const button = buttonText && buttonUrl
    ? `<tr><td style="padding:0 36px 24px 36px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#A4502C" style="background-color:#A4502C;border-radius:6px;"><a href="${esc(buttonUrl)}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:6px;">${esc(buttonText)}</a></td></tr></table></td></tr>`
    : "";
  const previewLine = preview ?? previewText(paragraphs);
  // Hidden in the email itself; the spaces after it stop inboxes pulling in the words that follow.
  const html = `<!doctype html><html lang="en-CA"><body style="margin:0;padding:0;background-color:#F7F1E6;">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(previewLine)}${"&#8199;&#847; ".repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F7F1E6" style="background-color:#F7F1E6;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#FBF8F2;border:1px solid #E3D9C8;border-radius:8px;">
<tr><td align="center" bgcolor="#1B2B4B" style="background-color:#1B2B4B;padding:28px 24px;border-radius:8px 8px 0 0;"><img src="${SITE_URL}/brand/kestrel-lockup-email-reversed.png" width="240" alt="Kestrel Eye Care Jobs" style="display:block;width:240px;max-width:100%;height:auto;border:0;"></td></tr>
<tr><td style="padding:32px 36px 8px 36px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:32px;color:#1B2B4B;">${esc(heading)}</td></tr>
<tr><td style="padding:0 36px 8px 36px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#1B2B4B;">${body}</td></tr>
${list}
${button}
<tr><td style="padding:0 36px 24px 36px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#1B2B4B;"><p style="margin:0;">Warm regards,<br><strong>The Kestrel team</strong></p></td></tr>
<tr><td style="padding:20px 36px 28px 36px;border-top:1px solid #E3D9C8;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#5A6672;"><p style="margin:0;">Kestrel Eye Care Jobs, 6013 Yonge Street, 3rd Floor, North York, Ontario M2M 3W2, Canada. ${footerNote}</p></td></tr>
</table></td></tr></table></body></html>`;
  const text = [
    heading, "", ...paragraphs,
    ...(items?.length ? ["", ...items.map((i) => `${i.text}: ${i.url}`)] : []),
    ...(buttonText && buttonUrl ? ["", `${buttonText}: ${buttonUrl}`] : []),
    "", "Warm regards,", "The Kestrel team", "",
    "Kestrel Eye Care Jobs, 6013 Yonge Street, 3rd Floor, North York, Ontario M2M 3W2, Canada",
    ...(unsubscribeUrl ? [`Unsubscribe: ${unsubscribeUrl}`] : []),
  ].join("\n");
  return { html, text };
}
