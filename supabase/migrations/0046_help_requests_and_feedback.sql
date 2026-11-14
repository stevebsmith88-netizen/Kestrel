-- 0046: help requests and feedback (Steve, 14th November 2026). Safe to run twice.
--
-- * A clinic that is stuck asks Kestrel for help from its account: it picks a reason, writes a short explanation, and ticks a box that lets
--   Kestrel's team see and change its clinic account (profile, team, invitations, jobs and how many people applied, never resumes, cover
--   letters or private notes) for 7 days, or until the request is closed. Admin, Clinics only works for a clinic with such a request open.
-- * Anyone signed in can send feedback: a bug, an idea for a feature, or something else.
-- Both are emailed to Kestrel's support address and kept here. Read and written only by the website's server.

create table if not exists public.support_requests (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users (id) on delete set null,
  employer_id    uuid references public.employers (id) on delete set null,
  kind           text not null check (kind in ('help', 'bug', 'idea', 'other')),
  reason         text check (reason is null or char_length(reason) <= 60),
  message        text not null check (char_length(message) between 5 and 2000),
  page           text check (page is null or char_length(page) <= 200),
  access_until   timestamptz, -- set only when a clinic ticked the box allowing Kestrel into its account
  access_text    text check (access_text is null or char_length(access_text) <= 600), -- the exact words they agreed to
  status         text not null default 'open' check (status in ('open', 'done')),
  created_at     timestamptz not null default now(),
  closed_at      timestamptz,
  closed_by      uuid references auth.users (id) on delete set null,
  constraint support_access_only_for_help check (access_until is null or (kind = 'help' and employer_id is not null and access_text is not null))
);
create index if not exists support_requests_open_idx on public.support_requests (status, created_at desc);
create index if not exists support_requests_employer_idx on public.support_requests (employer_id, created_at desc);

alter table public.support_requests enable row level security;
revoke all on public.support_requests from anon, authenticated;
