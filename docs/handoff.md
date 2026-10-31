# Handoff: everything a fresh session needs to know

Written on 30th October 2026, at the end of the long build conversation, so a new chat can pick up without it. Read `CLAUDE.md` first (the standing rules), then this file, then `docs/PLAN.md`. The full business plan is the v7 document: https://claude.ai/artifact/2j9U84RzZ5vtmnNVtXPCTC (read it with the Artifact tool, action "read"). If it cannot be opened, work from `docs/PLAN.md` and say so.

## Who you are working for

Steve Smith, founder. Not a developer. He works full time at Eye Recommend, a different organisation, and Kestrel must stay completely separate from it: no Eye Recommend data, accounts, devices, clinics, email or branding, and clinic outreach stays off until Steve says his disclosure conversation has happened.
- Explain in plain English. For anything about the business, be professional and coach forward (he is a business coach for an optical buying group).
- Steve controls anything that costs money or goes live. Nothing goes to `main` without his approval. Fixes happen on branches, with a preview, then he says "merge".
- He tests on his phone and on a laptop. He pastes screenshots, and they are usually the fastest way to find a problem.
- Writing style for anything users read is in `CLAUDE.md` (no em dashes, numerals, British spelling with Canadian conventions, "The Kestrel team" sign off).

## What exists (it is all live on main unless noted)

A Next.js 16 site on Vercel (Hobby plan, team slug `kestrel18`), a Supabase project in a Canadian region, Resend for automatic email, Cloudflare Turnstile as the bot check, Google sign in, Namecheap for the domain, Google Workspace for people's email, UptimeRobot watching `/api/health`.

- **Public:** coming soon home page with waitlist (with email confirmation), job search and job pages (JobPosting structured data), claim your listing, report this job, blog (3 posts), contact, privacy, terms and posting policy (the last two are marked DRAFT for lawyer review), `/find-your-fit` quiz (built but switched off).
- **Accounts:** email and password, plus Continue with Google, with roles candidate, clinic and admin. Account page: change name and email, email choices, download my information, delete my account.
- **Clinics:** profile, post a job (with an AI ad builder), drafts, templates, editing a live job (goes back to review), post again, applicants board, status updates, notes, field based and supplier roles.
- **Candidates:** profile with a CV, apply with a cover letter, drafts and saved letters, application tracker, job alerts (daily, weekly or monthly).
- **Admin:** review queue, reports, claims, waitlist, do not email list, numbers overview with CSV export.
- **Automation:** a daily job (`/api/cron/daily`) that expires jobs, closes out stale applications, sends 14 day reminders and the job alert emails.
- **Database:** 17 numbered migrations in `supabase/migrations`, run as one file with `supabase/combined/run-everything.sql`, then `supabase/verify.sql` lists what is present. Row level security is on every table.

Docs that describe each area: `docs/accounts-setup.md`, `clinics-and-jobs.md`, `candidates-and-applications.md`, `automation-and-ai.md`, `templates-quiz-numbers.md`, `blog.md`, `casl-outreach.md`, `google-signin.md`, `security.md`, `breach-plan.md`, `cv-scanning.md`, `email-addresses.md`, `launch-checklist.md`, `test-accounts.md`.

## What is NOT built

- **Stripe** (single posts, the monthly pass, coupons, HST via Stripe Tax, the free launch coupon FREELAUNCH). Decided: launch with Stripe in test mode and a free launch period, then switch prices on. A pricing decision for field and supplier roles is still open.
- **The seeding tool** (admin tool to add found listings) and **careers page reading** with the Claude API (the stack table mentions it). Seeding stays unused until Steve confirms his disclosure conversation.
- **Clinic outreach sending.** The email template exists (`lib/outreach.ts`) and is deliberately not connected to anything.
- A **real antivirus scan** for CVs (see `docs/cv-scanning.md`), **French**, the **locum board**, **featured listings**, **AI culture match**, and a **stricter Content Security Policy**.

## Decisions already made that are not obvious from the code

- Candidates apply through Kestrel and clinic email addresses are never public. Clinics see an application as it was on the day, not the live profile.
- Application closing statuses are soft: Not selected this time, Role filled, Kept for future roles (needs the candidate's consent), No update from the clinic, Withdrawn. Unopened applications trigger a 14 day reminder to the clinic. A job that ended 7 days ago closes out waiting applications.
- Every post needs a pay range (no more than $50,000 wide unless the top is over $200,000), plus two honest yes or no answers (existing vacancy, AI screening). No "Canadian experience". The review queue flags other wording that can break human rights rules, and agency wording.
- Recruiters, agencies and job brokers are not allowed to post. Clinics confirm they hire directly. A clinic can have up to 10 open jobs. This is a core part of Kestrel's pitch.
- Seeded listings expire in 21 days, paid ones in 30. Editing a live job sends it back to review but keeps its original 30 days.
- The do not email list blocks every marketing or outreach email by address or whole domain. Emails about an account or an application are not marketing and still go.
- Clinic outreach stays off until the disclosure conversation. Never add Eye Recommend clinics.
- Pricing ladder and the revenue model are in `CLAUDE.md` and `docs/PLAN.md`.

## How to build, test and what was and was not verified

Commands: `npm run typecheck`, `npm test` (Node's test runner, about 56 tests in `lib/*.test.ts`), `npm run build`. The build needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` set, to any value.

Test tools that live in the repo (development only, never deployed):
- `bash scripts/dev/scratch-db.sh` builds a throwaway Postgres 16, applies every migration twice and prints the check table. After that, row level security can be tested with `psql`, as `set role authenticated; select set_config('request.jwt.claim.sub', '<uuid>', false);`.
- `node scripts/dev/fake-postgrest.js` serves 3 sample jobs on port 54399, so public pages can be rendered and screenshotted (build with `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399`). Playwright is installed globally in the cloud session (`NODE_PATH=$(npm root -g)`).
- Careful: do not run `pkill -f` with a pattern that appears in your own command, because it kills your own shell.

**Tested against a real database:** all migrations, row level security rules for every table, the triggers and limits.
**Tested only with stand ins or not at all, so verify with Steve:** anything that talks to the live Supabase API (Storage for CVs, PostgREST embeds on some pages), Resend email delivery, the Anthropic ad builder, signed in pages (sessions need real Supabase), and Stripe (not built). This cloud session cannot reach the live site, Vercel, Cloudflare or Google. Steve has confirmed by hand: sign up and sign in, Google sign in, the Supabase email templates including change email, the Turnstile check, alert and admin emails, and the uptime monitor. Ask him what else he has actually clicked through (`docs/test-accounts.md` lists the full walk through).

## Accounts and settings (names only, never values)

Vercel environment variables (Production and Preview): `NEXT_PUBLIC_SITE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `ANTHROPIC_API_KEY`, `CRON_SECRET`, `ADMIN_ALERT_EMAIL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `ENABLE_GOOGLE_SIGNIN`, optional `ENABLE_FIND_YOUR_FIT`, `CLINIC_INVITE_CODE` and `CLINIC_SIGNUP` (see docs/accounts-setup.md), and the optional `DAILY_EMAIL_BUDGET` and `ADMIN_BACKUP_EMAIL` (see "The daily job and the health check" below). `EMAIL_REPLY_TO` now defaults to hello@eyecarejobs.ca in code. Preview uses Cloudflare's test keys for Turnstile. Never ask Steve to paste a secret into chat.

## Open items waiting on Steve

Account lockdown (2 step sign in everywhere, Vercel Sensitive secrets, domain lock, Anthropic spend limit, GitHub Dependabot), `EMAIL_REPLY_TO` and the support inbox aliases, lawyer review of the Terms, Posting policy and Privacy policy (then remove the DRAFT banner), the breach plan blanks, Stripe account and the pricing decision, Supabase Pro and a backup restore test, Vercel Pro and moving the repo into the Kestrel GitHub organisation, the Eye Recommend disclosure conversation, and the quiz design.

## Process

1. Work on a branch. 2. `npm run typecheck && npm test && npm run build`. 3. Push the branch, Steve checks the preview. 4. Steve says merge, then fast forward `main`. Docs only changes may be merged without a preview but still need his go ahead in the conversation.
New database changes are a new numbered migration, added to the combined file (`supabase/combined/run-everything.sql`, built from every migration plus `supabase/verify.sql`), and tested twice on a scratch database.

## The daily job and the health check (audit R7, R8, R35)

- **Send budget:** the daily job (`/api/cron/daily`) sends at most `DAILY_EMAIL_BUDGET` emails a run (default 50). Every email Kestrel sends, including "confirm your email", shares one Resend account, and the free plan refuses everything after 100 in a day. Whatever does not fit waits for tomorrow, and Steve is emailed when that happens. On Resend Pro, raise it.
- **One run at a time:** the job takes a lock (`job_runs`, migration 0020) and gives up if another copy is running. Alerts are claimed before they are emailed, so nobody gets the same email twice. It reads alerts in pages, longest waiting first, and stops starting new work after 50 seconds.
- **Failures are counted:** if any email fails, the run is marked as having problems and Steve is emailed. "ok" in the result now means nothing went wrong.
- **Heartbeat:** each good run records when it finished. `/api/health` returns 503 if the database cannot be reached, if the daily job has not finished well for over 36 hours, or (on the live site only) if `CRON_SECRET`, `ADMIN_ALERT_EMAIL`, `RESEND_API_KEY` or either Turnstile key is missing. Point UptimeRobot at `/api/health`. The public answer is just `{"ok": true}` or false. Sending the header `Authorization: Bearer <CRON_SECRET>` also lists the missing setting names.
- **Second alert contact:** set `ADMIN_BACKUP_EMAIL` and every admin alert goes to both addresses.
- **Waiting too long:** each day, if any job has been in review, any listing claim has been pending, or any report has been open for over a day, Steve gets one email listing them.
- **Clinic emails:** a clinic is emailed when a job is approved (or an edit is), when it needs a change (with the note), and 3 days before it closes (once, respecting the clinic's reminder choice).

## The waitlist download

`/admin/waitlist.csv` is now the "ready to email" list: confirmed, not unsubscribed, not on the do not email list, with each person's unsubscribe link. `/admin/waitlist.csv?all=1` is everyone with a status column. The public waitlist form never changes an address that is already on the list.
