// A clinic's own message to an applicant, as Kestrel sends it (audit P1-47). The clinic writes up to 1,500 characters, and Kestrel
// emails them from its own address. So that nobody can use that to send live links under Kestrel's name, web addresses in the message
// are shown as plain text, and the email and the inbox message say who wrote it.

import { emailLayout } from "./email-layout.ts";

export const writtenBy = (clinicName: string) => `This message was written by ${clinicName}.`;

// A hidden zero width space. Email programs turn anything shaped like a web address into a link; with this after each dot and
// after "://", the address reads exactly the same but is no longer that shape, so it stays plain text.
const ZW = "​";
const TLD = "ca|com|net|org|info|biz|io|co|app|me|ly|link|xyz|online|site|health|care|vision|clinic|us|uk";
const ADDRESS = new RegExp(`(?<![@\\w.])((?:https?:\\/\\/|www\\.)[^\\s<>"]+|[a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.(?:${TLD})\\b(?:\\/[^\\s<>"]*)?)`, "gi");

export function plainAddresses(text: string) {
  return text.replace(ADDRESS, (address) => address.replace(/:\/\//g, `:${ZW}//`).replace(/\./g, `.${ZW}`));
}

// The email a candidate gets when a clinic moves their application, with the clinic's message if there is one.
export function applicationUpdateEmail(args: { jobTitle: string; clinicName: string; label: string; message: string; applicationId: string; site: string }) {
  return emailLayout({
    heading: "An update on your application",
    paragraphs: [
      `Your application for ${args.jobTitle} at ${args.clinicName} is now: ${args.label}.`,
      ...(args.message ? [plainAddresses(args.message), writtenBy(args.clinicName)] : []),
    ],
    buttonText: "See your application",
    buttonUrl: `${args.site}/candidate/applications/${args.applicationId}`,
  });
}
