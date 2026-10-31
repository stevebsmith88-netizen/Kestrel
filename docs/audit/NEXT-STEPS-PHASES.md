# Audit next steps, in phases

Proposal from the audit of 30th October 2026. Steve chooses; nothing here is started. Finding numbers (R1 to R60) refer to the risk register in `AUDIT-REPORT-2026-10-30.md`. Each phase has a gate: do not start the next phase until the gate is met.

Rules for every phase: work on a branch, run `npm run typecheck && npm test && npm run build`, push, Steve checks the preview, Steve says merge. Database changes are a new numbered migration, added to the combined file and tested twice on a scratch database. Clinic outreach and seeding stay off until Steve confirms the disclosure conversation has happened.

## Phase 0: Steve's settings hour (this week, about 2 hours)

Owner: Steve. No code. Report section 5, checks 1 to 13.

- Move Supabase to Pro, confirm daily backups, note the CV storage size (R1).
- Remove the Google sign in preview wildcard in Supabase (R4).
- Stop previews using live data: separate Supabase project for previews, Vercel Deployment Protection (R9).
- Resend plan and Supabase email limits (R7). Reply address and the hello@ and privacy@ aliases (R12).
- Anthropic spend limit (R24). Vercel Pro (R36). Vercel function region (R28).
- Account lockdown: 2 step sign in everywhere, domain lock and auto renew, Dependabot (R14).
- Check what is live: admin Overview, any clinic accounts or jobs you did not create (R10).

Gate: every "Possible" finding is now confirmed or cleared, and Steve has told Claude what he saw.

## Phase 1: Safe to invite (Claude, about 4 to 5 working days, 3 branches)

Each branch gets its own preview. Steve tests the flows listed in report section 5, checks 14 to 18, on his phone.

- **1A, sign in and accounts:** terms tick on email sign up (R2), redirect check (R3), password reset needs the email link (R20), session refresh on every page (R21), invite only switch for clinic sign up and posting (R10), bot check fails closed in Production (R49), signed account unsubscribe link (R47).
- **1B, data safety:** delete rules and cascades (R5), saves that currently fail (R6), error page that keeps typed text (R27), review queue shows every live field (R26), copy of a job as published (R33), concurrent job limit (R50).
- **1C, email and operations:** daily job send budget, paging and run lock (R7, R35), "last good run" heartbeat on /api/health and a second alert contact (R8), waitlist protected from overwrites and a safe launch sender (R11), clinic emails for approved, needs a change and closing soon (R13), reply address default (R12), keep candidates on their job through sign up (R18), share previews and robots.txt (R15, R38).

Gate: Steve's phone test of the 12 untested flows passes, Phase 0 is done, backups are confirmed.

## Phase 2: Legal and Gate B (Steve with the lawyer, Claude edits)

Book 1 fixed fee meeting covering: the employment agreement (sections 7 and 9), the disclosure letter, the Terms, Posting policy and Privacy policy, retention periods, Quebec, clinic notes in the data download.

- Edits that follow: retention table and purge step (R30), download completeness (R29), processing location and services in the policy (R28), Quebec decision (R31), privacy officer named and breach plan blanks (R57), then remove the DRAFT banners (R2).
- Accessibility pass on forms (R37). Wider "Canadian experience" check and pay range flags (R32). Profile changes reviewed (R25). CV checks and a scanner decision (R23). Sign in guarding (R22).
- Automatic checks before code goes live (R34). Bad day playbooks and a maintenance switch (R45).

Gate B: policies published without DRAFT, every flow tested on a phone.
Gate A, in parallel and entirely Steve's: lawyer, disclosure given and acknowledged, company, Business Number, bank account. Free launch waits for Gate A.

## Phase 3: Free launch and evidence (Claude)

- Count job views and apply clicks, cookie free analytics, Search Console, admin numbers fixed with a Gate C tile (R17, R41).
- One "read this page" step used by both the ad builder and the seeding tool, then the seeding tool with the 21 day rule and the "not stated by the clinic" rule (R16, R19).
- Fix the claim loop (R40), the For clinics sales page (R42), search filter canonicals (R39), small SEO and polish items (R56, R55, R54).
- Do not use "paste your job link" in any email or flyer until R16 is built.

Gate C: 50 live roles across 5 or more provinces, job pages indexed, free to paid data being recorded.

## Phase 4: Paid launch

- Steve decides prices, the pass contents, field and supplier pricing and the annual option first (R46).
- Then Stripe (test mode while building, live after the bank account), receipts, HST. Restate the revenue model net of all fees and churn (R43).
- Skill and internationally trained tags (R58). Logo and public clinic page if the pass sells a "featured profile".

## Phase 5: Tidy and simplify (any quiet week)

- Refresh CLAUDE.md, merge the 19 docs to about 9, issue a v8 plan note on the stack (R44).
- Drop 4 unneeded settings and the duplicate code, update the cost estimate (R59).
- Low items and ideas (R48, R51 to R53, R60).
