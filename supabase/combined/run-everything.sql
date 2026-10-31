-- KESTREL: everything the database needs, in order (migrations 0001 to 0018), plus a check at the end.
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
    ('column: Google sign in account type', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'account_type_confirmed')),
    ('column: job alert frequency', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'job_alerts' and column_name = 'frequency')),
    ('column: clinic confirmed direct hire', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'employers' and column_name = 'direct_hire_confirmed_at')),
    ('column: field based role area', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'jobs' and column_name = 'territory')),
    ('column: extra pay', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'jobs' and column_name = 'pay_extras')),
    ('column: work arrangement', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'jobs' and column_name = 'work_arrangement')),
    ('column: waitlist email confirmed', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'waitlist' and column_name = 'confirmed_at')),
    ('column: unsubscribed date on profiles', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'unsubscribed_at')),
    ('column: unopened reminder on applications', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'applications' and column_name = 'reminded_at')),
    ('private CV storage', exists (select 1 from storage.buckets where id = 'cvs')),
    ('people without a profile (should be 0 problems)', not exists (select 1 from auth.users u where not exists (select 1 from public.profiles p where p.id = u.id)))
) as checks(thing, present)
order by 2, 1;
