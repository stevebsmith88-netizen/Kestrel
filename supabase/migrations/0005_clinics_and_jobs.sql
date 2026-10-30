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
