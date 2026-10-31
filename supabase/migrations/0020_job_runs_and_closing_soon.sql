-- Email and operations fixes from the 30th October 2026 audit. Safe to run more than once.
--  1. job_runs: a lock so the daily job cannot run twice at once, and a record of when it last finished well
--     (the health check reads this, so a missed run shows up in the uptime monitor).
--  2. jobs.expiry_reminded_at: so the "your job closes in 3 days" email goes out once.

create table if not exists public.job_runs (
  name             text primary key,
  locked_until     timestamptz,
  last_started_at  timestamptz,
  last_finished_at timestamptz,
  last_ok_at       timestamptz,
  last_result      jsonb
);
alter table public.job_runs enable row level security;
revoke all on public.job_runs from anon, authenticated;

-- Returns true if this caller now holds the lock. A lock that was never released (a crash) frees itself after p_minutes.
create or replace function public.claim_job_run(p_name text, p_minutes integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed text;
begin
  insert into public.job_runs (name, locked_until, last_started_at)
  values (p_name, now() + make_interval(mins => p_minutes), now())
  on conflict (name) do update
    set locked_until = excluded.locked_until, last_started_at = excluded.last_started_at
    where public.job_runs.locked_until is null or public.job_runs.locked_until < now()
  returning name into claimed;
  return claimed is not null;
end;
$$;
revoke execute on function public.claim_job_run(text, integer) from public, anon, authenticated;
grant execute on function public.claim_job_run(text, integer) to service_role;

alter table public.jobs add column if not exists expiry_reminded_at timestamptz;
