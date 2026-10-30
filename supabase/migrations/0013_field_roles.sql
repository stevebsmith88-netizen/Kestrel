-- Field based roles (sales and territory representatives, trainers, field service technicians and
-- similar) and suppliers or manufacturers as employers. Safe to run more than once.

-- 1. More role categories, everywhere a role is checked.
alter table public.jobs drop constraint if exists jobs_role_category_check;
alter table public.jobs add constraint jobs_role_category_check check (role_category in (
  'Optometrist', 'Optician', 'Optometric assistant or technician',
  'Practice or clinic manager', 'Patient care or reception',
  'Sales or territory representative', 'Trainer or clinical educator',
  'Field service or equipment technician', 'Account or practice development manager'));

alter table public.candidate_profiles drop constraint if exists candidate_profiles_profession_check;
alter table public.candidate_profiles add constraint candidate_profiles_profession_check check (profession is null or profession in (
  'Optometrist', 'Optician', 'Optometric assistant or technician',
  'Practice or clinic manager', 'Patient care or reception',
  'Sales or territory representative', 'Trainer or clinical educator',
  'Field service or equipment technician', 'Account or practice development manager'));

alter table public.job_alerts drop constraint if exists job_alerts_role_category_check;
alter table public.job_alerts add constraint job_alerts_role_category_check check (role_category is null or role_category in (
  'Optometrist', 'Optician', 'Optometric assistant or technician',
  'Practice or clinic manager', 'Patient care or reception',
  'Sales or territory representative', 'Trainer or clinical educator',
  'Field service or equipment technician', 'Account or practice development manager'));

-- 2. Suppliers and manufacturers can have an employer profile too.
alter table public.employers drop constraint if exists employers_practice_type_check;
alter table public.employers add constraint employers_practice_type_check check (practice_type in ('independent', 'corporate', 'supplier'));

alter table public.job_alerts drop constraint if exists job_alerts_practice_type_check;
alter table public.job_alerts add constraint job_alerts_practice_type_check check (practice_type is null or practice_type in ('independent', 'corporate', 'supplier'));

-- 3. Where the person works, the area a field based person covers, and any extra pay such as commission.
alter table public.jobs add column if not exists work_arrangement text not null default 'on_site';
alter table public.jobs drop constraint if exists jobs_work_arrangement_check;
alter table public.jobs add constraint jobs_work_arrangement_check check (work_arrangement in ('on_site', 'field'));

alter table public.jobs add column if not exists territory text;
alter table public.jobs drop constraint if exists jobs_territory_check;
alter table public.jobs add constraint jobs_territory_check check (territory is null or char_length(territory) <= 200);

alter table public.jobs add column if not exists pay_extras text;
alter table public.jobs drop constraint if exists jobs_pay_extras_check;
alter table public.jobs add constraint jobs_pay_extras_check check (pay_extras is null or char_length(pay_extras) <= 300);

-- A field based job that is submitted or live must say what area it covers.
alter table public.jobs drop constraint if exists jobs_field_has_area;
alter table public.jobs add constraint jobs_field_has_area check (
  work_arrangement <> 'field' or status in ('draft', 'rejected') or (territory is not null and char_length(territory) >= 3));

-- 4. Who can see and change the new columns.
grant select (work_arrangement, territory, pay_extras) on public.jobs to anon;
grant insert (work_arrangement, territory, pay_extras) on public.jobs to authenticated;
grant update (work_arrangement, territory, pay_extras) on public.jobs to authenticated;
