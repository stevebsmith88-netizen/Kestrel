-- 0033: a record of which first week emails each account has been sent (marketing audit item 14), so none is sent twice.
-- Written only by the server with the service role key. Row level security is on with no public policies. Safe to run more than once.
-- Run it on BOTH databases (live and demo). The emails stay off until ENABLE_ONBOARDING_EMAILS is "yes" in Vercel.

create table if not exists public.onboarding_emails (
  user_id uuid not null references auth.users (id) on delete cascade,
  step    text not null check (char_length(step) <= 40),
  sent_at timestamptz not null default now(),
  primary key (user_id, step)
);

alter table public.onboarding_emails enable row level security;
