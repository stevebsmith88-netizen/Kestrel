-- KESTREL: everything the database needs, in order (migrations 0001 to 0041), plus a check at the end.
-- Safe to run more than once. Paste ALL of it into the Supabase SQL editor and press Run.

-- ======================================================================
-- 0001_waitlist.sql
-- ======================================================================
-- Kestrel launch waitlist.
-- Rows are written only by the server (app/api/waitlist/route.ts) using the
-- service role key. Row level security is on with no public policies, so the
-- public anon key can neither read nor write this table.

create table if not exists public.waitlist (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  audience      text not null check (audience in ('clinic', 'candidate')),
  first_name    text not null,
  last_name     text,
  email         text not null unique, -- always stored in lower case
  clinic_name   text,
  role          text,
  province      text not null,
  consent       boolean not null check (consent = true),
  consent_text  text not null,
  consent_at    timestamptz not null default now(),
  source        text not null default 'eyecarejobs.ca waitlist',
  unsubscribed_at timestamptz
);

-- One sign up per email address; a repeat sign up updates the existing row.
alter table public.waitlist enable row level security;

-- ======================================================================
-- 0002_accounts.sql
-- ======================================================================
-- Accounts: one profile row per person who signs in.
-- Roles: candidate, clinic or admin. Anyone can sign up as a candidate or a
-- clinic. Nobody can make themselves an admin: that is done once, by hand, in
-- the SQL editor (see the bottom of this file).

create table if not exists public.profiles (
  id                     uuid primary key references auth.users (id) on delete cascade,
  role                   text not null default 'candidate' check (role in ('candidate', 'clinic', 'admin')),
  full_name              text not null default '',
  marketing_consent      boolean not null default false,
  marketing_consent_text text,
  marketing_consent_at   timestamptz,
  created_at             timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Checks the signed in person's role. Security definer so the check itself is
-- not blocked by row level security.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "People can read their own profile" on public.profiles;
create policy "People can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Admins can read every profile" on public.profiles;
create policy "Admins can read every profile"
  on public.profiles for select to authenticated
  using (public.is_admin());

drop policy if exists "People can update their own profile" on public.profiles;
create policy "People can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Signed in people can change their name and nothing else. Role and consent
-- records can only be changed by the server or in the SQL editor.
revoke all on public.profiles from anon;
revoke insert, delete on public.profiles from authenticated;
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Creates the profile the moment someone signs up. The role comes from the sign
-- up form, and only "clinic" or "candidate" are ever accepted.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  consent boolean := coalesce(new.raw_user_meta_data ->> 'marketing_consent', 'false') = 'true';
begin
  insert into public.profiles (id, role, full_name, marketing_consent, marketing_consent_text, marketing_consent_at)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'role' = 'clinic' then 'clinic' else 'candidate' end,
    coalesce(left(new.raw_user_meta_data ->> 'full_name', 120), ''),
    consent,
    case when consent then left(new.raw_user_meta_data ->> 'marketing_consent_text', 500) end,
    case when consent then now() end
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Give a profile to anyone who signed up before this file was run.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- TO MAKE YOURSELF THE ADMIN (run this on its own, once, after you have created
-- your account on the site, replacing the email address):
--
--   update public.profiles
--   set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');

-- ======================================================================
-- 0003_profile_names.sql
-- ======================================================================
-- Keep first and last name separately, so people can be greeted by first name.
-- full_name stays, as the two joined together, for places that show a single name.

alter table public.profiles add column if not exists first_name text not null default '';
alter table public.profiles add column if not exists last_name text not null default '';

-- Fill in the names of accounts made before this file was run.
update public.profiles
set first_name = split_part(full_name, ' ', 1),
    last_name = trim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1))
where first_name = '' and last_name = '' and full_name <> '';

-- People can change their own names, and nothing else about their profile.
grant update (first_name, last_name, full_name) on public.profiles to authenticated;

-- The same sign up trigger as before, now reading the two names.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  consent boolean := coalesce(new.raw_user_meta_data ->> 'marketing_consent', 'false') = 'true';
  first text := left(coalesce(new.raw_user_meta_data ->> 'first_name', ''), 60);
  last text := left(coalesce(new.raw_user_meta_data ->> 'last_name', ''), 60);
begin
  insert into public.profiles (id, role, first_name, last_name, full_name, marketing_consent, marketing_consent_text, marketing_consent_at)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'role' = 'clinic' then 'clinic' else 'candidate' end,
    first,
    last,
    trim(concat_ws(' ', first, last)),
    consent,
    case when consent then left(new.raw_user_meta_data ->> 'marketing_consent_text', 500) end,
    case when consent then now() end
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ======================================================================
-- 0004_repair_profiles.sql
-- ======================================================================
-- Repairs accounts that were created without a profile, and makes sure the
-- sign up trigger is in place. Safe to run more than once.

-- 1. The trigger that creates a profile whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  consent boolean := coalesce(new.raw_user_meta_data ->> 'marketing_consent', 'false') = 'true';
  first text := left(coalesce(new.raw_user_meta_data ->> 'first_name', ''), 60);
  last text := left(coalesce(new.raw_user_meta_data ->> 'last_name', ''), 60);
begin
  insert into public.profiles (id, role, first_name, last_name, full_name, marketing_consent, marketing_consent_text, marketing_consent_at)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'role' = 'clinic' then 'clinic' else 'candidate' end,
    first,
    last,
    trim(concat_ws(' ', first, last)),
    consent,
    case when consent then left(new.raw_user_meta_data ->> 'marketing_consent_text', 500) end,
    case when consent then now() end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. A profile for everyone who signed up without one, using the details they gave.
insert into public.profiles (id, role, first_name, last_name, full_name)
select
  u.id,
  case when u.raw_user_meta_data ->> 'role' = 'clinic' then 'clinic' else 'candidate' end,
  left(coalesce(nullif(u.raw_user_meta_data ->> 'first_name', ''), split_part(coalesce(u.raw_user_meta_data ->> 'full_name', ''), ' ', 1)), 60),
  left(coalesce(nullif(u.raw_user_meta_data ->> 'last_name', ''), trim(substr(coalesce(u.raw_user_meta_data ->> 'full_name', ''), length(split_part(coalesce(u.raw_user_meta_data ->> 'full_name', ''), ' ', 1)) + 1))), 60),
  left(coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), trim(concat_ws(' ', u.raw_user_meta_data ->> 'first_name', u.raw_user_meta_data ->> 'last_name'))), 120)
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- ======================================================================
-- 0005_clinics_and_jobs.sql
-- ======================================================================
-- Clinics and their job postings.
--
-- What the rules below do, in plain English:
--   * A clinic account can create one clinic profile and post jobs for it.
--   * A job starts as a draft, goes "in review" when the clinic submits it, and
--     only an admin can make it live. Clinics can never publish their own jobs.
--   * Anyone on the internet can read live jobs that have not expired, and the
--     clinic details that go with them. Nothing else is public.
--   * The email address a clinic wants applicant alerts sent to is kept in its own
--     private table, so it can never appear on a public page.
--   * Safe to run more than once.

-- People who unsubscribe from marketing email.
alter table public.profiles add column if not exists unsubscribed_at timestamptz;

-- ---------------------------------------------------------------- helpers

create or replace function public.is_clinic()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'clinic'
  );
$$;

-- ---------------------------------------------------------------- clinics

create table if not exists public.employers (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users (id) on delete cascade,
  clinic_name   text not null check (char_length(clinic_name) between 1 and 160),
  practice_type text not null check (practice_type in ('independent', 'corporate')),
  website       text check (website is null or char_length(website) <= 300),
  province      text not null,
  city          text not null check (char_length(city) between 1 and 80),
  about         text check (about is null or char_length(about) <= 3000),
  status        text not null default 'active' check (status in ('active', 'suspended')),
  claimed       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists employers_owner_idx on public.employers (owner_id);

-- Private: where a clinic wants "new applicant" alerts sent. Never public.
create table if not exists public.employer_contacts (
  employer_id  uuid primary key references public.employers (id) on delete cascade,
  notify_email text not null check (char_length(notify_email) between 3 and 254)
);

alter table public.employers enable row level security;
alter table public.employer_contacts enable row level security;

create or replace function public.owns_employer(emp uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.employers
    where id = emp and owner_id = (select auth.uid())
  );
$$;

-- ---------------------------------------------------------------- jobs

create table if not exists public.jobs (
  id                  uuid primary key default gen_random_uuid(),
  employer_id         uuid not null references public.employers (id) on delete cascade,
  title               text not null check (char_length(title) between 1 and 120),
  role_category       text check (role_category in (
                        'Optometrist', 'Optician', 'Optometric assistant or technician',
                        'Practice or clinic manager', 'Patient care or reception')),
  employment_type     text check (employment_type in ('Full time', 'Part time', 'Locum', 'Contract')),
  province            text,
  city                text check (city is null or char_length(city) <= 80),
  pay_period          text check (pay_period in ('year', 'hour')),
  pay_min             numeric(10, 2) check (pay_min is null or pay_min > 0),
  pay_max             numeric(10, 2) check (pay_max is null or pay_max > 0),
  is_existing_vacancy boolean,
  uses_ai_screening   boolean,
  description         text check (description is null or char_length(description) <= 8000),
  apply_method        text not null default 'kestrel' check (apply_method in ('kestrel', 'external')),
  apply_url           text check (apply_url is null or char_length(apply_url) <= 500),
  status              text not null default 'draft' check (status in ('draft', 'in_review', 'live', 'rejected', 'closed', 'expired')),
  review_note         text check (review_note is null or char_length(review_note) <= 1000),
  is_seeded           boolean not null default false,
  source_url          text,
  posted_at           timestamptz,
  expires_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Anything past a draft must be complete, with a pay range that follows the rules:
  -- up to $50,000 wide a year, unless the top of the range is over $200,000.
  constraint jobs_complete_unless_draft check (
    status in ('draft', 'rejected')
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
  ),
  constraint jobs_live_has_dates check (status <> 'live' or (posted_at is not null and expires_at is not null))
);

create index if not exists jobs_employer_idx on public.jobs (employer_id);
create index if not exists jobs_live_idx on public.jobs (status, expires_at, posted_at desc);

alter table public.jobs enable row level security;

create or replace function public.employer_has_live_job(emp uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.jobs
    where employer_id = emp and status = 'live' and expires_at > now()
  );
$$;

-- ---------------------------------------------------------------- who can change what

-- Only moves a clinic is allowed to make: submit a draft, withdraw it, fix a rejected
-- one, or close a live one. Only an admin (or the server) can make a job live.
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
    or (old.status = 'live' and new.status = 'closed')
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

drop trigger if exists jobs_enforce_changes on public.jobs;
create trigger jobs_enforce_changes
  before update on public.jobs
  for each row execute function public.enforce_job_changes();

create or replace function public.touch_employer()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists employers_touch on public.employers;
create trigger employers_touch
  before update on public.employers
  for each row execute function public.touch_employer();

-- ---------------------------------------------------------------- row level security

-- employers
drop policy if exists "Clinics can read their own profile" on public.employers;
create policy "Clinics can read their own profile"
  on public.employers for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Anyone can read clinics that have live jobs" on public.employers;
create policy "Anyone can read clinics that have live jobs"
  on public.employers for select to anon, authenticated
  using (status = 'active' and public.employer_has_live_job(id));

drop policy if exists "Admins can read every clinic" on public.employers;
create policy "Admins can read every clinic"
  on public.employers for select to authenticated
  using (public.is_admin());

drop policy if exists "Clinic accounts can create their profile" on public.employers;
create policy "Clinic accounts can create their profile"
  on public.employers for insert to authenticated
  with check ((select auth.uid()) = owner_id and public.is_clinic());

drop policy if exists "Clinics can update their own profile" on public.employers;
create policy "Clinics can update their own profile"
  on public.employers for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- employer_contacts (private)
drop policy if exists "Clinics can read their own contact" on public.employer_contacts;
create policy "Clinics can read their own contact"
  on public.employer_contacts for select to authenticated
  using (public.owns_employer(employer_id));

drop policy if exists "Clinics can add their own contact" on public.employer_contacts;
create policy "Clinics can add their own contact"
  on public.employer_contacts for insert to authenticated
  with check (public.owns_employer(employer_id));

drop policy if exists "Clinics can change their own contact" on public.employer_contacts;
create policy "Clinics can change their own contact"
  on public.employer_contacts for update to authenticated
  using (public.owns_employer(employer_id))
  with check (public.owns_employer(employer_id));

-- jobs
drop policy if exists "Anyone can read live jobs" on public.jobs;
create policy "Anyone can read live jobs"
  on public.jobs for select to anon, authenticated
  using (status = 'live' and expires_at > now());

drop policy if exists "Clinics can read their own jobs" on public.jobs;
create policy "Clinics can read their own jobs"
  on public.jobs for select to authenticated
  using (public.owns_employer(employer_id));

drop policy if exists "Admins can read every job" on public.jobs;
create policy "Admins can read every job"
  on public.jobs for select to authenticated
  using (public.is_admin());

drop policy if exists "Clinics can add jobs" on public.jobs;
create policy "Clinics can add jobs"
  on public.jobs for insert to authenticated
  with check (public.owns_employer(employer_id) and status in ('draft', 'in_review'));

drop policy if exists "Clinics can edit their own jobs" on public.jobs;
create policy "Clinics can edit their own jobs"
  on public.jobs for update to authenticated
  using (public.owns_employer(employer_id))
  with check (public.owns_employer(employer_id));

drop policy if exists "Clinics can delete their drafts" on public.jobs;
create policy "Clinics can delete their drafts"
  on public.jobs for delete to authenticated
  using (public.owns_employer(employer_id) and status in ('draft', 'rejected'));

-- ---------------------------------------------------------------- column permissions

revoke all on public.employers, public.employer_contacts, public.jobs from anon, authenticated;

-- Public: only what a job page needs to show.
grant select (id, clinic_name, practice_type, website, province, city, about, claimed) on public.employers to anon;
grant select (id, employer_id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max,
              is_existing_vacancy, uses_ai_screening, description, apply_method, apply_url, status, is_seeded,
              source_url, posted_at, expires_at, created_at)
  on public.jobs to anon;

-- Signed in clinics: their own rows (the policies limit which rows).
grant select on public.employers to authenticated;
grant insert (owner_id, clinic_name, practice_type, website, province, city, about) on public.employers to authenticated;
grant update (clinic_name, practice_type, website, province, city, about) on public.employers to authenticated;

grant select, insert, update on public.employer_contacts to authenticated;

grant select on public.jobs to authenticated;
grant insert (employer_id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max,
              is_existing_vacancy, uses_ai_screening, description, apply_method, apply_url, status)
  on public.jobs to authenticated;
grant update (title, role_category, employment_type, province, city, pay_period, pay_min, pay_max,
              is_existing_vacancy, uses_ai_screening, description, apply_method, apply_url, status)
  on public.jobs to authenticated;
grant delete on public.jobs to authenticated;

revoke execute on function public.is_clinic() from public, anon;
grant execute on function public.is_clinic() to authenticated;
revoke execute on function public.owns_employer(uuid) from public, anon;
grant execute on function public.owns_employer(uuid) to authenticated;
grant execute on function public.employer_has_live_job(uuid) to anon, authenticated;
revoke execute on function public.enforce_job_changes() from public, anon, authenticated;

-- ======================================================================
-- 0006_candidates_and_applications.sql
-- ======================================================================
-- Candidates: a private profile, a saved CV, and job applications.
--
-- In plain English:
--   * A candidate's profile is visible to that candidate only. A clinic sees a candidate's
--     details only through an application that candidate sent to that clinic, and only the
--     details as they were when they applied (a snapshot).
--   * A clinic can see applications to its own jobs, and nothing else.
--   * Clinics' private notes are in their own table, which candidates cannot read.
--   * CV files live in a private storage bucket. Nobody can read them directly. The server
--     hands out a link that works for one minute, after checking who is asking.
--   * Writes to applications go through the server, which checks who is allowed, so these
--     tables only grant read access to the browser.
--   * Safe to run more than once.

-- ---------------------------------------------------------------- candidate profiles

create table if not exists public.candidate_profiles (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  profession         text check (profession is null or profession in (
                       'Optometrist', 'Optician', 'Optometric assistant or technician',
                       'Practice or clinic manager', 'Patient care or reception')),
  licensed_provinces text[] not null default '{}',
  years_experience   text check (years_experience is null or years_experience in (
                       'Under 1 year', '1 to 4 years', '5 to 9 years', '10 or more years')),
  available_from     date,
  phone              text check (phone is null or char_length(phone) <= 30),
  cv_path            text,
  cv_filename        text check (cv_filename is null or char_length(cv_filename) <= 200),
  cv_uploaded_at     timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.candidate_profiles enable row level security;

create or replace function public.touch_candidate_profile()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists candidate_profiles_touch on public.candidate_profiles;
create trigger candidate_profiles_touch
  before update on public.candidate_profiles
  for each row execute function public.touch_candidate_profile();

drop policy if exists "Candidates can read their own profile" on public.candidate_profiles;
create policy "Candidates can read their own profile"
  on public.candidate_profiles for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Candidates can create their own profile" on public.candidate_profiles;
create policy "Candidates can create their own profile"
  on public.candidate_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Candidates can change their own profile" on public.candidate_profiles;
create policy "Candidates can change their own profile"
  on public.candidate_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------- applications

create table if not exists public.applications (
  id                uuid primary key default gen_random_uuid(),
  job_id            uuid not null references public.jobs (id) on delete cascade,
  candidate_id      uuid not null references auth.users (id) on delete cascade,
  status            text not null default 'applied' check (status in (
                      'applied', 'viewed', 'shortlisted', 'interview', 'offer',
                      'not_selected', 'role_filled', 'kept', 'no_update', 'withdrawn')),
  cover_letter      text check (cover_letter is null or char_length(cover_letter) <= 5000),
  keep_details      boolean not null default false,
  -- What the clinic is allowed to see, as it was on the day they applied.
  applicant         jsonb not null,
  cv_path           text,
  cv_filename       text,
  -- What the candidate saw about the job, kept even after the job closes.
  job_title         text not null,
  clinic_name       text not null,
  job_location      text not null,
  clinic_message    text check (clinic_message is null or char_length(clinic_message) <= 1500),
  viewed_at         timestamptz,
  status_changed_at timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (job_id, candidate_id)
);

create index if not exists applications_candidate_idx on public.applications (candidate_id, created_at desc);
create index if not exists applications_job_idx on public.applications (job_id, status);

create table if not exists public.application_events (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  status         text not null,
  note           text check (note is null or char_length(note) <= 1500),
  created_at     timestamptz not null default now()
);

create index if not exists application_events_idx on public.application_events (application_id, created_at);

-- Private to the clinic. Candidates cannot read this table.
create table if not exists public.application_notes (
  application_id uuid primary key references public.applications (id) on delete cascade,
  note           text not null check (char_length(note) <= 3000),
  updated_at     timestamptz not null default now()
);

alter table public.applications enable row level security;
alter table public.application_events enable row level security;
alter table public.application_notes enable row level security;

create or replace function public.owns_job(job uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.jobs j
    join public.employers e on e.id = j.employer_id
    where j.id = job and e.owner_id = (select auth.uid())
  );
$$;

create or replace function public.owns_application_job(app uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.employers e on e.id = j.employer_id
    where a.id = app and e.owner_id = (select auth.uid())
  );
$$;

drop policy if exists "Candidates can read their own applications" on public.applications;
create policy "Candidates can read their own applications"
  on public.applications for select to authenticated
  using ((select auth.uid()) = candidate_id);

drop policy if exists "Clinics can read applications to their jobs" on public.applications;
create policy "Clinics can read applications to their jobs"
  on public.applications for select to authenticated
  using (public.owns_job(job_id));

drop policy if exists "People can read the history of applications they can see" on public.application_events;
create policy "People can read the history of applications they can see"
  on public.application_events for select to authenticated
  using (
    exists (select 1 from public.applications a where a.id = application_id and a.candidate_id = (select auth.uid()))
    or public.owns_application_job(application_id)
  );

drop policy if exists "Clinics can read their notes" on public.application_notes;
create policy "Clinics can read their notes"
  on public.application_notes for select to authenticated
  using (public.owns_application_job(application_id));

drop policy if exists "Clinics can add notes" on public.application_notes;
create policy "Clinics can add notes"
  on public.application_notes for insert to authenticated
  with check (public.owns_application_job(application_id));

drop policy if exists "Clinics can change their notes" on public.application_notes;
create policy "Clinics can change their notes"
  on public.application_notes for update to authenticated
  using (public.owns_application_job(application_id))
  with check (public.owns_application_job(application_id));

-- ---------------------------------------------------------------- permissions

revoke all on public.candidate_profiles, public.applications, public.application_events, public.application_notes from anon, authenticated;

-- Candidates edit their own details. The CV columns are set by the server only, so a
-- candidate can never point their profile at someone else's file.
grant select on public.candidate_profiles to authenticated;
grant insert (user_id, profession, licensed_provinces, years_experience, available_from, phone) on public.candidate_profiles to authenticated;
grant update (profession, licensed_provinces, years_experience, available_from, phone) on public.candidate_profiles to authenticated;

grant select on public.applications to authenticated;
grant select on public.application_events to authenticated;
grant select, insert, update on public.application_notes to authenticated;

revoke execute on function public.owns_job(uuid) from public, anon;
grant execute on function public.owns_job(uuid) to authenticated;
revoke execute on function public.owns_application_job(uuid) from public, anon;
grant execute on function public.owns_application_job(uuid) to authenticated;

-- ======================================================================
-- 0007_housekeeping.sql
-- ======================================================================
-- Small additions for the automatic housekeeping and the ad builder. Safe to run more than once.

-- When a clinic was last reminded that an application is still unopened.
alter table public.applications add column if not exists reminded_at timestamptz;

-- Every time someone uses the ad builder, so use can be capped. Server only.
create table if not exists public.ad_builder_uses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists ad_builder_uses_user_idx on public.ad_builder_uses (user_id, created_at desc);

alter table public.ad_builder_uses enable row level security;
revoke all on public.ad_builder_uses from anon, authenticated;

-- ======================================================================
-- 0008_job_alerts.sql
-- ======================================================================
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

-- ======================================================================
-- 0009_alert_frequency_and_posting_safeguards.sql
-- ======================================================================
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

-- ======================================================================
-- 0010_job_reports.sql
-- ======================================================================
-- "Report this job": anyone can tell us about a post that looks wrong. Reports are written by the
-- server only, and only admins can read them. Safe to run more than once.

create table if not exists public.job_reports (
  id             uuid primary key default gen_random_uuid(),
  job_id         uuid not null references public.jobs (id) on delete cascade,
  reason         text not null check (reason in (
                   'scam', 'recruiter', 'discrimination', 'misleading', 'filled', 'other')),
  details        text check (details is null or char_length(details) <= 1000),
  -- Optional. Only used to write back to the person who reported.
  reporter_email text check (reporter_email is null or char_length(reporter_email) <= 254),
  status         text not null default 'open' check (status in ('open', 'job_removed', 'dismissed')),
  created_at     timestamptz not null default now(),
  handled_at     timestamptz
);

create index if not exists job_reports_open_idx on public.job_reports (status, created_at);
create index if not exists job_reports_job_idx on public.job_reports (job_id);

alter table public.job_reports enable row level security;

drop policy if exists "Admins can read reports" on public.job_reports;
create policy "Admins can read reports"
  on public.job_reports for select to authenticated
  using (public.is_admin());

revoke all on public.job_reports from anon, authenticated;
grant select on public.job_reports to authenticated;

-- ======================================================================
-- 0011_do_not_email.sql
-- ======================================================================
-- The do not email list. When someone unsubscribes, or asks us to stop, their address goes here
-- and no marketing or outreach email is ever sent to it again, however many jobs they post later.
-- An entry is either a full address (name@clinic.ca) or a whole domain (@clinic.ca).
-- Written by the server only. Safe to run more than once.

create table if not exists public.email_suppressions (
  id         uuid primary key default gen_random_uuid(),
  address    text not null unique check (address = lower(address) and char_length(address) between 3 and 254),
  reason     text not null check (reason in ('unsubscribed', 'asked_to_stop', 'bounced', 'complaint', 'admin')),
  source     text check (source is null or char_length(source) <= 200),
  created_at timestamptz not null default now()
);

alter table public.email_suppressions enable row level security;

drop policy if exists "Admins can read the do not email list" on public.email_suppressions;
create policy "Admins can read the do not email list"
  on public.email_suppressions for select to authenticated
  using (public.is_admin());

revoke all on public.email_suppressions from anon, authenticated;
grant select on public.email_suppressions to authenticated;

-- ======================================================================
-- 0012_claim_listing.sql
-- ======================================================================
-- Claim your listing. A clinic whose job we found on its own website can claim it. Safe to run more than once.

-- 1. A listing we found has no owner until someone claims it.
alter table public.employers alter column owner_id drop not null;

-- 2. Claims. Written by the server only. A person can read their own, and admins can read all.
create table if not exists public.listing_claims (
  id               uuid primary key default gen_random_uuid(),
  employer_id      uuid not null references public.employers (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  claimant_name    text not null default '' check (char_length(claimant_name) <= 120),
  claimant_email   text not null check (char_length(claimant_email) <= 254),
  role_at_clinic   text not null check (role_at_clinic in ('Owner', 'Practice manager', 'Hiring manager', 'Other')),
  -- email: confirmed by a link sent to an address at the clinic's own website. manual: checked by a person.
  method           text not null check (method in ('email', 'manual')),
  note             text check (note is null or char_length(note) <= 1000),
  status           text not null default 'pending_email' check (status in ('pending_email', 'pending_review', 'approved', 'rejected', 'expired')),
  token_hash       text,
  token_expires_at timestamptz,
  decision_note    text check (decision_note is null or char_length(decision_note) <= 1000),
  created_at       timestamptz not null default now(),
  verified_at      timestamptz,
  decided_at       timestamptz
);

create index if not exists listing_claims_status_idx on public.listing_claims (status, created_at);
create index if not exists listing_claims_user_idx on public.listing_claims (user_id, created_at);
-- One open claim per person per clinic.
create unique index if not exists listing_claims_open_idx on public.listing_claims (employer_id, user_id) where status in ('pending_email', 'pending_review');

alter table public.listing_claims enable row level security;

drop policy if exists "People can read their own claims" on public.listing_claims;
create policy "People can read their own claims"
  on public.listing_claims for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Admins can read every claim" on public.listing_claims;
create policy "Admins can read every claim"
  on public.listing_claims for select to authenticated
  using (public.is_admin());

revoke all on public.listing_claims from anon, authenticated;
grant select (id, employer_id, user_id, claimant_name, claimant_email, role_at_clinic, method, note, status, decision_note, created_at, verified_at, decided_at)
  on public.listing_claims to authenticated;

-- ======================================================================
-- 0013_field_roles.sql
-- ======================================================================
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

-- ======================================================================
-- 0014_live_edits_and_waitlist_confirmation.sql
-- ======================================================================
-- 1. A clinic can edit a live job. The edit sends it back to review, so nothing changes on the public
--    site until a person has read it. The 30 days it started with keep running (only an admin can change the dates).
-- 2. The waitlist confirms email addresses with a link. Safe to run more than once.

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

alter table public.waitlist add column if not exists confirmed_at timestamptz;
alter table public.waitlist add column if not exists confirmation_sent_at timestamptz;

-- ======================================================================
-- 0015_templates_and_drafts.sql
-- ======================================================================
-- Saved templates and drafts. Safe to run more than once.
--  * job_templates: a clinic keeps up to 20 job templates to start new posts from.
--  * cover_letter_templates: a candidate keeps up to 5 cover letters to start from.
--  * application_drafts: a candidate's half written cover letter for a job, to come back to.
-- Each person can only see and change their own.

create or replace function public.touch_row()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- job templates
-- The two questions every post must answer (existing vacancy, AI screening) are deliberately not saved,
-- so they are answered fresh for each post.
create table if not exists public.job_templates (
  id              uuid primary key default gen_random_uuid(),
  employer_id     uuid not null references public.employers (id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 80),
  title           text check (title is null or char_length(title) <= 120),
  role_category   text check (role_category is null or role_category in (
                    'Optometrist', 'Optician', 'Optometric assistant or technician',
                    'Practice or clinic manager', 'Patient care or reception',
                    'Sales or territory representative', 'Trainer or clinical educator',
                    'Field service or equipment technician', 'Account or practice development manager')),
  employment_type text check (employment_type is null or employment_type in ('Full time', 'Part time', 'Locum', 'Contract')),
  province        text,
  city            text check (city is null or char_length(city) <= 80),
  pay_period      text check (pay_period is null or pay_period in ('year', 'hour')),
  pay_min         numeric(10, 2) check (pay_min is null or pay_min > 0),
  pay_max         numeric(10, 2) check (pay_max is null or pay_max > 0),
  description     text check (description is null or char_length(description) <= 8000),
  apply_method    text not null default 'kestrel' check (apply_method in ('kestrel', 'external')),
  apply_url       text check (apply_url is null or char_length(apply_url) <= 500),
  work_arrangement text not null default 'on_site' check (work_arrangement in ('on_site', 'field')),
  territory       text check (territory is null or char_length(territory) <= 200),
  pay_extras      text check (pay_extras is null or char_length(pay_extras) <= 300),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (employer_id, name)
);

create or replace function public.limit_job_templates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.job_templates where employer_id = new.employer_id) >= 20 then
    raise exception 'You can save up to 20 templates. Delete one to add another.';
  end if;
  return new;
end;
$$;

drop trigger if exists job_templates_limit on public.job_templates;
create trigger job_templates_limit before insert on public.job_templates for each row execute function public.limit_job_templates();
drop trigger if exists job_templates_touch on public.job_templates;
create trigger job_templates_touch before update on public.job_templates for each row execute function public.touch_row();

alter table public.job_templates enable row level security;
drop policy if exists "Clinics can read their templates" on public.job_templates;
create policy "Clinics can read their templates" on public.job_templates for select to authenticated using (public.owns_employer(employer_id));
drop policy if exists "Clinics can add templates" on public.job_templates;
create policy "Clinics can add templates" on public.job_templates for insert to authenticated with check (public.owns_employer(employer_id));
drop policy if exists "Clinics can change their templates" on public.job_templates;
create policy "Clinics can change their templates" on public.job_templates for update to authenticated using (public.owns_employer(employer_id)) with check (public.owns_employer(employer_id));
drop policy if exists "Clinics can delete their templates" on public.job_templates;
create policy "Clinics can delete their templates" on public.job_templates for delete to authenticated using (public.owns_employer(employer_id));

revoke all on public.job_templates from anon, authenticated;
grant select, delete on public.job_templates to authenticated;
grant insert (employer_id, name, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, description, apply_method, apply_url, work_arrangement, territory, pay_extras)
  on public.job_templates to authenticated;
grant update (name, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, description, apply_method, apply_url, work_arrangement, territory, pay_extras)
  on public.job_templates to authenticated;

-- ---------------------------------------------------------------- cover letter templates
create table if not exists public.cover_letter_templates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  body       text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create or replace function public.limit_cover_letter_templates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.cover_letter_templates where user_id = new.user_id) >= 5 then
    raise exception 'You can save up to 5 cover letters. Delete one to add another.';
  end if;
  return new;
end;
$$;

drop trigger if exists cover_letter_templates_limit on public.cover_letter_templates;
create trigger cover_letter_templates_limit before insert on public.cover_letter_templates for each row execute function public.limit_cover_letter_templates();
drop trigger if exists cover_letter_templates_touch on public.cover_letter_templates;
create trigger cover_letter_templates_touch before update on public.cover_letter_templates for each row execute function public.touch_row();

alter table public.cover_letter_templates enable row level security;
drop policy if exists "People can read their cover letters" on public.cover_letter_templates;
create policy "People can read their cover letters" on public.cover_letter_templates for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "People can add cover letters" on public.cover_letter_templates;
create policy "People can add cover letters" on public.cover_letter_templates for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "People can change their cover letters" on public.cover_letter_templates;
create policy "People can change their cover letters" on public.cover_letter_templates for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "People can delete their cover letters" on public.cover_letter_templates;
create policy "People can delete their cover letters" on public.cover_letter_templates for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.cover_letter_templates from anon, authenticated;
grant select, delete on public.cover_letter_templates to authenticated;
grant insert (user_id, name, body) on public.cover_letter_templates to authenticated;
grant update (name, body) on public.cover_letter_templates to authenticated;

-- ---------------------------------------------------------------- application drafts
create table if not exists public.application_drafts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  job_id       uuid not null references public.jobs (id) on delete cascade,
  cover_letter text not null default '' check (char_length(cover_letter) <= 5000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, job_id)
);

create or replace function public.limit_application_drafts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.application_drafts where user_id = new.user_id) >= 50 then
    raise exception 'You have a lot of saved drafts. Finish or delete some first.';
  end if;
  return new;
end;
$$;

drop trigger if exists application_drafts_limit on public.application_drafts;
create trigger application_drafts_limit before insert on public.application_drafts for each row execute function public.limit_application_drafts();
drop trigger if exists application_drafts_touch on public.application_drafts;
create trigger application_drafts_touch before update on public.application_drafts for each row execute function public.touch_row();

alter table public.application_drafts enable row level security;
drop policy if exists "People can read their drafts" on public.application_drafts;
create policy "People can read their drafts" on public.application_drafts for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "People can add drafts" on public.application_drafts;
create policy "People can add drafts" on public.application_drafts for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "People can change their drafts" on public.application_drafts;
create policy "People can change their drafts" on public.application_drafts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "People can delete their drafts" on public.application_drafts;
create policy "People can delete their drafts" on public.application_drafts for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.application_drafts from anon, authenticated;
grant select, delete on public.application_drafts to authenticated;
grant insert (user_id, job_id, cover_letter) on public.application_drafts to authenticated;
grant update (cover_letter) on public.application_drafts to authenticated;

revoke execute on function public.limit_job_templates() from public, anon, authenticated;
revoke execute on function public.limit_cover_letter_templates() from public, anon, authenticated;
revoke execute on function public.limit_application_drafts() from public, anon, authenticated;

-- ======================================================================
-- 0016_email_preferences.sql
-- ======================================================================
-- Email preferences people can change themselves on their Account page. Safe to run more than once.
--  * Candidates can turn off emails about their applications.
--  * Clinics can turn off new applicant emails and the reminders about unopened applications.
-- Emails about security (password resets, email changes) and about an account (a job taken down) are always sent.

alter table public.profiles add column if not exists notify_application_updates boolean not null default true;
alter table public.employer_contacts add column if not exists notify_new_applications boolean not null default true;
alter table public.employer_contacts add column if not exists notify_reminders boolean not null default true;

-- ======================================================================
-- 0017_google_signin.sql
-- ======================================================================
-- Sign in with Google. Safe to run more than once.
--  * People who sign up with Google have not yet said whether they are a candidate or a clinic, so their
--    account starts as "type not confirmed" and they are asked on the first visit.
--  * Google gives a first and last name, so use them when our own sign up form was not used.

alter table public.profiles add column if not exists account_type_confirmed boolean not null default true;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  whole text := coalesce(nullif(meta ->> 'full_name', ''), nullif(meta ->> 'name', ''), '');
  consent boolean := coalesce(meta ->> 'marketing_consent', 'false') = 'true';
  first text := left(coalesce(nullif(meta ->> 'first_name', ''), nullif(meta ->> 'given_name', ''), split_part(whole, ' ', 1)), 60);
  last text := left(coalesce(nullif(meta ->> 'last_name', ''), nullif(meta ->> 'family_name', ''), trim(substr(whole, length(split_part(whole, ' ', 1)) + 1))), 60);
  chose boolean := coalesce((meta ->> 'role') in ('clinic', 'candidate'), false);
  by_email boolean := coalesce(new.raw_app_meta_data ->> 'provider', 'email') = 'email';
begin
  insert into public.profiles (id, role, first_name, last_name, full_name, marketing_consent, marketing_consent_text, marketing_consent_at, account_type_confirmed)
  values (
    new.id,
    case when meta ->> 'role' = 'clinic' then 'clinic' else 'candidate' end,
    first,
    last,
    trim(concat_ws(' ', first, last)),
    consent,
    case when consent then left(meta ->> 'marketing_consent_text', 500) end,
    case when consent then now() end,
    chose or by_email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ======================================================================
-- 0018_terms_record.sql
-- ======================================================================
-- Record which terms a person agreed to, and when. Safe to run more than once.
--  * Email sign ups now agree to the terms of use as well as the privacy policy (Google sign ups already did).
--  * The sign up form sends the terms version in the sign up details, and this saves it on the profile.
--  * People who signed up before this file was run have no record (the columns stay empty).

alter table public.profiles add column if not exists terms_accepted_at timestamptz;
alter table public.profiles add column if not exists terms_version text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  whole text := coalesce(nullif(meta ->> 'full_name', ''), nullif(meta ->> 'name', ''), '');
  consent boolean := coalesce(meta ->> 'marketing_consent', 'false') = 'true';
  first text := left(coalesce(nullif(meta ->> 'first_name', ''), nullif(meta ->> 'given_name', ''), split_part(whole, ' ', 1)), 60);
  last text := left(coalesce(nullif(meta ->> 'last_name', ''), nullif(meta ->> 'family_name', ''), trim(substr(whole, length(split_part(whole, ' ', 1)) + 1))), 60);
  chose boolean := coalesce((meta ->> 'role') in ('clinic', 'candidate'), false);
  by_email boolean := coalesce(new.raw_app_meta_data ->> 'provider', 'email') = 'email';
  terms text := left(nullif(meta ->> 'terms_version', ''), 40);
begin
  insert into public.profiles (id, role, first_name, last_name, full_name, marketing_consent, marketing_consent_text, marketing_consent_at, account_type_confirmed, terms_version, terms_accepted_at)
  values (
    new.id,
    case when meta ->> 'role' = 'clinic' then 'clinic' else 'candidate' end,
    first,
    last,
    trim(concat_ws(' ', first, last)),
    consent,
    case when consent then left(meta ->> 'marketing_consent_text', 500) end,
    case when consent then now() end,
    chose or by_email,
    terms,
    case when terms is not null then now() end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ======================================================================
-- 0019_data_safety.sql
-- ======================================================================
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
-- "not valid": existing rows are not re-checked against this earlier version, so the whole file can be run again on a database that already
-- holds found listings (which migration 0023 allows to leave the 2 questions empty). Migration 0023 then sets the final rule and checks every row.
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
) not valid;

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

-- ======================================================================
-- 0020_job_runs_and_closing_soon.sql
-- ======================================================================
-- Email and operations fixes from the 30th October 2026 audit. Safe to run more than once.
--  1. job_runs: a lock so the daily job cannot run twice at once, and a record of when it last finished well
--     (the health check reads this, so a missed run shows up in the uptime monitor).
--  2. jobs.expiry_reminded_at: so the "your job closes in 3 days" email goes out once.

create table if not exists public.job_runs (
  name             text primary key,
  locked_until     timestamptz,
  last_started_at  timestamptz,
  last_finished_at timestamptz,
  last_ok_at       timestamptz,
  last_result      jsonb
);
alter table public.job_runs enable row level security;
revoke all on public.job_runs from anon, authenticated;

-- Returns true if this caller now holds the lock. A lock that was never released (a crash) frees itself after p_minutes.
create or replace function public.claim_job_run(p_name text, p_minutes integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed text;
begin
  insert into public.job_runs (name, locked_until, last_started_at)
  values (p_name, now() + make_interval(mins => p_minutes), now())
  on conflict (name) do update
    set locked_until = excluded.locked_until, last_started_at = excluded.last_started_at
    where public.job_runs.locked_until is null or public.job_runs.locked_until < now()
  returning name into claimed;
  return claimed is not null;
end;
$$;
revoke execute on function public.claim_job_run(text, integer) from public, anon, authenticated;
grant execute on function public.claim_job_run(text, integer) to service_role;

alter table public.jobs add column if not exists expiry_reminded_at timestamptz;

-- ======================================================================
-- 0021_signup_gate.sql
-- ======================================================================
-- Close sign up until launch, at the database, so it cannot be skipped by calling the sign up service directly.
-- Safe to run more than once.
--  * signup_gate: one row with `open`. While it is false, a new account can only be created with a one time ticket that the
--    website gives out (after checking an invitation code). Existing accounts are not affected.
--  * To open sign up at launch, run:  update public.signup_gate set open = true;
--  * Accounts created by hand in the Supabase dashboard are also refused while it is closed. Open the gate for a moment, or
--    use the invitation link on the site.

create table if not exists public.signup_gate (
  id         boolean primary key default true check (id),
  open       boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.signup_gate (id, open) values (true, false) on conflict (id) do nothing;
alter table public.signup_gate enable row level security;
revoke all on public.signup_gate from anon, authenticated;

create table if not exists public.signup_tickets (
  ticket     uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
alter table public.signup_tickets enable row level security;
revoke all on public.signup_tickets from anon, authenticated;

-- The website asks for a ticket only after it has checked the invitation code. Tickets last 15 minutes and work once.
create or replace function public.issue_signup_ticket()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  t uuid;
begin
  delete from public.signup_tickets where created_at < now() - interval '15 minutes';
  insert into public.signup_tickets default values returning ticket into t;
  return t;
end;
$$;
revoke execute on function public.issue_signup_ticket() from public, anon, authenticated;
grant execute on function public.issue_signup_ticket() to service_role;

create or replace function public.gate_new_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  given text := nullif(new.raw_user_meta_data ->> 'signup_ticket', '');
  used  integer;
begin
  if exists (select 1 from public.signup_gate where open) then
    return new;
  end if;
  if given ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    delete from public.signup_tickets where ticket = given::uuid and created_at > now() - interval '15 minutes';
    get diagnostics used = row_count;
    if used = 1 then
      new.raw_user_meta_data := new.raw_user_meta_data - 'signup_ticket';
      return new;
    end if;
  end if;
  raise exception 'Sign ups are not open yet.';
end;
$$;
revoke execute on function public.gate_new_users() from public, anon, authenticated;

drop trigger if exists gate_new_users on auth.users;
create trigger gate_new_users before insert on auth.users for each row execute function public.gate_new_users();

-- ======================================================================
-- 0022_clinic_email_frequency.sql
-- ======================================================================
-- How often a clinic is emailed about new applicants. Safe to run more than once.
--  each      one email for every application (what happens today)
--  few_days  one summary email every 2 to 3 days (recommended)
--  weekly    one summary email a week
--  off       no emails, the clinic checks its dashboard

alter table public.employer_contacts add column if not exists notify_frequency text not null default 'each';
alter table public.employer_contacts add column if not exists last_digest_at timestamptz;

alter table public.employer_contacts drop constraint if exists employer_contacts_notify_frequency_check;
alter table public.employer_contacts add constraint employer_contacts_notify_frequency_check check (notify_frequency in ('each', 'few_days', 'weekly', 'off'));

-- Clinics that had already turned new applicant emails off stay off.
update public.employer_contacts set notify_frequency = 'off' where notify_new_applications = false and notify_frequency = 'each';

-- ======================================================================
-- 0023_found_listings.sql
-- ======================================================================
-- Found listings: jobs Kestrel lists from a clinic's own careers page (the seeding tool at /admin/found). Safe to run more than once.
--  1. page_reads: a record of every careers page the tool read (when, by whom, the address, what it found), so we can always
--     show where and when a listing was found. The page's wording is never stored. Only a set of numbers is kept, used to
--     check that our summary does not copy the clinic's wording, and the daily job clears it after 30 days.
--     Private: only the server can read or write it.
--  2. jobs.found_at and jobs.found_read_id: when, and from which reading, a found listing came.
--  3. A found listing may leave "existing vacancy" and "uses AI to screen" empty. The job page shows "Not stated by the clinic",
--     because Kestrel never states a fact the clinic has not. Posts written by clinics still need both answers (the website
--     checks this on every clinic post). Pay is still required for every live job, so only roles whose page shows pay are listed.
--  4. A found listing is live for 21 days at most.

-- 1. what the tool read
create table if not exists public.page_reads (
  id          uuid primary key default gen_random_uuid(),
  read_by     uuid references auth.users (id) on delete set null,
  url         text not null check (char_length(url) <= 600),
  final_url   text check (final_url is null or char_length(final_url) <= 600),
  page_title  text check (page_title is null or char_length(page_title) <= 200),
  outcome     text not null check (outcome in ('read', 'refused', 'failed')),
  reason      text check (reason is null or char_length(reason) <= 400),
  jobs_found  integer not null default 0,
  facts       jsonb,
  fingerprint integer[],
  read_at     timestamptz not null default now()
);
create index if not exists page_reads_by_idx on public.page_reads (read_by, read_at desc);
alter table public.page_reads enable row level security;
revoke all on public.page_reads from anon, authenticated;

-- 2. where a found listing came from
alter table public.jobs add column if not exists found_at timestamptz;
alter table public.jobs add column if not exists found_read_id uuid references public.page_reads (id) on delete set null;

-- 3. found listings may leave the 2 questions unanswered
alter table public.jobs drop constraint if exists jobs_complete_unless_draft;
alter table public.jobs add constraint jobs_complete_unless_draft check (
  status in ('draft', 'rejected')
  or (status = 'closed' and posted_at is not null)
  or (
    role_category is not null and employment_type is not null
    and province is not null and city is not null
    and pay_period is not null and pay_min is not null and pay_max is not null
    and pay_max >= pay_min
    and (is_seeded or (is_existing_vacancy is not null and uses_ai_screening is not null))
    and description is not null and char_length(description) >= 50
    and (apply_method = 'kestrel' or apply_url is not null)
    and (
      (case when pay_period = 'hour' then 2080 else 1 end) * (pay_max - pay_min) <= 50000
      or (case when pay_period = 'hour' then 2080 else 1 end) * pay_max > 200000
    )
  )
) not valid; -- "not valid": existing rows are not re-checked here, so this file can run again on a database that holds newer pay shapes (see 0034, 0035)

-- 4. 21 days at most. "not valid" leaves any older test rows alone, and still checks every new or changed row.
alter table public.jobs drop constraint if exists jobs_found_listing_21_days;
alter table public.jobs add constraint jobs_found_listing_21_days check (
  not is_seeded or posted_at is null or expires_at is null or expires_at <= posted_at + interval '21 days'
) not valid;

-- ======================================================================
-- 0024_sign_in_attempts.sql
-- ======================================================================
-- Sign in guard (audit R22). Counts failed sign in attempts per email and per visitor, so that after 5 failures in
-- 15 minutes the sign in form asks for the bot check. Only the website's server reads or writes this table.
-- The keys are one way scrambled (hashed) values, never a plain email address or visitor address.
-- Safe to run more than once.

create table if not exists public.sign_in_attempts (
  key                text primary key,
  failures           integer not null default 0,
  window_started_at  timestamptz not null default now()
);

alter table public.sign_in_attempts enable row level security;
revoke all on public.sign_in_attempts from anon, authenticated;
-- No policies on purpose: the browser can never read or change this table.

-- ======================================================================
-- 0025_clinic_leads.sql
-- ======================================================================
-- Clinic leads: clinics that appear to be hiring, found by the province search (Admin, Found listings). Safe to run more than once.
-- A lead is a note about a clinic, not a listing. Nothing here is public, and nothing is sent to anyone from it.
--  * One lead per clinic website. Saving again updates it.
--  * contact_email is only kept with the page it was published on (email_source_url) and the date, which is the record
--    CASL asks for before any outreach. Outreach stays off until the disclosure conversation has happened.
--  * Private: only the server can read or write it.

create table if not exists public.clinic_leads (
  id               uuid primary key default gen_random_uuid(),
  added_by         uuid references auth.users (id) on delete set null,
  clinic_name      text not null check (char_length(clinic_name) between 1 and 160),
  website          text not null check (char_length(website) <= 300),
  website_key      text not null check (char_length(website_key) between 3 and 253),
  city             text check (city is null or char_length(city) <= 80),
  province         text not null,
  practice_type    text check (practice_type is null or practice_type in ('independent', 'corporate', 'supplier')),
  careers_url      text check (careers_url is null or char_length(careers_url) <= 500),
  job_title        text check (job_title is null or char_length(job_title) <= 120),
  role_category    text check (role_category is null or char_length(role_category) <= 80),
  posted_text      text check (posted_text is null or char_length(posted_text) <= 60),
  pay_as_written   text check (pay_as_written is null or char_length(pay_as_written) <= 120),
  source_url       text check (source_url is null or char_length(source_url) <= 500),
  source_kind      text check (source_kind is null or source_kind in ('own_site', 'hiring_system', 'job_board')),
  contact_email    text check (contact_email is null or char_length(contact_email) <= 254),
  email_source_url text check (email_source_url is null or char_length(email_source_url) <= 500),
  email_found_at   timestamptz,
  note             text check (note is null or char_length(note) <= 300),
  status           text not null default 'new' check (status in ('new', 'listed', 'skipped')),
  found_at         timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- An email is never kept without where and when it was found.
  constraint clinic_leads_email_has_source check (contact_email is null or (email_source_url is not null and email_found_at is not null))
);
create unique index if not exists clinic_leads_website_idx on public.clinic_leads (website_key);
create index if not exists clinic_leads_province_idx on public.clinic_leads (province, found_at desc);
alter table public.clinic_leads enable row level security;
revoke all on public.clinic_leads from anon, authenticated;


-- ======================================================================
-- 0026_posted_by_admin.sql
-- ======================================================================
-- Jobs that an admin posted on a clinic's behalf (for example when a clinic is having trouble with the form).
-- Records who did it and when, so the record is clear. Safe to run more than once.

alter table public.jobs add column if not exists posted_by_admin_id uuid references auth.users (id) on delete set null;
alter table public.jobs add column if not exists posted_by_admin_at timestamptz;

-- ======================================================================
-- 0027_vision_therapist.sql
-- ======================================================================
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

-- ======================================================================
-- 0028_job_extensions_and_outcomes.sql
-- ======================================================================
-- Clinics can extend a job by 30 days near the end of its run (or within 7 days of it ending), and tell us
-- how they filled a role when they close it. Both are written on the server after the clinic is checked,
-- so clinics are not given any new rights over these columns. Safe to run more than once.

alter table public.jobs add column if not exists extended_count integer not null default 0;
alter table public.jobs add column if not exists last_extended_at timestamptz;
alter table public.jobs add column if not exists filled_at timestamptz;
alter table public.jobs add column if not exists filled_via text;
alter table public.jobs add column if not exists filled_via_other text;

alter table public.jobs drop constraint if exists jobs_filled_via_check;
alter table public.jobs add constraint jobs_filled_via_check check (filled_via is null or filled_via in (
  'kestrel', 'indeed', 'linkedin', 'word_of_mouth', 'own_website', 'other'));

alter table public.jobs drop constraint if exists jobs_filled_via_other_length;
alter table public.jobs add constraint jobs_filled_via_other_length check (filled_via_other is null or char_length(filled_via_other) <= 200);

-- ======================================================================
-- 0029_outreach_sequence.sql
-- ======================================================================
-- The clinic outreach sequence: 4 emails over about 5 weeks to a clinic address found by the province search
-- (clinic_leads). Steve adds clinics in batches on the admin Outreach page, which is his approval of each send list.
-- The daily job sends what is due, only while ENABLE_OUTREACH is "yes". Private: only the server can read or write.
-- Safe to run more than once.

create table if not exists public.outreach_contacts (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid references public.clinic_leads (id) on delete set null,
  email         text not null check (char_length(email) between 3 and 254), -- always lower case
  clinic_name   text not null check (char_length(clinic_name) between 1 and 160),
  -- The CASL record of implied consent: where the address was published and when we found it.
  email_source_url text not null check (char_length(email_source_url) <= 500),
  email_found_at   timestamptz not null,
  steps_sent    integer not null default 0 check (steps_sent between 0 and 4),
  status        text not null default 'active' check (status in ('active', 'stopped', 'finished')),
  stop_reason   text check (stop_reason is null or stop_reason in ('unsubscribed', 'replied', 'joined', 'claimed', 'bounced', 'manual')),
  next_due_at   timestamptz,
  last_sent_at  timestamptz,
  approved_by   uuid references auth.users (id) on delete set null,
  approved_at   timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index if not exists outreach_contacts_email_idx on public.outreach_contacts (email);
create index if not exists outreach_contacts_due_idx on public.outreach_contacts (status, next_due_at);
alter table public.outreach_contacts enable row level security;
revoke all on public.outreach_contacts from anon, authenticated;

-- One row per email sent, kept as the record of what went to whom and when.
create table if not exists public.outreach_sends (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid not null references public.outreach_contacts (id) on delete cascade,
  step        integer not null check (step between 1 and 4),
  subject     text not null,
  sent_at     timestamptz not null default now()
);
create index if not exists outreach_sends_contact_idx on public.outreach_sends (contact_id, sent_at);
alter table public.outreach_sends enable row level security;
revoke all on public.outreach_sends from anon, authenticated;

-- ======================================================================
-- 0030_job_stats.sql
-- ======================================================================
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

-- ======================================================================
-- 0031_candidate_preferences.sql
-- ======================================================================
-- 0031: what a candidate is looking for, for the "Recommended for you" list on their home page.
-- The list is worked out by rules in the website code (no AI). These columns only hold the candidate's own choices, and row level security
-- keeps them private to the candidate (the existing candidate_profiles policies already cover new columns).
-- Safe to run more than once.

alter table public.candidate_profiles
  add column if not exists home_city            text check (home_city is null or char_length(home_city) <= 80),
  add column if not exists home_province        text check (home_province is null or char_length(home_province) <= 40),
  add column if not exists pref_radius_km       integer not null default 25 check (pref_radius_km in (10, 25, 50)),
  add column if not exists pref_provinces       text[] not null default '{}',
  add column if not exists pref_employment_types text[] not null default '{}',
  add column if not exists pref_other_roles     text[] not null default '{}',
  add column if not exists pref_min_pay         numeric(10, 2) check (pref_min_pay is null or pref_min_pay > 0),
  add column if not exists pref_pay_period      text check (pref_pay_period is null or pref_pay_period in ('hour', 'year')),
  add column if not exists pref_practice        text check (pref_practice is null or pref_practice in ('independent', 'corporate'));

-- Jobs a candidate has said they are not interested in, so they stop appearing in their recommendations.
create table if not exists public.candidate_job_hides (
  user_id    uuid not null references auth.users (id) on delete cascade,
  job_id     uuid not null references public.jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

alter table public.candidate_job_hides enable row level security;

drop policy if exists "Candidates can read their own hidden jobs" on public.candidate_job_hides;
create policy "Candidates can read their own hidden jobs"
  on public.candidate_job_hides for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Candidates can hide a job for themselves" on public.candidate_job_hides;
create policy "Candidates can hide a job for themselves"
  on public.candidate_job_hides for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Candidates can bring back a hidden job" on public.candidate_job_hides;
create policy "Candidates can bring back a hidden job"
  on public.candidate_job_hides for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ======================================================================
-- 0032_waitlist_attribution.sql
-- ======================================================================
-- 0032: where a waitlist sign up came from (marketing audit item 2).
-- The first visit of the browser session is saved with the sign up: the link tags (utm_source, utm_medium, utm_campaign),
-- the website that sent the visitor, and the page they landed on. No query strings are kept, so nothing personal can be
-- saved by accident. Safe to run more than once. Run it on BOTH databases (live and demo).

alter table public.waitlist
  add column if not exists utm_source    text check (utm_source is null or char_length(utm_source) <= 60),
  add column if not exists utm_medium    text check (utm_medium is null or char_length(utm_medium) <= 60),
  add column if not exists utm_campaign  text check (utm_campaign is null or char_length(utm_campaign) <= 60),
  add column if not exists referrer_host text check (referrer_host is null or char_length(referrer_host) <= 100),
  add column if not exists landing_path  text check (landing_path is null or char_length(landing_path) <= 120);

-- ======================================================================
-- 0033_onboarding_emails.sql
-- ======================================================================
-- 0033: a record of which first week emails each account has been sent (marketing audit item 14), so none is sent twice.
-- Written only by the server with the service role key. Row level security is on with no public policies. Safe to run more than once.
-- Run it on BOTH databases (live and demo). The emails stay off until ENABLE_ONBOARDING_EMAILS is "yes" in Vercel.

create table if not exists public.onboarding_emails (
  user_id uuid not null references auth.users (id) on delete cascade,
  step    text not null check (char_length(step) <= 40),
  sent_at timestamptz not null default now(),
  primary key (user_id, step)
);

alter table public.onboarding_emails enable row level security;

-- ======================================================================
-- 0034_pay_basis_tags_headcount.sql
-- ======================================================================
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

-- ======================================================================
-- 0035_pay_both_parts.sql
-- ======================================================================
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

-- ======================================================================
-- 0036_hired.sql
-- ======================================================================
-- 0036: "Hired" (Steve, 10th November 2026).
--   * A clinic that fills a job through Kestrel can say which applicant it hired. That application moves to a new final step, "hired", and the
--     candidate is told. The job remembers which application it was, so Kestrel can count hires made through the site.
--   * Nothing else changes. Existing applications and jobs are untouched and still valid.
-- Safe to run more than once.

alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check check (status in (
  'applied', 'viewed', 'shortlisted', 'interview', 'offer', 'hired',
  'not_selected', 'role_filled', 'kept', 'no_update', 'withdrawn'));

-- Set by the website's server when the clinic names the person it hired. Clinics cannot write it themselves (there is no column
-- permission for it), and if the application is ever deleted the job simply forgets it.
alter table public.jobs add column if not exists filled_application_id uuid references public.applications (id) on delete set null;

-- ======================================================================
-- 0037_candidate_first_step.sql
-- ======================================================================
-- 0037: the first step after a candidate signs in for the first time (Steve, 12th November 2026).
--   * career_stage: an optional, private answer to "where are you in eye care". Plain facts only: working in eye care now, studying or
--     training for eye care, or not working in eye care yet. It is never shown to a clinic, never used to rank or filter jobs, and never
--     a gate. Whether a clinic may ever see it is a question for the lawyer (it could hint at protected grounds).
--   * start_seen_at: when the candidate was shown the first step page (they answered it or chose Skip), so they are only sent there once.
-- Nothing else changes. Existing profiles are untouched: career_stage stays empty. A candidate who already has a role is never sent to the first
-- step page. One with no role yet is sent there once. Until this SQL has been run the site simply skips the page. Safe to run more than once.

alter table public.candidate_profiles
  add column if not exists career_stage  text check (career_stage is null or career_stage in ('working', 'studying', 'not_yet')),
  add column if not exists start_seen_at timestamptz;

-- The candidate saves these through their own sign in, so they need permission on the new columns, as for the other profile columns.
grant insert (career_stage, start_seen_at) on public.candidate_profiles to authenticated;
grant update (career_stage, start_seen_at) on public.candidate_profiles to authenticated;

-- ======================================================================
-- 0038_notifications.sql
-- ======================================================================
-- 0038: the in account inbox (Steve, 12th November 2026).
--   * notifications: a short message to one person about something that happened on their account, for example an application moved to a new
--     step, a new applicant, or a job approved. One way only: Kestrel tells people things, and nobody replies to anybody in it.
--   * Only the website's server writes them (there is no insert permission for signed in people). A person can read their own, and can set
--     read_at on their own (to mark them read). Nobody can read anyone else's.
--   * Nothing else changes. Safe to run more than once.

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (char_length(kind) <= 40),
  title      text not null check (char_length(title) <= 160),
  body       text check (body is null or char_length(body) <= 500),
  href       text check (href is null or (href like '/%' and char_length(href) <= 200)),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "People can read their own notifications" on public.notifications;
create policy "People can read their own notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "People can mark their own notifications read" on public.notifications;
create policy "People can mark their own notifications read"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- ======================================================================
-- 0039_name_changes.sql
-- ======================================================================
-- 0039: the hold on changing your name (Steve, 12th November 2026).
--   * name_changed_at: when a person last changed their name. Every change, including the first, starts a 30 day hold before the
--     next one. Only the website's server writes it (there is no permission for signed in people to change it), so nobody can clear their own hold.
--   * To unlock someone early (a typo, a legal name change) after they write to hello@, run in the Supabase SQL editor:
--       update public.profiles set name_changed_at = null where id = (select id from auth.users where email = 'their@email.ca');
-- Nothing else changes, and nobody's name is changed. Safe to run more than once.

alter table public.profiles add column if not exists name_changed_at timestamptz;

-- ======================================================================
-- 0040_database_keeps_promises.sql
-- ======================================================================
-- 0040: the database keeps the promises the website makes (audit part 1, Phase D, 12th November 2026).
-- Each part below closes 1 finding from docs/audit/AUDIT-2026-11-PART1.md. Nobody's data is changed or removed.
-- Safe to run more than once. The access tests for every part are in scripts/dev/rls-tests.sql.

-- ---------------------------------------------------------------- P1-16: the name hold cannot be skipped
-- Signed in people could change their own first_name, last_name and full_name directly, which skipped the 30 day hold (migration 0039).
-- The website now saves a name with the server's key, after checking the hold (lib/name-change.ts), so the permission is taken away.
-- Before this is run the website already saves names through the server, so nothing changes for anyone on the day it is run.
revoke update on public.profiles from authenticated;
revoke update (first_name, last_name, full_name) on public.profiles from authenticated;

-- ---------------------------------------------------------------- P1-28: no Quebec job in review or live
-- Kestrel is in English for now, so the website refuses a job in Quebec (Steve, 6th November 2026). A job sent straight to the database API
-- skipped that. This rule refuses a Quebec job that is in review or live. Drafts, and jobs that are rejected, closed or expired, are left
-- alone, so a Quebec job that somehow exists already can still be closed or run out. "not valid" means rows already in the table are not
-- checked today (the check at the end of the combined file counts them, and it should say 0).
alter table public.jobs drop constraint if exists jobs_not_quebec_once_sent;
alter table public.jobs add constraint jobs_not_quebec_once_sent check (
  status not in ('in_review', 'live') or province is null or lower(btrim(province)) not in ('quebec', 'québec', 'qc')
) not valid;

-- ---------------------------------------------------------------- P1-44: percentages and daily rates are for optometrist roles
-- The website's form only lets an optometrist role give pay as a percentage or a daily rate (Steve, 9th November 2026, lib/job-pay.ts).
-- The database accepted both for any role. This rule holds the same line for a job that is in review or live. Drafts are left alone so a
-- clinic can save a half finished job and fix it. "not valid": rows already in the table are not checked today (the check at the end counts them).
alter table public.jobs drop constraint if exists jobs_optometrist_only_pay;
alter table public.jobs add constraint jobs_optometrist_only_pay check (
  status not in ('in_review', 'live')
  or coalesce(role_category = 'Optometrist', false)
  or ((pay_period is null or pay_period <> all (array['day'])) and pay_percent_min is null and pay_percent_max is null)
) not valid;

-- ---------------------------------------------------------------- P1-41: a sign in gives no wider view of other people's jobs and clinics
-- Visitors read live jobs and their clinics through a short list of public columns (migrations 0005, 0013, 0034, 0035). Signed in people were
-- covered by the same 2 "anyone can read" rules but hold table wide read permission (clinics need it for their own jobs), so any signed in
-- person could read every column of every live job and of every clinic with a live job: the review note, who posted it, who was hired,
-- and the clinic owner's account id.
-- From here the 2 "anyone can read" rules are for visitors only. A signed in person reads jobs and clinics through their own sign in only as
-- the owner or as an admin (those rules are unchanged). The website already shows live jobs to everyone, signed in or not, through the
-- visitor's key and the public column list (lib/public-jobs.ts), so no page changes.
drop policy if exists "Anyone can read live jobs" on public.jobs;
create policy "Anyone can read live jobs"
  on public.jobs for select to anon
  using (status = 'live' and expires_at > now());

drop policy if exists "Anyone can read clinics that have live jobs" on public.employers;
create policy "Anyone can read clinics that have live jobs"
  on public.employers for select to anon
  using (status = 'active' and public.employer_has_live_job(id));

-- ---------------------------------------------------------------- P1-42: no leftover default permissions
-- Supabase gives visitors and signed in people every permission on a new table unless a migration takes them away. These 4 tables never had
-- them taken away. Row level security already blocked reading and changing rows, but it does not cover emptying a table (truncate).
-- Take everything away, then give back only what the website uses, as migration 0038 does for the inbox.
--   waitlist and onboarding_emails: only the website's server touches them.
--   candidate_job_hides: a candidate reads, adds and removes their own (the rules from migration 0031 limit it to their own rows).
--   profiles: a person reads their own row. Every change is made by the website's server (names since P1-16 above).
revoke all on public.waitlist, public.onboarding_emails, public.candidate_job_hides, public.profiles from anon, authenticated;
grant select, delete on public.candidate_job_hides to authenticated;
grant insert (user_id, job_id) on public.candidate_job_hides to authenticated;
grant select on public.profiles to authenticated;

-- ---------------------------------------------------------------- P1-15: the shortlist stays private from the candidate
-- A clinic's shortlist is its own working list, and the website shows a shortlisted candidate "Viewed". But a candidate could read their own
-- row in applications, and the history in application_events, straight from the database, and see "shortlisted" there.
-- Design chosen by Steve (12th November 2026): the database hands a candidate a masked copy.
--   * my_applications(): the signed in candidate's own applications, with a shortlist shown as "viewed", no clinic message on it, and the
--     time of the last change set back to when it was viewed, so nothing gives the shortlist away.
--   * my_application_events(application): the history of one of their own applications, without the shortlist step.
--   * Candidates can no longer read applications or application_events directly. Clinics read them exactly as before.
-- Nothing is moved or changed in either table. The website tries these first and falls back to the old read on a database without them.
create or replace function public.my_applications()
returns table (
  id uuid, job_id uuid, status text, cover_letter text, keep_details boolean, job_title text, clinic_name text, job_location text,
  cv_filename text, clinic_message text, viewed_at timestamptz, status_changed_at timestamptz, created_at timestamptz, applicant jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.job_id,
         case when a.status = 'shortlisted' then 'viewed' else a.status end,
         a.cover_letter, a.keep_details, a.job_title, a.clinic_name, a.job_location, a.cv_filename,
         case when a.status = 'shortlisted' then null else a.clinic_message end,
         a.viewed_at,
         case when a.status = 'shortlisted' then coalesce(a.viewed_at, a.created_at) else a.status_changed_at end,
         a.created_at, a.applicant
  from public.applications a
  where a.candidate_id = (select auth.uid());
$$;

create or replace function public.my_application_events(application uuid)
returns table (application_id uuid, status text, note text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select e.application_id, e.status, e.note, e.created_at
  from public.application_events e
  join public.applications a on a.id = e.application_id
  where e.application_id = application
    and a.candidate_id = (select auth.uid())
    and e.status <> 'shortlisted';
$$;

revoke all on function public.my_applications() from public, anon;
revoke all on function public.my_application_events(uuid) from public, anon;
grant execute on function public.my_applications() to authenticated;
grant execute on function public.my_application_events(uuid) to authenticated;

drop policy if exists "Candidates can read their own applications" on public.applications;

drop policy if exists "People can read the history of applications they can see" on public.application_events;
drop policy if exists "Clinics can read the history of applications to their jobs" on public.application_events;
create policy "Clinics can read the history of applications to their jobs"
  on public.application_events for select to authenticated
  using (public.owns_application_job(application_id));

-- ======================================================================
-- 0041_signup_ticket_always.sql
-- ======================================================================
-- 0041: every sign up made with an email address needs Kestrel's ticket, even once sign up is open (audit P1-03, Phase E, 12th November 2026).
-- Anyone can send a sign up straight to Supabase with the public browser key. Kestrel's website only issues a one time ticket after the
-- bot check, the "I agree to the terms" tick and, for a clinic, the invitation code. Before this, the ticket was only needed while the
-- gate was closed, so the day it opened a script could skip all 3. Now:
--   * a sign up with an email address (or any kind other than Google) needs a ticket, whether the gate is open or closed;
--   * a Google sign up needs no ticket once the gate is open, but any role it sends is removed, so the person lands on the welcome page,
--     which asks for the terms and, for a clinic, the invitation code (lib/auth-actions.ts, chooseAccountType);
--   * while the gate is closed, nothing gets in without a ticket, as before.
-- Adding a user by hand in Supabase's dashboard is refused too: make accounts through the website. To add one by SQL, include
-- 'signup_ticket', public.issue_signup_ticket() in raw_user_meta_data (supabase/demo/seed.sql does this).
-- Nobody's account is changed. Safe to run more than once. The access tests are in scripts/dev/rls-tests.sql (P1-03).

create or replace function public.gate_new_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  given    text := nullif(new.raw_user_meta_data ->> 'signup_ticket', '');
  provider text := coalesce(nullif(new.raw_app_meta_data ->> 'provider', ''), 'email');
  used     integer := 0;
begin
  if given ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    delete from public.signup_tickets where ticket = given::uuid and created_at > now() - interval '15 minutes';
    get diagnostics used = row_count;
  end if;
  if used = 1 then
    new.raw_user_meta_data := new.raw_user_meta_data - 'signup_ticket';
    return new;
  end if;
  if not exists (select 1 from public.signup_gate where open) then
    raise exception 'Sign ups are not open yet.';
  end if;
  if provider = 'google' then
    -- No ticket, so nothing the sign up says about itself is trusted: the person chooses on the welcome page.
    new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb) - 'role' - 'signup_ticket' - 'terms_version' - 'marketing_consent' - 'marketing_consent_text';
    return new;
  end if;
  raise exception 'Please sign up on the Kestrel website.';
end;
$$;
revoke execute on function public.gate_new_users() from public, anon, authenticated;

drop trigger if exists gate_new_users on auth.users;
create trigger gate_new_users before insert on auth.users for each row execute function public.gate_new_users();

-- ======================================================================
-- CHECK: after everything above has run, this lists every part of the
-- database Kestrel needs. Every row should say OK.
-- ======================================================================
select thing, case when present then 'OK' when thing = 'private CV storage' then 'NOT YET (normal: it is created when the first CV is uploaded)' else 'MISSING' end as status
from (
  values
    ('table: waitlist', to_regclass('public.waitlist') is not null),
    ('table: profiles', to_regclass('public.profiles') is not null),
    ('table: employers', to_regclass('public.employers') is not null),
    ('table: employer_contacts', to_regclass('public.employer_contacts') is not null),
    ('table: jobs', to_regclass('public.jobs') is not null),
    ('table: candidate_profiles', to_regclass('public.candidate_profiles') is not null),
    ('table: applications', to_regclass('public.applications') is not null),
    ('table: application_events', to_regclass('public.application_events') is not null),
    ('table: application_notes', to_regclass('public.application_notes') is not null),
    ('table: ad_builder_uses', to_regclass('public.ad_builder_uses') is not null),
    ('table: job_alerts', to_regclass('public.job_alerts') is not null),
    ('table: job_reports', to_regclass('public.job_reports') is not null),
    ('table: email_suppressions (do not email list)', to_regclass('public.email_suppressions') is not null),
    ('table: listing_claims', to_regclass('public.listing_claims') is not null),
    ('table: job_templates', to_regclass('public.job_templates') is not null),
    ('table: cover_letter_templates', to_regclass('public.cover_letter_templates') is not null),
    ('table: application_drafts', to_regclass('public.application_drafts') is not null),
    ('column: candidate application email choice', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'notify_application_updates')),
    ('column: clinic new applicant email choice', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'employer_contacts' and column_name = 'notify_new_applications')),
    ('column: terms agreed record', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'terms_version')),
    ('table: job_versions (copy of live wording)', to_regclass('public.job_versions') is not null),
    ('table: account_deletions', to_regclass('public.account_deletions') is not null),
    ('table: job_runs (daily job lock and heartbeat)', to_regclass('public.job_runs') is not null),
    ('column: closing soon email marker', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'jobs' and column_name = 'expiry_reminded_at')),
    ('column: clinic applicant email frequency', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'employer_contacts' and column_name = 'notify_frequency')),
    ('table: signup_gate (sign up closed until launch)', to_regclass('public.signup_gate') is not null),
    ('trigger: new accounts need an open gate or a ticket', exists (select 1 from pg_trigger where tgname = 'gate_new_users')),
    ('column: Google sign in account type', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'account_type_confirmed')),
    ('column: job alert frequency', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'job_alerts' and column_name = 'frequency')),
    ('column: clinic confirmed direct hire', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'employers' and column_name = 'direct_hire_confirmed_at')),
    ('column: field based role area', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'jobs' and column_name = 'territory')),
    ('column: extra pay', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'jobs' and column_name = 'pay_extras')),
    ('column: work arrangement', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'jobs' and column_name = 'work_arrangement')),
    ('column: waitlist email confirmed', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'waitlist' and column_name = 'confirmed_at')),
    ('column: unsubscribed date on profiles', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'unsubscribed_at')),
    ('column: unopened reminder on applications', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'applications' and column_name = 'reminded_at')),
    ('table: page_reads (found listings tool record)', to_regclass('public.page_reads') is not null),
    ('table: sign_in_attempts (sign in guard)', to_regclass('public.sign_in_attempts') is not null),
    ('column: job posted by an admin', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'jobs' and column_name = 'posted_by_admin_id')),
    ('column: when a found listing was found', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'jobs' and column_name = 'found_at')),
    ('rule: found listings live 21 days at most', exists (select 1 from pg_constraint where conname = 'jobs_found_listing_21_days')),
    ('table: clinic_leads (province search leads)', to_regclass('public.clinic_leads') is not null),
    ('table: outreach_contacts (clinic outreach sequence)', to_regclass('public.outreach_contacts') is not null),
    ('column: job extensions', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'jobs' and column_name = 'extended_count')),
    ('table: job_daily_stats (job views and apply clicks)', to_regclass('public.job_daily_stats') is not null),
    ('function: record_job_event', exists (select 1 from pg_proc where proname = 'record_job_event')),
    ('column: candidate preferences (recommended jobs)', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'candidate_profiles' and column_name = 'pref_min_pay')),
    ('table: candidate_job_hides (not interested)', to_regclass('public.candidate_job_hides') is not null),
    ('column: where a waitlist sign up came from', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'waitlist' and column_name = 'utm_source')),
    ('table: onboarding_emails (first week emails sent)', to_regclass('public.onboarding_emails') is not null),
    ('columns: pay basis, percentage and tags on jobs', (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'jobs' and column_name in ('pay_is_minimum', 'pay_percent_min', 'pay_percent_max', 'pay_percent_of', 'tags_software', 'tags_equipment', 'tags_specialties')) = 7),
    ('columns: pay basis and tags on job templates', (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'job_templates' and column_name in ('pay_is_minimum', 'pay_percent_min', 'pay_percent_max', 'pay_percent_of', 'tags_software', 'tags_equipment', 'tags_specialties')) = 7),
    ('column: employee count band (private contact table)', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'employer_contacts' and column_name = 'employee_band')),
    ('column: candidate software skills', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'candidate_profiles' and column_name = 'software_skills')),
    ('permission: candidates can save their job preferences', has_column_privilege('authenticated', 'public.candidate_profiles', 'home_city', 'UPDATE')),
    ('column: days a week on a daily rate', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'jobs' and column_name = 'pay_days_per_week')),
    ('private CV storage', exists (select 1 from storage.buckets where id = 'cvs')),
    ('column: the application a clinic hired for a filled job', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'jobs' and column_name = 'filled_application_id')),
    ('columns: candidate first step (career stage, first step seen)', (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'candidate_profiles' and column_name in ('career_stage', 'start_seen_at')) = 2),
    ('permission: candidates can save their first step answers', has_column_privilege('authenticated', 'public.candidate_profiles', 'career_stage', 'UPDATE')),
    ('table: notifications (in account inbox)', to_regclass('public.notifications') is not null),
    ('permission: people can mark their own notifications read', has_column_privilege('authenticated', 'public.notifications', 'read_at', 'UPDATE')),
    ('column: when a name was last changed', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'name_changed_at')),
    ('rule: applications can be hired', exists (select 1 from pg_constraint where conname = 'applications_status_check' and pg_get_constraintdef(oid) like '%hired%')),
    ('permission removed: signed in people cannot change their own name directly (0040)', not has_column_privilege('authenticated', 'public.profiles', 'first_name', 'UPDATE') and not has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE')),
    ('rule: no Quebec job in review or live (0040)', exists (select 1 from pg_constraint where conname = 'jobs_not_quebec_once_sent')),
    ('Quebec jobs already in review or live (should be 0 problems)', not exists (select 1 from public.jobs where status in ('in_review', 'live') and lower(btrim(province)) in ('quebec', 'québec', 'qc'))),
    ('rule: percentages and daily rates for optometrist roles only (0040)', exists (select 1 from pg_constraint where conname = 'jobs_optometrist_only_pay')),
    ('jobs for other roles already in review or live with a percentage or daily rate (should be 0 problems)', not exists (select 1 from public.jobs where status in ('in_review', 'live') and role_category is distinct from 'Optometrist' and (pay_period = 'day' or pay_percent_min is not null or pay_percent_max is not null))),
    ('rule: live jobs and their clinics are public through the visitor columns only (0040)', (select count(*) from pg_policies where schemaname = 'public' and policyname in ('Anyone can read live jobs', 'Anyone can read clinics that have live jobs') and roles = '{anon}') = 2),
    ('permissions: no table lets a visitor or signed in person truncate it, or add triggers or references (0040)', not exists (select 1 from information_schema.role_table_grants where table_schema = 'public' and grantee in ('anon', 'authenticated') and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES'))),
    ('permissions: visitors hold nothing on the waitlist, and signed in people can read their own profile (0040)', not has_table_privilege('anon', 'public.waitlist', 'SELECT') and not has_table_privilege('authenticated', 'public.waitlist', 'SELECT') and has_table_privilege('authenticated', 'public.profiles', 'SELECT')),
    ('table: outreach_sends (clinic outreach emails sent)', to_regclass('public.outreach_sends') is not null),
    ('table: signup_tickets (one time sign up tickets)', to_regclass('public.signup_tickets') is not null),
    ('row level security is on for every table (should be 0 problems)', not exists (select 1 from pg_tables where schemaname = 'public' and not rowsecurity)),
    ('rules: at least 51 access policies are in place', (select count(*) from pg_policies where schemaname = 'public') >= 51),
    ('rules: every table a visitor or signed in person can reach has an access policy (should be 0 problems)', not exists (select 1 from information_schema.role_table_grants g where g.table_schema = 'public' and g.grantee in ('anon', 'authenticated') and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = g.table_name)) and not exists (select 1 from information_schema.role_column_grants g where g.table_schema = 'public' and g.grantee in ('anon', 'authenticated') and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = g.table_name))),
    ('trigger: clinics cannot publish or change a live job (jobs_enforce_changes)', exists (select 1 from pg_trigger where tgname = 'jobs_enforce_changes' and tgrelid = 'public.jobs'::regclass and tgenabled <> 'D')),
    ('trigger: limit on open jobs for each clinic (jobs_limit_open)', exists (select 1 from pg_trigger where tgname = 'jobs_limit_open' and tgrelid = 'public.jobs'::regclass and tgenabled <> 'D')),
    ('trigger: a profile is made for every new account (on_auth_user_created)', exists (select 1 from pg_trigger where tgname = 'on_auth_user_created' and tgrelid = 'auth.users'::regclass and tgenabled <> 'D')),
    ('functions: a candidate reads their own applications with the shortlist hidden (0040)', (select count(*) from pg_proc where pronamespace = 'public'::regnamespace and proname in ('my_applications', 'my_application_events')) = 2 and has_function_privilege('authenticated', 'public.my_applications()', 'EXECUTE') and not has_function_privilege('anon', 'public.my_applications()', 'EXECUTE')),
    ('rule: candidates cannot read applications or their history directly (0040)', not exists (select 1 from pg_policies where schemaname = 'public' and policyname in ('Candidates can read their own applications', 'People can read the history of applications they can see'))),
    ('rule: every email sign up needs Kestrel''s ticket, even with the gate open (0041)', exists (select 1 from pg_proc where proname = 'gate_new_users' and pronamespace = 'public'::regnamespace and prosrc like '%Please sign up on the Kestrel website%') and exists (select 1 from pg_trigger where tgname = 'gate_new_users' and tgrelid = 'auth.users'::regclass and tgenabled <> 'D')),
    ('people without a profile (should be 0 problems)', not exists (select 1 from auth.users u where not exists (select 1 from public.profiles p where p.id = u.id)))
) as checks(thing, present)
order by 2, 1;
