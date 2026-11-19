-- 0057: follow a clinic or company (Steve, 19th November 2026). Safe to run twice.
--
-- A candidate can follow a clinic or supplier that has a public page on Kestrel, and gets an email when it posts a new job (in the same daily
-- email as their job alerts, never more than 1 email a day). `last_sent_at` starts when they follow, so they hear only about jobs posted after
-- that. Only the website's server reads and writes this table: visitors, other candidates and the clinics themselves have no access, so a
-- clinic cannot see who follows it. Follows go when the candidate's account or the clinic is deleted, and are in the candidate's data download.

create table if not exists public.employer_follows (
  user_id      uuid not null references auth.users (id) on delete cascade,
  employer_id  uuid not null references public.employers (id) on delete cascade,
  created_at   timestamptz not null default now(),
  last_sent_at timestamptz not null default now(),
  primary key (user_id, employer_id)
);
create index if not exists employer_follows_employer_idx on public.employer_follows (employer_id);
create index if not exists employer_follows_due_idx on public.employer_follows (last_sent_at);
alter table public.employer_follows enable row level security;
revoke all on public.employer_follows from anon, authenticated;
