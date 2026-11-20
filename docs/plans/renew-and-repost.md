# Renewed jobs go back to the top, and a free second chance (decided 20th November 2026)

Steve's decisions, 20th November 2026. Nothing is built yet.

## 1. Every extension moves the job to the top of Newest

- Applies from the start, including during the free launch, and to paid and pass extensions alike.
- Today an extension adds 30 days and sets `last_extended_at`, but the Newest sort uses `posted_at` (`lib/public-jobs.ts`, `lib/job-sort.ts`), so nothing moves. Sort on the later of `posted_at` and `last_extended_at`. This needs a sort date the database can order by (a new column, so SQL on both databases, access tests in `scripts/dev/rls-tests.sql`, a line in `supabase/combined/run-everything.sql`, and the site must keep working on a database without it).
- Be honest on the page: the card and job page say "Renewed 20th November 2026" next to the original posted date. The Google JobPosting `datePosted` stays the original date and must match the visible page.
- No new alert emails. A renewal never triggers job alerts, the Follow digest or the closing reminder again.
- Keep the cap: a clinic can extend only in the last 7 days of a post, or within 7 days after it ends (`lib/job-ending.ts`), so a job moves up at most about once per post period. Do not sell extra bumps.
- Update the help centre, the clinic pass wording and the `/compare` wording when built.

## 2. A free repost, once, as a second chance

Steve said yes to the idea. **Open question for Steve:** what counts as unfilled, either "no hire marked through Kestrel" or "fewer than a set number of applications" (suggestion: fewer than 3 in 30 days).
Draft rules to confirm: only after the job has been live for 3 months in total, the same role at the same clinic, once per job, free of charge and not counted against a pass, and goes through review as normal. Put it in the posting policy and terms as a promise, not a standing right, and check it with the paralegal along with the other drafts.
