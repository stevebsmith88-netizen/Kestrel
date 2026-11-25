// What a candidate needs on their profile to apply for a job (Steve, 12th November 2026): a role, a saved resume, and a town and province.
// Everything else on the profile is optional. One place decides it, so the profile page, the apply page, the server check, the dashboard,
// the first week emails and the admin numbers all agree. Kept free of app imports so it can be tested on its own (lib/profile-ready.test.ts).

export type ReadyFields = {
  profession?: string | null;
  cv_path?: string | null;
  home_city?: string | null;
  home_province?: string | null;
};

export const APPLY_NEEDS = [
  { key: "role", label: "Your role", done: (p: ReadyFields | null) => Boolean(p?.profession) },
  { key: "resume", label: "Your resume", done: (p: ReadyFields | null) => Boolean(p?.cv_path) },
  { key: "town", label: "Your town and province", done: (p: ReadyFields | null) => Boolean(p?.home_city && p?.home_province) },
] as const;

export const missingToApply = (p: ReadyFields | null) => APPLY_NEEDS.filter((n) => !n.done(p)).map((n) => n.label);
export const readyToApply = (p: ReadyFields | null) => missingToApply(p).length === 0;

// For example "your role, your resume and your town and province".
export function missingSentence(p: ReadyFields | null): string {
  const list = missingToApply(p).map((l) => l.toLowerCase());
  return list.length <= 1 ? list.join("") : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}

// The dashboard meter: how many of the 3 needs to apply are done, as a percentage. It reads 100 exactly when readyToApply is true,
// so it can never sit beside "Finish your profile".
export const profileStrength = (p: ReadyFields | null) => Math.round((APPLY_NEEDS.filter((n) => n.done(p)).length / APPLY_NEEDS.length) * 100);
