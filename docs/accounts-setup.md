# Accounts: how sign in works and how to set it up

Sign in uses Supabase Auth with email and password. Google sign in is added in a later step.

## How it works

- People sign up as a **candidate** or a **clinic**. A row in `public.profiles` is created for them automatically.
- Roles are `candidate`, `clinic` and `admin`. Nobody can make themselves an admin.
- Every protected page checks the role on the server (`requireRole` in `lib/auth.ts`). The proxy only keeps the session fresh.
- After signing in, `/dashboard` sends each role to its home: `/candidate`, `/clinic` or `/admin`.
- Email links (confirm your address, reset your password) go to `/auth/confirm`, which works on any device.

## One time setup in Supabase

1. **Run the migration.** SQL Editor, new query, paste `supabase/migrations/0002_accounts.sql`, run.
2. **Authentication, Sign In / Providers, Email:** set the minimum password length to 10. Turn "Confirm email" on for launch. While testing on a preview link you can turn it off, so sign up logs you straight in. Turn it back on before launch.
3. **Authentication, URL Configuration:** set the Site URL to `https://eyecarejobs.ca`.
4. **Authentication, Emails, Templates:** paste in the three Kestrel templates from `docs/email-templates/` (confirm sign up, reset password and change email address). The links use the secure token, so they work on a phone even if you signed up on a computer. Keep "Secure email change" on.

5. **Vercel, Settings, Environment Variables:** add these two (same values as in Supabase, Project Settings, API). They are safe to be public.
   - `NEXT_PUBLIC_SUPABASE_URL`: the Project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the **publishable** key (starts `sb_publishable_`)

   Then redeploy.

## Making yourself the admin

Create your account on the site first, then run this once in the SQL editor, with your own email:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

## Before launch

- Supabase's built in email is limited to a handful of messages an hour. Connect a proper email service (Resend or Postmark) under Authentication, SMTP Settings.
- Add a bot check (such as Cloudflare Turnstile) to the sign up form.
- Add Google sign in (needs a Google Cloud OAuth client; `/auth/callback` is ready for it).

## Clinic sign up is by invitation

Until the free launch, a new clinic account needs an invitation code, so nobody can post jobs before the company, the disclosure and the lawyer's review are in place.

- In Vercel (Production and Preview) add `CLINIC_INVITE_CODE` with a code of at least 6 characters, for example 2 words and a number. Mark it Sensitive. Send it only to clinics you invite.
- Candidates never need a code. The field on the sign up page and on the Welcome page says "clinics only".
- If `CLINIC_INVITE_CODE` is missing, nobody can create a clinic account. That is deliberate.
- At free launch, add `CLINIC_SIGNUP` with the value `yes` and redeploy. The code is no longer asked for.
- This does not remove clinic accounts that already exist. Check Admin, Overview for any you did not invite.

## What the account pages record and check

- **Terms agreed:** every sign up (email or Google) saves the terms version and the date on the profile (`terms_version`, `terms_accepted_at`, migration 0018). The version is `TERMS_VERSION` in `lib/auth-copy.ts`. Change it when the lawyer's terms replace the draft. People who signed up before 0018 have no record.
- **Password reset:** the reset page works only for someone who has just used the link in their reset email (a signed cookie that lasts 15 minutes). Being signed in on a shared computer is not enough.
- **Bot check on the live site:** if the Turnstile keys are missing in Production, sign up, sign in and reset forms refuse instead of letting bots through. Previews and local work are unaffected.
- **Session refresh:** runs on every page except static files and API routes.
