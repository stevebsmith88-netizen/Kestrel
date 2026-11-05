// The rules for the sign in guard (audit R22), kept apart from the database so they can be tested.
// Failed attempts are counted per email and per visitor. After MAX_FAILURES inside WINDOW_MS, the form asks for the bot check.
import { createHash } from "node:crypto";

export const MAX_FAILURES = 5;
export const WINDOW_MS = 15 * 60 * 1000;
export const TOO_MANY_MESSAGE = "Too many attempts. Please complete the security check and try again.";
export const RATE_LIMITED_MESSAGE = "Too many attempts. Please wait a few minutes and try again.";

export type Attempt = { failures: number; window_started_at: string };

// The key stored for an email or a visitor. Hashed, so the table never holds a readable address.
export function attemptKey(kind: "email" | "visitor", value: string) {
  return `${kind}:${createHash("sha256").update(value.trim().toLowerCase()).digest("hex")}`;
}

const inWindow = (row: Attempt, now: number) => now - new Date(row.window_started_at).getTime() < WINDOW_MS;

// Failures still counting against this key. A window that has run out counts as none.
export const currentFailures = (row: Attempt | null | undefined, now = Date.now()) => (row && inWindow(row, now) ? row.failures : 0);

// True when any key has used up its attempts.
export const needsCheck = (rows: (Attempt | null | undefined)[], now = Date.now()) => rows.some((row) => currentFailures(row, now) >= MAX_FAILURES);

// What to store after one more failure: counting on from the open window, or a fresh window.
export function afterFailure(row: Attempt | null | undefined, now = Date.now()): Attempt {
  if (row && inWindow(row, now)) return { failures: row.failures + 1, window_started_at: row.window_started_at };
  return { failures: 1, window_started_at: new Date(now).toISOString() };
}
