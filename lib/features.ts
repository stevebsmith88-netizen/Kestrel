// Things that are built but switched off until Steve is ready. Set the variable to "yes" in Vercel to switch one on.
export const findYourFitOn = () => process.env.ENABLE_FIND_YOUR_FIT === "yes";

// The "From the blog" section on the home page. Off until Steve wants it there (ENABLE_HOME_BLOG=yes in Vercel, then redeploy).
// The blog itself, at /blog, is not affected.
export const homeBlogOn = () => process.env.ENABLE_HOME_BLOG === "yes";

// Continue with Google. Switch on once Google and Supabase are set up (ENABLE_GOOGLE_SIGNIN=yes in Vercel).
export const googleSignInOn = () => process.env.ENABLE_GOOGLE_SIGNIN === "yes";

// Clinic sign up is by invitation until the free launch. While CLINIC_SIGNUP is not "yes", a new clinic account needs
// the code in CLINIC_INVITE_CODE (see lib/invite.ts). Set CLINIC_SIGNUP to "yes" in Vercel to open it to everyone.
export const clinicSignUpOpen = () => process.env.CLINIC_SIGNUP === "yes";

// Publishing found listings (jobs read from a clinic's own careers page, at /admin/found). Off until Steve confirms his
// disclosure conversation has happened. While it is off, pages can be read and drafts saved, but nothing is published.
// Set ENABLE_SEEDING to "yes" in Vercel to switch it on.
export const seedingOn = () => process.env.ENABLE_SEEDING === "yes";

// The clinic outreach email sequence (Admin, Outreach). Off until Steve confirms his disclosure conversation has happened
// and a lawyer has checked the sequence. While it is off, clinics can be added and nothing is sent.
// Set ENABLE_OUTREACH to "yes" in Vercel to switch it on. OUTREACH_DAILY_LIMIT caps sends a day (default 20).
export const outreachOn = () => process.env.ENABLE_OUTREACH === "yes";
export function outreachDailyLimit(env: Record<string, string | undefined> = process.env) {
  const given = Number(env.OUTREACH_DAILY_LIMIT);
  return env.OUTREACH_DAILY_LIMIT && Number.isFinite(given) && given >= 0 ? Math.min(Math.floor(given), 200) : 20;
}
