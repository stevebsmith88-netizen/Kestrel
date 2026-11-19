-- 0059: saved jobs (Steve, 19th November 2026). Safe to run twice.
--
-- A candidate can save a job to apply for later. Only the website's server reads and writes this table: visitors, other candidates and
-- clinics have no access, so a clinic never sees who saved its job. A saved job goes when the candidate's account or the job is deleted, and
-- the list is in the candidate's data download. `reminded_at` records that the candidate was reminded the job is about to close, so it is
-- done once.

create table if not exists public.saved_jobs (
  user_id     uuid not null references auth.users (id) on delete cascade,
  job_id      uuid not null references public.jobs (id) on delete cascade,
  created_at  timestamptz not null default now(),
  reminded_at timestamptz,
  primary key (user_id, job_id)
);
create index if not exists saved_jobs_job_idx on public.saved_jobs (job_id);
-- Safe to run again after an earlier version of this migration.
alter table public.saved_jobs add column if not exists reminded_at timestamptz;
alter table public.saved_jobs enable row level security;
revoke all on public.saved_jobs from anon, authenticated;
