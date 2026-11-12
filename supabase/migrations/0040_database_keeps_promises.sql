-- 0040: the database keeps the promises the website makes (audit part 1, Phase D, 12th November 2026).
-- Each part below closes 1 finding from docs/audit/AUDIT-2026-11-PART1.md. Nobody's data is changed or removed.
-- Safe to run more than once. The access tests for every part are in scripts/dev/rls-tests.sql.

-- ---------------------------------------------------------------- P1-16: the name hold cannot be skipped
-- Signed in people could change their own first_name, last_name and full_name directly, which skipped the 30 day hold (migration 0039).
-- The website now saves a name with the server's key, after checking the hold (lib/name-change.ts), so the permission is taken away.
-- Before this is run the website already saves names through the server, so nothing changes for anyone on the day it is run.
revoke update on public.profiles from authenticated;
revoke update (first_name, last_name, full_name) on public.profiles from authenticated;
