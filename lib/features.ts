// Things that are built but switched off until Steve is ready. Set the variable to "yes" in Vercel to switch one on.
export const findYourFitOn = () => process.env.ENABLE_FIND_YOUR_FIT === "yes";

// Continue with Google. Switch on once Google and Supabase are set up (ENABLE_GOOGLE_SIGNIN=yes in Vercel).
export const googleSignInOn = () => process.env.ENABLE_GOOGLE_SIGNIN === "yes";
