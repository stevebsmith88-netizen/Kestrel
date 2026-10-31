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
