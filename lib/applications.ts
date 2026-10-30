// The rules for job applications: the statuses a person sees, which moves a clinic may
// make, and the kind messages. Kept free of app imports so they can be tested on their
// own (see lib/applications.test.ts).

export type AppStatus =
  | "applied" | "viewed" | "shortlisted" | "interview" | "offer"
  | "not_selected" | "role_filled" | "kept" | "no_update" | "withdrawn";

export const APP_LABELS: Record<AppStatus, string> = {
  applied: "Applied",
  viewed: "Viewed",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offer: "Offer",
  not_selected: "Not selected this time",
  role_filled: "Role filled",
  kept: "Kept for future roles",
  no_update: "No update from the clinic",
  withdrawn: "Withdrawn",
};

// What a candidate sees as the one line of explanation under a status.
export const APP_EXPLAINERS: Record<AppStatus, string> = {
  applied: "Sent. The clinic has not opened it yet.",
  viewed: "The clinic has opened your application.",
  shortlisted: "You are in the running.",
  interview: "The clinic would like to meet you.",
  offer: "The clinic has made you an offer.",
  not_selected: "The clinic chose other candidates this time.",
  role_filled: "This job is no longer open.",
  kept: "The clinic will keep your details for future openings.",
  no_update: "The job closed without a decision.",
  withdrawn: "You withdrew this application.",
};

export const STEPS = ["applied", "viewed", "shortlisted", "interview", "offer"] as const;
export const CLOSED: readonly AppStatus[] = ["not_selected", "role_filled", "kept", "no_update", "withdrawn"];
export const CLINIC_MOVES: readonly AppStatus[] = ["shortlisted", "interview", "offer", "not_selected", "role_filled", "kept"];
export const NEEDS_MESSAGE: readonly AppStatus[] = ["interview", "offer", "not_selected", "role_filled", "kept"];

export const isClosed = (s: string) => (CLOSED as readonly string[]).includes(s);
export const isAppStatus = (s: string): s is AppStatus => s in APP_LABELS;

export type Group = "review" | "interview" | "offer" | "closed";
export const GROUP_LABELS: Record<Group, string> = { review: "In review", interview: "Interviews", offer: "Offers", closed: "Closed" };

export function groupOf(status: string): Group {
  if (status === "interview") return "interview";
  if (status === "offer") return "offer";
  if (isClosed(status)) return "closed";
  return "review";
}

// How far along the five steps an application got, from its history. Used to draw the
// progress bar for closed applications.
export function reachedStep(history: string[], current: string) {
  let best = -1;
  [...history, current].forEach((s) => {
    const i = (STEPS as readonly string[]).indexOf(s);
    if (i > best) best = i;
  });
  return Math.max(best, 0);
}

// Returns a plain sentence if the clinic may not make this move, or null if it may.
export function clinicMoveError(from: string, to: string, keepDetails: boolean, message: string): string | null {
  if (!(CLINIC_MOVES as readonly string[]).includes(to)) return "That is not a step you can choose.";
  if (from === "withdrawn") return "The candidate has withdrawn this application.";
  if (from === to) return "The application is already at that step.";
  if (to === "kept" && !keepDetails) return "This candidate did not agree to have their details kept, so you can't choose this.";
  if ((NEEDS_MESSAGE as readonly string[]).includes(to)) {
    if (!message.trim()) return "Please write a short message to the candidate.";
    if (/\[[^\]]+\]/.test(message)) return "Please fill in the details in the square brackets before sending.";
  }
  return null;
}

export function messageTemplate(status: string, clinic: string) {
  switch (status) {
    case "not_selected":
      return `Thank you for applying to ${clinic}. We have decided to move forward with other candidates for this role, and we wish you well in your search.`;
    case "role_filled":
      return `Thank you for your interest in ${clinic}. This role has now been filled. We appreciate the time you took to apply.`;
    case "kept":
      return `Thank you for applying to ${clinic}. We are not able to offer you this role right now, but we would like to keep your details for future openings, as you agreed when you applied.`;
    case "shortlisted":
      return `Good news. ${clinic} has added you to the shortlist for this role. We will be in touch about next steps.`;
    case "interview":
      return `${clinic} would like to interview you. [Add the date, time and how to join]`;
    case "offer":
      return `${clinic} would like to offer you this role. [Add the details, and when you need a reply by]`;
    default:
      return "";
  }
}

export const COVER_LETTER_MAX = 5000;

export function cleanCoverLetter(value: unknown) {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim().slice(0, COVER_LETTER_MAX) : "";
}

export function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// What a person's file looks like on the inside tells us what it really is, whatever it
// is called. Returns the kind of CV file, or null if it is not one we accept.
export function detectCv(bytes: Uint8Array, filename: string): { ext: "pdf" | "docx" | "doc"; contentType: string } | null {
  const name = filename.toLowerCase();
  const startsWith = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (startsWith(0x25, 0x50, 0x44, 0x46, 0x2d) && name.endsWith(".pdf")) return { ext: "pdf", contentType: "application/pdf" };
  if (startsWith(0x50, 0x4b, 0x03, 0x04) && name.endsWith(".docx")) {
    return { ext: "docx", contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
  }
  if (startsWith(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1) && name.endsWith(".doc")) return { ext: "doc", contentType: "application/msword" };
  return null;
}

export const CV_MAX_BYTES = 3 * 1024 * 1024;

const ascii = (bytes: Uint8Array) => Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("latin1");
const utf16 = (text: string) => Buffer.from(text, "utf16le").toString("latin1");

// Looks inside a CV for the things malicious files usually rely on: macros, scripts, launch actions and embedded
// programs. Returns what it found, or null. This is a safety net, not an antivirus. It cannot see inside compressed
// parts of a file, so a real virus scan is still planned (see docs/cv-scanning.md).
export function activeContent(bytes: Uint8Array, ext: "pdf" | "docx" | "doc"): string | null {
  const text = ascii(bytes);
  if (ext === "pdf") {
    if (/\/(JavaScript|Launch|EmbeddedFile|RichMedia|XFA)\b/.test(text) || /\/JS(?![A-Za-z])/.test(text)) return "a script, a launch action or an embedded file";
  } else if (ext === "docx") {
    if (/vbaProject\.bin|word\/activeX\/|word\/embeddings\//i.test(text)) return "macros or embedded objects";
  } else if (text.includes(utf16("_VBA_PROJECT")) || text.includes(utf16("Ole10Native"))) {
    return "macros or embedded objects";
  }
  return null;
}

// A safe name to show and to download the file as.
export function safeFilename(name: string) {
  const cleaned = name.replace(/[^\w.\- ()]/g, "").replace(/\s+/g, " ").replace(/^[.\s]+/, "").trim().slice(-120);
  return cleaned || "cv";
}
