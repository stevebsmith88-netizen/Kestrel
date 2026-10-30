-- "Report this job": anyone can tell us about a post that looks wrong. Reports are written by the
-- server only, and only admins can read them. Safe to run more than once.

create table if not exists public.job_reports (
  id             uuid primary key default gen_random_uuid(),
  job_id         uuid not null references public.jobs (id) on delete cascade,
  reason         text not null check (reason in (
                   'scam', 'recruiter', 'discrimination', 'misleading', 'filled', 'other')),
  details        text check (details is null or char_length(details) <= 1000),
  -- Optional. Only used to write back to the person who reported.
  reporter_email text check (reporter_email is null or char_length(reporter_email) <= 254),
  status         text not null default 'open' check (status in ('open', 'job_removed', 'dismissed')),
  created_at     timestamptz not null default now(),
  handled_at     timestamptz
);

create index if not exists job_reports_open_idx on public.job_reports (status, created_at);
create index if not exists job_reports_job_idx on public.job_reports (job_id);

alter table public.job_reports enable row level security;

drop policy if exists "Admins can read reports" on public.job_reports;
create policy "Admins can read reports"
  on public.job_reports for select to authenticated
  using (public.is_admin());

revoke all on public.job_reports from anon, authenticated;
grant select on public.job_reports to authenticated;
