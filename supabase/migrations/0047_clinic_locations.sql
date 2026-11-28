-- 0047: several locations under 1 owner (Steve, 14th November 2026; phase B of docs/plans/locations-and-team-design.md). Safe to run twice.
--
-- Each location is its own clinic row (its own name, town, public page, jobs and team), and 1 person can now own several. Team members are
-- invited to the locations the owner ticks, and someone can be on more than 1 location's team. Nothing about access changes: every rule
-- still asks about 1 location at a time (can_view_employer, can_edit_employer, migration 0045).

-- 1 person, several locations.
drop index if exists public.employers_owner_idx;
create index if not exists employers_owner_lookup_idx on public.employers (owner_id);

-- A person can be on several locations' teams.
drop index if exists public.employer_members_one_clinic_idx;
create index if not exists employer_members_user_idx on public.employer_members (user_id);

-- An invitation can cover several of the owner's locations at once (the first is employer_id).
alter table public.employer_invites add column if not exists also_employer_ids uuid[] not null default '{}';

-- Up to 5 people a location, and nobody is a team member of a location they own. Owning another location, or another clinic, is fine now.
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
  if exists (select 1 from public.employers where id = new.employer_id and owner_id = new.user_id) then
    raise exception 'This person already owns this clinic.';
  end if;
  return new;
end;
$$;

create or replace function public.owner_not_a_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_id is not null and exists (select 1 from public.employer_members where employer_id = new.id and user_id = new.owner_id) then
    raise exception 'This person is on this clinic''s team, so they cannot also own it.';
  end if;
  return new;
end;
$$;

-- At most 25 locations an owner (a larger group asks Kestrel).
create or replace function public.limit_locations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_id is not null and (select count(*) from public.employers where owner_id = new.owner_id) >= 25 then
    raise exception 'An account can hold up to 25 locations. Please email support@eyecarejobs.ca to add more.';
  end if;
  return new;
end;
$$;
revoke execute on function public.limit_locations() from public, anon, authenticated;
drop trigger if exists employers_limit_locations on public.employers;
create trigger employers_limit_locations before insert on public.employers for each row execute function public.limit_locations();
