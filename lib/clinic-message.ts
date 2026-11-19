// A clinic's own message to an applicant, as Kestrel sends it (audit P1-47). The clinic writes up to 1,500 characters, and Kestrel
// emails them from its own address. So that nobody can use that to send live links under Kestrel's name, web addresses in the message
// are shown as plain text, and the email and the inbox message say who wrote it.

import { emailLayout } from "./email-layout.ts";
import { splitMeetingLink } from "./meeting-link.ts";

export const writtenBy = (clinicName: string) => `This message was written by ${clinicName}.`;

// A hidden zero width space. Email programs turn anything shaped like a web address into a link; with this after each dot and
// after "://", the address reads exactly the same but is no longer that shape, so it stays plain text.
const ZW = "​";
const TLD = "ca|com|net|org|info|biz|io|co|app|me|ly|link|xyz|online|site|health|care|vision|clinic|us|uk";
const ADDRESS = new RegExp(`(?<![@\\w.])((?:https?:\\/\\/|www\\.)[^\\s<>"]+|[a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.(?:${TLD})\\b(?:\\/[^\\s<>"]*)?)`, "gi");

export function plainAddresses(text: string) {
  return text.replace(ADDRESS, (address) => address.replace(/:\/\//g, `:${ZW}//`).replace(/\./g, `.${ZW}`));
}

// The opening of the email for the steps where good news deserves a warmer start (Steve, 19th November 2026). Every other step keeps the plain
// "is now" line, since a no or a closed role should not be dressed up.
export function updateHeading(status: string | undefined) {
  if (status === "interview") return "Good news, you have been invited to interview";
  if (status === "offer") return "Congratulations, you have an offer";
  if (status === "hired") return "Congratulations on the new role";
  return "An update on your application";
}

export function updateSubject(status: string | undefined, jobTitle: string, clinicName: string) {
  if (status === "interview") return `Good news: ${clinicName} would like to interview you`;
  if (status === "offer") return `Congratulations: an offer from ${clinicName}`;
  return `Update on your application: ${jobTitle}`;
}

function updateIntro(args: { status?: string; jobTitle: string; clinicName: string; label: string }) {
  if (args.status === "interview") return `${args.clinicName} would like to meet you about the ${args.jobTitle} role. Their message is below.`;
  if (args.status === "offer") return `${args.clinicName} has made you an offer for the ${args.jobTitle} role. Their message is below.`;
  return `Your application for ${args.jobTitle} at ${args.clinicName} is now: ${args.label}.`;
}

// The email a candidate gets when a clinic moves their application, with the clinic's message if there is one. An interview link the clinic
// added (Zoom, Teams, Google Meet and the like) is checked again here and shown as 1 link, apart from the plain text of the message.
export function applicationUpdateEmail(args: { jobTitle: string; clinicName: string; label: string; message: string; applicationId: string; site: string; status?: string }) {
  const { text, link } = splitMeetingLink(args.message);
  return emailLayout({
    heading: updateHeading(args.status),
    paragraphs: [
      updateIntro(args),
      ...(text ? [plainAddresses(text)] : []),
      ...(link ? [`${args.clinicName} added a meeting link. Use the button below to join.`] : []),
      ...(args.message ? [writtenBy(args.clinicName)] : []),
    ],
    items: link ? [{ text: "Join the meeting", url: link }] : undefined,
    buttonText: "See your application",
    buttonUrl: `${args.site}/candidate/applications/${args.applicationId}`,
  });
}
