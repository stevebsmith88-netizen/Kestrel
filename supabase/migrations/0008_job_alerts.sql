-- Job alerts: a candidate asks to be emailed when new jobs match what they are looking for.
-- Each person can set up to 5. The daily housekeeping job sends the emails. Safe to run more than once.

create table if not exists public.job_alerts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  role_category text check (role_category is null or role_category in (
                  'Optometrist', 'Optician', 'Optometric assistant or technician',
                  'Practice or clinic manager', 'Patient care or reception')),
  province      text check (province is null or char_length(province) <= 40),
  practice_type text check (practice_type is null or practice_type in ('independent', 'corporate')),
  -- Only jobs posted after this moment are included in the next email.
  last_sent_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists job_alerts_user_idx on public.job_alerts (user_id);

alter table public.job_alerts enable row level security;

create or replace function public.limit_job_alerts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.job_alerts where user_id = new.user_id) >= 5 then
    raise exception 'You can have up to 5 job alerts.';
  end if;
  return new;
end;
$$;

drop trigger if exists job_alerts_limit on public.job_alerts;
create trigger job_alerts_limit
  before insert on public.job_alerts
  for each row execute function public.limit_job_alerts();

drop policy if exists "People can read their own alerts" on public.job_alerts;
create policy "People can read their own alerts"
  on public.job_alerts for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "People can add their own alerts" on public.job_alerts;
create policy "People can add their own alerts"
  on public.job_alerts for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "People can remove their own alerts" on public.job_alerts;
create policy "People can remove their own alerts"
  on public.job_alerts for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.job_alerts from anon, authenticated;
grant select on public.job_alerts to authenticated;
grant insert (user_id, role_category, province, practice_type) on public.job_alerts to authenticated;
grant delete on public.job_alerts to authenticated;

revoke execute on function public.limit_job_alerts() from public, anon, authenticated;
