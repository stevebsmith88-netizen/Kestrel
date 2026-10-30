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
