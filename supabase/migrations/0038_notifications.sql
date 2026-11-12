-- 0038: the in account inbox (Steve, 12th November 2026).
--   * notifications: a short message to one person about something that happened on their account, for example an application moved to a new
--     step, a new applicant, or a job approved. One way only: Kestrel tells people things, and nobody replies to anybody in it.
--   * Only the website's server writes them (there is no insert permission for signed in people). A person can read their own, and can set
--     read_at on their own (to mark them read). Nobody can read anyone else's.
--   * Nothing else changes. Safe to run more than once.

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (char_length(kind) <= 40),
  title      text not null check (char_length(title) <= 160),
  body       text check (body is null or char_length(body) <= 500),
  href       text check (href is null or (href like '/%' and char_length(href) <= 200)),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "People can read their own notifications" on public.notifications;
create policy "People can read their own notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "People can mark their own notifications read" on public.notifications;
create policy "People can mark their own notifications read"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
