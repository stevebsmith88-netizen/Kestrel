-- 0034: Phase 2 of the Gemini intake plan.
--   1. More ways to state pay on a job: a daily rate, a daily minimum guarantee, a percentage of production, collections or billings,
--      and a daily minimum with a percentage together. A pay range is still required for every one of them. Pay stays public.
--   2. Software, equipment and specialty tags on a job (the allowed names are fixed in the website code, so adding one needs no migration).
--   3. Software skills on a candidate profile, private to the candidate.
--   4. The clinic's employee count band, stored in the private clinic contact table (readable only by that clinic and by Admin).
--   5. The missing permission for the "Recommended for you" preference columns added in 0031 (the profile form could not save them).
-- Existing jobs keep working unchanged: every new column is empty or false for them, and they already fit the plain money shape.
-- Safe to run more than once.

-- 1. Pay on a job -------------------------------------------------------------------------------------------------------------------------
alter table public.jobs drop constraint if exists jobs_pay_period_check;
alter table public.jobs add constraint jobs_pay_period_check check (pay_period is null or pay_period in ('year', 'hour', 'day'));

alter table public.jobs
  add column if not exists pay_is_minimum   boolean not null default false,
  add column if not exists pay_percent_min  numeric(5, 2),
  add column if not exists pay_percent_max  numeric(5, 2),
  add column if not exists pay_percent_of   text;

alter table public.jobs drop constraint if exists jobs_pay_percent_min_check;
alter table public.jobs add constraint jobs_pay_percent_min_check check (pay_percent_min is null or (pay_percent_min > 0 and pay_percent_min <= 100));
alter table public.jobs drop constraint if exists jobs_pay_percent_max_check;
alter table public.jobs add constraint jobs_pay_percent_max_check check (pay_percent_max is null or (pay_percent_max > 0 and pay_percent_max <= 100));
alter table public.jobs drop constraint if exists jobs_pay_percent_of_check;
alter table public.jobs add constraint jobs_pay_percent_of_check check (pay_percent_of is null or pay_percent_of in ('production', 'collections', 'billings')) not valid;

-- A daily minimum is always a daily amount.
alter table public.jobs drop constraint if exists jobs_pay_shape_check;
alter table public.jobs add constraint jobs_pay_shape_check check (not pay_is_minimum or pay_period = 'day') not valid;

-- 2. Tags on a job ------------------------------------------------------------------------------------------------------------------------
create or replace function public.tags_ok(tags text[])
returns boolean
language sql
immutable
as $$
  select tags is not null and coalesce(cardinality(tags), 0) <= 12 and not exists (select 1 from unnest(tags) t where t is null or char_length(t) > 40);
$$;

alter table public.jobs
  add column if not exists tags_software    text[] not null default '{}',
  add column if not exists tags_equipment   text[] not null default '{}',
  add column if not exists tags_specialties text[] not null default '{}';
alter table public.jobs drop constraint if exists jobs_tags_check;
alter table public.jobs add constraint jobs_tags_check check (public.tags_ok(tags_software) and public.tags_ok(tags_equipment) and public.tags_ok(tags_specialties));

-- 3. The rule for a job that is past the draft stage. Kept from 0023 (found listings may leave the 2 questions empty; a closed job that
-- was once live stays valid), with the pay part widened:
--   money range:    pay_period year, hour or day; highest at least lowest; year up to $50,000 wide (hour converted to a year) unless the top is
--                   over $200,000; day up to $200 wide. Only a daily minimum may also carry a percentage.
--   percentage only: no money, a percentage range at most 10 points wide.
-- A percentage range, when there is one, is at most 10 points wide and names what it is of.
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
        and (pay_percent_min is null or pay_is_minimum)
        and (
          case pay_period
            when 'day' then pay_max - pay_min <= 200
            when 'hour' then 2080 * (pay_max - pay_min) <= 50000 or 2080 * pay_max > 200000
            else pay_max - pay_min <= 50000 or pay_max > 200000
          end
        )
      )
      or (
        pay_period is null and pay_min is null and pay_max is null and not pay_is_minimum
        and pay_percent_min is not null
      )
    )
    and (
      (pay_percent_min is null and pay_percent_max is null and pay_percent_of is null)
      or (pay_percent_min is not null and pay_percent_max is not null and pay_percent_of is not null
          and pay_percent_max >= pay_percent_min and pay_percent_max - pay_percent_min <= 10)
    )
  )
) not valid; -- "not valid": a database that already has migration 0035 holds pay shapes this older rule does not know, and 0035 sets the final rule

-- 4. Who may read and write the new job columns (a column missing from these lists silently fails to save).
grant select (pay_is_minimum, pay_percent_min, pay_percent_max, pay_percent_of, tags_software, tags_equipment, tags_specialties) on public.jobs to anon;
grant insert (pay_is_minimum, pay_percent_min, pay_percent_max, pay_percent_of, tags_software, tags_equipment, tags_specialties) on public.jobs to authenticated;
grant update (pay_is_minimum, pay_percent_min, pay_percent_max, pay_percent_of, tags_software, tags_equipment, tags_specialties) on public.jobs to authenticated;

-- 5. Templates carry the same pay and tags.
alter table public.job_templates drop constraint if exists job_templates_pay_period_check;
alter table public.job_templates add constraint job_templates_pay_period_check check (pay_period is null or pay_period in ('year', 'hour', 'day'));
alter table public.job_templates
  add column if not exists pay_is_minimum   boolean not null default false,
  add column if not exists pay_percent_min  numeric(5, 2) check (pay_percent_min is null or (pay_percent_min > 0 and pay_percent_min <= 100)),
  add column if not exists pay_percent_max  numeric(5, 2) check (pay_percent_max is null or (pay_percent_max > 0 and pay_percent_max <= 100)),
  add column if not exists pay_percent_of   text check (pay_percent_of is null or pay_percent_of in ('production', 'collections', 'billings')),
  add column if not exists tags_software    text[] not null default '{}',
  add column if not exists tags_equipment   text[] not null default '{}',
  add column if not exists tags_specialties text[] not null default '{}';
alter table public.job_templates drop constraint if exists job_templates_tags_check;
alter table public.job_templates add constraint job_templates_tags_check check (public.tags_ok(tags_software) and public.tags_ok(tags_equipment) and public.tags_ok(tags_specialties));
grant insert (pay_is_minimum, pay_percent_min, pay_percent_max, pay_percent_of, tags_software, tags_equipment, tags_specialties) on public.job_templates to authenticated;
grant update (pay_is_minimum, pay_percent_min, pay_percent_max, pay_percent_of, tags_software, tags_equipment, tags_specialties) on public.job_templates to authenticated;

-- 6. The copy kept when a live job is edited now includes the new fields.
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
      'pay_is_minimum', old.pay_is_minimum, 'pay_percent_min', old.pay_percent_min, 'pay_percent_max', old.pay_percent_max,
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

-- 7. Employee count band: private to the clinic and Admin (the contact table has owner only rules and no public access).
alter table public.employer_contacts add column if not exists employee_band text;
alter table public.employer_contacts drop constraint if exists employer_contacts_employee_band_check;
alter table public.employer_contacts add constraint employer_contacts_employee_band_check check (employee_band is null or employee_band in ('1_9', '10_24', '25_99', '100_plus'));

-- 8. Candidate software skills (private to the candidate) and the permission for the "Recommended for you" preference columns from 0031.
alter table public.candidate_profiles add column if not exists software_skills text[] not null default '{}';
alter table public.candidate_profiles drop constraint if exists candidate_profiles_software_skills_check;
alter table public.candidate_profiles add constraint candidate_profiles_software_skills_check check (public.tags_ok(software_skills));
grant insert (software_skills, home_city, home_province, pref_radius_km, pref_provinces, pref_employment_types, pref_other_roles, pref_min_pay, pref_pay_period, pref_practice)
  on public.candidate_profiles to authenticated;
grant update (software_skills, home_city, home_province, pref_radius_km, pref_provinces, pref_employment_types, pref_other_roles, pref_min_pay, pref_pay_period, pref_practice)
  on public.candidate_profiles to authenticated;
