-- Jobs that an admin posted on a clinic's behalf (for example when a clinic is having trouble with the form).
-- Records who did it and when, so the record is clear. Safe to run more than once.

alter table public.jobs add column if not exists posted_by_admin_id uuid references auth.users (id) on delete set null;
alter table public.jobs add column if not exists posted_by_admin_at timestamptz;
