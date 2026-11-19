-- 0058: remember who has been told that a clinic they asked about has joined (Steve, 19th November 2026). Safe to run twice.
--
-- The "tell us you would like to work for them" form (0055) promises "if they join Kestrel we will let you know". When a clinic or company gets a
-- public page, the daily job finds the people who asked about it, tells them once, and records it here so nobody is told twice. Still readable
-- and writable only by the website's server (0055 gave visitors and signed in people no access, and nothing here changes that).

alter table public.employer_interest add column if not exists notified_at timestamptz;
alter table public.employer_interest add column if not exists notified_employer_id uuid references public.employers (id) on delete set null;
create index if not exists employer_interest_waiting_idx on public.employer_interest (created_at) where notified_at is null;
