// Which home page and header to show: the coming soon page, or the launch layout (job search first, tagline in the header).
// Kept free of imports from the app so the rule can be tested on its own (lib/launch-rules.test.ts).
//
// By default the layout follows the sign up gate, the one switch Steve flips at launch (docs/launch-checklist.md): while sign up is
// closed the coming soon page shows, and the moment it opens the launch layout takes over. LAUNCH_HOME can force it either way, for
// the demo site ("yes") or for switching back in an emergency ("no").
export function launchChoice(envValue: string | undefined, signupsOpen: boolean): boolean {
  const v = (envValue ?? "").trim().toLowerCase();
  if (v === "yes") return true;
  if (v === "no") return false;
  return signupsOpen;
}

export const TAGLINE = "Canada-wide eye care job board";
