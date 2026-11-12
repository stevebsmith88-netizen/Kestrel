-- 0040: the database keeps the promises the website makes (audit part 1, Phase D, 12th November 2026).
-- Each part below closes 1 finding from docs/audit/AUDIT-2026-11-PART1.md. Nobody's data is changed or removed.
-- Safe to run more than once. The access tests for every part are in scripts/dev/rls-tests.sql.

-- ---------------------------------------------------------------- P1-16: the name hold cannot be skipped
-- Signed in people could change their own first_name, last_name and full_name directly, which skipped the 30 day hold (migration 0039).
-- The website now saves a name with the server's key, after checking the hold (lib/name-change.ts), so the permission is taken away.
-- Before this is run the website already saves names through the server, so nothing changes for anyone on the day it is run.
revoke update on public.profiles from authenticated;
revoke update (first_name, last_name, full_name) on public.profiles from authenticated;

-- ---------------------------------------------------------------- P1-28: no Quebec job in review or live
-- Kestrel is in English for now, so the website refuses a job in Quebec (Steve, 6th November 2026). A job sent straight to the database API
-- skipped that. This rule refuses a Quebec job that is in review or live. Drafts, and jobs that are rejected, closed or expired, are left
-- alone, so a Quebec job that somehow exists already can still be closed or run out. "not valid" means rows already in the table are not
-- checked today (the check at the end of the combined file counts them, and it should say 0).
alter table public.jobs drop constraint if exists jobs_not_quebec_once_sent;
alter table public.jobs add constraint jobs_not_quebec_once_sent check (
  status not in ('in_review', 'live') or province is null or lower(btrim(province)) not in ('quebec', 'québec', 'qc')
) not valid;

-- ---------------------------------------------------------------- P1-44: percentages and daily rates are for optometrist roles
-- The website's form only lets an optometrist role give pay as a percentage or a daily rate (Steve, 9th November 2026, lib/job-pay.ts).
-- The database accepted both for any role. This rule holds the same line for a job that is in review or live. Drafts are left alone so a
-- clinic can save a half finished job and fix it. "not valid": rows already in the table are not checked today (the check at the end counts them).
alter table public.jobs drop constraint if exists jobs_optometrist_only_pay;
alter table public.jobs add constraint jobs_optometrist_only_pay check (
  status not in ('in_review', 'live')
  or coalesce(role_category = 'Optometrist', false)
  or ((pay_period is null or pay_period <> all (array['day'])) and pay_percent_min is null and pay_percent_max is null)
) not valid;
