import "server-only";

import { SITE_URL } from "./email-layout.ts";
import { isSuppressed } from "@/lib/suppression";

export { SITE_URL, emailLayout } from "./email-layout.ts";
const FROM = process.env.EMAIL_FROM || "Kestrel Eye Care Jobs <hello@mail.eyecarejobs.ca>";

// Sends one email through Resend. Never throws: a failed email must not break the page.
// Until RESEND_API_KEY is set, it does nothing but note that it skipped.
export async function sendEmail({ to, subject, html, text, unsubscribeUrl }: { to: string; subject: string; html: string; text: string; unsubscribeUrl?: string }) {
  // Anything with an unsubscribe link is a marketing message, and is never sent to an address on the do not email list.
  if (unsubscribeUrl && (await isSuppressed(to))) {
    console.log("Email skipped, address is on the do not email list:", subject);
    return false;
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log("Email skipped, no RESEND_API_KEY set:", subject);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], subject, html, text, ...(unsubscribeUrl ? { headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` } } : {}) }),
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
