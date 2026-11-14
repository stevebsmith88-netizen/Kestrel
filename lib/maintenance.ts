// The off switch for the whole site. Setting MAINTENANCE_MODE to "yes" in Vercel (then redeploying) makes every page and
// form answer with a short "back soon" page instead (proxy.ts). The API routes are outside proxy.ts, so the ones that save
// or send email check the switch themselves with maintenanceApiResponse (audit P1-22): the waitlist, the daily job and the
// view counter. 2 keep working on purpose: /api/resend, so a bounce or spam complaint is still recorded and that address is
// never emailed again, and /api/health, so monitoring can still see the site. See docs/breach-plan.md for the steps.
type Env = Record<string, string | undefined>;

export const maintenanceOn = (env: Env = process.env) => (env.MAINTENANCE_MODE ?? "").trim().toLowerCase() === "yes";

// What an API route answers while the switch is on, or null when it is off. The first line of the route's handler.
export function maintenanceApiResponse(env: Env = process.env): Response | null {
  if (!maintenanceOn(env)) return null;
  return Response.json(
    { error: "Kestrel is being looked after for a short while. Please try again in a little while." },
    { status: 503, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } },
  );
}

export const MAINTENANCE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Back soon | Kestrel Eye Care Jobs</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #FBF8F2; color: #1B2B4B; font-family: "Source Sans 3", system-ui, sans-serif; }
  main { max-width: 32rem; padding: 2rem 1.5rem; }
  h1 { font-family: "DM Serif Display", Georgia, serif; font-weight: 400; font-size: 2rem; margin: 0 0 1rem; }
  p { line-height: 1.6; margin: 0 0 1rem; }
  a { color: #8C4024; }
</style>
</head>
<body>
<main>
<h1>We will be back soon</h1>
<p>Kestrel Eye Care Jobs is being looked after for a short while. Nothing you have saved has been lost.</p>
<p>Please try again in a little while. If it matters, write to <a href="mailto:support@eyecarejobs.ca">support@eyecarejobs.ca</a>.</p>
<p>The Kestrel team</p>
</main>
</body>
</html>`;
