# The demo site

A separate, fully working copy of Kestrel, with its own database and sample data, so Steve can show people around before launch. The live site (eyecarejobs.ca) is never touched.

**What visitors get:** a home page, the blog, job search across 18 sample jobs in 9 provinces, job pages, sign up (instant, no email), a candidate profile and applications, a clinic dashboard with an applicants board, posting a job, the AI ad writer (if you give it a key), and an admin review queue.

**What keeps it safe:**
- It has its own Supabase database in the Canada region. No real data, and none of the live data, is in it.
- Every page carries a banner: "This is a demo ... Please do not enter real personal information ... no email is sent".
- It is hidden from search engines (a header, a meta tag and robots.txt), so it cannot compete with the live site.
- It never sends email, whatever keys are set (`DEMO_MODE=yes`).
- It runs as its own project in Vercel, so its settings, keys and address are separate from the live site.

## Setting it up (about 45 minutes, once)

**Never paste a key into a chat. Copy it from Supabase straight into Vercel.**

### A. Supabase: a second project

1. Supabase, **New project** in your organisation. Name it `kestrel-demo`, region **Canada (Central)**, and save the database password in your password manager. The Free plan allows 2 projects.
2. **SQL Editor**, new query. Paste the whole of `supabase/combined/run-everything.sql` and run it. The check table at the end should be all OK (one "NOT YET" for the CV storage is normal).
3. **Authentication, Sign In / Providers, Email:** turn **off** "Confirm email". This is demo only. It lets visitors sign up without an email arriving. Keep the minimum password length at 10.
4. **Authentication, URL Configuration:** set the Site URL to `https://demo.eyecarejobs.ca`, and add `https://demo.eyecarejobs.ca/**` as a Redirect URL.
5. **SQL Editor**, new query. Paste the whole of `supabase/demo/seed.sql` and run it. This adds 11 sample clinics and 18 jobs and opens sign up on the demo database. (The part for your 2 demo accounts is skipped for now.)

### B. Vercel: a second project

1. Vercel, **Add New, Project**, choose the same GitHub repository (Kestrel). Name it `kestrel-demo`. The production branch is `main`.
2. **Settings, Environment Variables** (Production). Add:

| Name | Value |
| --- | --- |
| `DEMO_MODE` | `yes` |
| `NEXT_PUBLIC_SITE_URL` | `https://demo.eyecarejobs.ca` |
| `NEXT_PUBLIC_SUPABASE_URL` | the demo project's URL (Supabase, Project Settings, API) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the demo project's publishable key |
| `SUPABASE_URL` | the same URL again |
| `SUPABASE_SERVICE_ROLE_KEY` | the demo project's secret key. Mark it **Sensitive** |
| `CLINIC_SIGNUP` | `yes` (so clinics can sign up without an invitation code) |
| `ANTHROPIC_API_KEY` | optional. Add it if you want the AI ad writer to work in the demo. It uses the same spend limit as the live site |

Do **not** add `RESEND_API_KEY`, `CRON_SECRET`, `ADMIN_ALERT_EMAIL`, the Turnstile keys or `ENABLE_GOOGLE_SIGNIN`. The demo does not need them.

3. **Settings, Deployment Protection:** set it to **Disabled** for this project, so people can open the link without a Vercel account. (The live site's protection is a separate setting, and stays on.)
4. **Settings, Functions, Function Region:** Montreal, to match the live site.
5. **Deployments:** deploy (or redeploy) so the settings above are used.
6. **Settings, Domains:** add `demo.eyecarejobs.ca`. Vercel shows a CNAME value. In **Namecheap, Advanced DNS**, add a CNAME record with host `demo` and that value. It can take a few minutes to start working.

### C. Your 3 demo accounts

On the demo site, open `/sign-up` and create 3 accounts with a password you will remember (10 characters or more):

| Use | Address to sign up with | Choose |
| --- | --- | --- |
| Clinic | `kestrel+democlinic@eyecarejobs.ca` | I'm hiring for a clinic |
| Candidate | `kestrel+democandidate@eyecarejobs.ca` | I'm looking for a job |
| Admin | `kestrel+demoadmin@eyecarejobs.ca` | I'm looking for a job, and you promote it below |

Then, in the demo project's **SQL Editor**:
1. Run `supabase/demo/seed.sql` again. It now fills in the clinic (a live job with 4 applicants, a second live job, a job waiting in the review queue and a draft) and the candidate (a profile, an application to follow in the tracker, and a job alert).
2. Run this to make the admin account an admin:
```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'kestrel+demoadmin@eyecarejobs.ca');
```

You can use other addresses. If you do, change the 2 addresses at the top of Part 2 in `seed.sql`, and the list at the top of `reset.sql`.

## A 10 minute walkthrough

1. **As a visitor:** home page (the numbers box and the blog), Find jobs, a filter, a job page.
2. **As the candidate** (`democandidate`): My applications shows the tracker. Open a job and press Apply. (A CV is needed first: save any PDF in the profile.)
3. **As the clinic** (`democlinic`): the dashboard, then Applicants on the Optician job. Change an applicant's status. Post a new job, using the ad writer, and submit it.
4. **As the admin** (`demoadmin`): Review queue. Approve the job you just posted, then find it in Find jobs.

## Between audiences

Run `supabase/demo/reset.sql`, then `supabase/demo/seed.sql`. Reset removes everything visitors created, keeps your 3 accounts, and refuses to run unless the database carries the demo marker, so it cannot be run on the live project by mistake. Do this before each showing, or whenever it has got messy.

## If it is misused

Anyone with the link can create a demo account. If someone abuses it, run `update public.signup_gate set open = false;` in the demo project, or delete the demo project. Nothing on the live site is affected either way.

## Cost and fair use

The demo costs nothing extra on the free plans. Vercel's Hobby plan is for non commercial use, and a demo for showing people around is fine. If the AI ad writer is switched on, each draft costs a few cents and counts against the Anthropic spend limit.
