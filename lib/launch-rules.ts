// Which home page and header to show. Kept free of imports from the app so the rule can be tested on its own (lib/launch-rules.test.ts).
//
//   coming-soon  the original page, with the large wordmark and the waitlist form
//   prelaunch    the new look (tagline under the wordmark, headline, skyline) with the waitlist still the call to action
//   launch       job search first, and Create account instead of the waitlist
//
// By default the launch layout follows the sign up gate, the one switch Steve flips at launch (docs/launch-checklist.md): while sign up
// is closed an earlier page shows, and the moment it opens the launch layout takes over. PRELAUNCH_HOME=yes chooses the new look for
// the time before launch only, so it can stay set and still never gets in the way of launch. LAUNCH_HOME can force a page either way,
// for the demo site ("yes") or for switching back in an emergency ("no").
export type HomeMode = "coming-soon" | "prelaunch" | "launch";

export function homeMode(launchEnv: string | undefined, prelaunchEnv: string | undefined, signupsOpen: boolean): HomeMode {
  const forced = (launchEnv ?? "").trim().toLowerCase();
  if (forced === "yes") return "launch";
  if (forced === "no") return "coming-soon";
  if (signupsOpen) return "launch";
  return (prelaunchEnv ?? "").trim().toLowerCase() === "yes" ? "prelaunch" : "coming-soon";
}

export const TAGLINE = "Canada-wide eye care job board";
