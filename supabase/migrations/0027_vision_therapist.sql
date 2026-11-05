-- Vision therapist as a role, everywhere a role is checked (jobs, candidate profiles, job alerts and job templates).
-- Safe to run more than once.

alter table public.jobs drop constraint if exists jobs_role_category_check;
alter table public.jobs add constraint jobs_role_category_check check (role_category in (
  'Optometrist', 'Optician', 'Optometric assistant or technician',
  'Practice or clinic manager', 'Patient care or reception', 'Vision therapist',
  'Sales or territory representative', 'Trainer or clinical educator',
  'Field service or equipment technician', 'Account or practice development manager'));

alter table public.candidate_profiles drop constraint if exists candidate_profiles_profession_check;
alter table public.candidate_profiles add constraint candidate_profiles_profession_check check (profession is null or profession in (
  'Optometrist', 'Optician', 'Optometric assistant or technician',
  'Practice or clinic manager', 'Patient care or reception', 'Vision therapist',
  'Sales or territory representative', 'Trainer or clinical educator',
  'Field service or equipment technician', 'Account or practice development manager'));

alter table public.job_alerts drop constraint if exists job_alerts_role_category_check;
alter table public.job_alerts add constraint job_alerts_role_category_check check (role_category is null or role_category in (
  'Optometrist', 'Optician', 'Optometric assistant or technician',
  'Practice or clinic manager', 'Patient care or reception', 'Vision therapist',
  'Sales or territory representative', 'Trainer or clinical educator',
  'Field service or equipment technician', 'Account or practice development manager'));

alter table public.job_templates drop constraint if exists job_templates_role_category_check;
alter table public.job_templates add constraint job_templates_role_category_check check (role_category is null or role_category in (
  'Optometrist', 'Optician', 'Optometric assistant or technician',
  'Practice or clinic manager', 'Patient care or reception', 'Vision therapist',
  'Sales or territory representative', 'Trainer or clinical educator',
  'Field service or equipment technician', 'Account or practice development manager'));
