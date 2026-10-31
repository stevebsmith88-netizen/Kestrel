// The demo site: a separate copy of Kestrel with its own database and sample data, used to show people around before launch.
// It is switched on only by setting DEMO_MODE to "yes" in that project's settings in Vercel. The live site never has it.
// In demo mode: a banner says so on every page, the whole site is hidden from search engines, and no email is ever sent.
type Env = Record<string, string | undefined>;

export const demoMode = (env: Env = process.env) => env.DEMO_MODE === "yes";

export const DEMO_BANNER = "This is a demo of Kestrel Eye Care Jobs, filled with sample clinics and jobs. Please do not enter real personal information. Nothing here is real and no email is sent.";
