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
