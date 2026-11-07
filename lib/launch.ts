import "server-only";
import { unstable_cache } from "next/cache";
import { homeMode, type HomeMode } from "@/lib/launch-rules";
import { signupsOpen } from "@/lib/signup-gate";

// Remembered for 5 minutes, so every page does not ask the database whether sign up is open.
const gateOpen = unstable_cache(async () => signupsOpen(), ["launch-gate-open"], { revalidate: 300 });

// Which home page and header to show (lib/launch-rules.ts has the rule).
export async function homeModeNow(): Promise<HomeMode> {
  const forced = (process.env.LAUNCH_HOME ?? "").trim().toLowerCase();
  const open = forced === "yes" || forced === "no" ? false : await gateOpen();
  return homeMode(process.env.LAUNCH_HOME, process.env.PRELAUNCH_HOME, open);
}

// True once Kestrel has launched: job search first, and Create account in the header.
export async function launchLayoutOn() {
  return (await homeModeNow()) === "launch";
}
