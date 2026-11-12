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
| E. Find jobs, For me and Sort | not started | |
| F. Resume reader | not started | |
| G. Email and CASL | not started | |
| H. Accessibility and mobile | not started | |
| I. Docs against reality | not started | |
| J. Tests, dead code and health | not started | |
| K. SEO and search visibility | not started | |
| Final report written (`AUDIT-2026-11-PART1.md`) | not started | |
| Scheduled task disabled | not started | |
