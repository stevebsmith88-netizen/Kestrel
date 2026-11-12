-- 0041: every sign up made with an email address needs Kestrel's ticket, even once sign up is open (audit P1-03, Phase E, 12th November 2026).
-- Anyone can send a sign up straight to Supabase with the public browser key. Kestrel's website only issues a one time ticket after the
-- bot check, the "I agree to the terms" tick and, for a clinic, the invitation code. Before this, the ticket was only needed while the
-- gate was closed, so the day it opened a script could skip all 3. Now:
--   * a sign up with an email address (or any kind other than Google) needs a ticket, whether the gate is open or closed;
--   * a Google sign up needs no ticket once the gate is open, but any role it sends is removed, so the person lands on the welcome page,
--     which asks for the terms and, for a clinic, the invitation code (lib/auth-actions.ts, chooseAccountType);
--   * while the gate is closed, nothing gets in without a ticket, as before.
-- Adding a user by hand in Supabase's dashboard is refused too: make accounts through the website. To add one by SQL, include
-- 'signup_ticket', public.issue_signup_ticket() in raw_user_meta_data (supabase/demo/seed.sql does this).
-- Nobody's account is changed. Safe to run more than once. The access tests are in scripts/dev/rls-tests.sql (P1-03).

create or replace function public.gate_new_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  given    text := nullif(new.raw_user_meta_data ->> 'signup_ticket', '');
  provider text := coalesce(nullif(new.raw_app_meta_data ->> 'provider', ''), 'email');
  used     integer := 0;
begin
  if given ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    delete from public.signup_tickets where ticket = given::uuid and created_at > now() - interval '15 minutes';
    get diagnostics used = row_count;
  end if;
  if used = 1 then
    new.raw_user_meta_data := new.raw_user_meta_data - 'signup_ticket';
    return new;
  end if;
  if not exists (select 1 from public.signup_gate where open) then
    raise exception 'Sign ups are not open yet.';
  end if;
  if provider = 'google' then
    -- No ticket, so nothing the sign up says about itself is trusted: the person chooses on the welcome page.
    new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb) - 'role' - 'signup_ticket' - 'terms_version' - 'marketing_consent' - 'marketing_consent_text';
    return new;
  end if;
  raise exception 'Please sign up on the Kestrel website.';
end;
$$;
revoke execute on function public.gate_new_users() from public, anon, authenticated;

drop trigger if exists gate_new_users on auth.users;
create trigger gate_new_users before insert on auth.users for each row execute function public.gate_new_users();
