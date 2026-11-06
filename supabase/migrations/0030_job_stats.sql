-- Job views and apply clicks, counted per job per day (audit R17). The clinic dashboard shows these numbers.
-- No cookies, no visitor address and no account is stored: only a count. Only the website's server can add to a count,
-- through record_job_event, and only while the job is live. A clinic can read the counts for its own jobs, and an admin
-- can read all of them. Safe to run more than once.

create table if not exists public.job_daily_stats (
  job_id        uuid not null references public.jobs (id) on delete cascade,
  day           date not null,
  views         integer not null default 0 check (views >= 0),
  apply_clicks  integer not null default 0 check (apply_clicks >= 0),
  primary key (job_id, day)
);

alter table public.job_daily_stats enable row level security;
revoke all on public.job_daily_stats from anon, authenticated;
grant select on public.job_daily_stats to authenticated;

drop policy if exists "Clinics can read the numbers for their own jobs" on public.job_daily_stats;
create policy "Clinics can read the numbers for their own jobs"
  on public.job_daily_stats for select to authenticated
  using (exists (select 1 from public.jobs j where j.id = job_id and public.owns_employer(j.employer_id)));

drop policy if exists "Admins can read every job's numbers" on public.job_daily_stats;
create policy "Admins can read every job's numbers"
  on public.job_daily_stats for select to authenticated
  using (public.is_admin());

-- Adds 1 to today's count (Toronto time) for a live job. Anything else is quietly ignored.
create or replace function public.record_job_event(p_job_id uuid, p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_kind not in ('view', 'apply_click') then
    return;
  end if;
  if not exists (select 1 from public.jobs where id = p_job_id and status = 'live' and expires_at > now()) then
    return;
  end if;
  insert into public.job_daily_stats as s (job_id, day, views, apply_clicks)
  values (p_job_id, (now() at time zone 'America/Toronto')::date, case when p_kind = 'view' then 1 else 0 end, case when p_kind = 'apply_click' then 1 else 0 end)
  on conflict (job_id, day) do update
    set views = s.views + excluded.views, apply_clicks = s.apply_clicks + excluded.apply_clicks;
end;
$$;

revoke all on function public.record_job_event(uuid, text) from public, anon, authenticated;
grant execute on function public.record_job_event(uuid, text) to service_role;
