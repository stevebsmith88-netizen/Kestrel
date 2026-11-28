// An interview link a clinic can add to its message (Steve, 19th November 2026). The clinic pastes the Zoom, Teams, Google Meet, Webex or
// Whereby link, and the candidate gets it as a button. Nothing else is accepted: the address must be https and on one of those services'
// own websites, so a link in Kestrel's name can never lead somewhere else. It travels inside the saved message as a last line, so no database
// change was needed and it works on every database. Kept free of app imports so it can be tested on its own (lib/meeting-link.test.ts).

export const MEETING_HOSTS = ["zoom.us", "zoom.com", "teams.microsoft.com", "teams.live.com", "meet.google.com", "webex.com", "whereby.com"];
export const MEETING_LINE = "Join the meeting: ";
const MAX_LENGTH = 400;

const hostMatches = (host: string) => MEETING_HOSTS.some((a) => host === a || host.endsWith(`.${a}`));

export const MEETING_EXAMPLE = "https://zoom.us/j/1234567890";

// A clean link, an empty string for a blank answer, or an error message for the clinic to read. The part after "?" is kept, since a
// Zoom link needs it to carry the meeting password.
export function cleanMeetingLink(raw: unknown): { url: string; error?: undefined } | { url?: undefined; error: string } {
  const typed = typeof raw === "string" ? raw.trim() : "";
  if (!typed) return { url: "" };
  const wrong = `Use the meeting link from Zoom, Microsoft Teams, Google Meet, Webex or Whereby, starting with https://, like ${MEETING_EXAMPLE}.`;
  if (typed.length > MAX_LENGTH || /\s/.test(typed)) return { error: wrong };
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(typed) ? typed : `https://${typed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return { error: wrong };
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port || !hostMatches(url.hostname.toLowerCase())) return { error: wrong };
  if (url.pathname.replace(/\//g, "").length < 2) return { error: "That looks like the service's home page. Paste the link to your own meeting." };
  return { url: `https://${url.hostname.toLowerCase()}${url.pathname}${url.search}` };
}

// The clinic's message with the link added as its last line.
export function withMeetingLink(message: string, url: string): string {
  return url ? `${message.trimEnd()}\n\n${MEETING_LINE}${url}` : message;
}

// Splits a saved message into its words and its meeting link. The link is checked again here, so a line that only looks like one stays text.
export function splitMeetingLink(message: string | null | undefined): { text: string; link: string | null } {
  const full = message ?? "";
  const at = full.lastIndexOf(MEETING_LINE);
  if (at < 0) return { text: full, link: null };
  const checked = cleanMeetingLink(full.slice(at + MEETING_LINE.length));
  if (!checked.url) return { text: full, link: null };
  return { text: full.slice(0, at).trim(), link: checked.url };
}
