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
