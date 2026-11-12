// The check before the data download (audit P1-49), the same as before deleting an account: a password account gives its password,
// and an account that signs in with Google types its email address, so a signed in screen left open is not enough on its own.
// Kept free of app imports so it can be tested (lib/export-check.test.ts). The password itself is checked in app/account/export/route.ts.

export type ExportProblem = "missing-password" | "wrong-password" | "wrong-email";

export const EXPORT_PROBLEMS: Record<ExportProblem, string> = {
  "missing-password": "Enter your password to download your information.",
  "wrong-password": "That password doesn't match. Please try again.",
  "wrong-email": "Type your email address exactly as shown to download your information.",
};

export function exportCheck(input: { hasPassword: boolean; email: string; password?: string; confirmEmail?: string }): ExportProblem | "check-password" | "ok" {
  if (input.hasPassword) return input.password ? "check-password" : "missing-password";
  return (input.confirmEmail ?? "").trim().toLowerCase() === input.email.trim().toLowerCase() && input.email ? "ok" : "wrong-email";
}

export const isExportProblem = (value: string | undefined): value is ExportProblem => Boolean(value && value in EXPORT_PROBLEMS);
