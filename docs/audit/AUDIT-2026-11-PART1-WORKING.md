# Audit part 1, November 2026: working findings

Raw notes, written as each area is finished. The final report (`AUDIT-2026-11-PART1.md`) is built from this file.
Confidence words: Confirmed (reproduced or proven from the code), Likely, Possible.

## Area 0. First checks (12th November 2026, commit 3e42a07)

| Check | Result |
| --- | --- |
| `npm ci` | Clean install, no errors |
| `npm run typecheck` | Pass, 0 errors |
| `npm test` | Pass, 425 of 425 |
| `npm run build` | Pass. 181 pages generated. Every route except `/robots.txt`, `/sitemap.xml` (1 hour) and `/icon.svg` is marked "server rendered on demand" (see area K) |
| `npm audit` (all levels) | 0 known problems. 13 direct packages (docs/security.md says 11), all pinned exactly. No package runs an install script |
| `npm outdated` | Small updates waiting: next 16.4.3 to 16.4.6, @supabase/supabase-js 2.118.0 to 2.119.0, @anthropic-ai/sdk 1.3.0 to 1.8.0 |
| Secret scan, working tree | Nothing. Only made up test strings in `lib/setup-check.test.ts` |
| Secret scan, full history | 441 commits on 77 branches, from 28th October to 12th November 2026, after fetching the full history. Patterns searched: Anthropic, Stripe, Resend, Supabase secret and JWT keys, GitHub tokens, Google and AWS keys, private key blocks, Turnstile secrets, database addresses with passwords. Nothing real found. The only `.env` file ever committed is `.env.example`, which holds placeholders |
| Email addresses in history | Only Kestrel's own addresses and made up examples |

Notes for later areas:
- `.env.example` lists 12 settings. The code reads 32. The gap is checked against docs/security.md in area J.
- `docs/security.md` still says "CVs are never opened or processed by our servers". That stopped being true on 12th November 2026 (resume reader). Area I.
- `lib/directory-data.ts` exists although CLAUDE.md says the industry directory is "Not built". Area I.

## Area A. Decisions versus code

Verdict per item, then the findings. Probes were run with a throwaway test file against the real rule files (not committed).

| # | Decision | Verdict |
| --- | --- | --- |
| A1 | Pay public everywhere, pay range rules, 2 questions, no "Canadian experience" | Partly. Pay shows on the job page, cards, search, apply page, dashboards and structured data. It is missing from the job alert email (A-01). The range rule is right ($60,000 to $110,000 allowed, $110,001 refused, top over $200,000 exempt, hourly converted at 2,080 hours). The code also accepts things CLAUDE.md does not mention (A-02). The 2 questions are required on submit. The Canadian experience check can be sidestepped with abbreviations (A-03) |
| A2 | Quebec refused at every entry point | Verified in the 4 entry points (lib/jobs.ts:195 for the clinic form and the admin post, lib/found-listings.ts:231, lib/lead-actions.ts:118). No database rule backs it up, and extend and approve do not re-check (A-04) |
| A3 | Apply rule agrees on job page, apply page and server | Verified for the core rule: optician and optometrist are blocked from each other even through "other roles", and optometrists are blocked from field roles even with stale data. 3 gaps: A-05, A-06, A-07 |
| A4 | "Ready to apply" means role, resume, town and province everywhere | Verified in the profile page, apply page, server action, dashboard, first week emails and admin numbers (all use lib/profile-ready.ts). One stray: the dashboard meter (A-08) |
| A5 | Shortlisting never announced | Partly. No email, no inbox message, the candidate pages and the data download show "Viewed". 3 leaks or side effects: A-09, A-10, A-11 |
| A6 | Clinic sees only what was sent | Verified in the code: the clinic pages read only the `applications` row (a copy of name, email, phone, role, registered provinces, years of experience, available from, cover letter, resume). Career stage, software skills, preferences, minimum pay and town are not copied. Resume links are signed for 60 seconds in both routes. Database side is tested in area B. Gaps: A-12, A-13 |
| A7 | Matching has no AI, Kestrel never ranks applicants | Verified. lib/recommend.ts is fixed rules. The Anthropic client is used only by the ad builder, found listings, the province search and the setup check. Applicants are listed newest first |
| A8 | Name hold | Partly. Works through the website. Can be bypassed (A-14), fails open with no admin client, and small edge cases (A-15) |
| A9 | First step page | Verified in code: no loop (the page itself never redirects, the dashboard sends people once), existing users without a role see it once, safe before 0037 (write retried without the new columns, read error means "do not send"). A "next" address is not carried through it (A-16). Database side in areas B and C |
| A10 | Inbox | Partly. Right moments, no applicant details in clinic messages, links are internal only, shortlist returns no message. Gaps: A-17, A-18, A-19 |
| A11 | Writing rules | Verified, with small gaps (A-20, A-21). My own scan of every string in app, components, content and lib found 0 banned words, 0 em dashes, 0 curly quotes, 0 emoji and no capital CV |

### Findings

**A-01 Job alert email does not show pay.** Low. Confirmed. `app/api/cron/daily/route.ts:295` builds each line as title, clinic, place. CLAUDE.md says pay is public on every job surface. Fix: add `payChips(job)` text to each line (the pay columns are public). 20 minutes.

**A-02 The pay rule in the code is wider than the rule in CLAUDE.md.** Medium (a decision and a legal question, not a bug). Confirmed. `lib/job-pay.ts`: an optometrist post may give a percentage only, with no dollar figure at all (10 points wide at most); dollars may be "a guaranteed minimum"; a daily rate may be up to $200 wide. Steve agreed these on 9th November 2026 (Phase 2 in the intake plan), but CLAUDE.md still says only "max $50,000 wide unless over $200,000". Why it matters: Ontario's rule asks for expected compensation or a range. Whether "28% to 35% of production" with no dollar amount satisfies it is a question for the lawyer. Fix: update CLAUDE.md, and add the question to the lawyer pack. Also the hourly error message says "unless the top is over $96 an hour" but the real cut off is $96.16 (trivial).

**A-03 The Canadian experience check misses abbreviations and a few word orders.** Low. Confirmed by probe. Refused: "Canadian experience", "Canadian work experience", "experience working in Canada", "worked in Canada", "no Canadian experience needed". Allowed through: "Canadian exp required", "Cdn exp.", "previous experience at a Canadian practice", "experience (Canadian) required". An admin reads every post and the review queue flags the same pattern, so the same gaps apply to the flag. Fix: add `exp\.?` and "at a Canadian" shapes, with tests. 30 minutes.

**A-04 Quebec is refused by the website only, not by the database.** Low. Likely. No migration mentions Quebec. `doExtend` (lib/clinic-actions.ts:218) and `approveJob` (lib/admin-actions.ts:35) do not re-check the province, so a Quebec job that was in the database before 6th November 2026, or one written straight to the database API by a clinic account, could be approved or extended. An admin still has to approve anything new. Also not covered by the rule: a field based job based in Ottawa whose territory says "Quebec". Steve to decide if that matters. Fix: a database check on `jobs.province`, or a re-check in approve and extend. 30 minutes plus SQL on both databases.

**A-05 "For me" hides jobs the person is allowed to apply for.** Low. Confirmed by probe. `lib/role-fit.ts` lets an optometric assistant apply for patient care or reception jobs (and the other way round) without ticking anything, but `lib/recommend.ts:60` only lists the profile role plus ticked other roles. So an assistant never sees reception jobs under For me or Recommended. Fix: make `recommend` use the same compatible groups. 30 minutes.

**A-06 "For me" trusts the saved "other roles" list without re-checking it.** Low. Confirmed by probe. If the list ever holds a role the person may not have (an optician with Optometrist, an optometrist with field roles), For me shows those jobs. Apply is still refused. The forms clean the list, so this needs stale or hand written data. Fix: filter with `canApplyForRole` inside `recommend`. Same change as A-05.

**A-07 Only optician and optometrist are kept apart.** Idea, for Steve to decide. Confirmed by probe. A practice manager, assistant, receptionist, vision therapist or supplier rep can tick Optometrist (or Optician) under "Other roles you would consider" and then apply for those regulated roles. Also, on a job that takes applications on the clinic's own website, the role message is never shown (app/jobs/[id]/page.tsx:49), which is reasonable since Kestrel does not handle that application. And job alerts can be set for any role.

**A-08 The profile meter on the dashboard uses a different list from "ready to apply".** Low. Confirmed. `profileStrength` (lib/candidate.ts:87) counts role, registered provinces, years, available from and resume. It ignores town and province. A person can read "Ready to apply" beside a 60 percent meter, or "Finish your profile" beside 100 percent. Fix: build the meter from the same 3 needs, or drop it. 20 minutes.

**A-09 A shortlisted application shows as "Viewed" to the clinic on the application page.** Medium. Confirmed from the code. `app/clinic/applications/[id]/page.tsx:27` loads the application with `getApplication` from `lib/candidate.ts`, which applies the candidate mask (`forCandidate` turns shortlisted into viewed and `candidateHistory` removes the step). So after a clinic shortlists someone, that person's own page shows the badge and progress bar at Viewed, while the applicants list (which reads the table itself) shows Shortlisted. docs/candidates-and-applications.md says "The clinic still sees Shortlisted everywhere". Fix: give the clinic page its own unmasked loader. 30 minutes plus a test.

**A-10 A candidate with some technical skill can read "shortlisted" straight from the database API.** Low to Medium. Confirmed in area B (see B section). The mask is applied by the website's server, but the candidate's own sign in can read their `applications.status` and `application_events` rows directly. Fix: a database view or column rule that hides the raw status, or accept the risk. Half a day, with SQL.

**A-11 Small hints of a shortlist.** Low. Confirmed. (a) The data download includes `status_changed_at`, which moves when a clinic shortlists, next to a status that still says viewed (app/account/export/route.ts:33). (b) A clinic can move someone from Interview back to Shortlisted, and the candidate then sees Interview turn back into Viewed with no message. (c) A stale comment in lib/applicant-actions.ts:44 still says "the candidate sees it in their account".

**A-12 The apply page shows 4 of the 8 details that are sent.** Low. Confirmed. `app/jobs/[id]/apply/page.tsx:74` lists name, email, role and resume. The application also carries phone, registered provinces, years of experience and available from (lib/candidate-actions.ts:214). The help centre lists them all, but the screen where the person presses Send does not. Fix: list every item sent. 15 minutes.

**A-13 The data download leaves out part of what Kestrel holds.** Medium. Confirmed. `app/account/export/route.ts:32` omits the town and province, travel distance, chosen provinces, types of work, other roles, minimum pay, practice preference, the career stage answer, the "not interested" list and the name change date. If the privacy policy promises a copy of the person's information, the download should hold all of it. Fix: add the columns (reading the 0037 column separately so it works before the SQL). 30 minutes.

**A-14 The name hold can be skipped by writing to the database API directly.** Low to Medium. Confirmed in area B. The website checks the hold, then changes the name using the person's own sign in (lib/account-settings-actions.ts:38). That means the person's sign in is allowed to change `first_name`, `last_name` and `full_name` at any time, so anyone who calls the API themselves is not held. Nobody can clear `name_changed_at`, but they do not need to. Fix: make the name columns writable by the server only, and do the change with the admin client after the check. 1 hour plus SQL on both databases.

**A-15 Name hold edge cases.** Low. Confirmed. (a) If the admin client is missing, or saving `name_changed_at` fails, the change goes through with no hold and only a log line. (b) The comment says capital letters do not count as a change, but "smith" to "Smith" does count and starts the hold (probe). (c) CLAUDE.md says "the first change is free. Each change after that starts a 30 day hold"; the code starts the hold on the first change too. Steve to confirm which he meant. (d) Google sign in: handled, the name lives in `profiles` and is not overwritten on sign in (checked in area D).

**A-16 The first step page drops the "next" address.** Low. Likely. A new candidate who arrives from a job (sign up with next=/jobs/.../apply) is taken to the job, which is right. But once they reach the dashboard and the first step page, saving always goes to the profile page, and the profile link back to the job is lost. Also the page says "Two quick questions" while it asks 3 things and the house style wants numerals.

**A-17 Not every status change reaches the inbox.** Low. Confirmed. When the daily job closes out an application as "No update from the clinic" (app/api/cron/daily/route.ts:142) the candidate gets an email but no inbox message. The inbox doc says candidates get a message whenever an application moves.

**A-18 Opening a message does not mark it read.** Low. Confirmed. Only the "Mark all as read" button clears the count (app/account/inbox/page.tsx). Messages are never deleted, the page shows the newest 50 only, and the count covers all of them.

**A-19 Candidates at Interview or Offer are never told when the job is filled or ends.** Medium. Confirmed. `WAITING` in lib/applicant-actions.ts:36 is applied, viewed and shortlisted only, on purpose ("interviews and offers are never closed in bulk"). The daily job's close out uses the same 3 (cron line 131). So a person at Interview stays at Interview for ever if the clinic marks the role filled with someone else and does not close them by hand. Fix: on "role filled", list the people at Interview or Offer and ask the clinic to send each a message before closing. Half a day.

**A-20 The style test does not read `lib`.** Low. Confirmed. `lib/style-guard.test.ts:13` scans app, components and content. Every email, error message and inbox message lives in lib. My scan found lib clean today, so this is a gap in the guard, not a live problem. There is also no test for em dashes, hyphens as punctuation or spelled out numbers. Fix: add lib and 2 more patterns. 30 minutes.

**A-21 Spelled out numbers.** Low. Confirmed. "Two quick questions" (app/candidate/start/page.tsx:21), "Three things make a difference" and "Three things to check" (lib/onboarding-emails.ts:100 and :118), "one or two page resume" (content/posts.ts:71).

Also seen, for other areas: the clinic's free text message is emailed to candidates from Kestrel's address (a rogue clinic could send anything to its own applicants, D). The maintenance switch does not cover `/api/` routes (D). Emails with no unsubscribe link skip the do not email list, so bounced addresses keep being tried (G).

## Area B. Database

How it was tested: Postgres 16 was available. `scripts/dev/scratch-db.sh` built a throwaway database and ran the combined file twice (64 rows OK, 1 "NOT YET" for resume storage, both runs). I then built a second throwaway database that copies Supabase's habit of giving the `anon` and `authenticated` roles every permission on new tables by default, because the script's plain database does not do that and would hide mistakes. All access tests below ran on the second one, with 2 candidates (Ann, Bo), 2 clinics (C, D) and an admin, 1 application from Ann to clinic C (shortlisted), and 1 inbox message each. The test files were throwaway and are not committed.

**Combined file.** Verified. `supabase/combined/run-everything.sql` holds exactly the 39 migrations, in order, with no differences (compared section by section by script), followed by the check. Re-running it on a database that already held data changed nothing (checksum of 8 tables identical before and after, and the sign up gate stayed closed).

**Tables and rules.** 31 tables, all with row level security switched on. 52 policies. 19 "security definer" functions, all with a fixed search path. None of the functions can be called by a visitor or a signed in person directly (tested: `claim_job_run`, `issue_signup_ticket`, `record_job_event` all refused).

### What held (tested, all refused or returned 0 rows)

- A visitor (not signed in) cannot read profiles, candidate profiles, applications, inbox messages, the waitlist, clinic contact emails or the first week email record, and cannot write to the waitlist or the inbox. They see live jobs only, and only the public columns (not `review_note`, not a clinic's `owner_id`).
- Bo (a stranger) sees only her own profile, candidate profile and inbox message, 0 applications, and cannot change Ann's profile, name or inbox.
- Nobody can make themselves an admin or a clinic (`profiles.role` is not writable), and nobody can clear or set their own name hold date (`name_changed_at` is not writable).
- Ann cannot change her application, create an application without the website, change where her resume file points (`cv_path` is not writable, so one person's sign in cannot be used to fetch another person's file), forge, edit or delete an inbox message, or move one to another person. She can mark her own as read, which is the intent.
- Clinic D (no application from Ann) sees 0 candidate profiles, 0 applications and 0 history rows. Clinic C sees Ann's application and nothing of her profile: not her town, minimum pay, career stage or preferences.
- A clinic cannot change an application directly, publish its own job, edit a live job, edit or delete another clinic's job, delete a job that has applications, take over another clinic, or mark itself claimed. A candidate account cannot create a clinic profile.
- Migration 0037: a candidate can save `career_stage` and `start_seen_at` on their own row only, and a made up stage value is refused. Migration 0038: read own, update `read_at` only, no insert or delete. Migration 0039: column added, no permission for signed in people.

### Findings

**B-01 The name hold can be skipped (confirms A-14).** Low to Medium. Confirmed. With the hold switched on for Ann, an update of her own `first_name`, `last_name` and `full_name` sent as her own sign in succeeded. `profiles` gives signed in people UPDATE on those 3 columns (needed today because the website saves the name with the person's own sign in). Fix: take away that permission and save the name with the server's key after the hold check. 1 hour plus SQL on both databases.

**B-02 A candidate can read "shortlisted" straight from the database (confirms A-10).** Low to Medium. Confirmed. As Ann: `select status from applications` returned `shortlisted`, and `application_events` returned applied, viewed, shortlisted. The website hides it, the database does not. It needs someone to call the database API by hand with their own sign in, so most people will never see it, but the promise "a shortlist is never shown to the candidate" is not kept at the database level. Fix options: (a) stop signed in candidates reading `applications.status` and `application_events` directly and serve them through the server only, or (b) store the clinic's shortlist in a separate clinic only table. (b) is cleaner. Half a day plus SQL.

**B-03 A Quebec job can be put into the review queue through the database API (confirms A-04).** Low. Confirmed. As clinic C, an insert with province Quebec and status `in_review` was accepted. The same test with no pay, a range $120,000 wide, or the 2 questions missing was refused by the database rule `jobs_complete_unless_draft`, which is good. An admin would still have to approve the Quebec job. Fix: add Quebec to that database rule.

**B-04 The database does not know that percentages and daily rates are for optometrists only.** Low. Confirmed. A percentage only job and a daily rate job for an Optician were accepted by the database (the website form refuses both). Admin review is the backstop.

**B-05 Any signed in person can read every column of a live job and of a clinic that has a live job.** Low. Confirmed. Visitors are limited to a list of public columns, but signed in people have table wide read. As Bo I could read `employers.owner_id` (the clinic owner's account id) and the job columns `review_note`, `posted_by_admin_id`, `filled_application_id` and `expiry_reminded_at` for live jobs. Nothing sensitive is in them today for a live job, but it is wider than intended and `filled_via`, `filled_at` and future columns would be exposed the same way. Fix: give signed in people the same column list as visitors, with the owner's and admin's wider read handled by the existing policies through a view or the server. 2 hours plus SQL.

**B-06 Three tables keep every default permission for visitors.** Low. Confirmed on the Supabase like scratch database, Possible on the live one (I cannot see it). `waitlist`, `onboarding_emails` and `candidate_job_hides` never had the default permissions taken away, so the `anon` role holds select, insert, update, delete and truncate on them. Row level security blocks the first 4 (tested: 0 rows, insert refused). Truncate is not covered by row level security, and in my test `truncate waitlist` as `anon` succeeded. The Supabase API offers no way to send a truncate, so this is not reachable from the internet today. It is a missing layer, and the waitlist is the consent record. `profiles` also keeps truncate for signed in people. Fix: `revoke all on ... from anon, authenticated` then grant back only what is needed, as 0038 does. 20 minutes plus SQL on both databases. Steve can check the live database with: `select table_name, grantee, string_agg(privilege_type, ', ') from information_schema.role_table_grants where table_schema = 'public' and grantee in ('anon', 'authenticated') group by 1, 2 order by 1, 2;`

**B-07 The final check does not list every object.** Low. Confirmed. It checks 29 of the 31 tables (missing `outreach_sends` and `signup_tickets`), 1 of 14 triggers, 1 of 23 functions, 3 permissions and no policies. A half run migration that created a table but not its policies or trigger would still read "OK". Fix: add the 2 tables, a count of policies per table, and the triggers that enforce rules (`jobs_enforce_changes`, `jobs_limit_open`, `on_auth_user_created`). 30 minutes.

**B-08 Deleting an account still removes the other side's records.** Medium. Confirmed, and already known (R5 in the October audit, waiting on the lawyer). Deleting clinic C's owner removed the clinic, its jobs and Ann's application to it. Deleting Ann removed her application from clinic C. Listed here so it is not lost.

**B-09 Small points.** The 0038 policies call `auth.uid()` for every row where the older ones use `(select auth.uid())`, which is slower on large tables (not a concern at this size). There is no index for "unread only", and the count on every page uses the `(user_id, created_at)` index, which is fine. Inbox rows are never deleted except with the account.

### Could not verify from here

- The live and demo databases themselves: whether 0001 to 0036 are all applied, whether the permissions match the scratch database, and the storage bucket rules for `cvs` (the scratch database only has a stand in for storage).
- Whether Supabase's default permissions on the real project are the ones I copied (they have been for years, and Supabase has been changing defaults for new projects).

## Area C. Safe before the SQL (0037 to 0039)

Method: every read and write of the new columns and table was found by search (14 places) and each was read for what happens when the database answers with an error. I could not run the website against a database without 0037 to 0039, because that needs Supabase's API program in front of the database and this session was not allowed to download it. So these are "Likely" (strong reading of the code), not "Confirmed".

| Feature | Before the SQL | Verdict |
| --- | --- | --- |
| First step page | `needsFirstStep` reads `start_seen_at` on its own. An error means "do not send", so nobody is redirected and there is no loop. If someone opens `/candidate/start` by hand and saves, the first write fails, the error names the missing column, and the role and field tick are saved again without the new columns (lib/candidate-actions.ts:118). Skip saves nothing and moves on | Likely safe. The career stage answer is dropped without a message in that one hand typed case |
| Inbox and its count | `notify` is wrapped so it can never throw, and logs. `unreadCount` returns 0, the inbox page shows "Nothing here yet", Mark all as read does nothing, the data download returns an empty inbox | Likely safe. Messages raised before the SQL are not kept, so the inbox starts empty. Emails are unaffected. Each event writes 1 error line to the log |
| Name hold | The account page and the action both treat a read error as "no hold". The name is saved, and the failed write of `name_changed_at` is logged | Likely safe. No hold until the SQL is run, as documented |
| First week emails | Uses only columns from 0031 and 0033. Off by default. If the `onboarding_emails` table were missing, every claim fails and the run reports a problem and sends nothing | Safe. Does not depend on 0037 to 0039 |

Nothing in the 14 places puts a new column into a shared read, so no existing page can break. One thing to do when the SQL is run: the first step page will then be shown once to every existing candidate who has no role yet, which is intended.

## Area D. Server actions and routes

Counted: 73 exported server actions in 22 files, and 13 route handlers. Every action that changes or reads private data starts with a role check (`requireRole`) or, for the 5 that take no sign in (waitlist confirm, both unsubscribes, password reset, report a job), a signed link or the bot check. The 3 found listing actions that looked unguarded go through `foundJob`, which checks for admin first (lib/found-listing-actions.ts:323). Ownership for clinics is enforced by the database rules tested in area B (the actions read with the person's own sign in, then write with the server's key), and I found no action that writes with the server's key before that read. The 3 admin CSV downloads answer "Not found" to anyone but an admin, and the waitlist CSV neutralises cells that a spreadsheet would run as a formula. The sign in redirect check (`safeNext`) is fixed and tested since the October audit. Errors shown to people are generic, and the detail goes to the server log only.

### Findings

**D-01 Supabase's own sign up address is public, so the website's sign up checks can be skipped once the gate opens.** Medium. Likely (needs a look at the Supabase settings to confirm). The bot check, the clinic invitation code and the "I agree to the terms" tick are all checked in `signUp` (lib/auth-actions.ts:42), on Kestrel's server. But the browser key is public by design, and anyone can send a sign up straight to Supabase with it, with `role: "clinic"` in the details. The database trigger then creates a clinic profile (`handle_new_user` reads the role from those details). Today the closed gate stops this: the trigger `gate_new_users` refuses any sign up without a ticket that only Kestrel's server can issue. The day the gate opens, a script can create accounts with no bot check, a clinic account with no invitation code, and an account with no terms record. Fix: (1) Steve switches on Supabase's own CAPTCHA protection with the Turnstile keys (Authentication, Attack Protection), which makes Supabase itself demand the check; (2) keep the ticket requirement for clinic sign ups while clinics are by invitation; (3) treat a missing `terms_version` as "must agree at first sign in". 2 hours plus a setting.

**D-02 The maintenance switch does not cover the API routes.** Low to Medium. Confirmed. `proxy.ts` leaves out every address starting `/api/`, so with `MAINTENANCE_MODE` on, the waitlist form still saves and sends its confirmation email, the daily job still runs and sends email, the Resend webhook and the view counter still write. The comment in the file says "nothing else runs". In a breach, "stop everything" would not stop the daily emails (docs/breach-plan.md has a separate step for email, so the plan still works if followed). Fix: check the switch at the top of the 5 API routes, or narrow the exclusion to the cron and webhook only and make those return early. 30 minutes.

**D-03 The waitlist confirmation email skips the do not email list.** Low. Confirmed. `app/api/waitlist/route.ts` builds the email with an unsubscribe link in the footer but does not pass `unsubscribeUrl` to `sendEmail`, and `deliverEmail` only checks the list when that is passed (lib/email.ts:35). So an address that bounced or complained, and is not already on the waitlist, is still sent a confirmation if someone types it in. Limited to 1 an hour per address. Fix: pass `unsubscribeUrl` through. 5 minutes. The same pattern is worth a rule: check the list for every send (see G).

**D-04 A clinic's message is emailed to candidates from Kestrel's address, with no review.** Low. Confirmed. `tellCandidate` (lib/applicant-actions.ts:23) puts up to 1,500 characters of the clinic's own text into an email and an inbox message. A bad actor with an approved job could send links or anything else to its own applicants under Kestrel's name. Reach is limited to people who applied to that clinic. Fix: strip links from the message or show them as plain text with a line "this message was written by the clinic", and add a report link. 1 hour.

**D-05 No limit on how many applications a candidate can send, or how fast.** Low. Confirmed. `applyToJob` has no rate limit, and each application copies a resume file and emails a clinic. One account could apply to every matching live job in a minute. The role rule limits the damage. Fix: a daily cap (for example 30). 30 minutes.

**D-06 The view and apply click counter can be inflated.** Low. Known and documented (docs/clinics-and-jobs.md). `/api/job-event` takes no sign in, and the same site check relies on a header a script can set. Each call is a database write, so it is also a small cost risk. Leave as is, or add a per address limit at Vercel's firewall when on Pro.

**D-07 Small points.** (a) `getSession` makes 2 round trips (Supabase auth, then the profile) on every page that shows the top bar, plus 1 more for the unread count: see K. (b) `/account/export` hands the full download to anyone with a signed in screen, with no password prompt. (c) `fillRole`, `markHired` and the bulk actions ignore database errors on some writes (for example the history row), so a failure there is silent. (d) Sign up says "There is already an account with that email", which confirms an address is registered. Common, and Supabase limits attempts, but worth knowing.

## Area E. Find jobs, For me and Sort

How it works (app/jobs/page.tsx, lib/public-jobs.ts, lib/job-sort.ts, lib/recommend.ts): the plain list (signed out, or "Show all jobs" sorted by Newest) asks the database for 1 page of 20. The "For me" view, the Closest sort and any search by town ask for the newest 1,000 matching jobs in 1 request, then filter, order and cut the page in the website's own memory.

Verified as expected:
- View and sort values are cleaned. A sort that cannot be used falls back (probe: "best" when signed out gives Newest, "near" with no place gives the default, junk gives Newest). Filters accept only known values, and the keyword has the characters that could bend the database query removed.
- Any page with a filter, a sort, a view or a page number above 1 is marked noindex and follow, and points its canonical address at `/jobs` (app/jobs/page.tsx:22).
- For me leaves out jobs the person hid or already applied to, read with their own sign in. Hides are private to the person (tested in area B).
- Speed of the in memory step, timed here with made up jobs: 1,000 jobs take 3 ms for For me, 4 ms for Closest and under 1 ms for Newest. 5,000 jobs take 5 ms, 14 ms and 2 ms. The sorting is not a cost. The cost is fetching the list: 1,000 jobs is about 285 KB of data from the database on every For me or Closest page view.

### Findings

**E-01 Everything quietly stops at 1,000 live jobs.** Low today, Medium when Kestrel is busy. Confirmed. For me, Closest, town searches and Recommended only ever see the newest 1,000 live jobs (`RADIUS_SEARCH_LIMIT`, lib/public-jobs.ts:15, and `listLiveJobsForMatching`). The filter counts and the landing page counts ask for 2,000 rows, but Supabase hands back at most 1,000 rows per request unless the project setting is raised, so those counts would freeze at 1,000 as well (lib/public-jobs.ts:119 and :182). The sitemap lists at most 1,000 jobs (:167). With 5,000 live jobs, 4,000 would be missing from For me, from town searches and from the sitemap, with no error and no message. The whole of Canadian eye care is unlikely to have 1,000 live posts on Kestrel for a long time, so this is a "know the ceiling" finding. Fix when live jobs pass about 500: do the distance filter in the database (a small table of places with coordinates), count with a database query, and split the sitemap. 1 to 2 days.

**E-02 Each For me or Closest page view moves the whole list.** Low. Confirmed. Up to 1,000 rows and 20 columns are fetched to show 20 cards, plus the filter count query (every live job's role and province), the person's profile, hides and applications. About 6 database round trips per page view. Fine at launch size. Fix with E-01.

**E-03 For me and "can apply" do not match.** Covered in A-05 and A-06: the list is narrower than the apply rule for assistants and reception, and it trusts the saved "other roles".

**E-04 Paging past the end shows an empty list.** Low. Confirmed by reading. `page` is capped at 500 but not at the real last page, so `/jobs?page=400` shows the count and no jobs, with no message. Fix: clamp to the last page. 10 minutes.

**E-05 "Show all jobs" brings hidden and already applied jobs back with no mark.** Idea. In the "all" view a job the person hid or applied to looks like any other. A small "Applied" label on the card would save people opening it.

## Area F. Resume reader

Tested for real: I built made up resumes and hostile files in a throwaway test (not committed) and ran them through `resumeText` and `readResume` exactly as the website does. Packages: `unpdf` 1.9.1 and `fflate` 0.8.3, both pinned, `npm audit` reports 0 problems for either, neither runs an install script, and the production build bundles both without warnings.

| Test | Result |
| --- | --- |
| Made up optician resume as Word and as PDF | Read in 4 ms and 93 ms. Suggested role (Optician), years (10 or more, from 2 jobs), registered in Ontario, phone, 1 software name. Missed the town ("Thunder Bay, Ontario" on the same line as the phone and email) and 1 of 2 software names |
| Old .doc name, not a real PDF, not a real zip, empty page, 1 byte over 3 MB | All refused cleanly with the right message |
| What gets logged on a failure | Only the parser's own error ("Invalid PDF structure.", "invalid zip data"). I planted a marker in the bad files and it did not appear in the log. No `console` call anywhere in the 3 files prints resume text |
| Is the text stored | No. It lives in the request and only ticked answers are written, after the server reads the file a second time |
| Word file whose main part is 300 MB when unzipped (300 KB zipped) | Skipped at once (0 ms) |
| The same file lying about its size (claims 1,000 bytes) | Not expanded in memory (+2 MB), but the unzip still walked the stream for 1.1 seconds |
| PDF with 3,000 pages (2.3 MB) | **All 3,000 pages were processed** (2.4 seconds, +254 MB of memory). Only the first 12 pages of text were returned |
| Word file with 100 KB of "<" characters | **10 seconds** of solid processor time |
| Word file with 400 KB of unclosed `<w:br` tags | **45 seconds** |
| Word file with 400 KB of "<" | Still running when I stopped it at 90 seconds |
| The fixed rules (`readResume`) fed 200,000 characters of awkward text, 14 kinds | All under 70 ms except repeated year ranges (2.8 seconds) |

### Findings

**F-01 A small crafted Word file can keep the reader running for minutes.** Medium to High. Confirmed. `textFromDocx` (lib/resume-text.ts:25 to :29) cleans the file's text with patterns that take time proportional to the square of the input when the text has many "<" and no ">". 100 KB took 10 seconds here, 400 KB over 90 seconds, and the code accepts up to 8 MB. Such a file zips to a few KB, passes the upload checks (they look at the first bytes and the name) and needs only a free candidate account. The work is one unbroken step, so the 8 second timer in the code cannot fire, and it is not applied to Word files at all. Effect: each press of Read my resume holds a server function at full processor until Vercel's own time limit ends it. Nobody's data is exposed. It is a cost and availability risk, and the person could repeat it. Fix: replace the patterns with a single pass that walks the text once, cap the unzipped text at about 1 MB, and add a limit of a few reads per person per hour. 1 to 2 hours with tests.

**F-02 The 12 page limit and the 8 second limit do not limit the work.** Medium. Confirmed. `textFromPdf` asks the library for every page and then keeps 12 (lib/resume-text.ts:36), so a 3 MB PDF with thousands of pages is fully processed (3,000 pages: 2.4 seconds and 254 MB here, and richer pages would cost more). The timer only stops waiting for the answer. The parsing carries on behind it and the timer itself is never cleared. Fix: read the page count first, refuse or stop at 12, and ask for those pages one at a time. Set an explicit `maxDuration` and memory for this action in the page that hosts it. 1 hour.

**F-03 Nothing limits how often someone can press Read my resume.** Low. Confirmed. Each press downloads the file and parses it, and saving parses it again. Fix with F-01.

**F-04 The public wording promises limits that F-01 and F-02 show are not real yet.** Low. Confirmed. `/security` says "with limits on size, pages and time" (app/security/page.tsx:56) and docs/cv-scanning.md says "at most 3 MB, 12 pages and 8 seconds". The size limit is real. Fix the code and the wording becomes true. The privacy page and the help topic match the code: no AI, nothing sent to another service, nothing saved until ticked.

**F-05 A hostile PDF can still reach the PDF library.** Low. Known and written down in docs/cv-scanning.md. The upload check looks for scripts in the raw bytes and cannot see inside compressed parts. The library does not run scripts in a PDF, and I found no known problem in this version. Keep it on the list for the antivirus decision.

**F-06 Could not verify on Vercel.** Whether the functions run in a Canadian region (vercel.json sets none, so the project setting decides), and the real time and memory limits for a server action on the current plan. The build works, and both packages are plain JavaScript with no native parts, so I expect them to run there. Steve: after the fix, try Read my resume once on a preview with a real PDF and a real Word file.

**F-07 Accuracy notes for the improvement round.** Idea. On my made up resume the reader missed the town when it shared a line with the phone and email, and missed "Visual-Eyes". Worth adding as tests when Steve sends his samples.

## Area G. Email and CASL

Every send goes through 1 function (`deliverEmail`, lib/email.ts). There are 17 call sites. No other code talks to Resend.

Verified as expected:
- **Sender and replies.** From "Kestrel Eye Care Jobs <hello@mail.eyecarejobs.ca>" unless `EMAIL_FROM` says otherwise. Replies go to hello@eyecarejobs.ca unless `EMAIL_REPLY_TO` is set.
- **Mailing address.** 6013 Yonge Street, 3rd Floor, North York, Ontario M2M 3W2, Canada is in the footer of both layouts, HTML and plain text, so every email has it.
- **Unsubscribe.** Job alerts, first week emails, outreach and the "you're on the list" email carry a signed unsubscribe link, the reason the person is receiving it, and a `List-Unsubscribe` header. Unsubscribing takes effect at once (well inside CASL's 10 business days), writes the address to the do not email list, and the page answers the same whether or not the code matches, so it cannot be used to test who is on a list.
- **Do not email list.** Checked before every email that has an unsubscribe link, and if the list cannot be read the email is not sent. Bounces and complaints from Resend are added by a signed webhook.
- **Daily budget.** The daily job stops at `DAILY_EMAIL_BUDGET` (default 50), holds the rest for tomorrow and tells Steve.
- **Demo never sends.** `deliverEmail` returns before anything else when `DEMO_MODE` is yes.
- **Off by default.** `ENABLE_ONBOARDING_EMAILS` and `ENABLE_OUTREACH` must be exactly "yes". Unset means off. The first week emails are claimed in the database before sending, so 2 copies of the job cannot double send (the unique rule also covers a failed read).
- **Wording.** Plain, warm, signed "The Kestrel team", no banned words, no dashes. The first week emails are specific to what the person has done, which is good practice.

### Findings

**G-01 The first week emails would go to people who never confirmed their email address, and to people who did not tick the marketing box.** Medium. Confirmed in code, and off today. `runOnboarding` (lib/onboarding-run.ts:26) picks every account from the last 12 days that has not unsubscribed. It does not look at whether the address was confirmed, or at `marketing_consent`. A profile row is created the moment someone signs up, before they confirm. So if a person types someone else's address, that other person gets up to 3 "Thanks for registering with Kestrel" emails. For the consent question the doc already says to ask the lawyer whether an account is an existing business relationship. Fix before switching on: skip accounts whose email is not confirmed (the auth record has `email_confirmed_at`), and put the consent question to the lawyer. 30 minutes.

**G-02 Two places promise a feature that does not exist.** Medium. Confirmed. The day 7 candidate email says "Kestrel can draft a cover letter from your profile for you to edit" (lib/onboarding-emails.ts:168), and the candidate checklist on the dashboard says "Kestrel can draft a cover letter for you to edit" (lib/checklist.ts:21, live now). The apply form offers saved letters and "Save as a draft". Nothing writes a letter for the person. It also reads like AI, which Kestrel says it does not use on candidates. Fix: change both to "you can save a cover letter and reuse it". 10 minutes.

**G-03 Emails without an unsubscribe link never check the do not email list.** Low to Medium. Confirmed. Account emails (application updates, new applicant, job live, claim emails, the waitlist "please confirm") skip the check by design, because the list was built for marketing. But the list also holds addresses that hard bounced or filed a spam complaint, and those keep being emailed. Repeatedly sending to dead or complaining addresses is what damages a sending domain's standing. Fix: always skip addresses whose reason is `bounced` or `complaint`, whatever the email. 30 minutes. (D-03 is the same root.)

**G-04 Emails triggered by people are outside the daily budget.** Low to Medium. Confirmed. The budget covers the daily job only. A clinic that ticks 100 applicants and presses decline sends 100 emails at once (lib/applicant-actions.ts, `BULK_MAX` 100), and every new application emails a clinic. On Resend's free plan (100 a day, shared with "confirm your email" and password resets) one busy afternoon could stop sign up emails until the next day. Fix: move to Resend's paid plan before launch (already on Steve's list from R7), and count these sends against a shared counter. Could not verify which plan is active.

**G-05 The unsubscribe header has no one click form.** Low. Confirmed. `List-Unsubscribe` points at a page where the person presses a button. Gmail and Yahoo ask bulk senders for the one click version (`List-Unsubscribe-Post`). Kestrel is far below their bulk threshold, so this is polish. 1 hour.

**G-06 The job alert email has no pay.** Low. See A-01.

**G-07 Unsubscribing from news also stops job alerts, without saying so.** Low. Confirmed. The daily job skips anyone with `unsubscribed_at` set (cron line 255). That is the safe reading of CASL, but the alerts page still shows the alerts as active. Fix: say so on the alerts page, or ask at unsubscribe "all email, or only news?". 30 minutes.

**G-08 Numerals in 2 subject lines and bodies.** Low. "Three things" twice (A-21).

### Could not verify from here

- Supabase's own emails (confirm your address, reset password, change email): their wording, sender and footer live in the Supabase dashboard, for the live project and the demo project. The demo banner says no email is sent, but a sign up or password reset on the demo would be sent by the demo's Supabase project if email is switched on there.
- That SPF, DKIM and DMARC records for mail.eyecarejobs.ca are in place, the Resend plan, and that the webhook secret is set.
- What `ENABLE_ONBOARDING_EMAILS`, `ENABLE_OUTREACH` and `DAILY_EMAIL_BUDGET` are set to in each Vercel project.

## Area H. Accessibility and mobile

How it was tested: the site was built and run here against a small stand in for Supabase that I wrote for the audit (sample data, kept outside the repository), so signed in pages could be opened as a candidate, a brand new candidate and a clinic. A browser at 375 pixels wide opened 27 pages (11 public, 11 as a candidate, 5 as a clinic). On each page my own script measured text contrast against its background, tap sizes, names for screen readers on every link, button and field, sideways scrolling, heading order, image descriptions and duplicate ids. I then opened the phone menu, pressed Tab through the desktop top bar, and looked at screenshots. This is not a full screen reader test, and I did not test at 200 percent text size.

Verified as expected, on all 27 pages:
- 0 contrast failures against WCAG AA (4.5 to 1 for text, 3 to 1 for large text).
- 0 pages scroll sideways at 375 pixels.
- 0 links, buttons or fields without a name. The envelope reads "Inbox, 3 unread", the initials menu reads "Account menu for Jordan Sample".
- Every page has 1 main heading, a skip link, a main landmark, a language and a title. 0 images without a description. 0 duplicate ids.
- Tap sizes: every button and menu row is 44 pixels or taller. The envelope is 44 by 44. The phone menu rows are 51 pixels.
- Keyboard: Tab goes skip link, logo, My dashboard, Find jobs, Job alerts, Inbox, account menu, then the page, in reading order. Every stop shows a 3 pixel navy focus ring. The phone menu closes on Escape and on a tap outside, and marks the current page.
- The first step page groups its 3 choices in a labelled group ("Where are you in eye care?") and has both Save and continue and Skip for now. A brand new candidate is sent there once from the dashboard with no loop.
- The profile's closed sections ("More about you", "What you are looking for") are real open and close controls with 44 pixel headers. The 6 clinic dashboard tiles are single links, each the full width of the phone. For me shows "Showing jobs that fit your profile" with a Show all jobs button, and Sort by has a label for screen readers.

### Findings

**H-01 On a phone the top bar gives no sign of unread messages.** Low to Medium. Confirmed. Screenshots: `docs/audit/2026-11-part1/phone-top-bar-no-envelope.png` and `phone-menu-inbox-count.png`. At 375 pixels the envelope is hidden and the count only appears as "Inbox (3)" inside the menu. A candidate on a phone who has turned off emails would not know a clinic wrote to them unless they open the menu. Fix: keep the envelope beside the menu button on phones, or put a small dot on the menu button with "Menu, 3 unread" for screen readers. 30 minutes.

**H-02 The home page's sample job picture says "Use your saved CV".** Low. Confirmed. `public/home/sample-job.png`. The wording test reads code, not pictures, as the audit plan warned. Fix: retake the picture from the current job page. 10 minutes.

**H-03 The tagline under the logo is 9 to 10 pixels.** Low. Confirmed on every page ("Canada-wide eye care job board"). It passes contrast and it is part of the brand lockup, but text that small is hard to read on a phone. Steve's call, since the lockup is his. It could be hidden from the phone header and kept in the footer.

**H-04 Heading levels skip on 3 pages.** Low. Confirmed. My applications, the inbox and the applicants list go from the page heading straight to third level headings. Screen reader users who move by heading see a gap. Fix: make the item titles second level. 10 minutes.

**H-05 The 3 radio rows on the first step page are 24 pixels tall.** Low. Confirmed. Screenshot `phone-first-step.png`. That meets the newer minimum (24) but they sit tight together, and the rest of the site uses 44. Fix: a little more row height. 5 minutes.

**H-06 "Now live" notices stack up on the clinic dashboard.** Low. Likely. Each approved job gets its own green box with See your job and Dismiss. A clinic with 5 jobs approved together gets 5 boxes before the dashboard starts on a phone. My sample clinic had many live jobs, which exaggerates it. Fix: fold more than 2 into 1 box with "Dismiss all". 30 minutes.

**H-07 Opening a message does not clear its count.** See A-18.

### Not tested

A real screen reader (VoiceOver or NVDA), 200 percent text, reduced motion, and real phones. The last full pass of those was 6th November 2026 (`docs/audit/ACCESSIBILITY-PASS-2026-11-06.md`), before the top bar, inbox and first step page were added.

## Area I. Docs against reality

Method: I read `/privacy` and `/security` as a visitor sees them (from the running site) and compared each statement with the code and the database tests. For the help centre I pulled out all 172 button and page names it puts in bold and searched the real screens for each, then read the topics for the newest features. The lawyer packs were searched for 21 feature words.

Verified as expected:
- Help centre: 167 of 172 bold names match the screens word for word. The other 5 are fine ("Within 10 km" is built from a number, "Mark filled." is a lead in to the real **Filled it?** button). The inbox, name change (first change free, 30 day wait), Fill in from my resume, shortlist privacy and "Kestrel does not rank applicants with AI" topics all match the code.
- `/security`: who can see what, 1 minute resume links, refused file types, sign in slow down, bot check, keys out of public code, no certification claimed. All match. It carries its "draft, not yet reviewed by a lawyer" banner.
- `/privacy`: the service provider list (Supabase, Vercel, Resend, Google, Cloudflare, Anthropic) matches the code. Job view counts, waitlist source tracking, the 1 minute link, deletion and the do not email list are described correctly.

### Findings

**I-01 The privacy policy lists less than Kestrel collects from candidates.** Medium. Confirmed. `/privacy` says a candidate's profile holds "your role, where you are licensed, your experience, when you are available, and a phone number". The profile also stores town and province (now required to apply), how far the person will travel, provinces they would work in, types of work, other roles, lowest pay they would accept, independent or corporate preference, practice software, the "where are you in eye care" answer, and jobs they marked not interested. The inbox messages and the date of a name change are not mentioned either. None of this is shown to clinics (tested), but the policy should say it is held. The page still says "Last updated 5th November 2026" although the resume reading paragraph was added on 12th November. Fix: add the list and the date. 30 minutes, then to the lawyer.

**I-02 "We only email you if you ticked the consent box" will stop being true.** Medium. Confirmed. The next section explains that account emails are still sent, which covers application updates. The first week emails are neither: they go to every new account whether or not the box was ticked (G-01). Fix the wording or the behaviour before `ENABLE_ONBOARDING_EMAILS` is switched on. Lawyer question.

**I-03 The lawyer has not been told about anything built since 5th November 2026.** High for the legal track (not a code risk). Confirmed. The 2 privacy packs were last built on 5th November and the employment pack on 31st October. None of them mentions: resume reading on Kestrel's server (0 mentions), the inbox (0), the career stage answer (0), the name hold (0), the first week emails (0), pay as a percentage only, a guaranteed minimum or a daily rate (0), job view and apply click counts (0), Recommended for you and the private preferences behind it, including lowest pay (0), the found listings reader and the province search that saves clinics' published contact emails (0), or the price comparison page that names competitors (0). They also say "CV" 13 times. Fix: rebuild the pack (the script exists, `docs/legal/build-lawyer-pack.py`) with a "what changed since 5th November" page listing these, plus the questions already noted in the docs (may a clinic ever see career stage, is an account an existing business relationship for the first week emails, does a percentage only pay line satisfy Ontario's rule). 2 hours.

**I-04 `docs/security.md` has 3 statements that are now wrong.** Medium. Confirmed. (a) "CVs are never opened or processed by our servers, so there is no pipeline an uploaded file could attack". Wrong since 12th November (and F-01 shows the pipeline matters). (b) "If only one [bot check key] is set, the forms carry on without it". The code now refuses sign ups on the live site when a key is missing (lib/turnstile.ts), which is safer, but the doc would mislead someone debugging a broken form. (c) "Packages: 11 direct". There are 13. Fix: 15 minutes.

**I-05 "Anthropic sees only the job details a clinic types in" is slightly narrow.** Low. Confirmed. The ad builder also sends up to 8 of the same clinic's earlier ads as style examples (lib/ad-builder.ts:67), and the admin tools send the text of a clinic's public careers page and web search requests. No candidate information goes to Anthropic, so the important half of the sentence holds. Fix: "sees job details and the clinic's own earlier ads, and public careers pages we read". 5 minutes.

**I-06 CLAUDE.md is behind in 5 places.** Low. Confirmed. (a) "Industry directory ... Not built": it is live on `/resources` (lib/directory-data.ts, components/DirectoryTable.tsx). (b) The pay rule (A-02). (c) The name hold wording (A-15). (d) "The coming soon page (app/page.tsx) is a faithful copy of the Wix version and is live": the pre launch layout has been live since 8th November. (e) docs/discoverability-plan.md says the comparison page covers "Kestrel, Eluta and OJobs only", while the page's own description names 7 boards. Also docs/candidates-and-applications.md says the first step page has "3 optional questions" and the page says "Two quick questions". Fix: 20 minutes.

**I-07 "Hosted in Canada" and "Kestrel's own server".** Low, could not verify. The database and file store region is a Supabase setting I cannot see. The resume reader runs on Vercel, which the policy correctly lists as a United States provider, so "our own server" means Vercel's, probably outside Canada unless the project's function region is set to Montreal. The policy's "may handle requests on servers outside Canada" covers it. Worth one line to the lawyer, and worth setting the function region to Canada if the plan allows.

## Area J. Tests, dead code and health

- **Tests.** 425 tests in 79 files, all passing in 4 seconds. They cover the rule files well (pay, roles, wording, emails, limits). Every file that talks to the database or handles a request is untested: all 22 action files, `resume-text.ts` (the file with the F-01 and F-02 problems), `notifications.ts`, `onboarding-run.ts`, `public-jobs.ts`, `auth.ts`. There is no test that runs a page. That is a reasonable trade for a 1 person project, but it is why A-09 (the clinic page showing the wrong status) got through.
- **Gaps in tests for the new code:** no test that the clinic's application page shows Shortlisted, none for the resume file limits, none that "For me" agrees with the apply rule, none for the data download's contents, and the style guard skips `lib` (A-20).
- **Dead code.** None found: every file in `lib` and `components` is imported somewhere. A stale comment in lib/applicant-actions.ts:44.
- **Duplication.** The same id pattern is defined in 27 files and the site address constant in 14. Harmless, but a shared file would be tidier. `getApplication` being shared between the candidate and clinic pages is the one duplication that should exist and does not (A-09).
- **Packages.** 13 direct, all pinned, 0 audit problems, no install scripts. Small updates waiting for next, supabase-js and the Anthropic SDK.
- **Settings.** The code reads 36 settings. `.env.example` lists 12 and `docs/security.md` covers the secrets. The 17 on and off switches (`ENABLE_SEEDING`, `ENABLE_OUTREACH`, `ENABLE_ONBOARDING_EMAILS`, `ENABLE_GOOGLE_SIGNIN`, `ENABLE_COMPARE`, `ENABLE_FIND_YOUR_FIT`, `ENABLE_HOME_BLOG`, `CLINIC_SIGNUP`, `LAUNCH_HOME`, `PRELAUNCH_HOME`, `MAINTENANCE_MODE`, `DEMO_MODE`, `DAILY_EMAIL_BUDGET`, `OUTREACH_DAILY_LIMIT`, `INDEXNOW_KEY`, `AD_BUILDER_MODEL`, `PAGE_READER_MODEL`) are each explained in a different doc, and there is no single page that lists them all with what each should be in the live project and in the demo project. With 2 Vercel projects that is where a mistake will happen.
- **Demo mode.** When `DEMO_MODE` is yes: a banner on every page, robots.txt blocks everything, every page carries a noindex header, the sitemap is empty, IndexNow is off and no email leaves through Kestrel's sender. Not covered by the switch: Supabase's own sign up and password emails (sent by the demo's Supabase project if email is on there), the ad builder (it would spend real Anthropic credit if the demo has the key), and the bot check (off on the demo by design).

### Findings

**J-01 No single list of settings for the 2 Vercel projects.** Medium. Confirmed. Fix: 1 table in docs (setting, what it does, live value, demo value, secret or not), and bring `.env.example` up to date. 1 hour.

**J-02 The files that touch the database have no tests.** Medium. Confirmed. Fix, in order of value: a test for the clinic application page loader (A-09), tests for the resume file limits (F-01, F-02), and 1 scripted walk through of sign up, apply, shortlist and decline against the scratch database. Half a day to 2 days depending on depth.

**J-03 Small updates are waiting.** Low. next 16.4.3 to 16.4.6, @supabase/supabase-js 2.118.0 to 2.119.0. Do with the next change.

## Area K. SEO and search visibility (overview)

Reach: I could not open https://eyecarejobs.ca from this session (the session's network rules do not allow that address), so every check below was made on the same code built and run here in production mode with sample jobs. Real server response times, what Google has indexed and the Search Console data are for Steve to check. Speed was measured with the browser here set to behave like a mid range phone on slow 4G (150 ms delay, 1.6 Mbit, processor slowed 4 times). It is a Lighthouse style measurement, not Lighthouse itself, and the server was on the same machine, so the numbers leave out real server time.

### K1. Technical

Verified as expected:
- `robots.txt` allows the public site, blocks the account, admin and sign in areas, and names the sitemap. It does not block AI crawlers. On the demo it blocks everything, and every demo page carries a noindex header.
- The sitemap lists the home page, the 13 fixed public pages, each live job, each published blog post, and only the province and role pages that have live jobs. Jobs carry the date they went live. It is rebuilt hourly and keeps the last good copy if the database cannot be read.
- Every public page has 1 title, a description, a canonical address pointing at itself, Open Graph tags with a 1200 by 630 image, `lang="en-CA"` and 1 main heading.
- Filtered, sorted, "view" and later pages of `/jobs` are noindex and follow, with the canonical on `/jobs`. Province and role pages with 0 jobs are noindex and follow. An unknown address, a job that has ended, an unknown blog post and `/eye-care-jobs/quebec` all return a real 404 with noindex.
- JobPosting data on the job page is valid and matches the visible page: title, description (with the area covered and extra pay lines the page shows), date posted, valid through, employment type, hiring organisation, town, province code and country, base salary with the right unit, direct apply, address and identifier. A percentage only job gets no salary figure and the pay sentence goes in the description. A job that has ended returns 404, so its data goes at once. A found listing that is not claimed gets no job data.
- Blog posts carry Article data with dates. Province and role pages carry breadcrumbs.
- Scheduled blog posts: in production mode the 20 future posts return 404, are missing from the blog page and the sitemap, and appear on their date without a new deployment. On previews they show with a "Scheduled" note.
- The IndexNow key page answers only when a valid key is set.

Findings:

**K-01 The home page has lost its Organization and WebSite data.** Medium. Confirmed. The data that tells Google and AI assistants who Kestrel is (name, logo, description, LinkedIn link) sits inside the old `ComingSoon` component (app/page.tsx:36 to :56). The pre launch layout that has been live since 8th November (`PreLaunchHome`) and the launch layout (`LaunchHome`) do not output it. The home page here returned 0 structured data blocks. Fix: move the block into `app/page.tsx` itself so every version of the home page carries it. 10 minutes.

**K-02 Every public page is rebuilt for every visitor and can never be cached.** Medium to High for the search goal. Confirmed. See K2.

**K-03 Web fonts arrive late and push the page around.** Medium. Confirmed. Layout shift measured 0.21 on a job page and 0.14 on Compare (Google's "good" line is 0.1). The cause is the 5 font files arriving 1.1 to 1.6 seconds in with nothing preloaded, so text is drawn in a fallback font and then reflows. Fix: load the same self hosted files through Next's font loader, which preloads them and sizes the fallback to match. 2 hours.

**K-04 Only the home page, job pages, blog posts and landing pages carry structured data.** Low to Medium. Confirmed. `/help` (35 questions and answers), `/resources` (the pay table, a dated and quotable data set), `/compare` and `/clinics` have none. FAQ and data set markup will not win rich results on Google for a site like this, but it is the form AI assistants and Bing read most easily. Fix: FAQPage on `/help`, a Dataset block with the source and date on the pay table. 2 to 3 hours.

**K-05 Small tag problems.** Low. Confirmed. (a) The description for province pages lowercases the place: "10 live jobs: eye care jobs in ontario". (b) `twitter:card` is "summary" although a large image is supplied, so shares show a small thumbnail. (c) Every page, including every job, shares the same picture. (d) The title of `/clinics` is "For clinics", which says nothing to a searcher. "Post eye care jobs in Canada" would. (e) "Fixed term" jobs are sent to Google as CONTRACTOR. TEMPORARY is closer for an employee on a fixed term. (f) Job data has no street address or postal code (Google lists these as recommended, and shows a warning without them) and no logo for the clinic.

**K-06 Three pages chase the same search.** Low. Likely. `/resources/ontario-job-ads`, the blog post "What every eye care job ad in Canada should include" and `/posting-policy` all answer "what must a job ad include in Ontario". Pick 1 as the main page and have the other 2 link to it.

**K-07 The sitemap stops at 1,000 jobs.** Low today. See E-01.

### K2. Rendering and speed

**What I found.** The build marks every route except `robots.txt`, `sitemap.xml` and the icon as "rendered on demand", and every public page answers with `Cache-Control: private, no-cache, no-store`. Two things cause it. `components/SiteHeader.tsx` calls `connection()` and then reads the sign in session so that a signed in person sees their own top bar on public pages, and 51 pages also set `force-dynamic`. So the blog, Resources, Compare, For clinics, Help and the policy pages, whose content only changes when the code changes, are built again on every request.

**What it does.**
- Each visit and each crawl by Google, Bing or an AI crawler runs a server function. For a signed out visitor that function reads the launch switch from the database, and `/jobs` adds the search and the filter counts. A signed in visitor adds 2 round trips for the session and 1 for the unread count on every page.
- Nothing can be served from Vercel's edge cache, so the time to first byte is the function's start up time plus the database round trips, every time. A cold start is typically several hundred milliseconds. Crawlers see that delay on every page.
- Cost: every page view counts against Vercel's function allowance. Small now, but it scales with crawl traffic, which is what the SEO plan is trying to grow.

**Measured here** (phone settings above, server time not included):

| Page | First paint | Largest paint | Layout shift | Blocking time | Requests | Total size | Script | Fonts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | 0.66 s | 0.66 s | 0.045 | 145 ms | 22 | 326 KB | 154 KB | 81 KB |
| Find jobs | 0.65 s | 0.65 s | 0.037 | 220 ms | 19 | 257 KB | 146 KB | 81 KB |
| A job page | 0.60 s | 0.60 s | **0.210** | 150 ms | 20 | 256 KB | 146 KB | 81 KB |
| A blog post | 0.63 s | 0.63 s | 0.041 | 152 ms | 20 | 258 KB | 146 KB | 81 KB |
| Resources | 0.64 s | 0.64 s | 0.037 | 218 ms | 19 | 290 KB | 146 KB | 81 KB |
| Compare | 0.69 s | 0.69 s | **0.143** | 215 ms | 19 | 258 KB | 146 KB | 81 KB |
| For clinics | 0.68 s | 0.68 s | 0.018 | 214 ms | 19 | 256 KB | 146 KB | 81 KB |

The pages are light and paint fast. The biggest causes of what is left: (1) the server work on every request, which these numbers do not show, (2) the font swap, (3) 146 KB of script on pages that are almost all text.

**A cheaper design.**
1. Pages that only change with the code (blog, Resources, Compare, For clinics, Help, the policy pages, the province and role pages): build them once and refresh hourly. Draw the header in its signed out form, and let a few lines of script in the browser swap "Sign in" for "My dashboard" when a sign in cookie is present. No private data is in the cached page, so nothing can leak between people. The hourly refresh also keeps scheduled blog posts appearing on their date.
2. Job pages: cache for 5 to 10 minutes and clear the cache when a job is approved, edited, closed or extended (the code already calls `revalidatePath` at those moments). Move the "this role is not your role" message to the apply page, where the person is signed in anyway.
3. `/jobs` with no filters for signed out visitors: cache for 5 minutes.
Effort: 1 to 2 days, with a preview for Steve. Risk: a signed in person briefly seeing the signed out header before the script runs.

### K3. Content

- **Blog.** 24 posts: 4 live, 20 scheduled weekly to 9th April 2027. Each has 1 clear subject and its own title and description. They are short, 380 to 630 words, with 1 to 5 links to other Kestrel pages. For "how to" searches the pages that rank are usually 2 to 3 times that length with specifics. The writing rules already ask for numbers, places and stories only Steve can supply, and that is what would lift these.
- **Hub and cluster plan.** The plan (Phase 3 of the intake plan) describes pillar hubs. No hub page exists yet. The posts link to each other, but there is no page such as "Working in eye care in Canada" that gathers the career posts, or "Hiring for an eye care clinic" for the clinic posts.
- **Province and role pages.** 12 provinces and territories by 10 roles, plus 12 province pages. Sensibly kept out of Google while they have 0 jobs. The side effect: until jobs exist, Kestrel has no page Google can index for "optician jobs in Ontario", which is the search that matters most.
- **Pay guide.** It lives inside `/resources` behind a drop down, as 1 address for every province and role. Nobody searching "optician salary Ontario" can land on a page about exactly that. Today those searches are answered by Job Bank, Payscale, Salary.com and Indeed.
- **Thin or duplicate.** K-06 above. `/contact` and `/security` are short but have a clear purpose.
- **What others rank for that Kestrel has no page for** (from 3 searches run on 12th November 2026, results list only, nothing copied): Job Bank holds most of the first page for "[role] jobs in [place]" with a page per role per town, and for wages with a page per role per region. Indeed has a page per job title. The Canadian Association of Optometrists runs classifieds at opto.ca. Kestrel did not appear for its own name in the index I searched. Gaps: town level pages (Toronto, Ottawa, Calgary, Vancouver), pay pages per role and province, locum optometrist pages, and public clinic profile pages.

### K4. Google for Jobs and AI assistants

**Google for Jobs.** What is needed: a public page per job, valid JobPosting data that matches the page, removal when the job ends, and a way for Google to find new jobs fast. Kestrel has the first 3. Missing or unverified: (a) Google Search Console is not recorded as set up anywhere in the repository (Bing is), and the sitemap needs submitting there. (b) Google's Indexing API, which is allowed for job postings and gets a new job seen in minutes instead of days. IndexNow, which is built, only reaches Bing. (c) The recommended street address and clinic logo. (d) Unclaimed found listings carry no job data by decision, so the launch stock will not appear in Google for Jobs until clinics claim or post.

**AI assistants.** Cheap ways to be named:
1. Put the Organization data back on the home page (K-01) and add `sameAs` links as profiles are created.
2. A plain "About Kestrel" facts page. There is none. One page with what Kestrel is, who it is for, where it operates, what it costs, when it opened and how to reach it, written as short factual sentences. Assistants quote pages like this.
3. Mark up `/help` as questions and answers, and the pay table as a dated data set with its source (K-04).
4. One page per pay question (see opportunities), each with the figure, the source and the date in the first 2 sentences.
5. Keep the name, the one line description and the logo identical on LinkedIn, Bing Places and any directory.
6. Compared with `docs/marketing/ai-visibility-baseline.md`: the 10 prompts are well chosen, but the log table in the file is empty, so the baseline has not been recorded in the repository. Prompts 3 and 8 are the ones Kestrel can win first, and they need the pay pages and 1 clear job ad rules page (K-06).

### K5. The 10 best SEO moves, ranked

| # | Move | Effort | Expected effect | What Steve must supply |
| --- | --- | --- | --- | --- |
| 1 | Put Organization and WebSite data back on the home page, fix the lowercase province, the share card and the `/clinics` title (K-01, K-05) | 1 hour | Small but immediate. Fixes how Kestrel is identified everywhere | Nothing |
| 2 | Set up Google Search Console, submit the sitemap, and check what is indexed | 30 minutes (Steve) | Needed to see anything else working | His Google account for Kestrel |
| 3 | Cache the public pages and fix the font shift (K-02, K-03) | 2 days | Faster pages for every visitor and crawler, lower running cost, passes Core Web Vitals on job pages | A look at the preview |
| 4 | Pay pages: 1 page per role and province from the Job Bank figures already in the code (about 55, optometrists left out as decided), each with the source and date | 1 to 2 days | High. These are real searches with weak, generic competitors, and the pages are quotable by AI assistants | Approval of the wording, and the yearly refresh |
| 5 | An "About Kestrel" facts page, and question and answer markup on `/help` | Half a day | Medium for AI assistants, small for Google | The facts: opening date, who runs it, what he is comfortable saying |
| 6 | Let province and role pages be indexed before they have jobs, by giving each real content (typical pay, the regulator, what the role needs in that province, a job alert sign up) | 2 days | High once live, because these are the main job searches. Risk of thin pages if rushed | A decision that it is worth doing before launch |
| 7 | Google's Indexing API for new and ended jobs | Half a day | Medium to High at launch: jobs show in Google for Jobs within minutes | A Google Cloud service account |
| 8 | 2 hub pages that gather the blog posts (careers, hiring), and lengthen the 6 strongest posts with specifics | 2 days, mostly Steve's stories | Medium, builds over months | Numbers, places and stories from his own knowledge |
| 9 | Town pages for the 10 largest cities once each has jobs | 1 day | Medium, later | Nothing |
| 10 | Links from others: associations, schools of opticianry, trade publications | Ongoing, Steve | High over time, and the one thing code cannot do | Waits for the disclosure conversation, as already decided |
