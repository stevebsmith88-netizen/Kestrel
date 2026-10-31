import { suppressionKeys } from "./unsubscribe-token.ts";

// What to do when someone submits the public waitlist form. An address already on the list is never changed from
// this form, because anyone can type anyone's address. That keeps a stranger from rewriting someone's details or
// undoing an unsubscribe. Only the person at that address, through the link we email them, can confirm.
type Existing = { confirmed_at: string | null; confirmation_sent_at: string | null; unsubscribed_at: string | null } | null;

export type JoinAction = "add" | "send-confirmation" | "nothing";

export function joinAction(existing: Existing, now = Date.now()): JoinAction {
  if (!existing) return "add";
  if (existing.unsubscribed_at || existing.confirmed_at) return "nothing";
  const recentlySent = existing.confirmation_sent_at && now - new Date(existing.confirmation_sent_at).getTime() < 60 * 60 * 1000;
  return recentlySent ? "nothing" : "send-confirmation";
}

// The waitlist download. By default it holds only people we may email: confirmed, not unsubscribed, and not on the do not
// email list (by address or by whole domain). Each row carries the person's own unsubscribe link for the email.
type Row = { email: string; confirmed_at: string | null; unsubscribed_at: string | null };

export function waitlistStatus(row: Row, blocked: Set<string>) {
  if (row.unsubscribed_at) return "unsubscribed";
  if (suppressionKeys(row.email).some((key) => blocked.has(key))) return "do not email";
  if (!row.confirmed_at) return "not confirmed";
  return "ready";
}
