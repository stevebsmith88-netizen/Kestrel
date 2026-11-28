// A clinic's own message to an applicant, as Kestrel sends it (audit P1-47). The clinic writes up to 1,500 characters, and Kestrel
// emails them from its own address. So that nobody can use that to send live links under Kestrel's name, web addresses in the message
// are shown as plain text, and the email and the inbox message say who wrote it.

import { emailLayout } from "./email-layout.ts";
import { buildIcs, calendarLinks, detailsLines, splitInterview } from "./interview-details.ts";

export const writtenBy = (clinicName: string) => `This message was written by ${clinicName}.`;

// A hidden zero width space. Email programs turn anything shaped like a web address into a link; with this after each dot and
// after "://", the address reads exactly the same but is no longer that shape, so it stays plain text.
const ZW = "​";
const TLD = "ca|com|net|org|info|biz|io|co|app|me|ly|link|xyz|online|site|health|care|vision|clinic|us|uk";
const ADDRESS = new RegExp(`(?<![@\\w.])((?:https?:\\/\\/|www\\.)[^\\s<>"]+|[a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.(?:${TLD})\\b(?:\\/[^\\s<>"]*)?)`, "gi");

export function plainAddresses(text: string) {
  return text.replace(ADDRESS, (address) => address.replace(/:\/\//g, `:${ZW}//`).replace(/\./g, `.${ZW}`));
}

// The opening of the email, different for each step so a no never sounds like an offer (Steve, 19th November 2026). Good news is kept for
// the steps that are good news. A no or a closed role is kind and plain, and any other step keeps the plain "is now" line.
export function updateHeading(status: string | undefined) {
  switch (status) {
    case "interview": return "Good news, you have been invited to interview";
    case "offer": return "Congratulations, you have an offer";
    case "hired": return "Congratulations on the new role";
    case "not_selected": return "Thank you for applying";
    case "role_filled": return "This role has been filled";
    case "kept": return "Your details are being kept";
    default: return "An update on your application";
  }
}

export function updateSubject(status: string | undefined, jobTitle: string, clinicName: string) {
  switch (status) {
    case "interview": return `Good news: ${clinicName} would like to interview you`;
    case "offer": return `Congratulations: an offer from ${clinicName}`;
    case "hired": return `Congratulations from ${clinicName}`;
    case "not_selected": return `Your application to ${clinicName}`;
    case "role_filled": return `The ${jobTitle} role at ${clinicName} has been filled`;
    case "kept": return `${clinicName} is keeping your details`;
    default: return `Update on your application: ${jobTitle}`;
  }
}

function updateIntro(args: { status?: string; jobTitle: string; clinicName: string; label: string }) {
  switch (args.status) {
    case "interview": return `${args.clinicName} would like to meet you about the ${args.jobTitle} role. Their message is below.`;
    case "offer": return `${args.clinicName} has made you an offer for the ${args.jobTitle} role. Their message is below.`;
    case "hired": return `${args.clinicName} has told us you are the person they hired as ${args.jobTitle}. Their message is below.`;
    case "not_selected": return `${args.clinicName} has made its decision on the ${args.jobTitle} role, and it is not a yes this time. Their message is below.`;
    case "role_filled": return `The ${args.jobTitle} role at ${args.clinicName} is no longer open. Their message is below.`;
    case "kept": return `${args.clinicName} cannot offer you the ${args.jobTitle} role right now, but would like to keep your details for future openings, as you agreed when you applied.`;
    default: return `Your application for ${args.jobTitle} at ${args.clinicName} is now: ${args.label}.`;
  }
}

// The email a candidate gets when a clinic moves their application, with the clinic's message if there is one. An interview can carry how it
// will happen, when and where, a meeting link (Zoom, Teams, Google Meet and the like) and a calendar file; each is checked again here, and the
// link is shown as 1 link, apart from the plain text of the message.
export function applicationUpdateEmail(args: { jobTitle: string; clinicName: string; label: string; message: string; applicationId: string; site: string; status?: string }) {
  const { text, interview, link } = splitInterview(args.message);
  const calendar = interview ? calendarLinks({ id: args.applicationId, jobTitle: args.jobTitle, clinicName: args.clinicName, interview, link }) : null;
  return emailLayout({
    heading: updateHeading(args.status),
    paragraphs: [
      updateIntro(args),
      ...(text ? [plainAddresses(text)] : []),
      ...(interview ? [detailsLines(interview, link).join("\n")] : link ? [`${args.clinicName} added a meeting link. Use the link below to join.`] : []),
      ...(calendar ? ["The calendar file is attached. Open it to add the interview to your calendar. You can also use the links below."] : []),
      ...(args.message ? [writtenBy(args.clinicName)] : []),
    ],
    items: [
      ...(link ? [{ text: "Join the meeting", url: link }] : []),
      ...(calendar ? [{ text: "Add to Google Calendar", url: calendar.google }, { text: "Add to Outlook calendar", url: calendar.outlook }] : []),
    ],
    buttonText: "See your application",
    buttonUrl: `${args.site}/candidate/applications/${args.applicationId}`,
  });
}

// The calendar file to attach to an interview email, or null when the clinic gave no date and time.
export function interviewCalendarFile(args: { jobTitle: string; clinicName: string; message: string; applicationId: string }) {
  const { interview, link } = splitInterview(args.message);
  const ics = interview ? buildIcs({ id: args.applicationId, jobTitle: args.jobTitle, clinicName: args.clinicName, interview, link }) : null;
  return ics ? { filename: "interview.ics", content: Buffer.from(ics, "utf8").toString("base64"), contentType: "text/calendar; charset=utf-8; method=PUBLISH" } : null;
}
