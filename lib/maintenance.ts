// The off switch for the whole site. Setting MAINTENANCE_MODE to "yes" in Vercel (then redeploying) makes every page and
// form answer with a short "back soon" page instead. The health check, the daily job and other /api routes are not
// covered, so monitoring and housekeeping keep working. Used by proxy.ts. See docs/breach-plan.md for the steps.
type Env = Record<string, string | undefined>;

export const maintenanceOn = (env: Env = process.env) => (env.MAINTENANCE_MODE ?? "").trim().toLowerCase() === "yes";

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
<p>Please try again in a little while. If it matters, write to <a href="mailto:hello@eyecarejobs.ca">hello@eyecarejobs.ca</a>.</p>
<p>The Kestrel team</p>
</main>
</body>
</html>`;
