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
