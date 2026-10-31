import { timingSafeEqual } from "node:crypto";

// Clinic sign up is by invitation until the free launch, so nobody can post jobs before the company, the
// disclosure and the lawyer's review are in place. The code is a setting in Vercel, never in the code.
type Env = Record<string, string | undefined>;

export const clinicInviteOnly = (env: Env = process.env) => env.CLINIC_SIGNUP !== "yes";

const tidy = (value: string) => value.trim().toLowerCase();

// True when the person may create a clinic account. Candidates never need a code. If the switch is on
// but no code has been set, nobody can sign up as a clinic, which is the safe way to fail.
export function clinicInviteOk(given: string, env: Env = process.env) {
  if (!clinicInviteOnly(env)) return true;
  const code = tidy(env.CLINIC_INVITE_CODE ?? "");
  if (code.length < 6) return false;
  const a = Buffer.from(tidy(given));
  const b = Buffer.from(code);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const INVITE_MESSAGE = "Clinic accounts are by invitation for now. Enter the invitation code we sent you, or join the waitlist and we will email you when Kestrel opens.";
