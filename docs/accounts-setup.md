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
4. **Authentication, Emails, Templates:** replace the links so they use the secure token (these work on a phone even if you signed up on a computer).

   Confirm signup, subject "Confirm your email for Kestrel Eye Care Jobs":

   ```html
   <h2>Confirm your email</h2>
   <p>Thanks for joining Kestrel Eye Care Jobs. Please confirm your email address to finish creating your account.</p>
   <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/dashboard">Confirm my email</a></p>
   <p>If you didn't sign up, you can ignore this email.</p>
   <p>The Kestrel team</p>
   ```

   Reset password, subject "Reset your Kestrel password":

   ```html
   <h2>Reset your password</h2>
   <p>We received a request to reset the password for your Kestrel account.</p>
   <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Choose a new password</a></p>
   <p>If you didn't ask for this, you can ignore this email.</p>
   <p>The Kestrel team</p>
   ```

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
