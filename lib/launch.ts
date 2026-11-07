import "server-only";
import { unstable_cache } from "next/cache";
import { launchChoice } from "@/lib/launch-rules";
import { signupsOpen } from "@/lib/signup-gate";

// Remembered for 5 minutes, so every page does not ask the database whether sign up is open.
const gateOpen = unstable_cache(async () => signupsOpen(), ["launch-gate-open"], { revalidate: 300 });

// True once Kestrel has launched: the home page shows the job search first and the header carries the tagline.
export async function launchLayoutOn() {
  const forced = (process.env.LAUNCH_HOME ?? "").trim().toLowerCase();
  if (forced === "yes" || forced === "no") return launchChoice(forced, false);
  return launchChoice(undefined, await gateOpen());
}
