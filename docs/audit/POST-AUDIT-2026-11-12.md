# Kestrel post audit review, 12th November 2026

Reviewed: `main` at `a67323d` (fix phases A to G merged). Branch for this review: `audit/post-fix-review`. Only files under `docs/audit/` were written. No application code was changed, no SQL was run on the live or demo database, no setting was changed, nobody was contacted and no pull request was opened.

Reach: the code and history, tests, builds and 3 throwaway databases here, and the demo site (demo.eyecarejobs.ca). The live site (eyecarejobs.ca) is refused by this session's network settings, so nothing here was checked on the live site itself.

<!-- SUMMARY -->

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
| P1-02 | High | Fixed but now out of date | Packs rebuilt in Phase C. Since then Phases D to G and the lawyer's reply have changed things. See Part 5B |
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
| P1-20 | Medium | **Still open, and now the lawyer's first point** | Deleting a clinic still removes its jobs and the candidates' applications. The lawyer has now asked for this to be fixed before launch (Part 5) |
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
