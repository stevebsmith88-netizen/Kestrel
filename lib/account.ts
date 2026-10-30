// Rules for the details people can change on their Account page. Kept free of the app so they can be tested.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const cleanName = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, 60) : "");

export function validateName(first: string, last: string) {
  const errors: Record<string, string> = {};
  if (!first) errors.firstName = "Enter your first name.";
  if (/[<>@\d]/.test(first + last)) errors.firstName = errors.firstName ?? "Names can't contain numbers or symbols such as @ < >.";
  return errors;
}

export function validateEmailChange(current: string, next: string, password: string) {
  const errors: Record<string, string> = {};
  if (!EMAIL.test(next) || next.length > 254) errors.email = "Enter a full email address, like name@clinic.ca.";
  else if (next.toLowerCase() === current.toLowerCase()) errors.email = "That is the address you already use.";
  if (!password) errors.password = "Enter your password to confirm it is you.";
  return errors;
}

export const fullName = (first: string, last: string) => [first, last].filter(Boolean).join(" ");
