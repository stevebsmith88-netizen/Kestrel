// Whether a signed in person must agree to the terms before going on (audit P1-03, part c). Every sign up through the website and
// the welcome page saves the terms version, so this only catches an account made some other way, or before the record existed
// (migration 0018). An admin is never asked. Kept free of app imports so it can be tested (lib/terms-check.test.ts).

export function needsTerms(profile: { role?: string | null; terms_version?: string | null } | null | undefined): boolean {
  if (!profile || profile.role === "admin") return false;
  return profile.terms_version === null || profile.terms_version === undefined;
}
