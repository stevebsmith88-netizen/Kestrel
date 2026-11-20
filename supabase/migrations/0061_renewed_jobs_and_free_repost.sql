-- 0061: renewed jobs go back to the top, and a free second chance (Steve, 20th November 2026). Safe to run twice.
-- (0060 is kept for the Canada only province rule, planned in another chat.)
--
-- 1. `sort_at` is the date the Newest list sorts on: the later of when a job went live and when it was last extended, so every
--    extension moves the job back to the top. It is worked out by the database from the 2 dates already there, so no code has to
--    keep it in step. The Google JobPosting date and the alert emails still use `posted_at`, which never moves.
-- 2. `free_repost_of` marks a job that is the one free second chance for an older job that ran 3 months with no hire marked through
--    Kestrel. Only the website's server can set it (no grant to a clinic's own sign in), and a unique index means an older job can
--    have 1 such copy, so a clinic cannot claim it twice.

alter table public.jobs add column if not exists sort_at timestamptz generated always as (greatest(posted_at, last_extended_at)) stored;
create index if not exists jobs_sort_at_idx on public.jobs (sort_at desc) where status = 'live';
grant select (sort_at) on public.jobs to anon;
grant select (sort_at) on public.jobs to authenticated;

alter table public.jobs add column if not exists free_repost_of uuid references public.jobs (id) on delete set null;
create unique index if not exists jobs_one_free_repost on public.jobs (free_repost_of) where free_repost_of is not null;
revoke select (free_repost_of) on public.jobs from anon;
