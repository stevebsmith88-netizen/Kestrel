# Kestrel audit, part 1, 12th November 2026

Audited commit: `3e42a07` (main). Run by: a Claude Code cloud session, 1 auditor, working area by area with the progress saved after each (`docs/audit/AUDIT-PROGRESS-PART1.md`). Nothing outside `docs/audit/` was changed, no SQL was run on a real database, nobody was contacted and no pull request was opened.

Reach: the code, the full git history (441 commits on 77 branches), a production build run here on sample data, 2 throwaway Postgres 16 databases with every migration applied, and a browser at phone width. I could not reach the live site (this session's network rules do not allow eyecarejobs.ca), Vercel, Supabase, Resend, Cloudflare or Google. I was not allowed to download Supabase's API program, so "safe before the SQL" rests on reading the code. Everything I could not check is in section 4.

The evidence behind every line here, with the test results, is in `docs/audit/AUDIT-2026-11-PART1-WORKING.md`, under the area letters shown in the "From" column.

## 1. For Steve (one page)

**Overall:** the platform is in good shape and the decisions in CLAUDE.md are, with a few exceptions, what the code does. The database's access rules held in every test that matters: a clinic cannot see a candidate it has no application from, a candidate's town, minimum pay and career stage never reach a clinic, and nobody can make themselves an admin. No secret has ever been committed. All 425 tests pass, the build is clean and no package has a known problem. The new work from this week (inbox, first step page, name hold, resume reader) is safe to have live before the SQL is run.

What needs attention is narrower than last time. The resume reader, which is the first place Kestrel's own server opens a stranger's file, has 2 limits that do not work. The lawyer's pack is a week behind a busy week. And 2 promises are kept by the website but not by the database underneath it.

**Top 5 risks**
1. **A small crafted Word file can keep the resume reader running for minutes.** I built one and timed it: 100 KB took 10 seconds, 400 KB was still going at 90. It needs only a free candidate account. Nobody's data is exposed, but it is a cost and availability risk the day sign up opens. (P1-01, P1-04)
2. **The lawyer has not been told about anything built since 5th November.** Resume reading on our server, the inbox, the career stage answer, the name hold, the first week emails, pay as a percentage only, view counts and the preferences behind Recommended for you are in none of the 3 packs. (P1-02)
3. **Once the sign up gate opens, the website's sign up checks can be skipped.** The bot check, the clinic invitation code and the terms tick are checked by Kestrel's server, but Supabase's own sign up address is public. The closed gate blocks it today. (P1-03)
4. **Two promises hold on the website only.** A candidate who calls the database directly can read "shortlisted" on their own application, and can change their name during the 30 day hold. Both need technical skill, and both were confirmed on a test database. (P1-15, P1-16)
5. **Words that are ahead of the product.** The first week emails would reach people who never confirmed their address, the dashboard and a day 7 email say "Kestrel can draft a cover letter" when nothing does, and the privacy policy lists less than the profile now collects. (P1-06, P1-07, P1-08)

**Top 5 quick wins** (small effort, real value)
1. Fix the clinic's application page, which shows a shortlisted person as "Viewed". 30 minutes. (P1-05)
2. Put the Organization data back on the home page. It was dropped when the new layout went live on 8th November. 10 minutes. (P1-11)
3. Remove the 2 "Kestrel can draft a cover letter" lines, and retake the home page picture that still says "CV". 20 minutes. (P1-07, P1-37)
4. Add the missing items to the data download and the privacy policy's list. 1 hour. (P1-08, P1-09)
5. Correct the 3 wrong statements in `docs/security.md` and the 5 stale lines in CLAUDE.md. 30 minutes. (P1-17, P1-45)

**Do this first:** let Claude fix the resume reader (P1-01, P1-04) on a branch, about 2 hours, because it is the only finding where a stranger can cause trouble with nothing but a free account. Then rebuild the lawyer pack with a "what changed since 5th November" page (P1-02). Then the quick wins above in 1 small branch.

**A coaching note on sequencing:** this week added 4 features in 2 days, and the tests, the docs and the lawyer's pack did not keep up. That is the pattern to watch, more than any single finding. I would hold new features until Phase 1 and Phase 2 below are closed, and make "does the lawyer pack, the privacy policy and the help centre need a line?" a standing last step of every feature.

## 2. Findings, ranked

Severity: Blocker, High, Medium, Low, Idea. Confidence: Confirmed (reproduced or proven from the code), Likely (strong reading of the code), Possible (needs the live system). There are no Blockers in this part. Effort is Claude's time unless it says Steve.

### High

| ID | From | Where | What I saw | Why it matters | Fix | Effort | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P1-01 | F-01 | lib/resume-text.ts:25 to :29 | The Word file reader cleans the text with patterns whose running time grows with the square of the input when the text has many "<" and no ">". Timed: 100 KB, 10 seconds. 400 KB of unclosed tags, 45 seconds. 400 KB of "<", over 90 seconds. Up to 8 MB is accepted, such a file zips to a few KB and passes the upload checks. The 8 second timer cannot fire during this step and is not applied to Word files | Any candidate account can hold a server function at full processor until Vercel ends it, as often as they like. Cost and availability, no data exposure | Walk the text once instead of using the patterns, cap the unzipped text near 1 MB, limit reads per person per hour, add tests with these files | 1 to 2 hours | Confirmed |
| P1-02 | I-03 | docs/legal/*.html (built 5th November and 31st October) | 0 mentions of: resume reading on our server, the inbox, career stage, the name hold, first week emails, percentage only pay, guaranteed minimum, daily rate, view and apply click counts, Recommended for you and its private preferences, the found listings reader and province search, the comparison page. "CV" appears 13 times | The lawyer is reviewing a product that no longer matches. 3 open legal questions are waiting in the docs (may a clinic ever see career stage, is an account an existing business relationship for first week emails, does a percentage only pay line meet Ontario's rule) | Rebuild the packs with a "what changed" page and the 3 questions | 2 hours | Confirmed |
| P1-03 | D-01 | lib/auth-actions.ts:42, migration 0002 `handle_new_user`, migration 0021 `gate_new_users` | The bot check, clinic invitation code and terms tick live in Kestrel's `signUp`. Supabase's sign up address accepts a request sent directly with the public browser key, and the trigger takes `role: "clinic"` from what is sent. The closed gate refuses these today | The day the gate opens, a script can create accounts with no bot check, a clinic account with no invitation, and accounts with no terms record | Steve switches on Supabase's own CAPTCHA protection with the Turnstile keys. Keep the ticket rule for clinic sign ups while clinics are by invitation. Treat a missing terms version as "must agree at first sign in" | 2 hours, plus 10 minutes for Steve | Likely |

### Medium

| ID | From | Where | What I saw | Why it matters | Fix | Effort | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P1-04 | F-02 | lib/resume-text.ts:16, :36 | A PDF with 3,000 pages (2.3 MB) had every page processed: 2.4 seconds and 254 MB of memory. Only then are 12 pages kept. The timer stops the waiting, not the work | The stated limits ("12 pages and 8 seconds") do not bound time or memory | Read the page count first and stop at 12, one page at a time. Set a time and memory limit on the action | 1 hour | Confirmed |
| P1-05 | A-09 | app/clinic/applications/[id]/page.tsx:27, lib/candidate.ts:69 | The clinic's page loads the application through the candidate's loader, which turns Shortlisted into Viewed and removes the step from the history | A clinic that shortlists someone then sees "Viewed" on that person's page, while the list shows Shortlisted. The doc says the clinic sees Shortlisted everywhere | Give the clinic page its own unmasked loader, with a test | 30 minutes | Confirmed |
| P1-06 | G-01 | lib/onboarding-run.ts:26 | The first week emails pick every account from the last 12 days that has not unsubscribed. No check that the address was confirmed, or that the marketing box was ticked. Off today | Someone who types another person's address would cause that person to get up to 3 emails. The consent question is for the lawyer | Skip unconfirmed addresses. Put the consent question in the pack. Do both before switching on | 30 minutes | Confirmed |
| P1-07 | G-02 | lib/checklist.ts:21 (live now), lib/onboarding-emails.ts:168 | "Kestrel can draft a cover letter for you to edit". The apply form offers saved letters and a draft save. Nothing writes a letter | A promise the product does not keep, and one that reads like AI used on candidates | Reword both | 10 minutes | Confirmed |
| P1-08 | I-01 | app/privacy/page.tsx | The policy lists role, where licensed, experience, availability and phone. The profile also holds town and province, travel distance, provinces, types of work, other roles, lowest pay, practice preference, software, the career stage answer and hidden jobs. Inbox messages and the name change date are not mentioned. "Last updated 5th November" although text was added on the 12th | The policy should name what is held. None of it reaches clinics (tested) | Add the list and the date, then to the lawyer | 30 minutes | Confirmed |
| P1-09 | A-13 | app/account/export/route.ts:32 | The data download leaves out the same items: town, distance, provinces, work types, other roles, lowest pay, practice preference, career stage, hidden jobs, name change date | The policy says people can download a copy of their information | Add the columns, reading the 0037 column separately so it works before the SQL | 30 minutes | Confirmed |
| P1-10 | K-02 | components/SiteHeader.tsx:19, 51 pages with `force-dynamic` | Every public page answers `private, no-store` and is built again for every visitor and every crawler | Slower first byte, nothing served from the edge, cost grows with crawl traffic, which is what the search plan is trying to grow | Build the content pages once and refresh hourly, swap the header in the browser when a sign in cookie is present, cache job pages for a few minutes. Detail in section 5 | 1 to 2 days | Confirmed |
| P1-11 | K-01 | app/page.tsx:36 to :56 | The Organization and WebSite data is inside the old `ComingSoon` component. The pre launch home page, live since 8th November, outputs 0 structured data blocks | It is how Google and AI assistants learn who Kestrel is | Move the block up so every version of the home page carries it | 10 minutes | Confirmed |
| P1-12 | K-03 | app/layout.tsx:2 to :7 | Layout shift of 0.21 on a job page and 0.14 on Compare (the "good" line is 0.1), caused by 5 font files arriving late with nothing preloaded | A Core Web Vitals miss on the page type that matters most | Load the same self hosted fonts through Next's font loader | 2 hours | Confirmed |
| P1-13 | A-19 | lib/applicant-actions.ts:36, app/api/cron/daily/route.ts:131 | "Role filled" and the daily close out only touch people at Applied, Viewed or Shortlisted. Someone at Interview or Offer is never told and stays there for ever unless the clinic closes them by hand | The people who got furthest are the ones left hanging | On "role filled", list those people and ask the clinic for a message to each before closing | Half a day | Confirmed |
| P1-14 | A-02 | lib/job-pay.ts, CLAUDE.md | The code accepts a percentage with no dollar figure for optometrists, a guaranteed minimum, and daily rates up to $200 wide (agreed 9th November). CLAUDE.md still states only the $50,000 rule | Whether a percentage only line meets Ontario's pay rule is a legal question nobody has asked yet | Update CLAUDE.md. Add the question to the pack (P1-02) | 15 minutes | Confirmed |
| P1-15 | B-02, A-10 | migration 0006 policies on `applications` and `application_events` | Signed in as the candidate on the test database, `select status from applications` returned `shortlisted`, and the history rows showed the step | "A shortlist is never shown to the candidate" holds on the website, not in the database. Needs someone to call the API by hand | Keep the clinic's shortlist in a clinic only table, or stop candidates reading the raw status directly | Half a day plus SQL on both databases | Confirmed |
| P1-16 | B-01, A-14 | lib/account-settings-actions.ts:38, `profiles` column permissions | With the hold on, an update of the person's own name columns sent as their own sign in succeeded. Nobody can clear the hold date, but they do not need to | The hold can be skipped by anyone who calls the API directly | Take away the permission on the 3 name columns and save the name with the server's key after the check | 1 hour plus SQL on both databases | Confirmed |
| P1-17 | I-04 | docs/security.md | 3 statements are wrong: "CVs are never opened or processed by our servers", "if only one [bot check key] is set, the forms carry on" (the code now refuses on the live site), and "11 direct packages" (13) | It is the page to read on a bad day | Correct them | 15 minutes | Confirmed |
| P1-18 | J-01 | 36 settings across the code, 12 in `.env.example` | 17 on and off switches are each explained in a different doc. No single list says what each should be in the live project and in the demo project | With 2 Vercel projects, this is where a mistake will happen | 1 table: setting, what it does, live value, demo value | 1 hour | Confirmed |
| P1-19 | J-02 | lib/*-actions.ts, lib/resume-text.ts, lib/notifications.ts and others | 425 tests, all on rule files. No file that talks to the database or handles a request has a test, and nothing runs a page | It is why P1-05 got through | A test for the clinic loader, tests for the resume limits, then 1 scripted walk through against the scratch database | Half a day to 2 days | Confirmed |
| P1-20 | B-08 | cascades from `auth.users` (migrations 0005, 0006) | Deleting a clinic's account removed its jobs and the candidate's application to it. Deleting a candidate removed their application from the clinic | Already known (R5, October). Still waiting on the lawyer's retention answer. Listed so it is not lost | As R5 | As R5 | Confirmed |
| P1-21 | I-02 | app/privacy/page.tsx | "We only email you if you ticked the consent box". True for news. The first week emails would go to everyone | Becomes untrue when `ENABLE_ONBOARDING_EMAILS` is switched on | Fix the wording or the behaviour first (with P1-06) | 15 minutes | Confirmed |
| P1-22 | D-02 | proxy.ts:15 | The maintenance switch skips every `/api/` address. The waitlist still saves and emails, the daily job still runs and emails | "Stop everything" would not stop email unless the separate step in the breach plan is also followed | Check the switch at the top of the 5 API routes | 30 minutes | Confirmed |
| P1-23 | G-03, D-03 | lib/email.ts:35, app/api/waitlist/route.ts:79 | The do not email list is only checked for emails that carry an unsubscribe link. Addresses that bounced or complained keep getting account emails, and the waitlist "please confirm" email skips the check too | Repeated sends to dead or complaining addresses damage the sending domain | Always skip `bounced` and `complaint` addresses. Pass the unsubscribe link through on the waitlist email | 30 minutes | Confirmed |
| P1-24 | G-04 | lib/applicant-actions.ts (`BULK_MAX` 100) | The daily budget covers the daily job only. A clinic declining 100 applicants sends 100 emails at once | On Resend's free plan that is the whole day's allowance, shared with "confirm your email" | Paid Resend plan before launch (already on Steve's list as R7), and count these sends | Steve, plus 1 hour | Likely |
| P1-25 | E-01 | lib/public-jobs.ts:15, :119, :167, :182 | For me, Closest, town searches, Recommended, the filter counts and the sitemap all stop at the newest 1,000 live jobs, with no error | Not a problem until Kestrel is busy. Know the ceiling | When live jobs pass about 500: distance filter and counts in the database, split the sitemap | 1 to 2 days, later | Confirmed |

### Low

| ID | From | Where | What I saw | Fix | Effort |
| --- | --- | --- | --- | --- | --- |
| P1-26 | A-01, G-06 | app/api/cron/daily/route.ts:295 | The job alert email lists title, clinic and place, with no pay | Add the pay text | 20 minutes |
| P1-27 | A-03 | lib/jobs.ts:128 | "Canadian exp required", "Cdn exp." and "previous experience at a Canadian practice" get past the Canadian experience check. An admin still reads every post | Add the shapes, with tests | 30 minutes |
| P1-28 | A-04, B-03 | no database rule | A Quebec job sent straight to the database API was accepted into the review queue. Extend and approve do not re-check | Add Quebec to the database rule | 30 minutes plus SQL |
| P1-29 | A-05, A-06, E-03 | lib/recommend.ts:60 | For me is narrower than the apply rule (an assistant never sees reception jobs) and trusts the saved "other roles" list | Use `canApplyForRole` inside `recommend` | 30 minutes |
| P1-30 | A-08 | lib/candidate.ts:87 | The dashboard meter counts different things from "ready to apply": it can read 100 percent beside "Finish your profile" | Build it from the same 3 needs | 20 minutes |
| P1-31 | A-11 | app/account/export/route.ts:33, lib/applications.ts | Small hints of a shortlist: the download's "status changed" date moves, and a move from Interview back to Shortlisted shows as Interview becoming Viewed | Leave the date out, and block that backwards move | 30 minutes |
| P1-32 | A-12 | app/jobs/[id]/apply/page.tsx:74 | The apply page shows 4 of the 8 details that are sent (not phone, registered provinces, years, available from) | List them all | 15 minutes |
| P1-33 | A-15 | lib/account-settings-actions.ts, lib/name-hold.ts | If the server key is missing or the hold date fails to save, the name changes with no hold. "smith" to "Smith" starts the hold although the comment says it does not | Save through the server (with P1-16), fix the comment or the rule | With P1-16 |
| P1-34 | A-16 | lib/candidate-actions.ts:128 | The first step page always goes on to the profile and drops a "next" address | Carry it through | 20 minutes |
| P1-35 | A-17 | app/api/cron/daily/route.ts:142 | "No update from the clinic" sends an email but no inbox message | Add the message | 15 minutes |
| P1-36 | A-18, H-07 | app/account/inbox/page.tsx | Opening a message does not mark it read, messages are never deleted, and the page shows the newest 50 while the count covers all | Mark read on open, clear after 12 months | 1 hour |
| P1-37 | H-02 | public/home/sample-job.png | The home page picture says "Use your saved CV" | Retake it | 10 minutes |
| P1-38 | H-01 | components/AppBar.tsx | On a phone the envelope is hidden and the count only shows inside the menu. Screenshots in `docs/audit/2026-11-part1/` | Keep the envelope, or a dot on the menu button | 30 minutes |
| P1-39 | H-03, H-04, H-05, H-06 | header tagline, 3 list pages, first step page, clinic dashboard | Tagline at 9 to 10 pixels. Headings skip a level on My applications, the inbox and the applicants list. Radio rows 24 pixels tall. "Now live" notices stack 1 per job | Small layout fixes, tagline is Steve's call | 1 hour |
| P1-40 | A-20, A-21, G-08 | lib/style-guard.test.ts:13, 4 strings | The style test does not read `lib`, where every email and error message lives, and has no check for dashes or spelled out numbers. Found by hand: "Two quick questions", "Three things" twice, "one or two page resume" | Add `lib` and 2 patterns, fix the 4 | 30 minutes |
| P1-41 | B-05 | migration 0005 permissions | Any signed in person can read every column of a live job and of a clinic that has one, including the owner's account id and the admin columns. Visitors are limited to a public list | Give signed in people the same column list | 2 hours plus SQL |
| P1-42 | B-06 | `waitlist`, `onboarding_emails`, `candidate_job_hides`, `profiles` | These never had Supabase's default permissions removed. Row level security blocks reads and writes (tested). Truncate is not covered by it, and succeeded as a visitor on the test database. The API offers no way to send it | Revoke all, grant back what is needed. Check query for Steve in the working file | 20 minutes plus SQL |
| P1-43 | B-07 | end of supabase/combined/run-everything.sql | The final check covers 29 of 31 tables, 1 of 14 triggers, 1 of 23 functions and no policies | Add the 2 tables, policy counts and the rule triggers | 30 minutes |
| P1-44 | B-04 | no database rule | The database accepts a percentage only or daily rate job for an optician. The form refuses both | Add to the rule, or accept admin review as the backstop | 30 minutes plus SQL |
| P1-45 | I-06 | CLAUDE.md, 2 docs | 5 stale lines: the directory is "not built" (it is live on Resources), the pay rule, the name hold wording, the coming soon page, and the comparison page's list of boards | Update | 20 minutes |
| P1-46 | I-05 | app/privacy/page.tsx, app/security/page.tsx | "Anthropic sees only the job details a clinic types in". It also gets up to 8 of that clinic's earlier ads, and public careers pages the admin tools read. Never candidate information | Widen the sentence | 5 minutes |
| P1-47 | D-04 | lib/applicant-actions.ts:23 | A clinic's own 1,500 characters are emailed to its applicants from Kestrel's address, unreviewed | Show links as plain text and say the clinic wrote it | 1 hour |
| P1-48 | D-05, F-03 | lib/candidate-actions.ts, lib/resume-actions.ts | No cap on applications per day or resume reads per hour | Add caps | 30 minutes |
| P1-49 | D-07 | app/account/export/route.ts and others | The download needs no password. Some bulk steps ignore a failed history write. Sign up confirms an address is registered | Note only, or small fixes | 1 hour |
| P1-50 | E-04 | app/jobs/page.tsx | `/jobs?page=400` shows a count and an empty list | Clamp to the last page | 10 minutes |
| P1-51 | G-05, G-07 | lib/email.ts:40, alerts page | No one click unsubscribe header. Unsubscribing from news silently stops job alerts while the alerts page still shows them | Add the header, say so on the alerts page | 1.5 hours |
| P1-52 | K-04, K-05, K-06 | help, resources, compare, clinics, landing pages | No structured data on Help or the pay table. Province name lowercased in descriptions. Small share card. `/clinics` titled "For clinics". Fixed term sent to Google as contractor. 3 pages chase "what a job ad must include in Ontario" | Section 5 | 3 to 4 hours |
| P1-53 | F-04 | app/security/page.tsx:56, docs/cv-scanning.md | "With limits on size, pages and time" is not yet true for pages and time | Becomes true with P1-01 and P1-04 | With those |
| P1-54 | J-03 | package.json | Small updates waiting for next and supabase-js | With the next change | 15 minutes |

### Ideas, and decisions for Steve

| ID | From | Question |
| --- | --- | --- |
| P1-55 | A-07 | Only optician and optometrist are kept apart. A practice manager, assistant or supplier rep can tick Optometrist under "other roles" and apply. Is that intended? |
| P1-56 | A-15 | CLAUDE.md says the first name change is free and each later one starts a hold. The code starts the hold on the first change. Which did you mean? |
| P1-57 | A-04 | Should a field based job based in Ottawa whose territory includes Quebec be allowed? |
| P1-58 | E-05 | Mark jobs as "Applied" on the cards in the "Show all jobs" view. |
| P1-59 | F-07 | Resume reader accuracy: my made up resume lost its town (same line as phone and email) and 1 software name. Add as tests with your samples. |
| P1-60 | I-07 | Ask Vercel for a Canadian function region (Montreal), so the resume is read in Canada. Tell the lawyer either way. |

## 3. Verified as expected

- **First checks.** Type check clean. 425 of 425 tests pass. Build passes. `npm audit` reports 0 problems at every level. 13 direct packages, all pinned, none runs an install script. No secret in the working tree or in any of 441 commits on 77 branches.
- **Pay.** Shown on the job page, cards, search, apply page, dashboards and Google's job data. The range rule is right: $60,000 to $110,000 allowed, $110,001 refused, exempt when the top is over $200,000, hourly converted at 2,080 hours. The 2 questions are required to submit. The database refuses a post with no pay, a range too wide, or the 2 answers missing.
- **Quebec.** Refused in the clinic form, the admin post, found listings and the province search.
- **Apply rule.** The job page, the apply page and the server use the same function. Optician and optometrist are blocked from each other even with stale "other roles". Optometrists are blocked from field roles even with stale data. Field roles need the tick.
- **Ready to apply.** Role, resume, town and province, from 1 file, used by the profile, the apply page, the server, the dashboard, the first week emails and the admin numbers.
- **Shortlisting.** No email, no inbox message, "Viewed" on the candidate's pages and in the download, quiet in bulk actions.
- **Privacy, tested on a real database.** A stranger sees only their own rows. A clinic with no application from a candidate sees nothing of them. A clinic with an application sees that application and none of the profile. Nobody can make themselves admin, clear a name hold, forge or edit an inbox message, change an application, or point their resume at another file. Clinics cannot publish their own job, edit a live one, or touch another clinic's. Resume links last 60 seconds in both routes.
- **No AI in matching.** `lib/recommend.ts` is fixed rules. The Anthropic client is used only by the ad builder, found listings, province search and the setup check. Applicants are listed newest first.
- **First step page.** No loop, existing users without a role see it once, new columns saved only on the person's own row.
- **Inbox.** Written at the right moments, no applicant details in clinic messages, internal links only, read own and mark read only.
- **Writing rules.** My scan of every string in app, components, content and lib: 0 banned words, 0 em dashes, 0 curly quotes, 0 emoji, no capital CV in code.
- **Database.** 31 tables, all with row level security. The combined file equals the 39 migrations in order, and running it again on a database with data changed nothing. No function is callable by a visitor or a signed in person.
- **Safe before the SQL.** All 14 places that touch the new columns and table handle an error by carrying on. Likely, not Confirmed (see section 4).
- **Server actions and routes.** 73 actions and 13 routes: every one that reads or changes private data checks the role first, or a signed link, or the bot check. CSV downloads are admin only and safe to open in a spreadsheet. The redirect check from the October audit is fixed.
- **Find jobs.** View and sort values are cleaned and fall back sensibly. Filtered pages are noindex. Sorting 5,000 jobs takes 5 to 14 ms.
- **Resume reader.** No resume text is logged or stored. A zip bomb is skipped or not expanded. Broken files are refused cleanly. Both packages are current and bundle cleanly.
- **Email.** 1 sender function, 17 call sites. The mailing address is in every email. Marketing emails have a signed unsubscribe that works at once. The demo never sends. First week emails and outreach are off unless set to exactly "yes".
- **Accessibility at 375 pixels, 27 pages signed out and signed in.** 0 contrast failures, 0 unnamed controls, 0 sideways scroll, every button 44 pixels or more, correct keyboard order with a visible focus ring, menu closes on Escape.
- **Help centre.** 167 of 172 button and page names match the screens word for word, and the other 5 are fine.
- **SEO basics.** Robots, sitemap, canonicals, noindex rules, 404s, valid job data that matches the page, and scheduled blog posts hidden in production mode until their date.

## 4. Could not verify

Things that need the real database, Vercel, or Steve.

1. **The live site.** This session's network rules do not allow eyecarejobs.ca. To let a future audit read it, the address has to be added to the session's allowed network domains. Nothing in this report comes from the live site.
2. **Safe before the SQL, run for real.** Proven by reading, not by running, because I was not allowed to download Supabase's API program. Steve's check: on the live site today, sign in as a candidate, open the dashboard, the inbox and the account page, and change nothing. All 3 should load, the inbox should say "Nothing here yet", and the name boxes should be open.
3. **The live and demo databases.** Which migrations are applied, whether permissions match the test database, and the storage rules for the resume bucket. Steve can run the check query in the working file (finding B-06) in each Supabase project and send me the result.
4. **Supabase settings.** Whether CAPTCHA protection is on (P1-03), the allowed sign in addresses (R4 from October), the region, backups, and the wording of Supabase's own emails for the live and demo projects.
5. **Vercel settings.** The function region, time and memory limits for the resume reader, and what each of the 17 switches is set to in each project.
6. **Email.** The Resend plan, SPF, DKIM and DMARC for mail.eyecarejobs.ca, and the webhook secret.
7. **Search.** What Google and Bing have indexed, Search Console (not recorded as set up), real page speed with server time included, and whether `INDEXNOW_KEY` is set.
8. **Accessibility beyond my script.** A real screen reader, 200 percent text and real phones.
9. **The lawyer pack PDF pages themselves.** I searched the HTML they are built from.
10. **Carried over, not re-audited:** the October findings R1 to R60. I re-confirmed R5 (P1-20) and that R3 is fixed.

## 5. SEO overview

Full detail, with the method, is in the working file under Area K. Checked on a production build run here with sample jobs.

**Technical: mostly sound.** Robots, sitemap, canonical tags, noindex on filters, sort, view and empty landing pages, real 404s, valid JobPosting data that matches the page and disappears when a job ends or is an unclaimed found listing, Article data on posts, breadcrumbs on landing pages, and the IndexNow key page all behave as intended. Scheduled blog posts are not exposed early. The problems are P1-11 (home page identity data lost), P1-12 (font shift) and the small tag items in P1-52.

**Rendering and speed.** Every public page is built on demand and sent as `private, no-store`, because the header reads the sign in session on every page and 51 pages set `force-dynamic`. Measured on a phone profile (slow 4G, processor slowed 4 times, server time not included):

| Page | First paint | Largest paint | Layout shift | Blocking time | Requests | Total | Script | Fonts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | 0.66 s | 0.66 s | 0.045 | 145 ms | 22 | 326 KB | 154 KB | 81 KB |
| Find jobs | 0.65 s | 0.65 s | 0.037 | 220 ms | 19 | 257 KB | 146 KB | 81 KB |
| A job page | 0.60 s | 0.60 s | 0.210 | 150 ms | 20 | 256 KB | 146 KB | 81 KB |
| A blog post | 0.63 s | 0.63 s | 0.041 | 152 ms | 20 | 258 KB | 146 KB | 81 KB |
| Resources | 0.64 s | 0.64 s | 0.037 | 218 ms | 19 | 290 KB | 146 KB | 81 KB |
| Compare | 0.69 s | 0.69 s | 0.143 | 215 ms | 19 | 258 KB | 146 KB | 81 KB |
| For clinics | 0.68 s | 0.68 s | 0.018 | 214 ms | 19 | 256 KB | 146 KB | 81 KB |

The pages are light and quick to paint. What is left is the server work on every request (not in these numbers), the font swap, and 146 KB of script on pages that are mostly text. The cheaper design is in P1-10: content pages built once and refreshed hourly, the header swapped in the browser, job pages cached for minutes and cleared when a job changes.

**Content.** 24 posts, 4 live and 20 scheduled weekly to 9th April 2027, each with a clear single subject but short (380 to 630 words). No hub pages yet. Province and role pages are rightly hidden while empty, which leaves Kestrel with nothing Google can index for "optician jobs in Ontario" until jobs exist. The pay guide sits behind a drop down on 1 address, so it cannot be found for "optician salary Ontario". From 3 searches on 12th November 2026: Job Bank holds most of the first page for jobs by role and place and for wages, with Indeed, Payscale, Salary.com and the Canadian Association of Optometrists' classifieds behind it. Kestrel did not appear for its own name.

**Google for Jobs.** The job pages qualify. Missing or unverified: Search Console, Google's Indexing API for jobs (IndexNow only reaches Bing), and the recommended street address and logo. Unclaimed found listings carry no job data by decision, so launch stock will not show there until clinics claim or post.

**AI assistants.** Cheap moves: the home page identity data (P1-11), an "About Kestrel" facts page (there is none), question and answer markup on Help, 1 page per pay question with source and date, and the same name, line and logo everywhere. The baseline in `docs/marketing/ai-visibility-baseline.md` has good prompts and an empty log, so it has not been recorded yet.

**The 10 best moves, ranked**

| # | Move | Effort | Expected effect | What Steve must supply |
| --- | --- | --- | --- | --- |
| 1 | Home page identity data back, plus the small tag fixes (P1-11, P1-52) | 1 hour | Small, immediate | Nothing |
| 2 | Google Search Console, sitemap submitted, see what is indexed | 30 minutes, Steve | Needed to see anything else working | Kestrel's Google account |
| 3 | Cache the public pages and fix the font shift (P1-10, P1-12) | 2 days | Faster for every visitor and crawler, lower cost, passes Core Web Vitals | A look at the preview |
| 4 | Pay pages: 1 per role and province from the Job Bank figures already in the code, about 55, optometrists left out as decided | 1 to 2 days | High. Real searches, generic competitors, quotable by AI assistants | Approval of wording, the yearly refresh |
| 5 | "About Kestrel" facts page, and question and answer markup on Help | Half a day | Medium for AI assistants | The facts he is comfortable publishing |
| 6 | Let province and role pages be indexed before they have jobs, with real content: typical pay, the regulator, what the role needs there, a job alert | 2 days | High once live. Risk of thin pages if rushed | A decision to do it before launch |
| 7 | Google's Indexing API for new and ended jobs | Half a day | Jobs in Google for Jobs within minutes | A Google Cloud service account |
| 8 | 2 hub pages, and lengthen the 6 strongest posts with specifics | 2 days, mostly Steve | Medium, builds over months | Numbers, places and stories |
| 9 | Town pages for the 10 largest cities, once each has jobs | 1 day | Medium, later | Nothing |
| 10 | Links from associations, schools and trade publications | Ongoing, Steve | High over time. The one thing code cannot do | Waits for the disclosure conversation |

## 6. Suggested order of fixes

One phase at a time, on branches, with a preview for Steve. Nothing here has been started.

**Phase 1: close what a stranger could use, and the words that are wrong today.** About 1 working day.
P1-01 and P1-04 (resume reader), P1-05 (clinic sees Shortlisted), P1-07 (cover letter claim), P1-11 (home page data), P1-37 (CV picture), P1-17 and P1-45 (docs), P1-23 (do not email list for bounces), P1-26, P1-32, P1-40. No SQL.
*Gate: Steve tries Read my resume with a real PDF and a real Word file on the preview, shortlists a test applicant and sees "Shortlisted" on their page, and reads the changed lines.*

**Phase 2: the legal track.** About half a day for Claude, then the lawyer.
P1-02 (rebuild the packs with what changed and the 3 questions), P1-08 and P1-09 (policy list and data download), P1-14, P1-21, P1-46, P1-60.
*Gate: the pack is sent, and Steve has the lawyer's answer on the first week emails before P1-06 is switched on.*

**Phase 3: make the database keep the promises.** About 1.5 days, with 1 migration to run on both databases.
P1-15 (shortlist), P1-16 and P1-33 (name hold), P1-28 and P1-44 (Quebec and pay shapes in the rule), P1-41, P1-42, P1-43. Each must keep working on a database that has not had the SQL yet, and Steve gets the whole combined file.
*Gate: the access tests from this audit are added to the repository and pass on the scratch database, then the SQL is run on demo, checked, then live.*

**Phase 4: before the sign up gate opens.**
P1-03 (Supabase CAPTCHA and the clinic ticket), P1-06 (first week emails), P1-22 (maintenance switch), P1-24 (Resend plan and counting), P1-48 (caps), P1-18 (the settings table for both projects), P1-13 (people at Interview).
*Gate: Steve's settings check in both Vercel projects and both Supabase projects against the new table.*

**Phase 5: search.** Moves 1 to 5 from section 5, starting with Search Console.
*Gate: 2 weeks of Search Console data before deciding on moves 6 to 9.*

**Phase 6: tidy.** The remaining Low findings, P1-19 (tests for the database code), and P1-25 when live jobs pass 500.

Decisions needed from Steve before Phase 3 and 4: P1-55, P1-56 and P1-57.
