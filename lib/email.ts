import "server-only";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";
const FROM = process.env.EMAIL_FROM || "Kestrel Eye Care Jobs <hello@mail.eyecarejobs.ca>";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// A short, branded email in the same look as the sign up emails.
export function emailLayout({ heading, paragraphs, buttonText, buttonUrl }: { heading: string; paragraphs: string[]; buttonText?: string; buttonUrl?: string }) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px 0;">${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  const button = buttonText && buttonUrl
    ? `<tr><td style="padding:0 36px 24px 36px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#A4502C" style="background-color:#A4502C;border-radius:6px;"><a href="${esc(buttonUrl)}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:6px;">${esc(buttonText)}</a></td></tr></table></td></tr>`
    : "";
  const html = `<!doctype html><html lang="en-CA"><body style="margin:0;padding:0;background-color:#F7F1E6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F7F1E6" style="background-color:#F7F1E6;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#FBF8F2;border:1px solid #E3D9C8;border-radius:8px;">
<tr><td align="center" bgcolor="#1B2B4B" style="background-color:#1B2B4B;padding:28px 24px;border-radius:8px 8px 0 0;"><img src="${SITE_URL}/brand/kestrel-lockup-full-reversed.png" width="240" alt="Kestrel Eye Care Jobs" style="display:block;width:240px;max-width:100%;height:auto;border:0;"></td></tr>
<tr><td style="padding:32px 36px 8px 36px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:32px;color:#1B2B4B;">${esc(heading)}</td></tr>
<tr><td style="padding:0 36px 8px 36px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#1B2B4B;">${body}</td></tr>
${button}
<tr><td style="padding:0 36px 24px 36px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#1B2B4B;"><p style="margin:0;">Warm regards,<br><strong>The Kestrel team</strong></p></td></tr>
<tr><td style="padding:20px 36px 28px 36px;border-top:1px solid #E3D9C8;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#5A6672;"><p style="margin:0;">Kestrel Eye Care Jobs, 6013 Yonge Street, 3rd Floor, North York, Ontario M2M 3W2, Canada. This email is about your Kestrel account or an application.</p></td></tr>
</table></td></tr></table></body></html>`;
  const text = [heading, "", ...paragraphs, ...(buttonText && buttonUrl ? ["", `${buttonText}: ${buttonUrl}`] : []), "", "Warm regards,", "The Kestrel team"].join("\n");
  return { html, text };
}

// Sends one email through Resend. Never throws: a failed email must not break the page.
// Until RESEND_API_KEY is set, it does nothing but note that it skipped.
export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log("Email skipped, no RESEND_API_KEY set:", subject);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
    });
    if (!res.ok) {
      console.error("Email failed:", res.status, (await res.text()).slice(0, 200));
      return false;
    }
    return true;
  } catch (error) {
    console.error("Email failed:", error instanceof Error ? error.message : error);
    return false;
  }
}
