-- 0035: pay can now be dollars, a percentage, or both (Steve, 9th November 2026), for every unit.
--   * a percentage can sit alongside a yearly, hourly or daily amount ("$90,000 a year, plus 10% of production")
--   * "exam fees" joins production, collections and billings as what a percentage is of
--   * a daily rate can carry the days worked a week, used only for a labelled yearly estimate
--   * "guaranteed minimum" can apply to any dollar unit, not only a day
-- At least one part must be filled in on a post past the draft stage. Existing jobs are untouched and still valid.
-- Safe to run more than once.

alter table public.jobs add column if not exists pay_days_per_week smallint;
alter table public.jobs drop constraint if exists jobs_pay_days_per_week_check;
alter table public.jobs add constraint jobs_pay_days_per_week_check check (pay_days_per_week is null or pay_days_per_week between 1 and 7);

alter table public.jobs drop constraint if exists jobs_pay_percent_of_check;
alter table public.jobs add constraint jobs_pay_percent_of_check check (pay_percent_of is null or pay_percent_of in ('production', 'collections', 'billings', 'exam_fees'));

-- A guaranteed minimum needs dollar amounts (the unit may now be a year, an hour or a day).
alter table public.jobs drop constraint if exists jobs_pay_shape_check;
alter table public.jobs add constraint jobs_pay_shape_check check (not pay_is_minimum or pay_period is not null);

-- The rule for a job past the draft stage: same as 0034 except for the pay part, which is now
--   dollars (year, hour or day; width rules as before) and/or a percentage (at most 10 points wide, and says what it is of),
--   at least one of the two, and no half filled part.
alter table public.jobs drop constraint if exists jobs_complete_unless_draft;
alter table public.jobs add constraint jobs_complete_unless_draft check (
  status in ('draft', 'rejected')
  or (status = 'closed' and posted_at is not null)
  or (
    role_category is not null and employment_type is not null
    and province is not null and city is not null
    and (is_seeded or (is_existing_vacancy is not null and uses_ai_screening is not null))
    and description is not null and char_length(description) >= 50
    and (apply_method = 'kestrel' or apply_url is not null)
    and (
      (
        pay_period in ('year', 'hour', 'day') and pay_min is not null and pay_max is not null and pay_max >= pay_min
        and (
          case pay_period
            when 'day' then pay_max - pay_min <= 200
            when 'hour' then 2080 * (pay_max - pay_min) <= 50000 or 2080 * pay_max > 200000
            else pay_max - pay_min <= 50000 or pay_max > 200000
          end
        )
      )
      or (pay_period is null and pay_min is null and pay_max is null and not pay_is_minimum)
    )
    and (
      (pay_percent_min is not null and pay_percent_max is not null and pay_percent_of is not null
        and pay_percent_max >= pay_percent_min and pay_percent_max - pay_percent_min <= 10)
      or (pay_percent_min is null and pay_percent_max is null and pay_percent_of is null)
    )
    and (pay_period is not null or pay_percent_min is not null)
  )
);

grant select (pay_days_per_week) on public.jobs to anon;
grant insert (pay_days_per_week) on public.jobs to authenticated;
grant update (pay_days_per_week) on public.jobs to authenticated;

-- Templates carry the same.
alter table public.job_templates add column if not exists pay_days_per_week smallint;
alter table public.job_templates drop constraint if exists job_templates_pay_days_per_week_check;
alter table public.job_templates add constraint job_templates_pay_days_per_week_check check (pay_days_per_week is null or pay_days_per_week between 1 and 7);
alter table public.job_templates drop constraint if exists job_templates_pay_percent_of_check;
alter table public.job_templates add constraint job_templates_pay_percent_of_check check (pay_percent_of is null or pay_percent_of in ('production', 'collections', 'billings', 'exam_fees'));
grant insert (pay_days_per_week) on public.job_templates to authenticated;
grant update (pay_days_per_week) on public.job_templates to authenticated;

-- The copy kept when a live job is edited includes the days a week.
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
      'pay_percent_of', old.pay_percent_of, 'tags_software', old.tags_software, 'tags_equipment', old.tags_equipment,
      'tags_specialties', old.tags_specialties,
      'is_existing_vacancy', old.is_existing_vacancy, 'uses_ai_screening', old.uses_ai_screening, 'description', old.description,
      'apply_method', old.apply_method, 'apply_url', old.apply_url, 'work_arrangement', old.work_arrangement,
      'territory', old.territory, 'pay_extras', old.pay_extras, 'posted_at', old.posted_at, 'expires_at', old.expires_at));
  end if;
  return null;
end;
$$;
revoke execute on function public.keep_live_version() from public, anon, authenticated;
