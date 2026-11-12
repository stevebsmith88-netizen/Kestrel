# Audit part 1, November 2026: progress

Branch: `audit/2026-11-part1`. Read only audit: nothing outside `docs/audit/` is changed.
Audited commit: `3e42a07` (main, 12th November 2026).
Hourly scheduled task: `trig_01LXua9bgib1T4T8s5pPkqzZ` ("Kestrel part 1 audit, hourly continue"). Disable it when the final report is written.

Working findings are kept in `docs/audit/AUDIT-2026-11-PART1-WORKING.md` and become `docs/audit/AUDIT-2026-11-PART1.md` at the end.

## How to resume

Read this file, then carry on from the first area that is not "done". Add findings to the working file as they are found, and commit and push after every area.

## Areas

| Area | Status | Notes |
| --- | --- | --- |
| 0. First checks (typecheck, test, build, npm audit, secret scan) | done | All pass. 425 tests, 0 npm audit problems, no secrets in 441 commits on 77 branches. Details in the working file |
| A. Decisions versus code (11 items) | done | 21 findings (A-01 to A-21) in the working file. Biggest: A-09 clinic page shows a shortlisted person as Viewed, A-13 data download incomplete, A-19 people at Interview never told, A-02 pay rule wider than CLAUDE.md. A-10 and A-14 to be confirmed by the database tests in B |
| B. Database (migrations, combined file, row level security tests) | done | Real tests on Postgres 16. Combined file equals the 39 migrations and is safe to re-run. 9 findings (B-01 to B-09). Confirmed: name hold bypass, raw shortlist status readable, anon keeps default permissions on 3 tables |
| C. Safe before the SQL (0037 to 0039) | done | Likely safe, by code reading of all 14 places. Could not run the site against a pre 0037 database (not allowed to download Supabase's API program) |
| D. Server actions and routes | done | 73 actions and 13 routes checked. All guarded. 7 findings (D-01 to D-07). Biggest: D-01 direct sign up to Supabase skips the bot check, invite code and terms tick once the gate opens |
| E. Find jobs, For me and Sort | done | Sorting is fast (5 ms for 5,000 jobs). 5 findings (E-01 to E-05). Main one: everything quietly stops at 1,000 live jobs |
| F. Resume reader | done | Tested with made up and hostile files. 7 findings (F-01 to F-07). Confirmed: a crafted Word file runs the reader for minutes (F-01), and the page and time limits do not limit the work (F-02). No resume text is logged or stored |
| G. Email and CASL | done | 17 send sites, 1 sender function. Address, unsubscribe, demo block and off by default all verified. 8 findings (G-01 to G-08). Main: first week emails would reach unconfirmed addresses, and 2 places promise a cover letter drafting feature that does not exist |
| H. Accessibility and mobile | done | 27 pages at 375 px, signed out and signed in, using a local stand in for Supabase. 0 contrast, label or sideways scroll failures. 7 small findings (H-01 to H-07). 3 screenshots in docs/audit/2026-11-part1/ |
| I. Docs against reality | done | Privacy, security, help (172 names checked, all match) and lawyer packs compared with the code. 7 findings (I-01 to I-07). Main: lawyer packs predate everything since 5th November, privacy policy lists less than is collected, docs/security.md has 3 wrong statements |
| J. Tests, dead code and health | done | 425 tests on rule files, 0 on database code. No dead code. 36 settings with no single list. 3 findings (J-01 to J-03) |
| K. SEO and search visibility | done | Checked on a local production build (the live site could not be reached from this session). 7 findings (K-01 to K-07), speed table for 7 pages, and the 10 ranked moves. Main: home page lost its Organization data, every public page is rebuilt per visit, fonts cause layout shift |
| Final report written (`AUDIT-2026-11-PART1.md`) | not started | |
| Scheduled task disabled | not started | |
