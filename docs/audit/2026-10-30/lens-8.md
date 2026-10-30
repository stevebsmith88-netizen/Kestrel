# Lens 8: Simplicity and cost
Reach: read the code, every doc, package.json, vercel.json and the v7 plan text; ran knip (installed in $S/lens-8, read only) and queried the scratch database. Could not see Steve's Vercel, Supabase, Resend or Anthropic dashboards, so I do not know which plan each account is on. Every price is from published pricing as I know it to mid 2026 (Anthropic prices from the model table cached 6th October 2026); prices marked Possible should be checked on the vendor's pricing page.

## Findings

### 8.1 The docs contradict each other and the code, starting with CLAUDE.md
- Severity: Medium  | Confidence: Confirmed
- For Steve: CLAUDE.md is the file every new Claude session reads first, and parts of it describe the project as it was months ago. A fresh session could rebuild something that already exists, or tell you something is missing when it is done.
- Evidence (file:line, what it says, what is true):
  - CLAUDE.md:28 "Email: Resend or Postmark (not chosen yet)". CLAUDE.md:41 and lib/email.ts:23 show Resend is chosen and live.
  - CLAUDE.md:30 "Code: GitHub organisation for Kestrel". CLAUDE.md:38 says the repo is in Steve's personal account.
  - CLAUDE.md:39 "migrations 0002 to 0004 are applied ... the candidate and clinic homes are still placeholders". There are 17 migrations, and app/candidate/page.tsx and app/clinic/page.tsx are full dashboards.
  - CLAUDE.md:73 lists Find your fit as built but not that it is switched off (lib/features.ts:2).
  - CLAUDE.md:75 to 81 "Data model (planned)": `employers.logo_url` and `owner_user_id` do not exist (the column is `owner_id`); there is no `candidates` table (it is `candidate_profiles`); `job_alerts` is a saved search (user_id, role_category, province, practice_type, frequency, last_sent_at), not candidate_id, job_id, sent_at; jobs has `apply_method`, not `apply_email`. 12 of the 17 real tables are missing from the list (checked with information_schema on kestrel_lens).
  - CLAUDE.md:88 "runs `npm run build`" vs docs/handoff.md:47 and :66 "typecheck, test and build".
  - CLAUDE.md:94 to 100 "Next tasks": items 1, 2, 3 and 5, and all 3 "before launch" items, are built (docs/handoff.md:13 to 23, docs/launch-checklist.md:27, 31, 48). Only Stripe remains of item 4.
  - README.md:3 "Today it's the coming soon page and waitlist"; README.md:9 "Unzip this folder"; README.md:12 suggests an organisation named kestrel-eyecare (CLAUDE.md:38 says Kestreleyecarejobs); README.md:13 to 15 sets up only migration 0001 and "the same 3 values" (there are 15 settings, docs/handoff.md:59); README.md:18 to 22 omits `npm test`; README.md:24 to 34 lists only the waitlist files.
  - docs/launch-checklist.md:9 "all migrations 0001 to 0016". supabase/combined/run-everything.sql:1 says 0001 to 0017.
  - docs/accounts-setup.md:3 "Google sign in is added in a later step" and :36 to 40 "Before launch: connect Resend or Postmark, add a bot check, add Google sign in". All 3 are done.
  - docs/automation-and-ai.md:25 "Each clinic can use it 15 times a day". lib/ad-builder.ts:48 to 49 counts per person, over a rolling 24 hours. :34 refers to "step 4" of a 3 step list (:7 to 9). :38 says the combined file "is migrations 0005 to 0010".
  - docs/clinics-and-jobs.md:13 "A live or in review job cannot be edited" vs :71 "A live job can be edited". :39 "Still to add: a bot check ... and a report this job link" (both built). :59 "Not built yet: editing a live job" vs :69 to 75 describing it.
  - docs/templates-quiz-numbers.md:18 "left out of the menus" vs :20 "Page: /find-your-fit, in the menu".
  - docs/casl-outreach.md:39 "Still to build: the claim your listing page" (built, CLAUDE.md:46). :28 "If the list cannot be read, the email is not sent", but lib/suppression.ts:22 returns "not suppressed" when the database client is missing.
  - docs/security.md:29 "Links we email (unsubscribe ...) are signed". The job alert unsubscribe link is the bare account id, /unsubscribe/<user id> (app/api/cron/daily/route.ts:136), not signed. (Pass to lens 1 and 4.) :33 "the Cloudflare account when it exists": it exists. :66 still lists bots as a known gap.
  - docs/PLAN.md:12 puts supplier roles in phase 3; they are built (migration 0013). docs/PLAN.md:18 to 20 uses 47 passes and 550 posts; the v7 plan uses 45 and 540 ($150,120). docs/PLAN.md:10 dates the build as December 2026 to February 2027; most of it is built already.
- Detail: 7 of the 16 docs in docs/ also carry their own "Setting up: run migration 00NN" step, which now conflicts with "run the combined file" (accounts-setup.md:15, automation-and-ai.md:29, clinics-and-jobs.md:19, candidates-and-applications.md:20).
- Proposed fix: one docs only branch: rewrite CLAUDE.md "Current state", delete "Data model (planned)" (point to the migrations) and "Next tasks" (point to the launch checklist), change the stack table to Resend, rewrite README.md for today, replace every per migration step with "run supabase/combined/run-everything.sql", and fix the lines above.  | Effort: hours  | Who: Claude

### 8.2 Email limits will bite on launch day: Resend's free tier, shared with sign up emails, and Supabase's hourly email cap
- Severity: High  | Confidence: Likely (the code path is confirmed; which plans Steve is on is not known)
- For Steve: if Resend is still on its free plan, the 101st email of any day fails, and that includes the "confirm your email" message people need to finish signing up. On the day you invite the waitlist, new people could be stuck unable to confirm. Moving Resend to its US$20 a month plan and raising one Supabase setting fixes it.
- Evidence:
  - Every site email goes through 1 Resend key (lib/email.ts:11 to 36), and Supabase sends sign up, reset and change email messages through Resend SMTP too (CLAUDE.md:41, docs/security.md:21), so they share 1 daily allowance.
  - 18 call sites send email (grep for sendEmail and notifyAdmin): new application to clinic (lib/candidate-actions.ts:196), every status change to the candidate (lib/applicant-actions.ts:53), close outs, 14 day reminders and job alert digests (app/api/cron/daily/route.ts:67, 95, 145), waitlist confirm and welcome (app/api/waitlist/route.ts:69, lib/waitlist-actions.ts:40), claims (lib/claim-actions.ts:98, 148, 167), take downs (lib/admin-actions.ts:85) and admin alerts (lib/notify-admin.ts:13).
  - Published limits (Possible, check resend.com/pricing): Resend free is 3,000 emails a month and 100 a day, 1 sending domain; Pro is US$20 a month for 50,000 a month with no daily cap. Supabase: with custom SMTP, Authentication, Rate Limits, "emails sent per hour" defaults to about 30 an hour (Possible).
- Detail, estimated monthly volume (assumptions: about 2.5 emails per application, weekly alerts by default, alerts sent only when there is a match):

| Source | Free launch, 50 to 200 jobs | At the $150,000 target (about 150 new posts a month) |
| --- | --- | --- |
| Applications (new application plus status updates) | 250 to 2,000 applications, about 600 to 5,000 emails | about 2,250 applications, about 5,600 emails |
| Job alert digests | 300 to 1,500 people, up to about 1,300 to 6,500 | 1,500 to 3,000 people, up to about 6,500 to 13,000 |
| Sign up confirmations, resets, email changes | 300 to 1,500 | about 500 |
| Waitlist confirm and welcome (2 each) | depends on the invite | small |
| Admin alerts, reminders, claims, close outs | 100 to 300 | 200 to 400 |
| Total | about 2,500 to 13,000 a month; a peak day of 150 or more on invite day | about 12,000 to 20,000 a month |

  So the 100 a day cap bites the first busy day (the waitlist invitation), and the 3,000 a month cap bites in the first month of the free launch. Resend Pro covers the $150,000 target 2 to 4 times over. Supabase's 30 an hour cap bites if more than 30 people sign up with email and password in one hour (Google sign ups need no email).
- Proposed fix: before inviting anyone, move Resend to Pro (US$20 a month), and in Supabase raise the hourly email rate limit to a few hundred. Add both to docs/launch-checklist.md section 2 and to the cost line in docs/PLAN.md.  | Effort: minutes  | Who: Steve (Claude updates the docs)

### 8.3 The daily job will quietly stop reaching everyone as job alerts grow (60 second cap, 1,000 row cap, one at a time)
- Severity: Medium  | Confidence: Likely (the limits are proven from the code; the point where it bites is an estimate, not measured)
- For Steve: the once a day job sends the job alert emails one person at a time and is allowed 60 seconds. Once a few hundred people have alerts due on the same day, it will run out of time, and because it goes down the list in the same order each day, the same people at the end never get their alerts. Nobody is told, because a job that is cut off cannot send the "the daily job failed" email.
- Evidence:
  - app/api/cron/daily/route.ts:9 `maxDuration = 60`.
  - route.ts:104 reads `job_alerts` with no `.range()` and no `.order()`. Supabase's API returns at most 1,000 rows per request by default (the code already knows this: lib/admin-stats-data.ts:7 pages through tables for exactly this reason). Alerts past the first 1,000 are never read. The same applies to the `ended` jobs (route.ts:51) and `stale` applications (route.ts:73) reads.
  - route.ts:111 to 149: for each person, in sequence, 1 profile read, 1 jobs query per alert, 1 `auth.admin.getUserById`, 1 Resend call and 1 update. That is at least 5 network round trips per person; at roughly 0.3 to 0.6 seconds per person, 60 seconds covers about 100 to 200 digests.
  - The crash handler (route.ts:22 to 30) only runs on a thrown error. A timeout kills the function, so `notifyAdmin` never runs. Vercel cron does not retry.
- Detail: with weekly alerts by default, about 1 in 7 people are due each day, so this bites somewhere around 700 to 1,400 people with alerts, well inside the free launch to target range (8.2). Daily alert users bring it closer. Vercel functions also run in the US by default (no `regions` in vercel.json) while the database is in Canada, which adds a little to every round trip (Possible).
- Proposed fix: read alerts in pages of 1,000, oldest `last_sent_at` first, so anyone missed goes first next time; build the digests in parallel batches of about 10; send through Resend's batch endpoint (up to 100 emails per call, Possible); raise `maxDuration` to 300 once on Vercel Pro; write a short "done" summary to the admin only when something was skipped. Test with 2,000 fake alerts on the scratch database and the fake REST server.  | Effort: hours  | Who: Claude

### 8.4 Supabase free tier: no backups, and every application makes a new copy of the CV, so the 1 GB file store fills fast
- Severity: Medium  | Confidence: Likely
- For Steve: on the free plan there is no backup to restore if data is lost, and the free 1 GB of file space fills up because each application stores its own copy of the CV. When it is full, applying fails with "We couldn't attach your CV". The launch checklist already says to move to Pro (about US$25 a month); this adds a reason to do it before inviting anyone, not on launch day.
- Evidence:
  - lib/candidate-actions.ts:169 to 177 copies the CV to `applications/<id>/cv.<ext>` on every application, and deletes the application if the copy fails. CV limit 3 MB (next.config.ts:5 to 7, docs/cv-scanning.md:7).
  - Nothing removes application CV copies except account deletion (lib/account-actions.ts:55). The daily job has no retention step (app/api/cron/daily/route.ts).
  - docs/launch-checklist.md:28 "Move Supabase to Pro (about $25 a month) for daily backups and no pausing".
- Detail: free plan limits as published (Possible): 500 MB database, 1 GB file storage, 5 GB egress, no downloadable backups, pauses after about a week of inactivity (the uptime monitor hitting /api/health, which reads the database, probably keeps it awake). 1 GB holds about 330 CVs at the 3 MB maximum, or about 3,000 at a typical 300 KB. Counting the profile CV plus 1 copy per application, a free launch with 250 to 2,000 applications a month fills it in roughly 1 to 4 months, or within days if CVs are large. Pro (US$25 a month, Possible) includes 8 GB of database, 100 GB of files, 250 GB egress and 7 days of daily backups; at the target (about 2,250 applications a month) that is many years of CVs, and extra storage costs about US$0.02 per GB a month. The database itself stays far below 500 MB for a long time (text rows only).
- Proposed fix: Steve moves to Pro before the first invitations (already item 13). Claude adds a retention rule: delete application CV copies, say, 12 months after the application closes, and say so in the privacy policy (lens 4 to confirm the period).  | Effort: minutes (Steve), hours (Claude)  | Who: Steve, Claude

### 8.5 Vercel Hobby: not allowed for a business, and its logs vanish after about an hour
- Severity: Medium  | Confidence: Likely
- For Steve: Vercel's free plan is for personal, non commercial projects only. A company's site that collects business sign ups is arguably already commercial, and it certainly is once it sells posts. The free plan also keeps the site's error notes for only about an hour, so an email that failed overnight leaves no trace you could find in the morning.
- Evidence: CLAUDE.md:25 and docs/launch-checklist.md:66 already plan Pro "from launch". Failures are logged only with `console.error` (for example lib/email.ts:29 and 34, "Email failed"), and only the daily job's own failures are emailed to the admin (app/api/cron/daily/route.ts:27, 152).
- Detail: Hobby limits as published (Possible): non commercial use only; 1 member; cannot deploy private organisation repositories; cron at most once a day, at any time within the scheduled hour (vercel.json `0 14 * * *` runs between 14:00 and 14:59 UTC, which is fine); runtime logs kept about 1 hour; function time up to 60 seconds (300 with fluid compute). Pro (US$20 a month per member, Possible): commercial use, about 1 day of logs (longer with a paid add on), cron as often as every minute, functions up to 300 to 800 seconds, spend management.
- Proposed fix: move to Pro before inviting the waitlist rather than on launch day, and move the repo into the Kestrel organisation at the same time. Set a spend limit in Vercel. When moving, check that commits written by Claude (40 of the 41 commits are authored by "Claude <noreply@anthropic.com>", from `git log`) still deploy without needing a second paid member.  | Effort: minutes  | Who: Steve

### 8.6 Ad builder: cheap in normal use, but the only cap is per person, so the bill depends on the Anthropic spend limit
- Severity: Low  | Confidence: Confirmed (code); prices from Anthropic's model table cached 6th October 2026
- For Steve: each AI draft costs about 1 to 4 US cents, so real use at the target is a few dollars to about US$15 a month. But anyone can open a free clinic account, each account can run it 15 times a day, and there is no overall daily limit, so the real safety net is the monthly spend limit on the Anthropic key, which is still on your to do list.
- Evidence:
  - lib/ad-builder.ts:9 `MODEL = "claude-opus-5-5"`, :10 `DAILY_LIMIT = 15`, :68 to 75 (`max_tokens: 8000` at :71), effort low, server side fallback on.
  - :48 to 51 counts `ad_builder_uses` for this user over the last 24 hours; there is no count across all users. :38 needs only the clinic role; :53 carries on with "the employer" when there is no clinic profile, so a brand new clinic account with no profile can use it.
  - docs/launch-checklist.md:39 (15c) "Anthropic: a monthly spend limit on the Kestrel key" is still open (docs/handoff.md:63).
- Detail: Claude Opus 5.5 is US$4 per million input tokens and US$20 per million output tokens. Input is about 420 tokens of instructions plus the facts (up to about 1,650 tokens with a long clinic description and brief), so under US$0.007. Output is the ad (120 to 300 words, about 160 to 400 tokens) plus the model's thinking at low effort (always on for this model), typically 400 to 1,900 tokens in all: about US$0.01 to 0.04 per draft. The worst case per call is the 8,000 token ceiling: about US$0.17. Worst case per account: 15 x 30 x US$0.17, about US$75 a month; 10 throwaway accounts, about US$750 a month. A refused request that falls back to another model is billed on both (rare). Realistic use: 2 to 3 drafts per post, so about US$2 to 20 a month at the free launch and US$5 to 30 at the target, inside the v7 plan's CA$150 to 300 a year. A cheaper model (Claude Sonnet 5.5 at US$2/US$10, or Claude Haiku 5.5 at US$0.10/US$0.50) would save only a few dollars a month at these volumes, so it is not worth changing for cost; that is a quality decision for Steve if he ever wants it.
- Proposed fix: Steve sets the Anthropic monthly spend limit (for example US$50). Claude adds an overall cap (for example 150 drafts a day across everyone), requires a saved clinic profile before the button works, and lowers `max_tokens` to about 4,000 (the ad is under 300 words), which halves the worst case. Fix docs/automation-and-ai.md:25 ("per clinic" is really per person).  | Effort: minutes (Steve), 1 hour (Claude)  | Who: Steve, Claude

### 8.7 15 website settings to manage, 4 of which can go
- Severity: Low  | Confidence: Confirmed
- For Steve: you keep 15 settings in Vercel, most of them twice (Production and Preview), plus about a dozen settings in Supabase, Google, Cloudflare, Resend and Namecheap. 4 of the Vercel ones either repeat another or no longer do anything useful, so they are just more places for a typo.
- Evidence: 15 variables read in code (grep `process.env.` across app, lib, components: NEXT_PUBLIC_SITE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, RESEND_API_KEY, EMAIL_FROM, EMAIL_REPLY_TO, ANTHROPIC_API_KEY, CRON_SECRET, ADMIN_ALERT_EMAIL, NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY, ENABLE_GOOGLE_SIGNIN, ENABLE_FIND_YOUR_FIT), matching docs/handoff.md:59. Candidates to remove:
  - `ENABLE_GOOGLE_SIGNIN` (lib/features.ts:5, app/sign-in/page.tsx:22, app/sign-up/page.tsx:18): Google sign in is live and tested, so the switch now only offers a way to hide it by mistake.
  - `SUPABASE_URL` (lib/supabase-server.ts:7): always the same value as `NEXT_PUBLIC_SUPABASE_URL` (.env.example:4 and :8).
  - `EMAIL_FROM` (lib/email.ts:7): the built in default is the same address.
  - `EMAIL_REPLY_TO` (lib/email.ts:26): could default to hello@eyecarejobs.ca, which also closes open item 22f (docs/launch-checklist.md:55).
  - `ENABLE_FIND_YOUR_FIT` (5 uses: app/find-your-fit/page.tsx:17, app/sitemap.ts:12, components/AppBar.tsx:38, components/SiteHeader.tsx:25 and 46): keep only until Steve decides the quiz design (docs/handoff.md:63); then switch it on and delete the flag, or delete the quiz.
- Detail: the same fallback address `process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca"` is written out in 9 files (app/layout.tsx:10, app/robots.ts:3, app/sitemap.ts:8, app/jobs/[id]/page.tsx:12, app/blog/[slug]/page.tsx:12, lib/account-settings-actions.ts:12, lib/waitlist-confirm.ts:4, lib/suppression.ts:5, lib/email-layout.ts:1); 1 shared constant would do. Separately, signed links (waitlist confirmation, and the clinic unsubscribe link outreach will use) are signed with `SUPABASE_SERVICE_ROLE_KEY` (lib/waitlist-confirm.ts:8, lib/suppression.ts:8, lib/unsubscribe.ts:33), so rotating the most powerful key after a breach (the first step in docs/security.md:49) also breaks every such link already sent. Harmless today; before outreach starts, give links their own secret (lens 4: CASL expects an unsubscribe link to keep working for 60 days).
- Proposed fix: remove the 4 variables above (keep reading the old names as a fallback for 1 release so nothing breaks), add 1 `SITE_URL` helper, update .env.example, docs/security.md and docs/handoff.md. Result: 11 settings (10 once the quiz is decided).  | Effort: 1 hour  | Who: Claude, then Steve deletes the variables in Vercel

### 8.8 Very little dead or duplicate code
- Severity: Low  | Confidence: Confirmed
- For Steve: the code is lean. There is almost nothing to cut, and no unused add on packages.
- Evidence: `knip --production` (output in $S/lens-8/knip-prod.txt): 0 unused dependencies; 2 unused files, `lib/outreach.ts` (deliberately kept for when outreach is allowed, tested by lib/outreach.test.ts) and `scripts/dev/fake-postgrest.js` (a test tool); 13 unused exports, of which `addressUnsubscribeUrl` (lib/suppression.ts:14) is waiting for outreach and the rest are constants or helpers exported only for tests; 18 exported types used only in their own file (harmless).
- Detail: small leftovers worth tidying in passing:
  - lib/auth.ts:42 to 43 "Until the names migration has been run, fall back": migration 0003 has been applied everywhere, so this second query only hides real errors.
  - The same tiny form reading helper is written 5 times (lib/auth-actions.ts:11, lib/claim-actions.ts:15, lib/candidate-actions.ts:18, lib/alert-actions.ts:10, lib/ad-builder.ts:33), `CV_BUCKET` twice (lib/account-actions.ts:10, lib/candidate-actions.ts:15), `DAY` 3 times.
  - Email layout is already shared well (lib/email-layout.ts used by every email), and the Supabase clients are in 4 small, clear files.
- Proposed fix: fold these into the 8.7 tidy branch; do not refactor further.  | Effort: 30 minutes  | Who: Claude

### 8.9 19 documents, where about 9 would do
- Severity: Low  | Confidence: Confirmed
- For Steve: the instructions are spread over 19 files, and the same thing (for example "run this migration") is written in 6 of them, which is how they drifted apart (8.1). Fewer files means less to read and fewer places to forget to update.
- Evidence: `wc -l` on CLAUDE.md, README.md, docs/*.md and docs/email-templates/README.md: 19 files (plus 2 audit files). A fresh session is told to read CLAUDE.md, docs/handoff.md and docs/PLAN.md, then is pointed at 14 more (docs/handoff.md:3 and 25).
- Proposed merge (keeps every fact, removes the repeats):

| Keep as | Made from | Why |
| --- | --- | --- |
| CLAUDE.md | CLAUDE.md plus docs/handoff.md (decisions, process, what is not built) | 1 file a session must read; handoff.md is mostly a second copy of it |
| README.md | rewritten: what is where, everyday commands (with `npm test`), where the other docs are | today it describes the first day of the project |
| docs/how-it-works.md | accounts-setup, clinics-and-jobs, candidates-and-applications, automation-and-ai, templates-quiz-numbers, blog | 1 section per feature, with every "Setting up: run migration 00NN" replaced by 1 line |
| docs/settings.md | the variables list, google-signin setup, Turnstile setup (from security.md), email-addresses, email-templates/README | every setting in every dashboard, in one table |
| docs/launch-checklist.md | as now, plus "open items waiting on Steve" from handoff.md | the 1 to do list |
| docs/security.md | security.md plus cv-scanning.md | 1 safety reference |
| docs/breach-plan.md, docs/test-accounts.md, docs/casl-outreach.md, docs/PLAN.md | unchanged | short, single purpose, and easy to find on a bad day |

- Proposed fix: do it on the same docs branch as 8.1. A fresh session then reads 2 files (CLAUDE.md, launch-checklist.md) and Steve has 1 settings page.  | Effort: hours  | Who: Claude

### 8.10 Manual steps that are fine today but fragile: the hand built combined SQL file, and key rotation
- Severity: Low  | Confidence: Confirmed
- For Steve: you run the database changes by pasting 1 big file, which works and which you have done. The risk is on Claude's side: that file is put together by hand, so a future change could be left out of it, and the docs about it have already drifted.
- Evidence:
  - supabase/combined/run-everything.sql is 1,345 lines, a hand made copy of the 17 migrations plus supabase/verify.sql (its header at line 1); there is no script that builds it (scripts/dev holds only auth-stub.sql, fake-postgrest.js and scratch-db.sh), and no test that it matches the numbered files. docs/handoff.md:68 describes the manual step.
  - Every run re applies all 17 migrations to live data. They are written to be safe to repeat (lens 2 tests this), but each new migration must stay repeatable forever.
  - Making an admin is a one off SQL update (docs/accounts-setup.md:28 to 34, docs/test-accounts.md:16 to 22). Fine for a team of 1; no change needed.
  - Rotating keys means 5 dashboards and a redeploy without the build cache (docs/security.md:15 to 27). That is normal and well written; the only trap is the link signing coupling in 8.7.
- Proposed fix: add a 10 line `scripts/build-combined.sh` that writes the combined file from the migrations, and a test in `npm test` that fails if the combined file is out of date. Later, once the schema settles, a small table that records which migrations have run, so only new ones run.  | Effort: 1 hour  | Who: Claude

### 8.11 About 1,700 lines are features beyond the launch list; freeze them rather than remove them
- Severity: Idea  | Confidence: Confirmed
- For Steve: the v7 plan says to launch with the smallest product that lets a clinic post and pay and a candidate apply, and add clever features once there is traffic. Several extras were built ahead of that while checkout, the one thing needed to earn money, is not built. They work and cost nothing to run, so removing them would be wasted effort, but each one is more to test and more to keep working.
- Evidence (lines of code counted with `wc -l`, out of about 9,400 lines of TypeScript plus the SQL):

| Feature | Plan status | Size | Steve tested? | Suggestion |
| --- | --- | --- | --- | --- |
| Claim your listing | v7 phase 2 (seeding loop) | about 584 lines (lib/claim-actions.ts, lib/claims.ts, 3 pages, migration 0012) | No | Dormant until the seeding tool and the disclosure conversation; it only appears on seeded listings, of which there are none. Leave it, test it when seeding starts. |
| Job templates, application drafts, saved cover letters | Not in v7 or the CLAUDE.md launch list | about 355 lines (migration 0015 alone is 175) | No | Keep; test once with docs/test-accounts.md:48 to 53, or hide the buttons for launch if testing time is short. |
| Find your fit quiz | Launch list, but switched off | about 344 lines | No (hidden) | Decide: switch on and drop the flag, or delete it (8.7). |
| Admin numbers and investor snapshot | Not in the launch list | about 331 lines | Yes | Keep: cheap and useful for the business. |
| Field based and supplier roles | v7 phase 2 | migration 0013 (54 lines) plus fields in the job form, filters and the ad builder | No | Keep, but it adds an open pricing decision (docs/launch-checklist.md:58) in front of Stripe. |
| Outreach email | Off until disclosure | 78 lines, not connected | n/a | Keep (CASL ready). |

- Proposed fix: no removals. Agree a scope freeze: nothing new until Stripe checkout is built and the paths Steve has not yet tested (posting, applying, review, claim, alerts, the daily job) have been walked through once. Record in CLAUDE.md which features are built but untested.  | Effort: minutes  | Who: Steve decides, Claude records it

### 8.12 Running costs are well under the ceiling, but about 2 times the CA$65 a month in docs/PLAN.md, and Stripe fees are understated
- Severity: Low  | Confidence: Possible (prices change; check each vendor's pricing page)
- For Steve: realistic running costs are about CA$110 to CA$175 a month at the free launch and CA$115 to CA$235 a month at the $150,000 target, so CA$1,300 to CA$2,800 a year: 13% to 28% of your $10,000 ceiling. The CA$65 figure leaves out paid email (needed, see 8.2), Google Workspace, the domain and a CV virus scanner. Separately, Stripe will take about $7,200 a year at the target, not the $4,847 in the plan, because its fee is charged on the HST too and subscriptions and tax calculation carry their own small fees.
- Evidence: docs/PLAN.md:29 to 31 "Vercel Pro US$20, Supabase Pro US$25, Stripe 2.9% plus $0.30, email and Claude API a few dollars. About CA$65 a month." (US$45 is about CA$62 alone.) docs/PLAN.md:14 to 20 nets only 2.9% plus $0.30. v7 plan, Startup budget: "running costs come to roughly $1,000 to $2,000 a year". Full table in "Cost table" below.
- Detail, Stripe at the target (Possible: Canadian domestic cards 2.9% plus CA$0.30; Stripe Billing about 0.7% of subscription volume; Stripe Tax about 0.5% per transaction where registered; fees apply to the amount charged including tax): $155,686 before tax is about $175,900 charged with an average 13% HST. Card fees about $5,100 plus $0.30 x about 1,114 charges ($334); Billing on the monthly pass (about $126,800 with tax) about $890; Stripe Tax about $880. Total about $7,200 a year, 4.6% of pre tax revenue, so net revenue is about $148,500 rather than $150,839. Steering clinics to the annual pass ($1,990) cuts the per charge part. No Stripe fees during the free launch.
- Proposed fix: update docs/PLAN.md "Running costs" and the revenue table with these lines, and re check prices when Stripe is built.  | Effort: 30 minutes  | Who: Claude, Accountant to confirm the HST treatment

### 8.13 Vendor lock in: Supabase is the deep dependency; Vercel, Resend, Anthropic and Cloudflare are easy to swap
- Severity: Idea  | Confidence: Confirmed
- For Steve: the one supplier that would be hard to leave is Supabase, because it holds the database, the sign in system and the CV files. That is a reasonable choice, and the data itself is a standard database you can take with you. Everything else could be swapped in an afternoon to a few days.
- Evidence and effort to leave:

| Vendor | What depends on it | How hard to leave |
| --- | --- | --- |
| Supabase | 165 `.from()` query calls in 41 files; 12 kinds of `auth.*` call (sign up, sign in, Google, reset, change email, delete, getUserById); 10 storage calls (CV upload, copy, signed links); row level security policies built on `auth.uid()`; the email templates, SMTP and Google settings in its dashboard; its secret key also signs links (8.7) | Hard: days to weeks. The data is plain Postgres (a standard dump moves it), but sign in, file storage and every query call would need rewriting. |
| Vercel | 1 cron line (vercel.json); the 4.5 MB request limit the CV upload is sized for (next.config.ts:5 to 7); no Vercel only packages (grep for `@vercel` finds none) | Easy: Next.js runs on other hosts, and the cron is 1 web address called with a secret (any scheduler can call it). Hours to a day. |
| Resend | 1 `fetch` in lib/email.ts:23, the Supabase SMTP setting, DNS records for mail.eyecarejobs.ca | Very easy: change 1 function, the SMTP setting and DNS. Hours. |
| Anthropic | 1 file, lib/ad-builder.ts | Very easy, and the site works without it (button hidden). |
| Cloudflare Turnstile | lib/turnstile.ts and components/Turnstile.tsx | Very easy; switches itself off without keys. |

- Proposed fix: none needed now. The real concentration risk is losing the Supabase project or account, which backups (8.4) and a monthly export kept by Steve (lens 9) cover.  | Effort: n/a  | Who: n/a

## Streamlining table

| What | Why remove or simplify | Saving | Risk of changing |
| --- | --- | --- | --- |
| CLAUDE.md "Data model (planned)" and "Next tasks" sections (CLAUDE.md:75 to 100) | Both are out of date and contradict the code (8.1) | A fresh session stops working from a wrong picture | None (docs only) |
| docs/handoff.md, folded into CLAUDE.md | Mostly repeats CLAUDE.md; 2 "read first" files drift apart | 1 fewer file to read and keep current | None |
| 6 feature docs merged into docs/how-it-works.md; setup bits into docs/settings.md (8.9) | 19 files, the same steps written up to 6 times | 19 files down to about 9 | None; check no fact is lost |
| Every "run migration 00NN" step in the feature docs | Replaced by the combined file; they now conflict | Fewer contradictions | None |
| `ENABLE_GOOGLE_SIGNIN` flag (lib/features.ts:5) | Google sign in is live and tested | 1 setting, 3 code lines | Tiny: removing the variable before the code change would hide the button |
| `SUPABASE_URL` (lib/supabase-server.ts:7) | Same value as `NEXT_PUBLIC_SUPABASE_URL` | 1 setting in 2 environments | Tiny if the old name is still read as a fallback for 1 release |
| `EMAIL_FROM` | The code default is the same address (lib/email.ts:7) | 1 setting | None |
| `EMAIL_REPLY_TO` as a required step | Default it to hello@eyecarejobs.ca | 1 setting, closes checklist item 22f | None |
| `ENABLE_FIND_YOUR_FIT` flag, or the quiz itself | A switch kept for a decision that is still open | 1 setting, or about 344 lines if the quiz is dropped | Low; it is Steve's product decision |
| lib/auth.ts:42 to 43 fallback query | Written for before migration 0003, which is applied | 1 extra database query on errors, and clearer errors | Tiny |
| 9 copies of the site address fallback, 5 copies of the form text helper | Repeats | About 20 lines, 1 place to change | Tiny; typecheck catches mistakes |
| Hand built supabase/combined/run-everything.sql | Can drift from the migrations | Replace by a build script plus a test (8.10) | Low |
| Per person only ad builder cap and `max_tokens: 8000` | No overall cap; worst case cost set by the spend limit alone | Worst case per call about US$0.17 to US$0.085 | Low; keep an eye on cut off drafts |
| Application CV copies kept forever | Storage and privacy grow without limit | Keeps storage small on any plan | Medium: old applications lose their CV; needs a privacy policy line |
| Daily job run one person at a time, first 1,000 rows only (8.3) | Will miss people as alerts grow | Same emails in a fraction of the time | Medium: test carefully on the scratch database; risk of double sends if done wrong |
| Not recommended: removing templates, drafts, saved letters, claim, field roles, admin numbers, outreach email (8.11) | They are built and cost nothing to run | Removing them would cost hours and save nothing on the bill | Higher than keeping them |

## Cost table

Monthly cost in Canadian dollars at US$1 = CA$1.38 (Possible). Prices as published to mid 2026 (Possible); Anthropic prices from the model table cached 6th October 2026.

| Item | (a) Private beta now | (b) Free launch, 50 to 200 jobs | (c) $150,000 revenue target |
| --- | --- | --- | --- |
| Vercel | Hobby, $0 (non commercial only) | Pro US$20, $28 | Pro, $28 to $45 (1 member) |
| Supabase | Free, $0 (no backups, 1 GB files) | Pro US$25, $35 | Pro, $35 to $55 (CV storage growth, maybe a bigger compute size) |
| Resend | Free, $0 (100 a day, 3,000 a month) | Pro US$20, $28 (needed, 8.2) | Pro, $28 (50,000 a month covers 12,000 to 20,000) |
| Anthropic ad builder | $0 to $3 | $3 to $28 (100 to 600 drafts) | $7 to $41 (about 400 to 1,000 drafts) |
| Cloudflare Turnstile | $0 | $0 | $0 |
| Google Workspace, Business Starter | $10 to $14 (1 user) | $10 to $14 | $10 to $28 (1 to 2 users) |
| Namecheap domains | about $2 | about $2 | $2 to $6 (with the optional kestreljobs.ca and kestreleyecare.ca) |
| UptimeRobot | $0 | $0 to $10 (if the free plan does not allow business use, Possible) | $0 to $10 |
| CV virus scanner (docs/cv-scanning.md option A) | $0 | $5 to $20 | $5 to $20 |
| GitHub | $0 | $0 | $0 |
| **Total a month** | **about $12 to $19** | **about $111 to $165** | **about $115 to $233** |
| **Total a year** | **about $150 to $230** | **about $1,330 to $1,980** | **about $1,380 to $2,800** |
| Share of the $10,000 a year ceiling | about 2% | 13% to 20% | 14% to 28% |
| Against docs/PLAN.md's CA$65 a month (CA$780 a year) | well under | 1.7 to 2.5 times | 1.8 to 3.6 times |

Stripe, separately (Possible): $0 during the free launch. At the target, about $7,200 a year (card fees 2.9% plus CA$0.30 on the amount including HST, about 0.7% Billing on the monthly pass, about 0.5% Stripe Tax), against $4,847 in docs/PLAN.md:14 to 20. Not counted above: lawyer, accountant, insurance, trademark and mailing address, which the v7 startup budget lists separately.

## Good things worth keeping
- Very few packages: 11 runtime dependencies, all pinned, knip finds 0 unused (package.json, $S/lens-8/knip-prod.txt). No email, form, date or UI library where built in features do.
- Every outside service is optional at run time: no Resend key skips email (lib/email.ts:17 to 21), no Anthropic key hides the ad builder (app/clinic/jobs/new/page.tsx:63), no Turnstile keys switch the check off, no Supabase keys give a friendly message (lib/supabase/config.ts:4 to 8). That makes previews and testing cheap.
- One shared email layout for every message, with the CASL footer built in (lib/email-layout.ts:6 to 37).
- The proxy runs only on account pages (proxy.ts:9 to 24), so public pages do not pay for session checks.
- Admin numbers already page past Supabase's 1,000 row limit (lib/admin-stats-data.ts:7 to 19); the same helper can fix the daily job (8.3).
- docs/security.md and docs/breach-plan.md are clear, short and written for a non developer.

## Steve's checks
1. Resend, Settings or Billing: which plan is the team on? If it says Free (100 emails a day), move to Pro before inviting anyone (8.2). Then Resend, Emails: look at a busy day's count to see how close you have come.
2. Supabase, Authentication, Rate Limits: find "emails sent per hour" (or similar). If it is about 30, raise it to a few hundred before the waitlist invitation (8.2).
3. Supabase, Settings, API (Data API): "Max rows". If it is 1,000, the daily job reads at most 1,000 alerts until Claude fixes 8.3. Do not raise it as the fix.
4. Supabase, Storage, `cvs` bucket: note the total size now, and Supabase, Billing: which plan. If Free, move to Pro before inviting anyone (8.4).
5. Anthropic console, Limits or Billing: is there a monthly spend limit on the Kestrel workspace or key? If not, set one, for example US$50 (8.6).
6. Vercel, Settings, Billing: plan is Hobby. When you move to Pro, also open Settings, Functions and note the function region (8.3), and after the move push any small change from Claude and check the preview still builds (commits are authored by "Claude", 8.5).
7. UptimeRobot: check the free plan's terms allow a business site; if not, the Solo plan is a few dollars a month (Possible).

## Not audited, and why
- Real usage numbers (emails sent, storage used, Anthropic spend): no access to the dashboards. The volumes above are estimates from the code and the plan's targets.
- Live prices: no internet access to vendor pricing pages; every price is marked Possible.
- How long the daily job really takes per person: needs the live Supabase and Resend; the 100 to 200 a run estimate is from counting round trips, not measured.
- Whether the combined SQL file exactly matches the numbered migrations: lens 2 owns that check.
- The unsigned job alert unsubscribe link (/unsubscribe/<user id>, app/api/cron/daily/route.ts:136), noted in 8.1 only as a docs mismatch: lens 1 and 4 to judge.
