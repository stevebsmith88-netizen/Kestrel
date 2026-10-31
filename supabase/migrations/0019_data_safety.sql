-- Data safety fixes from the 30th October 2026 audit. Safe to run more than once.
--  1. A job that has ever been live, or has any application, can no longer be deleted by the clinic. It can be closed instead,
--     so candidates keep their record of having applied.
--  2. A draft or rejected job that was once live can be closed (it could only be deleted before).
--  3. When a live job is edited, the wording candidates were seeing is kept (job_versions), so the review queue can compare.
--  4. The "10 open jobs" limit can no longer be beaten by sending two posts at the same moment.
--  5. A small record that an account was deleted (no names or emails), for Steve's own records.

-- 1. who may delete a job
create or replace function public.job_has_applications(job uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.applications where job_id = job);
$$;
revoke execute on function public.job_has_applications(uuid) from public, anon;
grant execute on function public.job_has_applications(uuid) to authenticated;

drop policy if exists "Clinics can delete their drafts" on public.jobs;
create policy "Clinics can delete their drafts"
  on public.jobs for delete to authenticated
  using (
    public.owns_employer(employer_id)
    and status in ('draft', 'rejected')
    and posted_at is null
    and not public.job_has_applications(id)
  );

-- 2. a job that was live can be closed from a draft or rejected state
create or replace function public.enforce_job_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  if (select auth.uid()) is null or public.is_admin() then
    return new;
  end if;

  if new.status <> old.status and not (
       (old.status = 'draft' and new.status = 'in_review')
    or (old.status = 'rejected' and new.status in ('draft', 'in_review'))
    or (old.status = 'in_review' and new.status = 'draft')
    or (old.status = 'live' and new.status in ('closed', 'in_review'))
    or (old.status in ('draft', 'rejected') and new.status = 'closed' and old.posted_at is not null)
  ) then
    raise exception 'That change is not allowed.';
  end if;

  if new.status = old.status and old.status in ('in_review', 'live', 'closed', 'expired')
     and (to_jsonb(new) - 'updated_at') <> (to_jsonb(old) - 'updated_at') then
    raise exception 'This job can no longer be edited.';
  end if;
  return new;
end;
$$;

-- a job that was once live can be closed even if its draft was later changed and left incomplete
alter table public.jobs drop constraint if exists jobs_complete_unless_draft;
alter table public.jobs add constraint jobs_complete_unless_draft check (
  status in ('draft', 'rejected')
  or (status = 'closed' and posted_at is not null)
  or (
    role_category is not null and employment_type is not null
    and province is not null and city is not null
    and pay_period is not null and pay_min is not null and pay_max is not null
    and pay_max >= pay_min
    and is_existing_vacancy is not null and uses_ai_screening is not null
    and description is not null and char_length(description) >= 50
    and (apply_method = 'kestrel' or apply_url is not null)
    and (
      (case when pay_period = 'hour' then 2080 else 1 end) * (pay_max - pay_min) <= 50000
      or (case when pay_period = 'hour' then 2080 else 1 end) * pay_max > 200000
    )
  )
);

-- 3. keep the wording candidates were seeing when a live job is edited
create table if not exists public.job_versions (
  id        uuid primary key default gen_random_uuid(),
  job_id    uuid not null references public.jobs (id) on delete cascade,
  saved_at  timestamptz not null default now(),
  snapshot  jsonb not null
);
create index if not exists job_versions_job_idx on public.job_versions (job_id, saved_at desc);
alter table public.job_versions enable row level security;
revoke all on public.job_versions from anon, authenticated;

create or replace function public.keep_live_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'live' and new.status = 'in_review' then
    insert into public.job_versions (job_id, snapshot)
    values (old.id, jsonb_build_object(
      'title', old.title, 'role_category', old.role_category, 'employment_type', old.employment_type,
      'province', old.province, 'city', old.city, 'pay_period', old.pay_period, 'pay_min', old.pay_min, 'pay_max', old.pay_max,
      'is_existing_vacancy', old.is_existing_vacancy, 'uses_ai_screening', old.uses_ai_screening, 'description', old.description,
      'apply_method', old.apply_method, 'apply_url', old.apply_url, 'work_arrangement', old.work_arrangement,
      'territory', old.territory, 'pay_extras', old.pay_extras, 'posted_at', old.posted_at, 'expires_at', old.expires_at));
  end if;
  return null;
end;
$$;
revoke execute on function public.keep_live_version() from public, anon, authenticated;

drop trigger if exists jobs_keep_live_version on public.jobs;
create trigger jobs_keep_live_version after update on public.jobs for each row execute function public.keep_live_version();

-- 4. the open jobs limit, with a lock so two posts at the same moment are counted one after the other
create or replace function public.limit_open_jobs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.employer_id::text, 0));
  if (select count(*) from public.jobs where employer_id = new.employer_id and status in ('draft', 'in_review', 'live')) >= 10 then
    raise exception 'You can have up to 10 open jobs at a time. Close or delete one to add another.';
  end if;
  return new;
end;
$$;

-- 5. a record that an account was deleted, with no personal details
create table if not exists public.account_deletions (
  id                 uuid primary key default gen_random_uuid(),
  deleted_at         timestamptz not null default now(),
  account_role       text not null,
  jobs_count         integer not null default 0,
  applications_count integer not null default 0
);
alter table public.account_deletions enable row level security;
revoke all on public.account_deletions from anon, authenticated;
