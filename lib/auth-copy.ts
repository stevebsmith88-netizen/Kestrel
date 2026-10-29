// Wording and small helpers shared by the account forms (in the browser) and the
// server actions that save them. Keep the consent wording identical to what
// people see: it is saved with their account as the record of what they agreed to.

export const ACCOUNT_TYPES = [
  { value: "candidate", label: "I'm looking for a job" },
  { value: "clinic", label: "I'm hiring for a clinic" },
] as const;

export const MARKETING_CONSENT_TEXT =
  "Yes, email me job alerts, product updates and offers from Kestrel Eye Care Jobs. I can unsubscribe at any time.";

export const MIN_PASSWORD = 10;

export const NOT_CONNECTED = "Sign in isn't connected yet. Please try again shortly.";

export type FormState = { error?: string; message?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isEmail = (value: string) => EMAIL.test(value);

// Only allow a redirect to a page on this site, never to another address.
export function safeNext(value: string | null, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
