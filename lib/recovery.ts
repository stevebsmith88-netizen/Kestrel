import { signValue, valueIsGenuine } from "./unsubscribe-token.ts";

// Proof that someone has just used the password reset link from their email. Being signed in on a shared computer
// is not enough to set a new password, so the reset page asks for this as well. It is a short lived signed cookie.
export const RECOVERY_COOKIE = "kestrel_recovery";
export const RECOVERY_MINUTES = 15;

export function makeRecoveryValue(secret: string, userId: string, now = Date.now()) {
  const value = `${userId}.${now + RECOVERY_MINUTES * 60_000}`;
  return `${value}.${signValue(secret, "recovery", value)}`;
}

// Returns true only when the cookie was made for this person and has not run out.
export function recoveryIsValid(secret: string, userId: string, cookie: string | undefined, now = Date.now()) {
  if (!secret || !cookie) return false;
  const cut = cookie.lastIndexOf(".");
  if (cut < 0) return false;
  const value = cookie.slice(0, cut);
  const [id, expires] = value.split(".");
  if (id !== userId || !(Number(expires) > now)) return false;
  return valueIsGenuine(secret, "recovery", value, cookie.slice(cut + 1));
}
