-- 0045: team members for a clinic, their invitations, and a record of changes Kestrel's admin makes for a clinic (Steve, 14th November
-- 2026; design in docs/plans/locations-and-team-design.md). Safe to run twice.
--
-- Before: 1 sign in owned 1 clinic, and every clinic rule asked "does this person own this clinic?".
-- From here a clinic can have up to 5 people, counting the owner. The owner invites the others at 1 of 2 levels:
--   * edit: post and change jobs, see applicants and their resumes, and move them along;
--   * view: read jobs and applicants, and add private notes (the website passes those notes to the owner). No changes.
-- The owner alone changes the clinic profile, the private alert address and the team.
-- Only the owner and the people the owner invites can see a clinic's applicants. Kestrel's admin is not given access by this.

-- ---------------------------------------------------------------- the team
create table if not exists public.employer_members (
  employer_id uuid not null references public.employers (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  level       text not null check (level in ('edit', 'view')),
  added_by    uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  primary key (employer_id, user_id)
);
-- For now a person belongs to 1 clinic (several locations come later, with migration 0046).
create unique index if not exists employer_members_one_clinic_idx on public.employer_members (user_id);

-- Invitations. The code itself is never stored, only a fingerprint of it (sha256), so reading this table does not give anyone a way in.
-- A code works once, only for the email address it was sent to, until it runs out (14 days).
create table if not exists public.employer_invites (
  id           uuid primary key default gen_random_uuid(),
  employer_id  uuid not null references public.employers (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 120),
  email        text not null check (char_length(email) between 3 and 254 and email = lower(email)),
  level        text not null check (level in ('edit', 'view')),
  code_hash    text not null unique check (char_length(code_hash) = 64),
  invited_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  accepted_at  timestamptz,
  accepted_by  uuid references auth.users (id) on delete set null,
  cancelled_at timestamptz
);
create index if not exists employer_invites_employer_idx on public.employer_invites (employer_id);

-- What Kestrel's admin changed for a clinic, when, and why (Admin, Clinics). Kept so a clinic can always be told what was done.
create table if not exists public.admin_actions (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references auth.users (id) on delete set null,
  employer_id uuid references public.employers (id) on delete set null,
  action      text not null check (char_length(action) between 1 and 60),
  detail      text check (detail is null or char_length(detail) <= 1000),
  reason      text check (reason is null or char_length(reason) <= 500),
  created_at  timestamptz not null default now()
);
create index if not exists admin_actions_employer_idx on public.admin_actions (employer_id, created_at desc);

alter table public.employer_members enable row level security;
alter table public.employer_invites enable row level security;
alter table public.admin_actions enable row level security;

-- Invitations and the admin record are handled only by the website's server. Nobody reads or changes them with their own sign in.
revoke all on public.employer_invites, public.admin_actions from anon, authenticated;
-- A clinic's people can see who is on their team. Adding and removing people is done by the website's server, after checking that the
-- person asking is the owner.
revoke all on public.employer_members from anon, authenticated;
grant select on public.employer_members to authenticated;

-- ---------------------------------------------------------------- who may do what
-- 'owner', 'edit', 'view', or null when the signed in person has nothing to do with the clinic.
create or replace function public.employer_level(emp uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (select 1 from public.employers where id = emp and owner_id = (select auth.uid())) then 'owner'
    else (select m.level from public.employer_members m where m.employer_id = emp and m.user_id = (select auth.uid()))
  end;
$$;

create or replace function public.can_edit_employer(emp uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.employer_level(emp) in ('owner', 'edit'), false);
$$;

create or replace function public.can_view_employer(emp uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.employer_level(emp) is not null;
$$;

-- These 2 decide who can read a job's applications, their history and the clinic's notes on them. They now include the whole team.
create or replace function public.owns_job(job uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.jobs j where j.id = job and public.can_view_employer(j.employer_id));
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
    where a.id = app and public.can_view_employer(j.employer_id)
  );
$$;

revoke execute on function public.employer_level(uuid) from public, anon;
revoke execute on function public.can_edit_employer(uuid) from public, anon;
revoke execute on function public.can_view_employer(uuid) from public, anon;
grant execute on function public.employer_level(uuid) to authenticated;
grant execute on function public.can_edit_employer(uuid) to authenticated;
grant execute on function public.can_view_employer(uuid) to authenticated;

-- At most 5 people a clinic (the owner and 4 more), and someone who owns a clinic cannot also join another one.
create or replace function public.limit_employer_members()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.employer_members where employer_id = new.employer_id) >= 4 then
    raise exception 'A clinic can have up to 5 people on Kestrel, including the owner.';
  end if;
  if exists (select 1 from public.employers where owner_id = new.user_id) then
    raise exception 'This person already has their own clinic on Kestrel.';
  end if;
  return new;
end;
$$;
revoke execute on function public.limit_employer_members() from public, anon, authenticated;
drop trigger if exists employer_members_limit on public.employer_members;
create trigger employer_members_limit before insert on public.employer_members for each row execute function public.limit_employer_members();

-- A team member cannot also own a clinic (claiming a listing or creating a profile), the other half of the rule above.
create or replace function public.owner_not_a_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_id is not null and exists (select 1 from public.employer_members where user_id = new.owner_id) then
    raise exception 'This person is on another clinic''s team, so they cannot own a clinic as well.';
  end if;
  return new;
end;
$$;
revoke execute on function public.owner_not_a_member() from public, anon, authenticated;
drop trigger if exists employers_owner_not_a_member on public.employers;
create trigger employers_owner_not_a_member before insert or update of owner_id on public.employers for each row execute function public.owner_not_a_member();

-- ---------------------------------------------------------------- the rules, now for the team
drop policy if exists "People can see their own clinic's team" on public.employer_members;
create policy "People can see their own clinic's team"
  on public.employer_members for select to authenticated
  using (public.can_view_employer(employer_id));

-- The owner's own rules on employers are unchanged (only the owner can change the profile). The team can read it.
drop policy if exists "Team members can read their clinic" on public.employers;
create policy "Team members can read their clinic"
  on public.employers for select to authenticated
  using (public.can_view_employer(id));

-- employer_contacts (the private alert address) stays owner only: its rules still use owns_employer, which is unchanged.

drop policy if exists "Clinics can read their own jobs" on public.jobs;
create policy "Clinics can read their own jobs"
  on public.jobs for select to authenticated
  using (public.can_view_employer(employer_id));

drop policy if exists "Clinics can add jobs" on public.jobs;
create policy "Clinics can add jobs"
  on public.jobs for insert to authenticated
  with check (public.can_edit_employer(employer_id) and status in ('draft', 'in_review'));

drop policy if exists "Clinics can edit their own jobs" on public.jobs;
create policy "Clinics can edit their own jobs"
  on public.jobs for update to authenticated
  using (public.can_edit_employer(employer_id))
  with check (public.can_edit_employer(employer_id));

drop policy if exists "Clinics can delete their drafts" on public.jobs;
create policy "Clinics can delete their drafts"
  on public.jobs for delete to authenticated
  using (
    public.can_edit_employer(employer_id)
    and status in ('draft', 'rejected')
    and posted_at is null
    and not public.job_has_applications(id)
  );

drop policy if exists "Clinics can read their templates" on public.job_templates;
create policy "Clinics can read their templates" on public.job_templates for select to authenticated using (public.can_edit_employer(employer_id));
drop policy if exists "Clinics can add templates" on public.job_templates;
create policy "Clinics can add templates" on public.job_templates for insert to authenticated with check (public.can_edit_employer(employer_id));
drop policy if exists "Clinics can change their templates" on public.job_templates;
create policy "Clinics can change their templates" on public.job_templates for update to authenticated using (public.can_edit_employer(employer_id)) with check (public.can_edit_employer(employer_id));
drop policy if exists "Clinics can delete their templates" on public.job_templates;
create policy "Clinics can delete their templates" on public.job_templates for delete to authenticated using (public.can_edit_employer(employer_id));

drop policy if exists "Clinics can read the numbers for their own jobs" on public.job_daily_stats;
create policy "Clinics can read the numbers for their own jobs"
  on public.job_daily_stats for select to authenticated
  using (exists (select 1 from public.jobs j where j.id = job_id and public.can_view_employer(j.employer_id)));
