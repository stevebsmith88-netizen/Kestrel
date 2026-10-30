-- The do not email list. When someone unsubscribes, or asks us to stop, their address goes here
-- and no marketing or outreach email is ever sent to it again, however many jobs they post later.
-- An entry is either a full address (name@clinic.ca) or a whole domain (@clinic.ca).
-- Written by the server only. Safe to run more than once.

create table if not exists public.email_suppressions (
  id         uuid primary key default gen_random_uuid(),
  address    text not null unique check (address = lower(address) and char_length(address) between 3 and 254),
  reason     text not null check (reason in ('unsubscribed', 'asked_to_stop', 'bounced', 'complaint', 'admin')),
  source     text check (source is null or char_length(source) <= 200),
  created_at timestamptz not null default now()
);

alter table public.email_suppressions enable row level security;

drop policy if exists "Admins can read the do not email list" on public.email_suppressions;
create policy "Admins can read the do not email list"
  on public.email_suppressions for select to authenticated
  using (public.is_admin());

revoke all on public.email_suppressions from anon, authenticated;
grant select on public.email_suppressions to authenticated;
