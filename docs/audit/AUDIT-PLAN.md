# Audit plan

Purpose: before any more is built, look at everything already built, find what is risky, wrong, wasteful or missing, and compare it with the business plan, so Steve can decide what to fix and what to build next with open eyes.

## Rules of engagement

- **Read first, change nothing.** The audit produces a report. It does not fix things, merge or push to `main`. The one exception is writing the report files under `docs/audit/`.
- **No secrets.** Never ask for, print or store a key. If one is found in the code or history, say where and tell Steve to rotate it, without repeating the value.
- **No contact with real people.** Do not send email, call live services with Steve's keys, or create accounts on the live site.
- **Be honest about confidence.** Mark each finding as **Confirmed** (reproduced or proven from the code), **Likely** (strong reading of the code) or **Possible** (needs checking on the live system). If this session cannot reach the live site or a service, say so for each area, and put the check on Steve's list.
- **Evidence for every finding:** a file and line, a command and its output, or a screenshot. No finding without a place to look.
- **Fixes are proposals.** Each finding gets a small proposed fix, an effort estimate and who does it (Claude or Steve). Fixes are done later, on branches, after Steve picks.
- **Plain English first.** Steve is not a developer. The summary is for him. Technical detail goes below it.

## The nine lenses

Run these in parallel where possible (one sub agent each), then reconcile their findings, remove duplicates and check each other's claims.

1. **Security.** Secrets (history, bundles, logs), authentication and the Google flow, every server action and route handler (is the role and the ownership checked on the server?), service role key use, input validation, file upload, redirects, headers, rate limits and bot protection, dependency and install script risk, whether any page leaks data to the wrong person. Check `docs/security.md` against reality.
2. **Data and row level security.** Run `bash scripts/dev/scratch-db.sh`, then test every table as anon, as a signed in stranger, as the owner and as an admin, for read, insert, update and delete. Check column grants, triggers, security definer functions, unique indexes, cascades on account deletion, orphaned rows, and whether the combined SQL file matches the numbered migrations.
3. **Correctness and resilience.** Walk every user flow in the code (sign up, apply, post, review, claim, report, alerts, deletion, export, the daily job) looking for wrong state transitions, double sends, race conditions, missing error handling, failure of Resend, Supabase or Anthropic, and what happens when an environment variable is missing. List the code paths that have never run against a live service.
4. **Privacy and legal compliance.** PIPEDA (consent, access, correction, deletion, safeguards, breach plan, cross border processing and the policy wording), CASL (every email type: who is it to, is it marketing, unsubscribe, address, suppression), Ontario and BC pay transparency, AI screening and vacancy disclosure, "Canadian experience", human rights wording, Quebec Law 25 and French, the Terms and Posting policy drafts, cookie and tracking use. Say plainly what needs a lawyer.
5. **Accessibility and content.** WCAG 2.2 AA against the real pages: keyboard use, focus, contrast, labels, errors, text resize at 200 percent, motion, tap targets, screen reader names and landmarks. Plain language and the house writing style across every page and email (search for em dashes and hyphens used as punctuation, numerals, spelling).
6. **SEO and public performance.** JobPosting structured data matches the visible page and is dropped on expiry, sitemap and robots, titles and descriptions, canonical addresses, blog structure, page weight, fonts, images, how pages cache (many are dynamic), and mobile layout.
7. **Product against the business plan.** Read the v7 plan and `docs/PLAN.md`. List every promise, phase and gate, and mark it Built, Partly built, Not built or Not needed. Cover the launch scope, pricing and payments, seeding and the claim loop, the supplier and locum ideas, the revenue model and its assumptions, the metrics an investor would ask for, and the order of the roadmap. Say what is missing for each phase gate.
8. **Simplicity and cost.** What can be removed, merged or simplified? Duplicate code, dead code, unused dependencies, docs that disagree with each other, too many settings, features nobody has asked for, and anything that will be hard for a non developer to run. Running cost against the target of well under $10,000 a year, plan limits that will bite (Vercel Hobby cron and commercial use, Supabase free tier, Resend and Anthropic limits), and vendor concentration.
9. **Operations.** Monitoring and alerts, backups and a restore test, key rotation, who can get into what (account lockdown), what happens if Steve is unavailable for a week, support inbox, incident response, the deploy and rollback process, and migration safety (can a bad migration be undone?).

## Method

- Start with the read only basics: `git log`, `npm run typecheck`, `npm test`, `npm run build`, `npm audit`, a search of the whole git history for secrets, and counts of routes, tables and tests.
- Then each lens, with the tools in `docs/handoff.md` (scratch database, fake database, Playwright screenshots at phone and desktop widths and at 200 percent text).
- Where Steve must look at something live, add it to **Steve's checks** with the exact page, click path and what he should see. Keep it short and ordered.
- Time box: finish a first full pass, then go deeper only where the first pass found smoke.

## What the report contains

Save as `docs/audit/AUDIT-REPORT-<date>.md`, using `docs/audit/REPORT-TEMPLATE.md`:

1. **One page for Steve:** overall verdict, the top 5 risks, the top 5 quick wins, and what to do first, in plain English.
2. **Risk register:** every finding with severity, confidence, evidence, proposed fix, effort and owner.
3. **Business plan gap analysis:** the table from lens 7, plus the recommended order for what to build next and why.
4. **Streamlining list:** what to remove or simplify, with the saving.
5. **Steve's checks:** things only he can verify on the live system, in order.
6. **What was not audited,** and why.

## Severity scale

- **Blocker:** must be fixed before real users or real money (data exposure, broken sign in, legal exposure, lost data).
- **High:** likely to cause real harm or embarrassment soon.
- **Medium:** worth fixing in the next few weeks.
- **Low:** polish, or small risk.
- **Idea:** not a defect, a possible improvement.

## After the report

Steve reads the one page summary and picks. Blockers and High findings become branches, each with a preview, in order. The audit session writes nothing to `main` itself.
