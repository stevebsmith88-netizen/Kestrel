import "server-only";
import { SITE_URL, emailLayout, sendEmail } from "@/lib/email";

// Emails the person who runs the site (ADMIN_ALERT_EMAIL) when something needs a look.
// Never throws, and does nothing until that address is set.
export async function notifyAdmin(heading: string, paragraphs: string[], path?: string) {
  const to = process.env.ADMIN_ALERT_EMAIL;
  if (!to) {
    console.log("Admin alert skipped, no ADMIN_ALERT_EMAIL set:", heading);
    return false;
  }
  const mail = emailLayout({ heading, paragraphs, ...(path ? { buttonText: "Open it", buttonUrl: `${SITE_URL}${path}` } : {}) });
  return sendEmail({ to, subject: `Kestrel: ${heading}`, ...mail });
}
