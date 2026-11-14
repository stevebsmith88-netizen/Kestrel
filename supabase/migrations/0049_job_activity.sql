-- 0049: a notes log for each job (Steve, 14th November 2026). Safe to run twice.
--
-- 1 row for each thing that happens to a job: sent for review, card saved, approved, charged, card refused and why, card updated, went live,
-- sent back. Kestrel's admin reads it in a drop down under the job. It is for the website's server only: clinics and candidates never read
-- it with their own sign in, and nothing here holds a card number or a Stripe key. The log goes when its job is deleted.

create table if not exists public.job_activity (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references public.jobs (id) on delete cascade,
  actor       text not null default 'system' check (actor in ('system', 'admin', 'clinic')),
  text        text not null,
  detail      text,
  created_at  timestamptz not null default now()
);
create index if not exists job_activity_job_idx on public.job_activity (job_id, created_at);

alter table public.job_activity enable row level security;
revoke all on public.job_activity from anon, authenticated;
