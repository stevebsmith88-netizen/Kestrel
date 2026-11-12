# Audit part 1: prompt to paste into a new chat (Fable)

Written 12th November 2026. Paste everything in the block below into a new session in this repository. Run it after the SQL (`supabase/combined/run-everything.sql`, migrations 0001 to 0039) has been run on both databases, so the audit sees the finished system. Part 2, the deeper performance and opportunities audit, is planned for about 3 weeks before launch.

```
You are the auditor for Kestrel Eye Care Jobs (eyecarejobs.ca), a Canadian eye care job board. The founder, Steve Smith, is not a developer. Write findings in plain English, with severity and what he needs to decide. Be thorough, honest about what you could not verify, and never invent evidence.

READ FIRST: CLAUDE.md (every decision in it is a rule to check the code against), docs/audit/AUDIT-PLAN.md, docs/audit/REPORT-TEMPLATE.md, docs/audit/AUDIT-REPORT-2026-10-30.md, docs/gemini-intake-plan-2026-11-08.md, docs/discoverability-plan.md, docs/candidates-and-applications.md, docs/clinics-and-jobs.md, docs/cv-scanning.md, docs/onboarding-emails.md, docs/security.md.

THIS IS READ ONLY. Do not change application code, run SQL against any real database, contact anyone, or open pull requests. The only files you may write are under docs/audit/, on a new branch called audit/2026-11-part1, pushed to that branch only. Do not use any Eye Recommend data. Do not scrape. You may read public pages of https://eyecarejobs.ca. The demo site (demo.eyecarejobs.ca) is noindexed and uses sample data.

STAY RESUMABLE (usage limits may stop you at any point):
1. Create docs/audit/AUDIT-PROGRESS-PART1.md listing every area below with a status (not started, in progress, done) and a line of notes. Update it, and commit and push it with the findings so far, after EVERY area. Never hold findings only in your head.
2. At the start of every session, read that file and continue from the first area not done.
3. At the very start, if you have scheduling tools (for example create_trigger or send_later), create ONE recurring scheduled task bound to this session, once an hour, with this prompt: "Continue the Kestrel part 1 audit. Read docs/audit/AUDIT-PROGRESS-PART1.md and carry on from the first area not done. If every area is done and the final report is written, disable this scheduled task and stop." When the audit is finished, disable it. If you have no scheduling tools, say so in your first message and tell Steve to type "continue" after a usage reset.
4. Work in small batches. If you are told you have hit a limit, stop cleanly after your last commit.

FIRST, run and record: npm run typecheck, npm test, npm run build, npm audit (all levels), and a scan of the repository and its git history for anything that looks like a secret. Then audit these areas.

A. DECISIONS VERSUS CODE. For each, find the code, test it, and say verified, partly, or broken:
1. Pay is public on every job surface (job page, cards, search, structured data, emails). Pay range rules (max $50,000 wide unless over $200,000), the 2 required yes or no questions, and no "Canadian experience" wording.
2. Quebec jobs are refused at every entry point (clinic form, admin post for a clinic, found listings, province search).
3. Apply rule (lib/role-fit.ts): job page, apply page and server action agree. An optician and an optometrist never see or apply to each other's jobs, including through "other roles". Field and supplier roles only through the opt-in tick, never for optometrists.
4. "Ready to apply" (lib/profile-ready.ts) means role, resume, town and province, and every place that uses it agrees (profile, apply, dashboard, emails, admin numbers).
5. Shortlisting is never announced to a candidate: check candidate pages, emails, the inbox, the data export, bulk actions and any API route.
6. Privacy: a clinic sees only what a candidate sent with an application. The career stage, software skills, search preferences, minimum pay and town are never exposed to clinics. Resume downloads only through a 1 minute signed link.
7. Matching has no AI. Kestrel never ranks applicants for clinics.
8. Name hold (lib/name-hold.ts): edge cases (Google sign in, empty names, missing admin client, same name resaved), and that nobody can clear their own hold.
9. First step page: no redirect loops, existing users handled, works with a "next" address, safe before migration 0037.
10. The in account inbox: messages written at the right moments, no duplicates, no personal details in messages, safe links, and the unread count query on every page (cost).
11. Writing rules: "resume" not "CV", "dashboard" not "home" for signed in people, no banned words or dashes in anything users read, including emails and error strings in lib. Tests exist; check what they miss.

B. DATABASE. Read every migration and supabase/combined/run-everything.sql. Confirm the combined file equals the migrations in order, is safe to run twice, and its final check lists every object. Review row level security and column grants for every table, especially notifications (0038), candidate_profiles (0037) and profiles.name_changed_at (0039). If Postgres 16 is available, use scripts/dev/scratch-db.sh and write real row level security tests (a user reading or changing another user's rows, a clinic reading a candidate it has no application from, writes without a grant). Report anything that can be read or written that should not be.

C. SAFE BEFORE THE SQL. Prove that each new feature still works on a database that has NOT had migrations 0037 to 0039 (first step page, inbox and its count, name hold, onboarding emails), and that nothing crashes or silently loses data.

D. SERVER ACTIONS AND ROUTES. Every action and route handler: does it check the role and ownership? Input validation, error handling, anything leaking an error or personal data, rate limits, and the admin routes.

E. FIND JOBS, FOR ME AND SORT. Correctness and cost of the "everything" search path (up to 1,000 jobs held in memory), pagination, view and sort parameters, filtered pages kept out of search, hide and applied lists, and behaviour with 5,000 jobs.

F. RESUME READER (highest risk: our servers now open uploaded files). lib/resume-text.ts, lib/resume-reader.ts, lib/resume-actions.ts: zip bombs, PDF parser hardening, size, page and time limits, memory, error logging (the resume text must never be logged or stored), whether the packages work on Vercel's runtime (bundling, function duration and memory limits), npm audit of unpdf and fflate, and whether the privacy, security and help wording matches what the code does. Test it on a few made up resumes if you can.

G. EMAIL AND CASL. First week emails, application emails and all sends: sender, unsubscribe, mailing address, do not email handling, the daily budget, the demo site never sending, and wording quality. Confirm ENABLE_ONBOARDING_EMAILS and outreach are off by default.

H. ACCESSIBILITY AND MOBILE (WCAG 2.1 AA, a 375 pixel wide phone): the top bar and menu, the envelope with its count, the first step page, the profile page with its closed sections, dashboard tiles as links, For me and Sort by, the hover highlight, focus order, names for screen readers, contrast, tap size. Use the browser available in this environment to look, and screenshot anything wrong.

I. DOCS AGAINST REALITY. Check every claim on /privacy, /security, /terms, the help centre (every step against the real screens), CLAUDE.md, and the lawyer pack list, against the real behaviour. List anything the lawyer has not been told (resume reading on our server, the inbox, the career stage answer, the name hold, the first week emails).

J. TESTS, DEAD CODE AND HEALTH. Gaps in tests for new code, dead or duplicated code, dependency health, settings that exist in code but not in docs/security.md, and how demo mode behaves.

K. SEO AND SEARCH VISIBILITY (Steve's main goal: first on Google and the source AI assistants name). A GENERAL OVERVIEW, not a deep audit, but concrete:
1. Technical: robots, sitemap contents and freshness, canonical tags, noindex rules (filters, sort, view, empty landing pages), JobPosting structured data validity and that it matches the visible page, that expired and unclaimed found jobs drop their markup, Organization and website data, titles, descriptions, social sharing tags, headings, internal links, 404s, redirects, the IndexNow key.
2. Rendering and speed: public pages call connection() in components/SiteHeader.tsx and the app bar reads the session on every page. Work out whether this forces every public page to render on demand, what it does to caching and speed, and whether a cheaper design exists. Run a mobile Lighthouse style check on the home page, Find jobs, a job page, a blog post, Resources, Compare and For clinics (use the browser here), and record the numbers and the biggest causes.
3. Content: the blog (about 24 posts scheduled into April 2027, check that future posts are not exposed early), the hub and cluster plan, role and province landing pages, the pay guide, whether each page has a clear single purpose and keyword, thin or duplicate pages, and gaps against what Jobs4ECPs and Indeed rank for in Canadian eye care.
4. Google for Jobs and AI assistants: what is needed to qualify, what is missing, and cheap ways to be named by AI assistants (clear facts pages, consistent business details, FAQ style content, sameAs links). Compare with docs/marketing/ai-visibility-baseline.md.
5. Opportunities: a ranked list of the 10 best SEO moves, each with effort, expected impact and what Steve must supply.

OUTPUT. Write the final report to docs/audit/AUDIT-2026-11-PART1.md using the report template: a one page plain English summary for Steve first; then findings ranked by severity (ID like P1-01, where and which file and line, what you saw, why it matters, how to fix it, effort); then a "verified as expected" list; then a "could not verify" list (things needing the real database, Vercel or Steve); then the SEO overview from area K; then a suggested order of fixes in phases, with a gate between phases. Do not fix anything. Finish with a short plain English message to Steve, and ask which findings he wants fixed first.
```
