// A clinic's team (Steve, 14th November 2026; migration 0045, docs/plans/locations-and-team-design.md). Wording and the small rules shared
// by the Team page, the invitation email, sign up and the server actions.
import { createHash, randomInt } from "node:crypto";
import { longDate } from "./jobs.ts";

export type ClinicLevel = "owner" | "edit" | "view";
export type MemberLevel = Exclude<ClinicLevel, "owner">;

export const TEAM_MAX = 5; // people a clinic, counting the owner
export const INVITE_DAYS = 14;

export const LEVELS: { value: MemberLevel; label: string; help: string }[] = [
  { value: "edit", label: "Can view and edit", help: "Posts and changes jobs, sees applicants and their resumes, and moves them along." },
  { value: "view", label: "View only, with notes", help: "Reads jobs and applicants, and adds notes. Their notes are passed to you to act on." },
];
export const levelLabel = (level: string) => (level === "owner" ? "Owner" : LEVELS.find((l) => l.value === level)?.label ?? "Team member");
export const isMemberLevel = (value: unknown): value is MemberLevel => value === "edit" || value === "view";

export const canEdit = (level: ClinicLevel | null | undefined) => level === "owner" || level === "edit";
export const isOwner = (level: ClinicLevel | null | undefined) => level === "owner";

export const VIEW_ONLY_TEXT = "You can view applicants and add notes. Ask the clinic owner if something needs to change.";
export const OWNER_ONLY_TEXT = "Only the clinic owner can change this.";

// Codes look like KT-7Q4K-M2XP: easy to read out and type, with no letters that look like numbers (no I, L, O, 0 or 1).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function newInviteCode() {
  const part = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `KT-${part()}-${part()}`;
}

// What a person typed, tidied: capitals, no spaces, the dashes put back. Anything that is not a code comes back empty.
export function cleanInviteCode(typed: string) {
  const raw = typed.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = raw.startsWith("KT") ? raw.slice(2) : raw;
  if (body.length !== 8 || [...body].some((c) => !ALPHABET.includes(c))) return "";
  return `KT-${body.slice(0, 4)}-${body.slice(4)}`;
}
export const looksLikeTeamCode = (typed: string) => cleanInviteCode(typed) !== "";

// Only a fingerprint of the code is stored (migration 0045), so the table never holds a way in.
export const codeHash = (code: string) => createHash("sha256").update(cleanInviteCode(code)).digest("hex");

export const inviteExpiry = (from: Date) => new Date(from.getTime() + INVITE_DAYS * 24 * 60 * 60 * 1000);

export type InviteRow = { email: string; expires_at: string; accepted_at: string | null; cancelled_at: string | null };
// Why an invitation cannot be used by this person now, or null when it can.
export function inviteProblem(invite: InviteRow | null, email: string, now = new Date()): string | null {
  if (!invite) return "That invite code is not right. Check it against the email, or ask the clinic to send a new one.";
  if (invite.cancelled_at) return "That invitation was cancelled. Ask the clinic to send a new one.";
  if (invite.accepted_at) return "That invite code has already been used.";
  if (new Date(invite.expires_at).getTime() < now.getTime()) return "That invite code has run out. Ask the clinic to send a new one.";
  if (invite.email !== email.trim().toLowerCase()) return `That invitation was sent to a different email address. Sign up or sign in with the address it was sent to.`;
  return null;
}

// A note from a view only member is added to the clinic's note with their name and the date, so it never replaces what is there.
export function appendNote(existing: string, author: string, text: string, when: Date, max = 3000) {
  const line = `${author}, ${longDate(when)}: ${text.trim()}`;
  const joined = existing.trim() ? `${existing.trim()}\n\n${line}` : line;
  return joined.length > max ? joined.slice(joined.length - max) : joined;
}
