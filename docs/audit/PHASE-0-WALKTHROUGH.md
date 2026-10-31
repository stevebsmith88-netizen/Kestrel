# Phase 0 walkthrough: Steve's settings hour

About 2 hours, no code. Work top to bottom, since the first 3 matter most. For each step, the aim is to note what you see and tell Claude. Never paste a key, password or token into chat. Describe what a screen says instead (for example "Preview is ticked for RESEND_API_KEY").

Finding numbers (R1 to R60) refer to `AUDIT-REPORT-2026-10-30.md`. Button names move around in dashboards, so if a label differs slightly, look for the closest match.

Keep a short list as you go, headed "What I saw", with 1 line per step. Send it to Claude when you finish.

---

## Part A: the 3 that matter most (about 40 minutes)

### Step 1. Remove the Google sign in wildcard (10 minutes) (R4)

Why: a wildcard return address lets a stranger name a free Vercel project to match it and capture a Google sign in.

1. Open Supabase and choose the Kestrel project.
2. Go to Authentication, then URL Configuration.
3. Look at the Redirect URLs list.
4. If `https://*-kestrel18.vercel.app/**` is there, delete it.
5. Keep `https://eyecarejobs.ca/**`. Check "Site URL" is `https://eyecarejobs.ca`.
6. Save.

Tell Claude: whether the wildcard was there, and what the list looks like now.

Note: preview links will no longer complete Google sign in until Step 3 sets up a separate preview project. Email sign in on a preview is not affected by this step.

### Step 2. Supabase plan and backups (20 minutes) (R1)

Why: the free plan keeps no backups. CV files are not in database backups on any plan.

1. In Supabase, open the organisation's Billing page and note the plan.
2. If it is Free, upgrade to Pro (about US$25 a month). Do this before inviting anyone.
3. Open your project, then Database, then Backups. You should see daily backups listed. Tell Claude if you do not.
4. Open Storage, then the `cvs` bucket. Note roughly how much space it uses, and confirm it says Private.

Tell Claude: the plan before and after, whether daily backups show, the size of `cvs`.

### Step 3. Stop previews using live data (30 minutes) (R9)

Why: today, a preview link runs unapproved code against the live database with the live email key. A test could change real records or email real people.

Part 1, check what is set:
1. Open Vercel, then the Kestrel project, then Settings, then Environment Variables.
2. For `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY`, look at which environments are ticked (Production, Preview, Development).
3. If Preview is ticked with the same values as Production, previews use live data.

Part 2, turn on protection:
1. Settings, then Deployment Protection.
2. Turn on Vercel Authentication for Preview deployments. Only you, signed in to Vercel, can then open previews.

Part 3, a separate preview database (can wait until Claude asks, but it is the real fix):
1. In Supabase, create a second free project, in the Canada (Central) region, named something like "kestrel-preview".
2. Tell Claude. Claude will give you the migration file to run in its SQL Editor, and will tell you which Preview variables to set in Vercel.
3. For Resend, create a separate API key for previews, restricted to sending, and set it on the Preview environment only.

Tell Claude: which environments were ticked, and whether protection is on.

---

## Part B: email, spend and region (about 40 minutes)

### Step 4. Email capacity (R7, R22)

1. Open Resend, then Billing. Note the plan. Free allows 100 emails a day, so the 101st fails, including "confirm your email". Move to Pro (about US$20 a month) before the waitlist invite.
2. In Resend, open Domains. `mail.eyecarejobs.ca` should read Verified.
3. In Supabase, go to Authentication, then Rate Limits. Write down the numbers for "emails sent per hour", "sign ups and sign ins" and "token refreshes". Do not change them yet.

Tell Claude: the Resend plan, the domain status, and the 3 numbers.

### Step 5. Settings that fail quietly (R12, R8, R49)

1. In Vercel, Environment Variables, filter to Production. Check that these exist, by name only: `EMAIL_REPLY_TO`, `ADMIN_ALERT_EMAIL`, `CRON_SECRET`, and both Turnstile keys (site key and secret key).
2. In the Preview environment, the Turnstile keys should be Cloudflare's published test keys.
3. From a personal email address (not an eyecarejobs.ca one), email `hello@eyecarejobs.ca` and `privacy@eyecarejobs.ca`. Check where they arrive.
4. Reply to any Kestrel email you have received, such as a sign up confirmation. Check where the reply lands.

Tell Claude: which names are present or missing, and where the emails and replies landed. If hello@ or privacy@ do not arrive, create them as aliases in Google Workspace Admin (Directory, Users, steve, aliases).

### Step 6. Anthropic spend limit (5 minutes) (R24)

1. Open the Anthropic console, then Settings, then Limits.
2. Set a monthly spend limit on the Kestrel workspace or key, for example US$50.

Tell Claude: the limit you set.

### Step 7. Password change protection (5 minutes) (R20)

1. Supabase, Authentication, then Sign In / Providers, then Email.
2. Check "Secure password change" and "Secure email change" are on.

Tell Claude: on or off for each.

### Step 8. Where your data is processed (10 minutes) (R28)

1. Vercel, Settings, then Functions, then Function Region. Note the region and whether a Canadian one is offered.
2. Supabase, Project Settings, then General. The region should read Canada (Central).

Tell Claude: both regions.

### Step 9. Is the daily job running? (10 minutes) (R8)

1. Vercel, Settings, then Cron Jobs. The daily job should be listed and enabled.
2. Open its logs. Did yesterday's run return 200 with `"ok":true`?
3. Vercel Hobby only keeps logs for about an hour, so you may see nothing. If so, say so. That is itself useful to know.

Tell Claude: listed or not, enabled or not, what the log said.

---

## Part C: lockdown and what is live (about 40 minutes)

### Step 10. Lockdown (45 minutes, all in one sitting) (R14)

Do this for each of: GitHub, Vercel, Supabase, Namecheap, Google Workspace, Google Cloud, Resend, Anthropic, Cloudflare, UptimeRobot.

1. Turn on 2 step sign in using an authenticator app (not text messages).
2. Save the backup codes somewhere safe and offline.
3. Check the recovery email is not an @eyecarejobs.ca address. If your domain email stops working, you would otherwise be locked out of recovering it.

Extra for Namecheap: turn on Auto Renew and Domain Lock, and note the registrant name shown.

Extra for GitHub: Settings, then Code security, and turn on Dependabot alerts. Skip the "require a pull request" rule for now, because it needs a paid plan on a private personal repo. It comes back when the repo moves into the Kestrel organisation.

Tell Claude: which accounts are done, and which are left.

### Step 11. What is actually live (5 minutes) (R10)

1. Sign in to the live site as admin and open Admin, then Overview.
2. Note the number of clinic accounts, clinic profiles and live jobs.
3. Is any of them a real clinic that you did not invite? If so, tell Claude before anything else.

### Step 12. Database permissions check (10 minutes) (R51)

1. Supabase, SQL Editor, new query. Paste and run:

```sql
select table_name, grantee, string_agg(privilege_type, ',')
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('waitlist', 'profiles')
  and grantee in ('anon', 'authenticated')
group by 1, 2;
```

2. Expected: 3 rows. `waitlist` for `anon` and for `authenticated` with 7 privileges each, and `profiles` for `authenticated` with REFERENCES, SELECT, TRIGGER, TRUNCATE. If `waitlist` has no rows, say so.
3. Storage, then the `cvs` bucket: it should say Private, with a 3 MB limit, and show no policies.

Tell Claude: the rows you get, copied as text, plus what the bucket says.

### Step 13. One rule while Phase 0 runs (R11)

Do not email anyone from the waitlist download until Claude has fixed the waitlist (branch 1C). Today it can include people who unsubscribed.

---

## Also, when you have a spare moment (not part of the hour)

- **Check 21:** you said you have used the applicants board, but not yet posted a job or applied. What was on the board? If it held a real person's application, tell Claude, because that would mean someone outside your test accounts has already applied.
- **Check 20:** fill in the backup person and lawyer in `docs/breach-plan.md`. Confirm you have accepted each provider's data processing terms. Verify Search Console by DNS in Namecheap, then submit the sitemap.
- **Check 19:** write down where each Gate A item stands: lawyer booked, disclosure given and acknowledged, company, Business Number, bank, Stripe account, trademark search.
- **Vercel Pro (R36):** Hobby is non commercial and keeps logs for about an hour. Move to Pro before inviting anyone, not on launch day. This does mean moving the repo into the Kestrel organisation, as CLAUDE.md notes.

## When you are done

Send Claude your "What I saw" list. The gate for Phase 0 is that every "Possible" finding is now either confirmed or cleared. Phase 1 branches do not depend on it, so Claude is working on those in the meantime, and nothing goes live without your say so.
