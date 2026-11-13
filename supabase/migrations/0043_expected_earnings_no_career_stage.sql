-- 0043: expected earnings beside percentage pay, and the career stage question removed (Steve, 12th November 2026). Safe to run twice.
--
-- 1. An optometrist job paid only by a percentage (of production, collections, billings or exam fees) now also gives the clinic's own
--    estimate of what the role earns, in dollars, by the day or the year, shown as the clinic's estimate. It answers the question of whether
--    a percentage alone meets the Ontario and British Columbia pay rules by always giving a dollar range. It is the clinic's figure, never
--    pay from another job board. The website checks it (lib/job-pay.ts) and the admin review is the backstop, so there is no new rule on
--    jobs already live.
-- 2. "Where are you in eye care" is no longer asked. Answers already saved are cleared, and a candidate can no longer write the column.
--    The column itself is removed in a later tidy up.

alter table public.jobs
  add column if not exists pay_expected_min    numeric(10, 2) check (pay_expected_min is null or pay_expected_min > 0),
  add column if not exists pay_expected_max    numeric(10, 2) check (pay_expected_max is null or pay_expected_max > 0),
  add column if not exists pay_expected_period text check (pay_expected_period is null or pay_expected_period in ('day', 'year'));

alter table public.jobs drop constraint if exists jobs_expected_earnings_shape;
alter table public.jobs add constraint jobs_expected_earnings_shape check (
  (pay_expected_min is null and pay_expected_max is null and pay_expected_period is null)
  or (pay_expected_min is not null and pay_expected_max is not null and pay_expected_period is not null and pay_expected_max >= pay_expected_min)
);

-- Who may read and write them (a column missing from these lists silently fails to save).
grant select (pay_expected_min, pay_expected_max, pay_expected_period) on public.jobs to anon;
grant insert (pay_expected_min, pay_expected_max, pay_expected_period) on public.jobs to authenticated;
grant update (pay_expected_min, pay_expected_max, pay_expected_period) on public.jobs to authenticated;

-- The copy kept when a live job is edited includes them.
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
      'pay_is_minimum', old.pay_is_minimum, 'pay_days_per_week', old.pay_days_per_week,
      'pay_percent_min', old.pay_percent_min, 'pay_percent_max', old.pay_percent_max,
      'pay_percent_of', old.pay_percent_of,
      'pay_expected_min', old.pay_expected_min, 'pay_expected_max', old.pay_expected_max, 'pay_expected_period', old.pay_expected_period,
      'tags_software', old.tags_software, 'tags_equipment', old.tags_equipment,
      'tags_specialties', old.tags_specialties,
      'is_existing_vacancy', old.is_existing_vacancy, 'uses_ai_screening', old.uses_ai_screening, 'description', old.description,
      'apply_method', old.apply_method, 'apply_url', old.apply_url, 'work_arrangement', old.work_arrangement,
      'territory', old.territory, 'pay_extras', old.pay_extras, 'posted_at', old.posted_at, 'expires_at', old.expires_at));
  end if;
  return null;
end;
$$;
revoke execute on function public.keep_live_version() from public, anon, authenticated;

-- The career stage answer: cleared, and no longer writable by a signed in person.
update public.candidate_profiles set career_stage = null where career_stage is not null;
revoke insert (career_stage), update (career_stage) on public.candidate_profiles from authenticated;
