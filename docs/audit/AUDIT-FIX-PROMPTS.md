# Audit part 1 fixes: prompts to paste into new chats

Written 12th November 2026, from the fix plan for `docs/audit/AUDIT-2026-11-PART1.md` (findings P1-01 to P1-60). Nothing here is started. Each phase is its own chat, on its own branch.

## How to use this file

1. Run the phases in order: A, B, C, D, E, F, G. Merge each one before starting the next, so every chat sees the earlier fixes and the shared log (`docs/audit/AUDIT-FIXES-LOG.md`).
2. At the start of the chat, type `/model` and pick the model in the table below.
3. Paste **block 0** first, then that phase's block, in the same message.
4. Replace every `[YOUR ANSWER ...]` before sending.

## Which model for which phase

All 3 can do every phase. The difference is how they cope with risk and judgement. **Fable** is the strongest and slowest and uses the most of the allowance, so it is kept for the phases where a subtle mistake could open a security hole or lose data. **Opus** is very strong and the most careful writer. **Sonnet** is fast and economical, and does clear, well specified work very well.

| Phase | Model | Why | Rough effort | SQL |
| --- | --- | --- | --- | --- |
| A, resume reader | Fable | Defending the server against hostile files. A fix that looks right can still be slow on a cleverer file | Half a day | No |
| B, wrong on screen | Sonnet | 13 small, clearly described fixes | 1 day | No |
| C, docs and lawyer pack | Opus | Privacy and lawyer wording must be exact and match the code | Half a day | No |
| D, database rules | Fable | A mistake in access rules could expose data or lock people out, and every page must keep working before the SQL is run | 1.5 to 2 days | Yes |
| E, before the gate opens | Opus | Sign up security, email law and a new step for clinics | 2 days | Possibly |
| F, search and speed | Opus | Caching must never show one person's details to another | 2.5 days | No |
| G, tidy and tests | Sonnet | Small fixes and tests to a clear pattern | Half a day to 2 days | No |

## Decisions Steve gives in the prompts

- **P1-48 (Phase A):** the daily cap on applications for one candidate. Suggested: 30.
- **P1-56 (Phase D):** is the first name change free, with only later changes starting the 30 day hold, or does every change start the hold?
- **P1-57 (Phase D):** a field based job based outside Quebec whose area covered includes Quebec: allow or refuse?
- **P1-55 (Phase G):** may a practice manager, assistant or supplier rep tick Optometrist or Optician under "other roles" and apply?

Decisions that come up during a phase: the tagline size on phones (B), how long inbox messages are kept (B), a Canadian Vercel region (C), a paid Resend plan (E), the `/clinics` title (F).

## Not in any phase

- **P1-20:** deleting an account removes the other side's records. Waits for the lawyer's answer on retention (R5 in October).
- **P1-25:** search stops at 1,000 jobs. Not needed until about 500 live jobs.
- **P1-58:** an "Applied" label on job cards. An idea only.
- **P1-59:** resume reader accuracy. Needs Steve's sample resumes.

---

## Block 0: shared rules (paste at the top of every phase chat)

```
You are fixing findings from the Kestrel Eye Care Jobs audit part 1. I am Steve, the founder, and I am not a developer: explain everything in plain English.

READ FIRST: CLAUDE.md (every decision in it is a rule), docs/audit/AUDIT-2026-11-PART1.md (the findings, IDs P1-01 to P1-60), docs/audit/AUDIT-2026-11-PART1-WORKING.md (the evidence, test methods and line numbers behind each finding, under the area letter shown in the report's "From" column), and docs/audit/AUDIT-FIXES-LOG.md if it exists. Run `git fetch origin main` first and branch from the latest main.

RULES FOR THIS PHASE:
- Work only on the findings listed below. Do not add features or change anything else. If you notice something new, write it in the log as "noticed, not fixed" and tell me.
- Make the branch named below. Fix one finding per commit. For each fix, first show the problem happening (a failing test or a clear reproduction), then show the same check passing. Never skip, delete or weaken a test to get green. If a finding cannot honestly have an automated test (for example wording), say how you checked it instead.
- Before every push, run npm run typecheck, npm test and npm run build. All 3 must pass.
- Keep every feature working on a database that has not had a new migration yet. Read any new column or table separately and tolerate an error, as the code already does for migrations 0037 to 0039.
- If a fix needs SQL: add a numbered migration in supabase/migrations, add it to supabase/combined/run-everything.sql (and to the final check at its end), run the combined file twice on the scratch database (bash scripts/dev/scratch-db.sh), and then hand me the WHOLE combined file, with step by step instructions to run it on the demo database first, check it, and then the live one. Never run anything against the live or demo databases yourself.
- Keep a log in docs/audit/AUDIT-FIXES-LOG.md (create it if it does not exist, with a table: finding ID, status, commit, how it was checked). Status is one of: fixed, will not fix (with the reason), needs a decision (with the question for me).
- Keep the docs true. If a fix changes behaviour, update the help centre (content/help.ts), the privacy, security and terms pages, CLAUDE.md, and the lawyer list in docs/gemini-intake-plan-2026-11-08.md where relevant.
- Follow the CLAUDE.md writing rules for anything users read: no em dashes or hyphens as punctuation, numerals, British spelling with Canadian conventions, ordinal dates, "resume" never "CV", no banned words, warm and plain.
- Do not use Eye Recommend data, do not scrape anything, do not spend money, and do not change settings in Vercel, Supabase, Resend or anywhere else. If a fix needs a setting changed, tell me exactly what to click.
- Push to the branch and tell me exactly what to check on the Vercel preview, step by step, on my phone where it matters. Do not open a pull request unless I ask. Merge only when I say "merge".
- At the end of the phase, re-check each fixed finding against the report, tell me what is left in this phase and what comes next, and stop for my go ahead.
```

---

## Phase A: resume reader (Fable)

```
PHASE A: the resume reader. Branch: claude/audit-fix-a

Findings to fix:

1. P1-01 (High). lib/resume-text.ts, textFromDocx, lines about 25 to 29. The Word file text is cleaned with regular expression replaces that take time proportional to the square of the input when the text has many "<" and no ">". The audit measured: 100 KB of "<" took 10 seconds, 400 KB of unclosed "<w:br" tags took 45 seconds, 400 KB of "<" was still running at 90 seconds. Up to 8 MB of unzipped text is accepted (MAX_XML), the file zips to a few KB and passes the upload checks, and the 8 second timer cannot interrupt this step (it is synchronous) and is not applied to Word files at all. Fix: replace the replaces with a single pass that walks the text once (linear time), and cap the unzipped document.xml at about 1 MB. Keep the same output for normal resumes: line breaks for </w:p>, <w:br/> and <w:cr/>, a space for <w:tab/>, tags dropped, the 5 XML entities decoded. Tests: build these hostile files in the test (zip them with fflate, as the existing tests do) and assert each finishes in well under 1 second: 400 KB of "<", 400 KB of "<w:br " repeated, and a normal resume that must still read exactly as before. Also confirm the existing resume reader tests still pass unchanged.

2. P1-04 (Medium). lib/resume-text.ts, textFromPdf and withTimeout. extractText processes every page and then keeps 12, so a 3 MB PDF with 3,000 pages took 2.4 seconds and 254 MB of memory in the audit. The timer only stops waiting; the work carries on and the timer is never cleared. Fix: read the page count from the document first, read pages 1 to 12 one at a time with unpdf's per page API (check unpdf 1.9.1's documentation and types in node_modules, do not guess), stop early when the time limit is reached, and clear the timer. Test: generate a PDF with 3,000 short pages in the test (a minimal hand written PDF is fine, see how the audit did it in the working file, area F) and assert it finishes quickly and returns text from the first 12 pages only. Also look for whether this server action can be given an explicit time limit, and tell me what you found rather than changing Vercel settings.

3. P1-48 (Low). No cap on applications per day. In applyToJob (lib/candidate-actions.ts), refuse more than [YOUR ANSWER, suggested 30] applications in the last 24 hours for one candidate, counted from the applications table (no new table, no SQL), with a kind message: say they have reached today's limit and can apply again tomorrow. Test the counting rule as a pure function. Do NOT add a cap on resume reads (that would need a new table); write "will not fix for now" in the log with the reason that after P1-01 and P1-04 a read is cheap.

4. P1-53 (Low). Once 1 to 3 are done, check that "with limits on size, pages and time" on /security (app/security/page.tsx) and the limits stated in docs/cv-scanning.md are now true, and correct any figure that changed (for example the 8 MB). Also fix the statement in docs/security.md that says resumes are never opened or processed by our servers, because it relates to this code (the rest of docs/security.md is Phase C).

On the preview, I will test: upload a normal PDF resume and press Read my resume, then a normal Word (.docx) resume, and check the suggestions still appear. Tell me the exact clicks.
```

---

## Phase B: things that are wrong on screen (Sonnet)

```
PHASE B: things that are wrong on screen today. Branch: claude/audit-fix-b. No SQL in this phase.

Findings to fix, in this order:

1. P1-05. app/clinic/applications/[id]/page.tsx loads the application with getApplication from lib/candidate.ts, which turns "shortlisted" into "viewed" for candidates (forCandidate and candidateHistory). So the clinic sees "Viewed" on a shortlisted person's page. Give the clinic page its own loader that does not mask the status or history. The candidate's pages must still show Viewed. Add a test that the clinic's version keeps Shortlisted and the candidate's version still shows Viewed.

2. P1-07. lib/checklist.ts line about 21 and lib/onboarding-emails.ts line about 168 say "Kestrel can draft a cover letter". Nothing does. Reword to say people can save a cover letter and reuse it (the apply form offers saved letters and Save as a draft). Update the matching tests.

3. P1-11. app/page.tsx: the Organization and WebSite structured data (ORGANIZATION) is only output by the old ComingSoon component, so the pre launch and launch home pages output none. Output it on every version of the home page. Test or reproduce by checking the rendered HTML contains application/ld+json with "Organization".

4. P1-37. public/home/sample-job.png says "Use your saved CV". Retake the picture from the current job page with Playwright (the browser is installed; build against scripts/dev/fake-postgrest.js as docs/handoff.md describes), at the same size and framing, with a sample clinic. Check public/home/sample-search.png for "CV" too. Never alter the logo, the feather or the skyline.

5. P1-26. The job alert email in app/api/cron/daily/route.ts (line about 295) lists title, clinic and place without pay. Add the pay, using payText or payChips from lib/job-pay.ts (select the pay columns in the query, which are public).

6. P1-32. app/jobs/[id]/apply/page.tsx (line about 74) lists name, email, role and resume, but the application also sends phone, registered provinces, years of experience and available from (see applyToJob in lib/candidate-actions.ts). List everything that is sent, showing "Not given" for empty ones.

7. P1-30. profileStrength in lib/candidate.ts counts different things from "ready to apply" (lib/profile-ready.ts), so the meter can read 100% beside "Finish your profile". Base the meter on the same 3 needs (role, resume, town and province), and test that the meter and readyToApply always agree.

8. P1-40. lib/style-guard.test.ts scans app, components and content but not lib, where every email and error message lives. Add lib (skipping comments and test files as it does now), and add checks for em and en dashes in user facing strings and for spelled out numbers two to twelve. Then fix what it finds, including "Two quick questions" (app/candidate/start/page.tsx, and that page asks 3 things, so make the count right), "Three things" twice in lib/onboarding-emails.ts, and "one or two page resume" in content/posts.ts. Any prompt text written for the AI that lists banned words (lib/ad-builder.ts, lib/found-listing-actions.ts) must be excluded explicitly, not by weakening the patterns.

9. P1-35. When the daily job closes an application as "no_update" (app/api/cron/daily/route.ts, line about 142), the candidate gets an email but no inbox message. Add one using notify and the wording helpers in lib/notify-text.ts, with a test for the wording.

10. P1-36. Opening a message in the inbox does not mark it read; only "Mark all as read" does. Mark a message read when the person opens its link, and mark the messages shown on the inbox page as read when the page is opened (choose one approach, explain it to me first). Do NOT add deleting old messages; log it as "needs a decision: how long to keep inbox messages".

11. P1-38. On a phone the envelope is hidden and the unread count only shows inside the menu (components/AppBar.tsx). Show the envelope with its count beside the menu button on phones, or a dot on the menu button with the count in its accessible name. Keep the 44 pixel tap size.

12. P1-39. Heading levels skip from h1 to h3 on My applications, the inbox and the clinic applicants list: make the item titles h2 (keep the look the same). Make the 3 radio rows on the first step page more comfortable to tap (44 pixels like the rest of the site). Fold more than 2 "now live" notices on the clinic dashboard into 1 notice with a Dismiss all. Do NOT change the tagline under the logo: log it as "needs a decision" (it is 9 to 10 pixels on phones and is part of my brand lockup).

13. P1-50. /jobs?page=400 shows a count and no jobs. Clamp the page to the last page.

Update the help centre topics in content/help.ts that describe anything you change (the inbox, the apply page, the dashboard checklist).

On the preview, tell me the exact pages and clicks to check each fix on my phone.
```

---

## Phase C: docs and the lawyer pack (Opus)

```
PHASE C: docs and the lawyer pack. Branch: claude/audit-fix-c. No SQL in this phase.

Findings to fix:

1. P1-09. The data download (app/account/export/route.ts, line about 32) leaves out: home town and province, travel distance, provinces they would work in, types of work, other roles, lowest pay and its period, independent or corporate preference, practice software, the career stage answer (career_stage, migration 0037), the jobs they marked not interested (candidate_job_hides), and the date of their last name change (profiles.name_changed_at, migration 0039). Add them all. Read career_stage and name_changed_at in separate queries and tolerate an error, so the download still works on a database without migrations 0037 to 0039. Keep the shortlist hidden exactly as now.

2. P1-08. app/privacy/page.tsx lists less than the profile collects. Add the items in point 1 under "If you are a candidate", plus the inbox messages and the name change date, saying plainly that clinics never see the preferences, the minimum pay, the career stage answer or the town. Update "Last updated" to the real date.

3. P1-21. The privacy page says "We only email you if you ticked the consent box". Reword it so it stays true, separating news and offers (needs the tick) from emails about an account or an application (always sent). Do NOT describe the first week emails as allowed without consent: that is a question for the lawyer, so say only what is true today (they are switched off).

4. P1-46. The privacy and security pages say Anthropic sees "only the job details a clinic types in". It also receives up to 8 of the same clinic's earlier ads (lib/ad-builder.ts, line about 67), and the admin tools send the text of a clinic's public careers page and web searches. Make the sentence accurate, keeping that no candidate information is ever sent.

5. P1-17. docs/security.md: correct "CVs are never opened or processed by our servers" (if Phase A has not already), the bot check sentence (lib/turnstile.ts now refuses sign ups on the live site when a key is missing), and the package count (13 direct). Check every other statement in it against the code and list any more you correct.

6. P1-14 and P1-45. CLAUDE.md: the pay rule (add the optometrist percentage, guaranteed minimum and daily rate options agreed on 9th November 2026, from lib/job-pay.ts); the industry directory is live on /resources (lib/directory-data.ts), not "Not built"; the coming soon line (the pre launch layout has been live since 8th November); the name hold wording (leave the question of whether the first change is free as a "needs a decision" for me). Also fix docs/discoverability-plan.md (the comparison page's list of boards) and docs/candidates-and-applications.md ("3 optional questions" against the page).

7. P1-02 (High). Rebuild the lawyer packs. docs/legal/build-lawyer-pack.py builds them from the running site (read its header for how). Add a page "What has changed since 5th November 2026" listing in plain English: resume reading on Kestrel's own server (Fill in from my resume, no AI, text not kept), the inbox, the "where are you in eye care" answer, the 30 day name hold, the first week emails (built, switched off), optometrist pay as a percentage only, a guaranteed minimum or a daily rate, job view and apply click counts, Recommended for you and the private preferences behind it including lowest pay, the found listings reader and the province search that saves clinics' published contact emails (both switched off), and the price comparison page that names competitors. Then these questions for the lawyer: (a) may a clinic ever see the career stage answer; (b) is an account an existing business relationship under CASL for the first week emails, or do they need the consent tick; (c) does a percentage only pay line (for example 28% to 35% of production) meet Ontario's pay range rule; (d) the retention question already open from the October audit (R5). Also change "CV" to "resume" in the pack text. Run the build as the script describes and regenerate the PDFs. Add the new questions to "Questions held for the lawyer" in docs/gemini-intake-plan-2026-11-08.md. Do not send anything to anyone.

8. P1-60. Do not change anything. In the log, write "needs a decision" with a plain explanation of what a Canadian (Montreal) function region in Vercel would mean for where resumes are read, and what I should check on my Vercel plan.

On the preview, I will read /privacy and /security, and download my data from the Account page with a test candidate. Tell me what to look for.
```

---

## Phase D: the database keeps the promises (Fable)

```
PHASE D: make the database keep the promises. Branch: claude/audit-fix-d. This phase adds 1 migration (the next free number, probably 0040).

My decisions: P1-56, the name hold: [YOUR ANSWER: "the first change is free and only later changes start the hold" OR "every change starts the hold"]. P1-57, a field based job based outside Quebec whose area covered includes Quebec: [YOUR ANSWER: allow OR refuse].

Before writing anything, read area B of docs/audit/AUDIT-2026-11-PART1-WORKING.md. The audit tested on 2 scratch databases: the plain one from scripts/dev/scratch-db.sh, and a second that copies Supabase's habit of granting anon and authenticated every permission on new tables by default (alter default privileges in schema public grant all on tables, sequences and functions to anon, authenticated, service_role, before running the combined file). Use the second kind for every test here, because the plain one hides permission mistakes. Turn the audit's access tests into a script committed in scripts/dev (for example scripts/dev/rls-tests.sql plus a small runner) that seeds 2 candidates, 2 clinics and an admin and asserts each rule, so it can be run again later. Show each test failing before the migration and passing after.

Findings to fix:

1. P1-15. A signed in candidate can read "shortlisted" straight from the database (select status from applications, and the application_events rows). Make the database keep the shortlist private from the candidate while clinics still see it. Design options: (a) keep the clinic's shortlist in a clinic only place and stop writing "shortlisted" into what the candidate can read; (b) stop candidates reading applications and application_events directly and serve their pages through the server with the mask. Explain the trade offs to me in plain English and recommend one BEFORE building it, and wait for my answer. Whatever is chosen, every page must keep working on a database that has not had the migration, and existing shortlisted applications must be handled.

2. P1-16 and P1-33. The name hold can be skipped: the profiles table lets a signed in person update first_name, last_name and full_name directly. Remove that permission in the migration, and save the name with the server's key in updateName (lib/account-settings-actions.ts) after the hold check. If the server key is missing, refuse the change instead of saving it with no hold. Apply my P1-56 decision in lib/name-hold.ts and the account page, and fix the comment about capital letters to match what the code does (decide with me if "smith" to "Smith" should count). The Google sign in flow (chooseAccountType in lib/auth-actions.ts) already writes names with the server key; check it still works. Before the migration is run, the website must still work exactly as today.

3. P1-28. A Quebec job sent straight to the database API was accepted into the review queue. Add Quebec to the database rule (jobs_complete_unless_draft or a new check), allowing existing rows to stay as they are (check for any). Also re-check the province in approveJob (lib/admin-actions.ts) and doExtend (lib/clinic-actions.ts). Apply my P1-57 decision.

4. P1-44. The database accepts a percentage only or a daily rate job for an optician. Add the rule that percentages and daily rates are for optometrist roles only, matching lib/job-pay.ts (OPTOMETRIST_ONLY_PERIODS), for jobs not in draft.

5. P1-41. Signed in people can read every column of a live job and of a clinic that has a live job (for example employers.owner_id, jobs.review_note, posted_by_admin_id, filled_application_id), while visitors are limited to a public column list (migrations 0005 and 0013). Give signed in people the same public columns, without breaking clinics reading their own jobs, admins, or any page. lib/public-columns.test.ts checks public reads against grants: extend it. Search the code for every read of jobs and employers made with a signed in client and make sure each still works.

6. P1-42. waitlist, onboarding_emails, candidate_job_hides and profiles still hold Supabase's default permissions (on the Supabase like scratch database anon could truncate the waitlist). Revoke all from anon and authenticated on these, then grant back only what each needs, as migration 0038 does. Include in your message to me the check query from finding B-06 in the working file, so I can run it on the live and demo databases before and after.

7. P1-43. The final check at the end of supabase/combined/run-everything.sql misses the outreach_sends and signup_tickets tables, policies and the rule triggers. Add the 2 tables, a check that row level security is on for every public table, a count of policies, and the triggers jobs_enforce_changes, jobs_limit_open and on_auth_user_created.

Run the combined file twice on both kinds of scratch database, and run the access test script after each. Then give me the whole combined file and the steps: demo database first, run my B-06 check query, try signing in as a test candidate and a test clinic on demo, then the live database. Tell me what to check on the preview before and after the SQL.
```

---

## Phase E: before the sign up gate opens (Opus)

```
PHASE E: before the sign up gate opens. Branch: claude/audit-fix-e.

Findings to fix:

1. P1-03 (High). The bot check, the clinic invitation code and the terms tick are checked by Kestrel's server in signUp (lib/auth-actions.ts), but anyone can send a sign up straight to Supabase with the public key, and the handle_new_user trigger takes role "clinic" from what is sent. The closed sign up gate (gate_new_users, migration 0021) blocks it today. Fix: (a) tell me exactly how to switch on Supabase's own CAPTCHA protection with the Turnstile keys (Authentication, Attack Protection) on both the live and demo projects, and what the code must send for it to work (the Turnstile token in the sign up options); make the code send it; (b) keep a server issued ticket required for clinic sign ups even when the gate is open, while clinic sign up is by invitation (CLINIC_SIGNUP), which needs SQL; (c) when a signed in person has no terms_version, send them to agree to the terms at first sign in, as the Google flow already does. Show me the plan for (b) and (c) before building. Test with the scratch database that a direct insert into auth.users with role clinic and no ticket is refused while the gate is open.

2. P1-06. lib/onboarding-run.ts sends the first week emails to accounts that never confirmed their email. Skip accounts whose auth user has no email_confirmed_at. Keep ENABLE_ONBOARDING_EMAILS off; the consent question is with the lawyer.

3. P1-23. lib/email.ts only checks the do not email list when an email has an unsubscribe link. Always skip addresses whose suppression reason is bounced or complaint, for every email except password and sign in emails (which Supabase sends anyway). Pass unsubscribeUrl through on the waitlist confirmation email (app/api/waitlist/route.ts). Tests for the rule.

4. P1-22. The maintenance switch (proxy.ts) skips every /api/ route, so the waitlist, the daily job, the Resend webhook and the view counter keep running. Make /api/waitlist, /api/cron/daily and /api/job-event return early with a 503 while MAINTENANCE_MODE is on. Leave /api/resend (bounces must still be recorded) and /api/health (monitoring) working, and say why. Update docs/breach-plan.md if it describes this.

5. P1-24. Emails triggered by people (a bulk decline of up to 100, new applications) are outside the daily budget. Add a shared count of emails sent today, so the daily job knows what clicks have already used, and warn me by admin email when the day's total passes 80% of DAILY_EMAIL_BUDGET. If this needs a table, tell me first (SQL). Do not change any plan or setting: in the log, write that a paid Resend plan before launch is my decision and roughly what it costs (tell me to check Resend's current price).

6. P1-13. "Role filled" and the daily close out only reach applicants at applied, viewed or shortlisted. People at Interview or Offer are never told. On the role filled form (applicants page and the job ending page), list anyone at Interview or Offer and ask the clinic for a short message to each (with a kind ready made one), then close them as role filled. Show me the screen design in words before building. Update the help centre topic for filling a role.

7. P1-47. A clinic's message is emailed to its applicants from Kestrel's address with live links. In the email and inbox message, show web addresses as plain text, not links, and add the line "This message was written by [clinic name]." Test the wording.

8. P1-51. Add the List-Unsubscribe-Post one click header to emails that carry an unsubscribe link, with a route that handles the POST. And because unsubscribing from news also stops job alerts (cron, line about 255), say so on the alerts page when the person has unsubscribed, with a way to turn news back on.

9. P1-49. The data download needs no password: ask for it on the account page as delete does (Google sign in: the email address, as delete does). Make fillRole, markHired and the bulk actions report a failed history write instead of ignoring it.

10. P1-18. Write docs/settings.md: one table of every setting the code reads (search for process.env), what it does, the value it should have in the live Vercel project and in the demo project, and whether it is a secret. Bring .env.example up to date with the non secret ones. Link it from docs/security.md and CLAUDE.md.

If any fix needs SQL, follow block 0. Tell me what to check on the preview and what to set in Supabase and Vercel, step by step.
```

---

## Phase F: search and speed (Opus)

```
PHASE F: search and speed. Branch: claude/audit-fix-f. No SQL in this phase.

Read area K of docs/audit/AUDIT-2026-11-PART1-WORKING.md first, and docs/discoverability-plan.md and docs/landing-pages.md.

Findings to fix:

1. P1-10 (the big one). Every public page answers Cache-Control private, no-store and is rebuilt for every visitor, because components/SiteHeader.tsx calls connection() and reads the sign in session, and 51 pages set force-dynamic. Design: pages whose content only changes with the code (blog, blog posts, resources, compare, clinics, help, privacy, security, terms, posting policy, contact, the province and role pages) are built once and refreshed every hour; the header is drawn signed out and a few lines of script in the browser swap "Sign in" for "My dashboard" when a Supabase sign in cookie is present; job pages are cached for a few minutes and cleared with revalidatePath when a job is approved, edited, closed, extended or expires (find every place the status changes, including the daily job); the "this role is not your role" message moves to the apply page. Hard rules: no page that is cached may ever contain anything about the person viewing it; signed in account pages stay dynamic; scheduled blog posts must still appear on their date without a deployment; the launch switches (lib/launch.ts reads the sign up gate from the database) must still take effect within the hour. Show me this design in plain English, with what could go wrong, BEFORE building. Then prove it: build, start the site, and show the Cache-Control headers before and after for each page type, and show a signed in session's details never appear in a cached page.

2. P1-12. The 5 self hosted fonts (app/layout.tsx, @fontsource) arrive late, giving layout shift of 0.21 on a job page and 0.14 on /compare. Load the same font files through Next's font loader (next/font/local) so they are preloaded and the fallback is sized to match. Do not change the fonts or the look. Measure layout shift before and after with Playwright on a phone profile, as the audit did, and show me both numbers.

3. P1-52, in parts. (a) Add FAQPage structured data to /help built from content/help.ts, and Dataset structured data for the pay table on /resources, with the Job Bank source, licence and date. Each must match what the page shows. (b) Province pages: the description lowercases the province ("eye care jobs in ontario"); fix it. (c) Use twitter:card summary_large_image, since a 1200 by 630 image is supplied. (d) The /clinics title "For clinics" says nothing to a searcher: propose 2 titles to me and use the one I pick. (e) "Contract" (shown as Fixed term) is sent to Google as CONTRACTOR in lib/jobs.ts; TEMPORARY is closer for a fixed term employee; check Google's JobPosting documentation and tell me before changing it. (f) /resources/ontario-job-ads, the blog post "What every eye care job ad in Canada should include" and /posting-policy chase the same search: recommend which is the main page and add links from the other 2 to it. Do not merge or delete pages.

Do not set up Search Console or any account: tell me the steps for Google Search Console instead, as a short list at the end.

On the preview, tell me what to check on my phone, and how to see that the pages still show me as signed in.
```

---

## Phase G: tidy and tests (Sonnet)

```
PHASE G: tidy and tests. Branch: claude/audit-fix-g. No SQL in this phase.

My decision on P1-55 (a practice manager, assistant or supplier rep can tick Optometrist or Optician under "other roles" and apply): [YOUR ANSWER: "intended, leave it" OR "only optometrists can apply to optometrist jobs, and only opticians and optometrists to optician jobs"]. If I chose to restrict it, change lib/role-fit.ts and the profile form, update the tests and the help centre.

Findings to fix:

1. P1-29. "For me" and Recommended (lib/recommend.ts, line about 60) list only the profile role plus ticked other roles, while the apply rule (lib/role-fit.ts) also lets an assistant apply for patient care or reception jobs and the other way round, and recommend trusts the saved other roles without checking them. Filter jobs in recommend with canApplyForRole, so the list and the apply rule always agree. Test both directions.

2. P1-27. mentionsCanadianExperience in lib/jobs.ts misses "Canadian exp required", "Cdn exp.", "previous experience at a Canadian practice" and "experience (Canadian) required". Add these shapes with tests, and keep every existing test passing, including the ones that must NOT be refused ("licensed to practise in Canada", "We are a Canadian clinic offering experience with lenses").

3. P1-31. The data download includes status_changed_at, which moves when a clinic shortlists: leave it out for shortlisted applications. And a clinic can move an application from Interview or Offer back to Shortlisted, which the candidate sees as Interview turning back into Viewed: refuse that move in clinicMoveError (lib/applications.ts) with a clear message, with a test.

4. P1-34. The first step page (saveFirstStep in lib/candidate-actions.ts) always goes on to the profile and drops a "next" address. Carry a safe next address through (use safeNext from lib/auth-copy.ts), so someone who came from a job goes back to it.

5. P1-19. Add tests for the code that talks to the database, starting with the most valuable: (a) the loaders behind the clinic and candidate application pages; (b) the data download's contents; (c) a scripted walk through against the scratch database (bash scripts/dev/scratch-db.sh) of sign up, apply, shortlist, decline and delete account, checking the database rules at each step. Keep them runnable by npm test where they do not need the database, and give the database ones their own command documented in docs/handoff.md.

6. P1-54. Update next, @supabase/supabase-js and @supabase/ssr to their latest patch versions only, run npm audit, and confirm the build and tests still pass. Keep exact pinned versions.

At the end, list which findings from the whole report are still open, with the phase they belong to, so I have one list.
```
