// Single source of truth for the waitlist form: used by the form on the page
// and by the API route that validates and saves each sign up.

export const AUDIENCES = [
  { value: "clinic", label: "A clinic that's hiring" },
  { value: "candidate", label: "Looking for my next role" },
] as const;

export const ROLES = [
  "Optometrist",
  "Optician",
  "Optometric assistant or technician",
  "Practice or clinic manager",
  "Patient care or reception",
] as const;

export const PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
] as const;

// Keep this wording identical to what people see. It is saved with every
// sign up as the record of what they agreed to (CASL express consent).
export const CONSENT_TEXT =
  "Yes, email me launch news, job alerts, product updates and offers from Kestrel Eye Care Jobs. I can unsubscribe at any time.";

export const THANK_YOU =
  "Thanks, you're on the list. We'll be in touch as Kestrel gets closer to launch.";

export type WaitlistInput = {
  audience: string;
  firstName: string;
  lastName: string;
  email: string;
  clinicName: string;
  role: string;
  roleOther: string;
  province: string;
  consent: boolean;
  website?: string; // honeypot, must stay empty
};

export type FieldErrors = Partial<Record<keyof WaitlistInput, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function validate(raw: Partial<WaitlistInput>) {
  const v = {
    audience: clean(raw.audience, 20),
    firstName: clean(raw.firstName),
    lastName: clean(raw.lastName),
    email: clean(raw.email, 254).toLowerCase(),
    clinicName: clean(raw.clinicName, 160),
    role: clean(raw.role),
    roleOther: clean(raw.roleOther),
    province: clean(raw.province, 40),
    consent: raw.consent === true,
    website: clean(raw.website),
  };
  const errors: FieldErrors = {};
  if (!AUDIENCES.some((a) => a.value === v.audience)) errors.audience = "Choose an option.";
  if (!v.firstName) errors.firstName = "Enter a first name.";
  if (!EMAIL.test(v.email)) errors.email = "Enter an email address like example@mysite.com.";
  if (v.audience === "clinic" && !v.clinicName) errors.clinicName = "Enter your clinic name.";
  if (v.role === "__other__" && !v.roleOther) errors.roleOther = "Tell us your role.";
  if (v.role && v.role !== "__other__" && !(ROLES as readonly string[]).includes(v.role)) errors.role = "Choose an option.";
  if (!(PROVINCES as readonly string[]).includes(v.province)) errors.province = "Choose an option.";
  if (!v.consent) errors.consent = "Check the box to continue.";
  const role = v.role === "__other__" ? `Other: ${v.roleOther}` : v.role;
  return { values: { ...v, role }, errors, ok: Object.keys(errors).length === 0 };
}
