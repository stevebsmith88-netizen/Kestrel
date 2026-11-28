-- 0051: passes (Steve, 14th November 2026; step 4 of docs/plans/stripe-plan.md). Safe to run twice.
--
-- A pass belongs to 1 clinic location (migration 0047: 1 pass, 1 location). While it is active, a job for a role it covers goes straight to
-- review with no card page, and nothing is charged for it at approval. A clinic reads the plan, status and renewal date of its own pass,
-- never the Stripe ids. Only the website's server writes here (the Stripe webhook and the return page keep it in step with Stripe).

create table if not exists public.location_passes (
  id                          uuid primary key default gen_random_uuid(),
  employer_id                 uuid not null references public.employers (id) on delete cascade,
  plan                        text not null check (plan in ('clinic_pass', 'clinic_pass_plus')),
  billing_interval            text not null default 'month' check (billing_interval in ('month', 'year')),
  status                      text not null check (status in ('incomplete', 'active', 'past_due', 'canceled')),
  stripe_checkout_session_id  text unique,
  stripe_subscription_id      text unique,
  stripe_payment_method_id    text,
  current_period_end          timestamptz,
  cancel_at_period_end        boolean not null default false,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  canceled_at                 timestamptz
);

-- A location has only 1 pass that is live or overdue. An abandoned checkout (incomplete) never blocks a new one.
create unique index if not exists location_passes_one_live_idx on public.location_passes (employer_id) where status in ('active', 'past_due');
create index if not exists location_passes_employer_idx on public.location_passes (employer_id, created_at desc);

alter table public.location_passes enable row level security;
drop policy if exists "Clinics can read their own pass" on public.location_passes;
create policy "Clinics can read their own pass"
  on public.location_passes for select
  to authenticated
  using (public.can_view_employer(employer_id));

revoke all on public.location_passes from anon, authenticated;
grant select (id, employer_id, plan, billing_interval, status, current_period_end, cancel_at_period_end, created_at, canceled_at)
  on public.location_passes to authenticated;

-- A job covered by a pass leaves a payment record too (for the sales page and the Billing page), at no charge.
alter table public.job_payments drop constraint if exists job_payments_status_check;
alter table public.job_payments
  add constraint job_payments_status_check
  check (status in ('awaiting_card', 'card_saved', 'charged', 'failed', 'cancelled', 'free_launch', 'covered_by_pass'));

drop index if exists public.job_payments_one_active_idx;
create unique index if not exists job_payments_one_active_idx
  on public.job_payments (job_id)
  where status in ('awaiting_card', 'card_saved', 'charged', 'free_launch', 'covered_by_pass');
