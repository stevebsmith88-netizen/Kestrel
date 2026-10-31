import "server-only";
import { SITE_URL, emailLayout, sendEmail } from "@/lib/email";

// Emails the person who runs the site (ADMIN_ALERT_EMAIL) when something needs a look, and a second person
// (ADMIN_BACKUP_EMAIL) if one is set, so an alert is not lost when one inbox is not being read.
// Never throws, and does nothing until the first address is set.
export async function notifyAdmin(heading: string, paragraphs: string[], path?: string) {
  const to = process.env.ADMIN_ALERT_EMAIL;
  if (!to) {
    console.log("Admin alert skipped, no ADMIN_ALERT_EMAIL set:", heading);
    return false;
  }
  const mail = emailLayout({ heading, paragraphs, ...(path ? { buttonText: "Open it", buttonUrl: `${SITE_URL}${path}` } : {}) });
  const backup = process.env.ADMIN_BACKUP_EMAIL;
  const results = await Promise.all([to, ...(backup && backup.toLowerCase() !== to.toLowerCase() ? [backup] : [])].map((address) => sendEmail({ to: address, subject: `Kestrel: ${heading}`, ...mail })));
  return results.some(Boolean);
}
