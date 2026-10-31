-- Close sign up until launch, at the database, so it cannot be skipped by calling the sign up service directly.
-- Safe to run more than once.
--  * signup_gate: one row with `open`. While it is false, a new account can only be created with a one time ticket that the
--    website gives out (after checking an invitation code). Existing accounts are not affected.
--  * To open sign up at launch, run:  update public.signup_gate set open = true;
--  * Accounts created by hand in the Supabase dashboard are also refused while it is closed. Open the gate for a moment, or
--    use the invitation link on the site.

create table if not exists public.signup_gate (
  id         boolean primary key default true check (id),
  open       boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.signup_gate (id, open) values (true, false) on conflict (id) do nothing;
alter table public.signup_gate enable row level security;
revoke all on public.signup_gate from anon, authenticated;

create table if not exists public.signup_tickets (
  ticket     uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
alter table public.signup_tickets enable row level security;
revoke all on public.signup_tickets from anon, authenticated;

-- The website asks for a ticket only after it has checked the invitation code. Tickets last 15 minutes and work once.
create or replace function public.issue_signup_ticket()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  t uuid;
begin
  delete from public.signup_tickets where created_at < now() - interval '15 minutes';
  insert into public.signup_tickets default values returning ticket into t;
  return t;
end;
$$;
revoke execute on function public.issue_signup_ticket() from public, anon, authenticated;
grant execute on function public.issue_signup_ticket() to service_role;

create or replace function public.gate_new_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  given text := nullif(new.raw_user_meta_data ->> 'signup_ticket', '');
  used  integer;
begin
  if exists (select 1 from public.signup_gate where open) then
    return new;
  end if;
  if given ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    delete from public.signup_tickets where ticket = given::uuid and created_at > now() - interval '15 minutes';
    get diagnostics used = row_count;
    if used = 1 then
      new.raw_user_meta_data := new.raw_user_meta_data - 'signup_ticket';
      return new;
    end if;
  end if;
  raise exception 'Sign ups are not open yet.';
end;
$$;
revoke execute on function public.gate_new_users() from public, anon, authenticated;

drop trigger if exists gate_new_users on auth.users;
create trigger gate_new_users before insert on auth.users for each row execute function public.gate_new_users();
