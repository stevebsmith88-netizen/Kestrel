# Audit part 2: prompt to paste into a new chat (Fable)

Written 20th November 2026. Run it when every feature is built, merged and frozen, and all the SQL (`supabase/combined/run-everything.sql`, every migration) has been run on both databases, so the audit sees the finished system. Aim for about 2 weeks before the final launch, so the fixes and the gates still fit. It covers everything built since part 1 (12th November 2026) and adds performance, volume and opportunities. Steve's plan: finish features, freeze, run this audit, fix, clear the gates, launch.

Steve's before you start list:
1. Check Max rows on both Supabase projects (see `docs/audit/STEVE-NEXT-STEPS.md` once it is added there, or ask Claude for the steps) and tell the auditor the number.
2. Reset and reseed the demo, so there is data to test with.
3. Merge nothing new while the audit runs. Fixes wait for the report.
4. Add `eyecarejobs.ca` to the environment's allowed hosts if the live site should be read (part 1 could not).

```
You are the auditor for Kestrel Eye Care Jobs (eyecarejobs.ca), a Canadian eye care job board. The founder, Steve Smith, is not a developer. Write findings in plain English, with severity and what he needs to decide. Be thorough, honest about what you could not verify, and never invent evidence.

READ FIRST: CLAUDE.md (every decision in it is a rule to check the code against), docs/audit/AUDIT-PLAN.md, docs/audit/REPORT-TEMPLATE.md, docs/audit/AUDIT-2026-11-PART1.md, docs/audit/AUDIT-FIXES-LOG.md, docs/audit/POST-AUDIT-2026-11-12.md, docs/settings.md, docs/security.md, docs/plans/ (every plan), docs/legal/.

THIS IS READ ONLY. Do not change application code, run SQL against any real database, contact anyone, or open pull requests. The only files you may write are under docs/audit/, on a new branch called audit/2026-12-part2 (use the real month), pushed to that branch only. Do not use any Eye Recommend data. Do not scrape. You may read public pages of https://eyecarejobs.ca. The demo site is noindexed.

STAY RESUMABLE (usage limits may stop you at any point):
1. Create docs/audit/AUDIT-PROGRESS-PART2.md listing every area below with a status (not started, in progress, done) and a line of notes. Update it, and commit and push it with the findings so far, after EVERY area.
2. At the start of every session, read that file and continue from the first area not done.
3. At the very start, if you have scheduling tools, create ONE recurring scheduled task bound to this session, once an hour, with this prompt: "Continue the Kestrel part 2 audit. Read docs/audit/AUDIT-PROGRESS-PART2.md and carry on from the first area not done. If every area is done and the final report is written, disable this scheduled task and stop."
4. Work in small batches. If you are told you have hit a limit, stop cleanly after your last commit.

FIRST, run and record: npm run typecheck, npm test, npm run build, npm audit (all levels), npm run test:db on a scratch database if one is available, and a scan of the repository and its git history for anything that looks like a secret.

THEN audit these areas.

A. WHAT CHANGED SINCE PART 1. List every migration after 0040 and every feature in the "Current state" and "Next tasks" parts of CLAUDE.md. For each one say verified, partly or broken, with the file and test that shows it. Pay particular attention to: clinic teams and locations (0045, 0047), help requests (0046), Stripe payments, passes and Founding clinics (0048 to 0052), the job headline (0053), social links (0054), interest in clinics (0055, 0058), registration numbers (0056), follows (0057), saved jobs (0059), the Slack alerts and approve buttons, Insights and Candidates in Admin, demo account filtering, and the retention builds.

B. PERMISSIONS AND PERSONAL DATA. For every table added since part 1, check who can read it and who can write it, through the visitor key, a candidate, a clinic owner, a team member at each level, another clinic and an admin. Check the access tests (scripts/dev/rls-tests.sql) really cover each one. Check that no page or API route shows a resume, an email or an application to someone who should not see it. Check the data download and account deletion cover every new table, and that the privacy policy and help centre say what the code does. Check that Slack and email messages carry no names, emails or resumes except where decided.

C. MONEY. Walk every payment path in test mode and in the code: a single post, a refused card, a pass, upgrade and cancel, Founding clinic price locks, the free launch with no card (payment_method_collection if_required), refunds, receipts, and what each failure leaves behind (a job live but unpaid, or paid but not live). Check the webhook is signed, repeated deliveries do no harm, and a price is never taken from the browser.

D. PERFORMANCE AND VOLUME. Measure, do not guess.
1. Core Web Vitals and Lighthouse on the home page, Find jobs, a job page, a clinic page, the blog, sign up, apply, the clinic dashboard and the applicants board, on a phone and a desktop.
2. On a scratch database, seed realistic volume (for example 500 clinics, 5,000 jobs of which 4,000 are expired, 20,000 applications) and time every public page, every dashboard and the daily job. List the slowest queries and the missing indexes.
3. Every place that reads a fixed number of rows (search for .limit( and .range( and for anything that reads a whole table). Supabase also caps rows per request (the Max rows setting, often 1,000), so say what happens at 1,000, 5,000 and 20,000. Known suspect: listPublicClinics in lib/public-clinics.ts. Report anything that fails quietly.
4. The daily job: its run time at that volume against Vercel's function time limit, and what happens if it is cut off halfway. Every step must be safe to run twice.
5. Email: the shared daily count, batch sizes and what a Resend outage does.

E. DATA LIFE. Check every retention period in the privacy policy against lib/retention.ts and the daily job, with fake dates. Check that a clinic page never disappears, that old job records and anonymous pay data are kept by year as decided, and that payment records are kept 6 years and are not deleted with a job.

F. SEARCH AND AI VISIBILITY. Structured data matches the visible page everywhere. Sitemap, robots.txt, llms.txt, canonical addresses, noindex rules, page titles, thin pages, internal links, clinic and company page addresses that never change, and what Google and an AI assistant would see on the live site if it can be read.

G. THE TRUTH CHECK. Compare CLAUDE.md, docs/ and the help centre with the code. List every statement that is no longer true, every setting missing from docs/settings.md and every secret missing from docs/security.md.

H. OPPORTUNITIES. Where do candidates and clinics drop off between landing, sign up, profile, apply and post a job (use docs/audit/CLICK-COUNT-2026-11-12.md as the baseline). Where could pages, emails or wording bring in more of the right people? What are the 10 highest value changes, each with effort and risk? Respect every rule in CLAUDE.md.

I. GATES. Say what is left for Gate A (lawyer, disclosure, company), Gate B (policies published, every flow tested on a phone) and Gate C (50 live roles in 5 or more provinces), and what Steve must do, in order, before the launch switches.

REPORT: follow docs/audit/REPORT-TEMPLATE.md. Number findings P2-01 onward, with severity (blocker, high, medium, low), the file, what to do and who does it. End with the 10 actions ranked, and a section called Could not verify. Write the final report to docs/audit/AUDIT-2026-12-PART2.md.
```
