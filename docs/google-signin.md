# Sign in with Google

The button "Continue with Google" is built, and stays hidden until it is switched on. Setting it up takes about 15 minutes.

## What the person sees

1. They press **Continue with Google** on the sign in or sign up page, and choose their Google account.
2. A new person is taken to **Welcome**, where they say whether they are looking for a job or hiring, and agree to the privacy policy and terms (the marketing box is optional and unticked). A clinic then goes to set up its clinic profile.
3. Someone who already has a Kestrel account with the same email address is signed in to that account. Supabase links them, because Google has verified the address.
4. We receive only their name and email address. We never see their Google password.

## Setting it up

1. **Google Cloud** (signed in as your Kestrel Workspace account, in the project under `eyecarejobs.ca`):
   - Google Auth Platform, Branding: app name `Kestrel Eye Care Jobs`, support email `hello@eyecarejobs.ca`, home page `https://eyecarejobs.ca`, privacy policy `https://eyecarejobs.ca/privacy`, terms `https://eyecarejobs.ca/terms`. Authorized domains: `eyecarejobs.ca` and `supabase.co`. Leave the logo out for now, because adding one can trigger a review.
   - Audience: **External**, then publish it ("In production"), so anyone can sign in and not only test users.
   - Data Access: add only `openid`, `email` and `profile`. These do not need Google's review.
   - Clients, Create client: type **Web application**, name `Kestrel website`. Authorized JavaScript origins: `https://eyecarejobs.ca`. Authorized redirect URI: the **Callback URL** shown in Supabase, under Authentication, Providers, Google (it looks like `https://xxxx.supabase.co/auth/v1/callback`).
   - Copy the **Client ID** and **Client secret**. The secret is a password. It goes only into Supabase.
2. **Supabase**, Authentication, Sign In / Providers, Google: switch it on, paste the Client ID and Client secret, save.
3. **Supabase**, Authentication, URL Configuration: the Site URL is `https://eyecarejobs.ca`. Under Redirect URLs, add `https://eyecarejobs.ca/**`, and for preview links `https://*-kestrel18.vercel.app/**`.
4. **Supabase SQL editor:** run the latest `supabase/combined/run-everything.sql` (migration 0017). It makes new Google accounts start as "type not confirmed".
5. **Vercel:** add `ENABLE_GOOGLE_SIGNIN` with the value `yes` (Production and Preview) and redeploy. Remove it, or set it to anything else, and the button disappears again.

## Test it

Sign out, press Continue with Google on the sign up page, choose an account, pick Clinic or Candidate on the Welcome page, and check you land on the right home. Then sign out and sign in with Google again: it should go straight to your home. Try it with a second Google account too.

## If something goes wrong

- "Error 400: redirect_uri_mismatch": the redirect URI in Google does not exactly match Supabase's Callback URL.
- "We could not sign you in with Google": the Google provider is off in Supabase, or the Client ID or secret was pasted wrongly.
- It lands on the sign in page after choosing an account: Redirect URLs in Supabase do not include your site address.
