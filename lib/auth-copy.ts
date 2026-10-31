// Wording and small helpers shared by the account forms (in the browser) and the
// server actions that save them. Keep the consent wording identical to what
// people see: it is saved with their account as the record of what they agreed to.

export const ACCOUNT_TYPES = [
  { value: "candidate", label: "I'm looking for a job" },
  { value: "clinic", label: "I'm hiring for a clinic" },
] as const;

export const MARKETING_CONSENT_TEXT =
  "Yes, email me launch news, job alerts, product updates and offers from Kestrel Eye Care Jobs. I can unsubscribe at any time.";

// Saved with each account as the record of which terms were agreed to. Change it when the terms change
// in a way people need to agree to again (for example when the lawyer's version replaces the draft).
export const TERMS_VERSION = "2026-10-30 draft";

export const MIN_PASSWORD = 10;

export const NOT_CONNECTED = "Sign in isn't connected yet. Please try again shortly.";

export type FormState = { error?: string; message?: string; email?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isEmail = (value: string) => EMAIL.test(value);

// Only allow a redirect to a page on this site, never to another address. Browsers quietly strip tabs and line
// breaks from addresses, so "/\t/example.com" would otherwise become "//example.com". Anything with a control
// character, a space or a backslash is refused, and what is left must still resolve to this site.
export function safeNext(value: string | null, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\s\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const base = "https://site.invalid";
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
