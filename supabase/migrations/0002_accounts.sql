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
