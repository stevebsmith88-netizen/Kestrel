import { emailLayout } from "./email-layout.ts";
import { levelLabel } from "./team.ts";

// The invitation a clinic owner sends a team member. It is about joining a clinic's account, so it carries no unsubscribe link.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

export function teamInviteEmail({ name, clinicName, inviter, level, code }: { name: string; clinicName: string; inviter: string; level: string; code: string }) {
  return {
    subject: `${inviter} invited you to ${clinicName} on Kestrel`,
    ...emailLayout({
      heading: `Join ${clinicName} on Kestrel`,
      paragraphs: [
        `Hi ${name},`,
        `${inviter} has invited you to help with hiring at ${clinicName} on Kestrel Eye Care Jobs. Your access: ${levelLabel(level).toLowerCase()}.`,
        "Press the button to create your account, or to sign in if you already have one with this email address. If you are asked for an invite code, use this one:",
        code,
        "It works once, only with this email address, for 14 days. If you were not expecting this, you can ignore it.",
      ],
      buttonText: "Join the clinic",
      buttonUrl: `${SITE}/join?code=${encodeURIComponent(code)}`,
    }),
  };
}
