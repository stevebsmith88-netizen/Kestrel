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
