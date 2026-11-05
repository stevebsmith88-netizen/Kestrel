-- Sign in guard (audit R22). Counts failed sign in attempts per email and per visitor, so that after 5 failures in
-- 15 minutes the sign in form asks for the bot check. Only the website's server reads or writes this table.
-- The keys are one way scrambled (hashed) values, never a plain email address or visitor address.
-- Safe to run more than once.

create table if not exists public.sign_in_attempts (
  key                text primary key,
  failures           integer not null default 0,
  window_started_at  timestamptz not null default now()
);

alter table public.sign_in_attempts enable row level security;
revoke all on public.sign_in_attempts from anon, authenticated;
-- No policies on purpose: the browser can never read or change this table.
