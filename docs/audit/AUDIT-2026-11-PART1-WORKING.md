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
