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
