// Whether a candidate may apply for a job, by role (Steve, November 2026). A candidate can apply when the job's role is their own role, a role
// that counts as the same kind of work, or one they added under "Other roles you would consider". Anything else shows a plain message with
// a way to fix the profile, and the server refuses the application too. Contact lens fitters are not a separate role yet (they sit inside
// Optician), so that pairing is not here. Kept free of imports from the app so it can be tested on its own (lib/role-fit.test.ts).

import { CLINIC_ROLES, FIELD_ROLES } from "./jobs.ts";

// Roles that are never offered to each other, even as "other roles you would consider" (Steve, November 2026): an optician is not shown
// optometrist jobs, and an optometrist is not shown optician jobs.
export const NEVER_TOGETHER: readonly (readonly string[])[] = [["Optometrist", "Optician"]];
export const neverTogether = (a: string, b: string) => NEVER_TOGETHER.some((pair) => pair.includes(a) && pair.includes(b));

// Optometrists are not offered field and supplier roles (Steve, November 2026).
export const canHaveFieldRoles = (profession: string | null | undefined) => Boolean(profession) && profession !== "Optometrist";
export const openToField = (otherRoles: readonly string[] | null | undefined) => (otherRoles ?? []).some((r) => (FIELD_ROLES as readonly string[]).includes(r));

// The clinic roles a candidate can add under "Other roles you would consider". Field and supplier roles are added with the single tick.
export const otherRolesOffered = (profession: string | null | undefined): string[] =>
  profession ? CLINIC_ROLES.filter((r) => r !== profession && !neverTogether(profession, r)) : [...CLINIC_ROLES];

// Roles that are flexible with each other: the unregulated front of house and chairside roles.
export const COMPATIBLE_ROLES: readonly (readonly string[])[] = [["Optometric assistant or technician", "Patient care or reception"]];

export function canApplyForRole(profession: string | null | undefined, otherRoles: readonly string[] | null | undefined, jobRole: string | null | undefined): boolean {
  if (!profession || !jobRole) return true; // nothing to compare, so the profile check elsewhere decides
  if (profession === jobRole) return true;
  if (neverTogether(profession, jobRole)) return false;
  if (!canHaveFieldRoles(profession) && (FIELD_ROLES as readonly string[]).includes(jobRole)) return false;
  if ((otherRoles ?? []).includes(jobRole)) return true;
  return COMPATIBLE_ROLES.some((group) => group.includes(profession) && group.includes(jobRole));
}

const PHRASE: Record<string, string> = {
  Optometrist: "an optometrist",
  Optician: "an optician",
  "Optometric assistant or technician": "an optometric assistant or technician",
  "Practice or clinic manager": "a practice or clinic manager",
  "Patient care or reception": "someone in patient care or reception",
  "Vision therapist": "a vision therapist",
  "Sales or territory representative": "a sales or territory representative",
  "Trainer or clinical educator": "a trainer or clinical educator",
  "Field service or equipment technician": "a field service or equipment technician",
  "Account or practice development manager": "an account or practice development manager",
};

// The message shown instead of the Apply button, and given back if someone tries to apply anyway.
export function roleMismatchText(profession: string, jobRole: string): string {
  const who = PHRASE[jobRole] ?? `someone in ${jobRole.toLowerCase()}`;
  const start = `This role is for ${who}. Your profile says ${profession.toLowerCase()}.`;
  if (neverTogether(profession, jobRole)) return `${start} If that is not right, you can change your role in your profile to apply.`;
  if ((FIELD_ROLES as readonly string[]).includes(jobRole)) {
    return canHaveFieldRoles(profession)
      ? `${start} If you would like field and supplier roles, tick Open to field and supplier roles in your profile to apply.`
      : `${start} If that is not right, you can change your role in your profile to apply.`;
  }
  return `${start} If that is not right, you can change your role in your profile to apply. You can also add this role under Other roles you would consider.`;
}
