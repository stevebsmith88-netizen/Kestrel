-- Job alert frequency, and safeguards against recruiters and spam. Safe to run more than once.

-- 1. Each alert can arrive daily, weekly or monthly. Weekly is the default so inboxes stay calm.
alter table public.job_alerts add column if not exists frequency text not null default 'weekly';
alter table public.job_alerts drop constraint if exists job_alerts_frequency_check;
alter table public.job_alerts add constraint job_alerts_frequency_check check (frequency in ('daily', 'weekly', 'monthly'));
grant insert (user_id, role_category, province, practice_type, frequency) on public.job_alerts to authenticated;

-- 2. A clinic confirms it is hiring directly, not as a recruiter or agency. The date is kept as a record.
alter table public.employers add column if not exists direct_hire_confirmed_at timestamptz;
grant insert (owner_id, clinic_name, practice_type, website, province, city, about, direct_hire_confirmed_at) on public.employers to authenticated;
grant update (clinic_name, practice_type, website, province, city, about, direct_hire_confirmed_at) on public.employers to authenticated;

-- 3. A clinic can have at most 10 open jobs (drafts, in review or live) at a time.
create or replace function public.limit_open_jobs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.jobs where employer_id = new.employer_id and status in ('draft', 'in_review', 'live')) >= 10 then
    raise exception 'You can have up to 10 open jobs at a time. Close or delete one to add another.';
  end if;
  return new;
end;
$$;

drop trigger if exists jobs_limit_open on public.jobs;
create trigger jobs_limit_open
  before insert on public.jobs
  for each row execute function public.limit_open_jobs();

revoke execute on function public.limit_open_jobs() from public, anon, authenticated;
