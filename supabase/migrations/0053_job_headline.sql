-- 0053: an optional one line headline on a job (Steve, 14th November 2026; plan in CLAUDE.md, next tasks item 12). Safe to run twice.
--
-- The job title is set from the role, the type of work, a level and a specialty, so every post reads the same way. The headline is the clinic's own
-- voice, up to 70 characters, shown under the title on the job card and page and in the review queue. It is never part of the title sent to Google.
-- The website checks it (lib/jobs.ts: no Canadian experience, no web address, no dollar amount) and the admin review is the backstop.

alter table public.jobs add column if not exists headline text;

alter table public.jobs drop constraint if exists jobs_headline_length;
alter table public.jobs add constraint jobs_headline_length check (headline is null or char_length(headline) <= 70);

-- Who may read and write it (a column missing from these lists silently fails to save).
grant select (headline) on public.jobs to anon;
grant insert (headline) on public.jobs to authenticated;
grant update (headline) on public.jobs to authenticated;

-- The copy kept when a live job is edited includes it, so the review queue can show what changed.
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
      'title', old.title, 'headline', old.headline, 'role_category', old.role_category, 'employment_type', old.employment_type,
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
