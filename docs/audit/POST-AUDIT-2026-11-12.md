# Kestrel post audit review, 12th November 2026

Reviewed: `main` at `a67323d` (fix phases A to G merged). Branch for this review: `audit/post-fix-review`. Only files under `docs/audit/` were written. No application code was changed, no SQL was run on the live or demo database, no setting was changed, nobody was contacted and no pull request was opened.

Reach: the code and history, tests, builds and 3 throwaway databases here, and the demo site (demo.eyecarejobs.ca). The live site (eyecarejobs.ca) is refused by this session's network settings, so nothing here was checked on the live site itself.

> **Correction, 12th November 2026:** the feedback described in this report as "the lawyer's" came from a paralegal friend. No lawyer is engaged yet. See `LEGAL-ON-A-BUDGET-2026-11-12.md` for the low cost plan.

## 1. For Steve (one page)

**Is the audit closed?** Yes, the code side of it. Of the 60 findings, 48 are fixed (36 re-tested today and passing, including all 3 High findings), 4 were partly fixed by your choice, 4 ideas were decided and built, and 4 remain: P1-20 (what happens to applications when an account is deleted), P1-25 (a ceiling at 1,000 jobs, for later), P1-58 (an idea) and P1-59 (waiting for your sample resumes). Main is healthy: 600 of 600 tests, a clean build, 0 vulnerable packages, no secrets in the history, and 117 of 117 database access tests on both kinds of test database. Nothing a fix changed broke something that used to work.

**What is not closed** is the legal and launch side, and the paralegal's review has made that sharper. Its first point is P1-20, the oldest open item in the project (October's R5).

**The 5 biggest risks now**
1. **A clinic deleting its account deletes every candidate's application to it**, and candidates lose them from their tracker. The paralegal advises fixing this before real applications. (X-01)
2. **There is no published policy for fake job reports.** The report button and admin queue exist; the policy the paralegal says Ontario requires does not. (X-02)
3. **9 sentences in the published policies and the sign up box are not true of the product today**, including the tick box that bundles job alerts with offers, which the paralegal suggested cleaning up now because it is live. (Section 6C)
4. **Gate A is not passed:** the meeting is not held, the disclosure not given, the company not formed. Outreach and found listings must stay off, as the paralegal also advised.
5. **The demo walk was only partly possible:** the candidate side is good, but the clinic's applicant screens (shortlist, decline, role filled) were not seen in a browser, because no job could be approved. On a phone, Find jobs shows 1.5 screens of filters before the first job, and the ad builder can add "internationally trained applicants are welcome" without being asked. (D-01, D-02)

**The 5 things to do next**
1. Read `LAWYER-QUESTIONS-2026-11-12.md`, change anything, forward it and book the meeting. It turns each of the paralegal's points into "here is my plan, please correct it", lists what is still open, and is written so you can send it unchanged.
2. Once the lawyer agrees the plan: Claude keeps applications when a clinic or job is deleted, and publishes a retention schedule.
3. Claude drafts the fake job policy page and fixes the sign up and waitlist wording and the 9 policy sentences.
4. Supabase Pro with backups, and a restore test, before anyone is invited.
5. Approve 1 audit job on the demo in a later session, so the clinic side can be walked in full.

**A coaching note:** the fix phases were done well and the evidence is real: the tests went from 425 to 600 and the database now keeps its own promises. The pattern to watch has moved from code to paperwork. The policies, the lawyer pack and `NEXT-STEPS-PHASES.md` all trail the product. A good habit from here: each change that touches what people are told ends with "does a policy page or the lawyer list need a line?"


## 2. Health check (Part 1)

| Check | Result |
| --- | --- |
| Type check (`npm run typecheck`) | 0 errors |
| Tests (`npm test`) | **600 of 600 pass** (425 at the audit, so 175 new) |
| Production build (`npm run build`) | Clean, no warnings |
| `npm audit`, all levels | 0 vulnerabilities |
| Secret scan, 108 commits since `3e42a07` | Nothing that looks like a key, token, password or private key. No `.env` file was ever added |
| Database access tests (`scripts/dev/rls-tests.sh both`) | **117 of 117** on the Supabase style database, **117 of 117** on the plain database |
| Scripted walk through (`scripts/dev/walkthrough.sh`) | **77 of 77** (sign up, apply, shortlist, decline, delete account) |
| Combined SQL file run twice | 84 OK and 1 NOT YET (resume storage, normal) on both runs, both databases. Safe to run twice |

## 3. Was everything done? (Part 2)

**How each was checked.** For the 3 High and 22 Medium findings I repeated the reproduction from the working file on today's `main`, or confirmed that the access tests now contain the original reproduction and pass. For Low findings and ideas I read the code on `main`. "Fixed and verified" means I saw it pass today. Where a fix needed SQL, the migration is in `supabase/combined/run-everything.sql` and runs twice without change (Part 1). CLAUDE.md records that you ran 0037 to 0042 on both databases on 12th November 2026; **please confirm that, and the date**, because I cannot see either database.

### Reproductions repeated today

| Finding | Then (audit, 3e42a07) | Now (main, a67323d) |
| --- | --- | --- |
| P1-01 hostile Word file | 400 KB of "<": still running at 90 seconds | 7 milliseconds. 400 KB of unclosed `<w:br `: 1 millisecond. 900 KB of "<": 16 milliseconds. A Word file whose text unzips to 8 MB is refused before it is opened |
| P1-04 3,000 page PDF | every page processed, 2.4 seconds, 254 MB | 12 pages opened, 0.14 seconds, 38 MB more memory |
| P1-03 sign up straight to Supabase | a script could create a clinic with no ticket once the gate opens | Refused with the gate open: no ticket, a made up ticket, a reused ticket, and a phone sign up. A Google sign up cannot name itself a clinic (10 tests) |
| P1-15 shortlist read | `select status` as the candidate returned `shortlisted` | Returns "not shortlisted"; the history shows no shortlist step; the clinic still sees it |
| P1-16 name hold bypass | the candidate's own sign in changed the name during the hold | Refused, with or without a hold. Only the server key can save a name |
| P1-05 clinic page showed "Viewed" | clinic page used the candidate's masked loader | Clinic page uses `getApplicationForClinic`; tested in `lib/application-loaders.test.ts` with a stand in database holding a shortlisted application |
| P1-28, P1-41, P1-42, P1-44 | Quebec into review; private columns readable; visitor could empty a table; optician daily rate accepted | All refused in the access tests |

### Every finding

| ID | Severity | Status | Evidence on main |
| --- | --- | --- | --- |
| P1-01 | High | Fixed and verified | Above |
| P1-02 | High | Fixed but now out of date | Packs rebuilt in Phase C. Since then Phases D to G and the paralegal's review have changed things. See Part 5B |
| P1-03 | High | Fixed and verified | Above. Migration 0041. Supabase's own CAPTCHA stays off, by your decision |
| P1-04 | Medium | Fixed and verified | Above |
| P1-05 | Medium | Fixed and verified | Above |
| P1-06 | Medium | Fixed and verified (code) | `lib/onboarding-run.ts:84` sends only to confirmed addresses. The consent question is still with the lawyer (Part 5) |
| P1-07 | Medium | Fixed and verified | No "draft a cover letter" anywhere; 2 tests guard it |
| P1-08 | Medium | Fixed and verified | `app/privacy/page.tsx` lists the preferences, lowest pay, career stage, town and the inbox |
| P1-09 | Medium | Fixed and verified | `lib/data-export.ts` adds the preferences, career stage, hidden jobs and name change date, each read separately |
| P1-10 | Medium | Fixed and verified | Build output: blog, Resources, Compare, For clinics, Contact, Help, the policy pages, the province and role pages and job pages are static, refreshed every 5 minutes. The home page is still built per visitor (Part 3, X-05) |
| P1-11 | Medium | Fixed and verified | `app/page.tsx` takes `organizationJson` from `lib/organization-data.ts` for every version of the home page; tested in `lib/home-page.test.ts` |
| P1-12 | Medium | Fixed but not verified | Fonts load through `next/font/local` (`app/fonts.ts`). The layout shift needs measuring on the deployed site (Part 4) |
| P1-13 | Medium | Fixed and verified (code) | `lib/applicant-actions.ts:173` onwards: people at Interview or Offer get the clinic's message when the role is filled |
| P1-14 | Medium | Fixed and verified | CLAUDE.md states the percentage, guaranteed minimum and daily rate rules |
| P1-15 | Medium | Fixed and verified | Above. Migration 0040 |
| P1-16 | Medium | Fixed and verified | Above. Migration 0040 |
| P1-17 | Medium | Fixed and verified | `docs/security.md` corrected |
| P1-18 | Medium | Fixed and verified | `docs/settings.md`, guarded by `lib/settings-doc.test.ts` |
| P1-19 | Medium | Fixed and verified | Loader tests, data download tests and the 77 step walk through |
| P1-20 | Medium | **Still open, and now the paralegal's first point** | Deleting a clinic still removes its jobs and the candidates' applications. The lawyer has now asked for this to be fixed before launch (Part 5) |
| P1-21 | Medium | Fixed and verified | The privacy page says the welcome emails are switched off and nobody is sent them |
| P1-22 | Medium | Fixed and verified (code) | The maintenance switch is checked in the waitlist, daily job, job event and unsubscribe routes |
| P1-23 | Medium | Fixed and verified (code) | `lib/email.ts:32` checks the do not email list for every email |
| P1-24 | Medium | Fixed and verified | 1 shared daily count (migration 0042, `lib/email-count.ts`); access test passes. A paid Resend plan is still yours to buy (R7) |
| P1-25 | Medium | Still open, by design | The 1,000 job ceiling is for later, when live jobs pass about 500 |
| P1-26 | Low | Fixed and verified | Job alert emails carry the pay (`lib/job-alert-text.ts`) |
| P1-27 | Low | Fixed and verified | "Cdn", "North American" and similar shapes caught, with tests |
| P1-28 | Low | Fixed and verified | Above |
| P1-29 | Low | Fixed and verified | `lib/recommend.ts:68` uses `canApplyForRole` |
| P1-30 | Low | Fixed and verified | The meter and "ready to apply" both come from `lib/profile-ready.ts` |
| P1-31 | Low | Fixed and verified | Download leaves out the date for a shortlist; backwards move refused |
| P1-32 | Low | Fixed and verified | `lib/application-details.test.ts` checks all 8 details are listed |
| P1-33 | Low | Fixed and verified | Names are saved through the server only (`lib/name-change.ts`) |
| P1-34 | Low | Fixed and verified | The first step page carries a safe "next" address through |
| P1-35 | Low | Fixed and verified (code) | The "no update from the clinic" email also leaves an inbox message |
| P1-36 | Low | Partly fixed (by decision) | Open links mark read; the 12 month clear out was not built (you decided to wait for the retention answer) |
| P1-37 | Low | Fixed but not verified | New picture in `public/home/`. To look at in Part 4 |
| P1-38 | Low | Fixed but not verified | Envelope kept on phones. To look at in Part 4 |
| P1-39 | Low | Partly fixed (by decision) | Headings, radio rows and notices fixed; tagline size left for launch, your decision |
| P1-40 | Low | Fixed and verified | The style test now reads `lib` |
| P1-41 | Low | Fixed and verified | Above |
| P1-42 | Low | Fixed and verified | Above. The check query for the real databases is in the fixes log; **tell me if you ran it** |
| P1-43 | Low | Fixed and verified | The final check now has 85 rows |
| P1-44 | Low | Fixed and verified | Above |
| P1-45 | Low | Fixed and verified | CLAUDE.md lines corrected |
| P1-46 | Low | Fixed and verified | The privacy and security pages now say Anthropic also sees earlier ads and public careers pages, never candidate information |
| P1-47 | Low | Fixed and verified (code) | A clinic's own words go as plain text with a line saying the clinic wrote them |
| P1-48 | Low | Partly fixed (by decision) | 30 applications per 24 hours. Resume reads per hour: not capped, your decision |
| P1-49 | Low | Partly fixed (by decision) | Small fixes made; the data download still needs no password, recorded as will not fix for now |
| P1-50 | Low | Fixed and verified | `clampPage` on `/jobs` |
| P1-51 | Low | Fixed and verified (code) | One click unsubscribe headers (`lib/unsubscribe-headers.ts`) and a note on the alerts page |
| P1-52 | Low | Fixed but not verified | Structured data, share card and titles changed. Google's view needs Search Console (your step) |
| P1-53 | Low | Fixed and verified | The security page wording is now true (P1-01 and P1-04 above) |
| P1-54 | Low | Fixed and verified | next 16.4.6, supabase-js 2.119.0 |
| P1-55 | Idea | Decided and built | Only optometrists apply for optometrist jobs (`lib/role-fit.ts`) |
| P1-56 | Idea | Decided and built | Every change starts the hold; capital letters alone do not (`lib/name-hold.ts`) |
| P1-57 | Idea | Decided and built | A field job based outside Quebec may cover Quebec; access test passes |
| P1-58 | Idea | Still open | No "Applied" mark on job cards in "Show all jobs" |
| P1-59 | Idea | Still open, waiting for you | The resume reader samples you were going to send |
| P1-60 | Idea | Decided | The Vercel region was already Montreal |

**Totals:** 48 fixed (36 verified today, 7 verified in the code only, 4 to check on the deployed site, and P1-02, which was fixed but is out of date again), 4 partly fixed by your decision, 4 decided ideas, 3 still open (P1-20, P1-25, P1-58), 1 waiting for you (P1-59).

### October findings still open (R1 to R60)

`docs/audit/NEXT-STEPS-PHASES.md` was never updated after October: it still says "nothing here is started", although Phase 1 was merged on 31st October. So it shows all 60 as open, which is wrong. From the code, `docs/audit/PHASE-0-RESULTS.md` and your to do list, these are the ones that look open today:

| Item | What | Who | Evidence |
| --- | --- | --- | --- |
| R1 | Supabase Pro and daily backups | You | Phase 0: Free plan, no backups. "Before any invitations" |
| R5 / R30 | What happens on deletion, and how long things are kept | Lawyer, then Claude | Still the cascade. No purge step in the code. The lawyer has now answered the direction (Part 5) |
| R7 | Paid Resend plan | You | Resend Free (100 a day) |
| R9 | Previews use live data | You | Phase 0: Preview ticked for the live Supabase keys. Not since re-checked |
| R14 | Vercel ownership and 2 step sign in | You | Waiting for Vercel Pro |
| R19 | Gate C, 50 live roles | You and Claude | Publishing found listings is off until the disclosure conversation |
| R23 | Virus scanner choice | You | `docs/cv-scanning.md` still lists the options |
| R28 / R57 | Privacy officer named, breach plan blanks | You and the lawyer | `docs/breach-plan.md` still says "Lawyer: (add after the first meeting)" |
| R2 (draft banners) | Terms, Posting policy and Security still carry the draft notice | Lawyer | `components/DraftNotice.tsx` used on 3 pages |
| R36 | Vercel Pro (Hobby is non commercial) | You | Before launch |
| R43, R46 | Revenue model net of fees; pricing in the product | Claude, at paid launch | Prices are decided; checkout is not built |
| R44, R59 | Docs tidy and cost estimate | Claude | Phase 5, any quiet week |
| R48, R51 to R53, R58, R60 | Low items and ideas | Claude | Phase 5. R58 (skill and internationally trained tags) not built |

Looks done from the code or your notes: R2 (tick), R3, R4, R6, R8, R10, R11, R12, R13, R15 to R18, R20 to R22, R24 to R27, R29, R31 to R35, R37 to R42, R45, R47, R49, R50, R54 to R56. Not re-tested one by one here. **Extra X-01 below** suggests refreshing that plan so it stops misleading.

## 4. Extras found along the way (Part 3)

Collected from the "noticed, not fixed" notes in `AUDIT-FIXES-LOG.md` (every phase), the commit messages on all 7 fix branches (every one is fully merged into `main`; nothing is stranded on a branch), and a comparison of `main` with `3e42a07` in the files the fixes touched. Ranked, most important first. Severity uses the audit's scale. Items marked **new** were not in any phase's notes.

| # | Severity | What | One line fix | From |
| --- | --- | --- | --- | --- |
| X-01 | Medium | **Deleting a clinic account still deletes the candidates' applications to it** (P1-20, R5). The paralegal names it as the first thing to sort before launch | Keep applications (with the job title and clinic name already saved on them) when a clinic or job is deleted; decide with the lawyer how long each side keeps them, then build the purge step | P1-20, lawyer |
| X-02 | Medium | **No published policy for fake or fraudulent job posts.** A "Report this job" link and an admin Reports queue exist, but no page says how reports are handled. The paralegal says Ontario requires this of the job board | A short "Reporting fake jobs" section (or page) linked from every job page and the footer, plus a help topic. Wording to the lawyer | **new**, lawyer |
| X-03 | Medium | **The career stage answer cannot be changed or cleared after the first step page**, which says "you can change them later in your profile" | Add the question to the profile, or change the first step wording | Phase C |
| X-04 | Medium | **Someone at Interview on a job that simply runs out is left at Interview for ever.** P1-13 covers "role filled" only | Have the daily close out tell Interview and Offer people too, with a kind standard message | Phase E |
| X-05 | Low | **The home page is still built for every visitor** (`force-dynamic`), as is `/jobs` with no filters. It is the most visited page | Save the signed out home page like the content pages | **new**, Phase F |
| X-06 | Low | **`docs/audit/NEXT-STEPS-PHASES.md` still says "nothing here is started"** and has no status per item, so it misreads as 60 open October findings | Add a status column, or replace it with the open list in section 3 | **new** |
| X-07 | Low | **The posting policy still says "contract"** where every screen says "Fixed term" | Change with the next legal page edit | Phase F, G |
| X-08 | Low | **The lawyer pack still gives the old prices** ($39, $49, $59 then $79) and 2 of its questions describe things fixed since | Rebuild the pack (Part 5B) | Phase C |
| X-09 | Low | **No way to bring back a job marked "Not interested"** | A "Hidden jobs" list on For me with an Undo | Phase C |
| X-10 | Low | **The candidate's own application page shows the clinic's message without the "written by the clinic" line** that the email and inbox now carry | Add the line | Phase E |
| X-11 | Low | **During a name hold the name boxes are greyed out**, so capitals cannot be fixed from the page though the server allows it | Leave capitals editable during a hold | Phase D |
| X-12 | Low | **A saved job page can show an expired job for up to about 5 minutes** after it passes its date, until the daily job clears it. Its Google markup carries the end date (`validThrough`), so Google drops it on time | None needed; noted because CLAUDE.md says "immediately" | **new** |
| X-13 | Low | **`lib/onboarding-emails.test.ts` fails if `NEXT_PUBLIC_SITE_URL` is set** to another address | Have the test set the address itself | Phase F |
| X-14 | Low | **Older docs tell you to run older combined files** (`docs/launch-checklist.md` says 0001 to 0021, `docs/google-signin.md` up to 0021) | Point them to "the current combined file" | Phase D |
| X-15 | Low | **Google sign ups skip the website's bot check** once the gate opens (they need no ticket, by design). The terms are asked at `/welcome/terms` | Accept, or add the bot check to the Google button | **new**, from the P1-03 tests |
| X-16 | Low | **The applicants list and admin pages read the database inside the page code** with no tests | Extract and test, as the loaders were | Phase G |
| X-17 | Idea | The final SQL check still says "private CV storage"; `docs/security.md` still says "CVs" in places | Rename with the next SQL and docs change | Phase A, D |
| X-18 | Idea | A shortlist made before the application is opened shows the candidate "Viewed" at the time of the shortlist | Leave, unless you want to hide even that | Phase G |
| X-19 | Idea | `jobs.province` has no list of allowed values in the database | Add one with the next SQL change | Phase D |
| X-20 | Idea | Help has a small layout shift (0.079) on a phone | Reserve the search box's space | Phase F |

Nothing found where a fix broke something that used to work. The 2 changes in what people see (the "could not read this file" message for an over limit Word file, and "A few quick questions") are deliberate and recorded.

## 5. The demo walk (Part 4)

Done on demo.eyecarejobs.ca on 12th November 2026, at phone width (375 pixels) and desktop width (1280), with a browser driven from this session. Screenshots are in `docs/audit/post-fix/`. Times are how long the pages took for the session, plus my estimate of a real person's time, which is mostly reading and typing.

**Accounts used:** an audit candidate ("Mara Auditson", an optician in Kamloops, British Columbia, with made up resumes in PDF and Word, phone 555) and an audit clinic ("Lakeview Eye Care (audit test)", Huntsville, Ontario), both on `@example.com` addresses. The 3 demo accounts in `docs/demo-site.md` were not touched. **Both audit accounts were deleted at the end with Delete account**, and signing in with them is now refused.

### What could not be walked in the browser

You were not around to approve a job, and the live sample jobs with applicants belong to the 3 demo accounts I was told not to touch. So my clinic never had a live job and never received an application. **These steps in 4B and 4C were therefore not done in the browser:** opening an application as the clinic, shortlist, invite to interview with a message, decline with the kind message, mark the role filled and name who was hired, Extend, the views and apply clicks on a live job, and the candidate's side of each change. The database side of shortlist, decline and deletion passes in the 77 step walk through (Part 1), and the shortlist mask passes in the access tests, but the screens were not seen. To finish it: approve the audit job in the demo admin queue during a session, or give the session a fourth demo clinic of its own to use.

### 4A. Candidate journey (about 25 minutes for a real person; about 2.5 minutes of page time here)

| Step | Result |
| --- | --- |
| Home page as a stranger | Clear headline, search box, Post a job, Latest jobs. No side scrolling at 375 pixels. Organisation data present |
| Search by role, province, town and distance, sort | All work. Optician: 6; Optician in Alberta: 1; Calgary within 50 km: 3; Quebec: "No jobs match this search yet"; a made up town: "We could not find that place", with a next step. Sort offers Newest and, once a town is given, Closest |
| **Find jobs on a phone** | **The first job sits about 1,240 pixels down, below about 1.5 screens of filters.** Someone arriving from Google on a phone sees a form, not jobs (screenshot 01). The home page search is fine |
| Job page | Pay in the header and in Job facts; both required answers shown; Google markup matches the page; no layout shift (0.000, was 0.21). "Existing vacancy: Yes" means nothing to a candidate without a short explanation (screenshot 02) |
| Sign up | Under 10 seconds. Straight to "Welcome to Kestrel" |
| First step page | Clear, optional, short. Says the answers can be changed later in the profile; **career stage cannot be** (X-03, confirmed) |
| Profile, upload resume, Fill in from my resume | PDF and Word both read correctly: role, about 8 years (right), registered in British Columbia, phone, and Kamloops (the audit's sample lost the town). Missed "Available from 1st February 2027" and the software (not in Kestrel's list). **After replacing the resume, the panel keeps the old file's suggestions and hides Read my resume until the page is reloaded** (screenshot 04). The file badge says "DOC" for a PDF |
| For me and Recommended | Both empty for an optician in Kamloops within 25 km (fair for the data), each with a helpful next step. **The checklist ticked "Say what you are looking for" although I never filled it in** |
| Apply with a cover note | The page lists all 8 details the clinic receives (P1-32 confirmed). The "keep my details for future roles" tick is there. Sending took over 4 seconds with "Sending" on the button |
| Tracker | Shows "Sent. The clinic has not opened it yet." Clear |
| Inbox and count | Empty, says what will appear. Envelope visible on the phone bar (P1-38 confirmed) |
| Job alert | Saved in 1 step. Quebec can be chosen as an alert province, though no Quebec job can be posted |
| Name change and hold | Works: "You can change your name again on 12th December 2026", boxes greyed. A live application did not stop it (decided, not built yet) |
| Download my data | Password asked; file includes account, consent record, alert, profile, preferences, career stage, name change date and the application exactly as sent |
| Apply outside my role (optometrist job) | "This role is not your role ... Your profile says optician", with Update my profile. Clear. The wording invites changing the role to apply, which Kestrel does not check |

### 4B. Clinic journey (about 15 minutes; about 2 minutes of page time)

| Step | Result |
| --- | --- |
| Sign up and clinic profile | Under 2 minutes, as promised. Direct hire confirmation and terms tick are clear |
| Dashboard | Checklist, 6 tiles, a clear explanation of views and apply clicks. Good on a phone (screenshot 08) |
| Post a job form | About 5 minutes as stated. Pay rules, the 2 questions and the Ontario AI rule explained in place. The percentage boxes hide for an optician role |
| Refusals | All 5 refused with a clear message: range too wide, "Canadian experience", "Cdn exp.", a Quebec location, and "negotiable" with no figures (screenshot 06) |
| **Ad builder (pressed once)** | Draft in a few seconds, warm and specific. **It added "Internationally trained applicants are welcome", which the clinic never said** (its instructions allow that line), and "apply through the job board" instead of naming Kestrel (screenshot 07) |
| Submit for review | Works; lands on the dashboard with "Your job is with our team". Takes 3 to 4 seconds |
| Take back to edit, Save as template, Use template | All work, with a confirmation each time |
| Applicant steps | Not done, see above |

### 4C. Both sides of the same moment

Not done in the browser (no live job of my own). From the code and the tests: the candidate reads applications only through the masked copy, so a shortlist shows as Viewed (access tests and walk through pass); what the clinic sees is the `applicant` record saved at the moment of applying, which matches the 8 details on the apply page and in the download.

### 4D. The sample data

28 live jobs across 7 provinces (the guide says 18 in 9), independent, corporate and supplier employers, opticians at $52,000 to $74,000 a year, assistants at $20 to $28 an hour, optometrists by salary, day rate and percentage, and no Quebec. It reads like real Canadian eye care. 2 things: **3 jobs from a visitor remain** ("Riverside Family Eye Care (demo)", one titled "Associate Optometrist in Established LC"), so the demo has not been reset since it was last shown; and **every job is in a city**, so the small town clinic owner in 4F sees nobody like them. No dead links (41 internal links checked). Empty states all offer a next step.

### 4E. Demo safety

Banner on every page checked; `x-robots-tag: noindex, nofollow`, the robots meta tag and `Disallow: /` all present; nothing says an email was sent. The demo serves today's `main` (the saved blog page, which only exists since Phase F, comes back as a shared copy). Layout shift: Compare 0.000 (was 0.14), Help 0.087 (X-20).

### 4F. First impressions

**(a) An independent clinic owner in a small Ontario town.** Setting up took 2 minutes and the post form explains the Ontario rules as it goes, which will reassure someone who has read about 1st January 2026 and is nervous of getting it wrong. The ad builder is the moment they will remember. What would make them leave: every job on the site is in a city, so they wonder whether candidates near them use it at all, and the draft putting words in their mouth ("internationally trained applicants are welcome") would worry a careful owner. What would bring them back: the first applicant arriving, with the dashboard counting views so they can see it working.

**(b) An optician moving from Toronto to Calgary.** Search by town and distance works, and pay on every card is the thing they cannot get elsewhere. Fill in from my resume saved them typing. What would make them leave: on a phone, Find jobs opens with a long filter form; with only a handful of Calgary jobs they may conclude the site is empty. What brings them back: a job alert for Alberta, which takes 1 step.

**(c) A new optometric assistant with no eye care experience.** The first step page asks "Where are you in eye care?" kindly and says it does not affect what they can apply for. Assistant jobs at $20 to $28 an hour are there. What would make them leave: the apply page lists "Registered in" and "Years of experience" first, which can feel like a door closing for a beginner, and nothing on the job page says whether training is given. What would bring them back: a "No experience needed" or "Training given" marker on jobs that welcome beginners.

### New issues from the walk

| # | Severity | What | One line fix |
| --- | --- | --- | --- |
| D-01 | Medium | Find jobs on a phone shows about 1.5 screens of filters before the first job | Fold the filters behind a "Filters" button on a phone, results first |
| D-02 | Medium | The ad builder may add "internationally trained applicants are welcome" unasked | Only include it when the clinic's brief says so |
| D-03 | Low | After replacing a resume, the old file's suggestions stay and Read my resume is hidden until reload | Clear the suggestions when a new file is saved |
| D-04 | Low | Checklist ticks "Say what you are looking for" before anything is filled in | Count it done only when a preference is saved |
| D-05 | Low | Quebec offered as a job alert province | Remove it, or say no Quebec jobs are posted yet |
| D-06 | Low | Ad builder says "apply through the job board" | Name Kestrel in its instructions |
| D-07 | Low | "Existing vacancy" has no explanation for candidates on the job page | A short info note, as for Fixed term |
| D-08 | Low | Demo not reset; guide's numbers (18 jobs, 9 provinces) out of date; no small town jobs | Run reset and seed; add 2 small town clinics to the seed |
| D-09 | Low | PDF resumes show a "DOC" badge | Show PDF for PDFs |
| D-10 | Idea | Applying and posting take 3 to 4 seconds | Watch after the move to Vercel Pro |

## 6. Legal readiness (Part 5)

**This is preparation for the lawyer, not legal advice.** The send ready questions are in **`docs/audit/LAWYER-QUESTIONS-2026-11-12.md`**: written to the lawyer in your voice, with no internal jargon, and your employer not named (as in the packs). Read it, change anything, then forward it. It has not been sent.

### 6A. The paralegal's review, and what is still open

The feedback you pasted is from a paralegal friend who read the pack (corrected 12th November 2026; it was first recorded here as the lawyer's). It is informed advice, not a lawyer's legal advice. It answers the direction on 6 points, and the questions file turns each into "here is what I plan to do, please correct it":

| Paralegal's point | Pack question it answers | What it means for Kestrel |
| --- | --- | --- |
| Sort out what happens to a resume after applying: what the clinic may do, how long each side keeps it, what happens on deletion. Fix the clinic deletion problem before people use it | 15, 24, 25, 45 | X-01 (P1-20, R5) becomes a pre launch build item, with the terms and privacy wording |
| Make reporting fake jobs more visible and publish a short policy; Ontario requires this of the job board | 36 (partly) | X-02: a policy page and links. The reporting tool already exists |
| Confirm who operates the site | 12 | Waits on incorporation (Gate A) |
| Have the liability clause looked at; the cap is $0 for candidates and the free launch | 13 | Clause to redraft at the meeting |
| Clean up the waitlist wording now, since it is live | 30 | The tick box bundles "job alerts" with news and offers, but alerts are sent without the tick (confirmed in the walk). Small change, then the lawyer's wording |
| Start with Ontario clinics posting their own jobs; leave cold outreach, reposting from clinic websites and paid plans for later | 31, 32, 16, 19 | Confirms keeping `ENABLE_OUTREACH`, `ENABLE_SEEDING` and payments off at the free launch |
| Spend the meeting on clinic terms and applicant information | | The questions file puts these first |

**Not covered by the paralegal's notes, and still open:** your employment and the disclosure (pack 1 to 6, still the gate for outreach and found listings), the company (7 to 11), where data is processed (22), Quebec residents who sign up (27), the privacy officer and breach plan (28, 29), the career stage answer (42), the first week emails (43), the optometrist percentage and daily rate pay (44), the posting rules as built (34), the marketing wording (35), the indemnity and changes clauses (14, 18, 20). New from this review: the ad builder adding "internationally trained applicants are welcome" unasked (D-02), Kestrel's position on a clinic's AI screening answer, and whether the buying groups blog post and the directory listing are a concern before the disclosure. The questions file groups them as you asked: privacy, anti spam, pay transparency, human rights wording, the platform's position, terms and retention, and the separation from your employer.

The paralegal's note "have the lawyer look at the liability clause" makes sense now: it was advice to get a lawyer for that clause.

### 6B. The lawyer packs (`docs/legal/`)

**Described correctly:** the business, the stack, the resume reader (no AI, no outside service), the inbox, career stage, Recommended for you and its preferences, the found listings tools, the comparison page, view and click counts, and the posting rules including the optometrist pay options.

**Changed since they were built (Phase C, 12th November):** the name hold is now in use (the pack says its database update "has not been run yet"); the shortlist is now private at the database level; only optometrists can apply for optometrist jobs; the 30 a day apply limit; Quebec refused by the database; the sign up ticket; one click unsubscribe and bounce suppression (pack question 33 is now partly answered by what was built); role filled messages to Interview and Offer; the clinic message label. **Wrong in the pack:** the prices in Part 1 ($39, $49, $59 then $79), and questions 21 and 23 describe things fixed since.

**Missing:** the lawyer's own reply and what you plan to do with it; the fake job policy; the waitlist wording change.

**Verdict:** do not rebuild the full packs before the meeting. A paralegal has read them and given notes, and no lawyer is engaged yet. Send the questions file instead: its section 3 lists what changed and section 4 lists the policy sentences that are wrong. Rebuild the packs once, after the meeting, with the agreed decisions, so the appendices (the policies as published) match what the lawyer approved.

### 6C. Sentences on /privacy, /terms, /posting-policy and /security that are not true today

Checked against what the demo did in Part 4.

| Page | Sentence | What is true |
| --- | --- | --- |
| Terms | "See our contact page for our mailing address." | The contact page shows no address (removed from the website on 5th November, by your choice) |
| Terms | "Last updated 30th October 2026" | Wording changed on 12th November (resume, not CV). Small, but the recorded terms version is still "2026-10-30 draft" |
| Terms | Silent on deletion | A clinic deleting its account deletes every application it received, and candidates lose them from their tracker (the delete box says so to the clinic) |
| Posting policy | "A pay range for the job, as a yearly salary or an hourly rate." | Optometrist jobs may also use a daily rate or a percentage only |
| Posting policy | "(full time, part time, locum or contract)" | Every screen says Fixed term (X-07) |
| Posting policy | Fake or scam posts mentioned only as a reason to suspend an account | No process or policy for reports is described (X-02) |
| Privacy | "How long we keep it" | Does not say what happens to a candidate's applications when a clinic leaves, nor mention the "keep my details for future roles" tick |
| Privacy | "...for example when we launch accounts, job posting and payments" | Accounts and posting exist |
| Sign up and waitlist box | "launch news, job alerts, product updates and offers" | Job alerts are sent to anyone who sets one up, ticked or not |
| Security | Nothing untrue found | "Enforced by the database itself, on every table" is now true (117 access tests) |

## 7. Next steps (Part 6)

### Where Kestrel stands against the gates

| Gate | Needs | Today |
| --- | --- | --- |
| **A** (lawyer, disclosure, company) | Lawyer meeting held and advice taken; disclosure given and acknowledged; company incorporated with a Business Number and bank account | **Not passed.** First written reply received; meeting not held; disclosure not given; no company |
| **B** (policies published, every flow tested) | Terms, Posting policy and Security without the draft notice; every flow tested on a phone | **Not passed.** 3 pages still draft. The candidate journey and the clinic up to submit pass on the demo. The clinic's applicant steps were not walked in a browser |
| **C** (50 live roles in 5 or more provinces) | Jobs live on eyecarejobs.ca | **Not passed.** The live site is pre launch. The demo has 28 sample jobs in 7 provinces |

### Before the free launch

1. Lawyer meeting, then the agreed changes: applications kept after a clinic leaves (X-01), a published retention schedule and the purge, the fake job policy (X-02), the waitlist and sign up wording, the operator and liability clauses, the 9 inaccurate sentences above. Then remove the draft notices.
2. Your disclosure conversation, before anything public is promoted (it also gates outreach and found listings, which stay off at launch as the lawyer suggests).
3. Supabase Pro with daily backups and 1 restore test; a paid Resend plan; Vercel Pro (Hobby is non commercial); move the repo to the Kestrel organisation.
4. Check that previews no longer use the live database (R9).
5. A full phone walk of the clinic applicant steps on the demo (approve 1 audit job so the session can finish 4B and 4C).
6. The demo walk fixes worth having first: D-01 (jobs first on a phone), D-02 (ad builder line), X-03 (career stage in the profile).

### Before paid launch

Stripe in test mode with the free launch coupon. A $0 total must not ask for a card (`payment_method_collection: if_required`), and the comparison page's "no credit card during the free launch" must stay true. Then receipts, HST through Stripe Tax, the fee terms and auto renewal wording from the lawyer, live keys after the bank account.

### Switches at launch, in both Vercel projects unless noted

| Setting | Live project | Demo project |
| --- | --- | --- |
| Sign up gate (in the database, not Vercel) | `update public.signup_gate set open = true;` | Already open |
| `CLINIC_SIGNUP` | `yes` when clinic sign up opens to all (or keep invitation codes for the Ontario first wave) | `yes` |
| `ENABLE_GOOGLE_SIGNIN` | `yes` | Leave unset |
| `LAUNCH_HOME` | Unset or `yes` once the gate opens | As now |
| `ENABLE_ONBOARDING_EMAILS` | Only after the lawyer answers the first week question | Leave unset |
| `ENABLE_SEEDING`, `ENABLE_OUTREACH` | **Stay off** (paralegal's advice and the disclosure) | Leave unset |
| Supabase CAPTCHA | Stays off (the database ticket does the job) | Off |

### The next 10 actions, ranked

| # | Action | Who | Effort | Unblocks |
| --- | --- | --- | --- | --- |
| 1 | Read and forward `LAWYER-QUESTIONS-2026-11-12.md`; book the meeting | You | 30 minutes | Gate A, Gate B |
| 2 | Keep applications when a clinic or job is deleted, so candidates keep their history (X-01) | Claude, after the lawyer agrees the plan | 1 day plus SQL on both databases | The lawyer's first point |
| 3 | Fake job policy page, linked from every job page, the footer and help (X-02) | Claude drafts, lawyer approves | Half a day | The lawyer's second point |
| 4 | Fix the waitlist and sign up tick box wording, and the 9 inaccurate policy sentences | Claude, lawyer's wording | 2 hours | Gate B |
| 5 | Supabase Pro with backups, then 1 restore test | You | 1 hour | Inviting anyone |
| 6 | Your disclosure conversation | You | | Gate A, any promotion |
| 7 | Phone friendly Find jobs (results first, filters behind a button) (D-01) | Claude | Half a day | Candidates arriving from Google |
| 8 | Ad builder: no unasked "internationally trained" line, name Kestrel (D-02, D-06) | Claude | 30 minutes | Clinic trust |
| 9 | Approve 1 audit job on the demo so a session can finish the clinic and both sides walk (4B, 4C); reset and reseed the demo first | You, then Claude | 20 minutes of yours | Gate B |
| 10 | Refresh `NEXT-STEPS-PHASES.md` with real statuses (X-06), and the small fixes X-03, D-03, D-04, D-05, X-07 in 1 branch | Claude | Half a day | A true picture |

## 8. Could not verify

| What | Why | Needs |
| --- | --- | --- |
| Anything on the live site (eyecarejobs.ca) | Refused by this session's network settings | Add `eyecarejobs.ca` to the environment's allowed hosts |
| Which databases have migrations 0037 to 0042, and on what dates | I cannot see either database | You to confirm (CLAUDE.md says both, 12th November) |
| Whether you ran the permissions check query from the fixes log (P1-42) on both databases | As above | You |
| The clinic's applicant steps and the candidate's view of them (4B, 4C) | No live job of my own without admin approval | Approve 1 audit job in a later session |
| Previews using the live database (R9), Supabase backups (R1), Resend plan (R7), Vercel plan (R36) | Settings outside the code | You |
| Google's view of the structured data and fonts (P1-52, P1-12 on the live site) | Needs Search Console and the live site | Your Search Console steps in `STEVE-NEXT-STEPS.md` |
| Email delivery and its content | The demo sends no email | A test on the live site after launch settings |
| The October items marked "looks done" | Not re-tested 1 by 1 | A refreshed `NEXT-STEPS-PHASES.md` (X-06) |
