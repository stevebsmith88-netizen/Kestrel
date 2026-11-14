-- 0048: job payments (Steve, 14th November 2026; step 3 of docs/plans/stripe-plan.md). Safe to run twice.
--
-- When a clinic sends a job for review (after the free launch) it saves a card with Stripe. Nothing is charged then. The card is charged
-- when Kestrel approves the job, for the price of the role. 1 row here follows each job through that: awaiting_card, card_saved, charged,
-- or failed (the card was refused at approval), cancelled (the job was not approved, so nothing was charged) or free_launch (no card).
--
-- Only the website's server writes to these tables. A clinic can read the status of its own payments, never the Stripe ids.
-- Rows are kept when a job or clinic is deleted, because Kestrel must keep its sales records for tax, so the job and the clinic are
-- linked loosely and their names are copied in.

create table if not exists public.job_payments (
  id                          uuid primary key default gen_random_uuid(),
  job_id                      uuid references public.jobs (id) on delete set null,
  employer_id                 uuid references public.employers (id) on delete set null,
  job_title                   text not null,
  clinic_name                 text not null,
  band                        text not null check (band in ('support', 'opticians', 'optometrists')),
  amount_cents                integer not null check (amount_cents >= 0),
  currency                    text not null default 'cad' check (currency = 'cad'),
  status                      text not null check (status in ('awaiting_card', 'card_saved', 'charged', 'failed', 'cancelled', 'free_launch')),
  stripe_checkout_session_id  text unique,
  stripe_payment_method_id    text,
  stripe_payment_intent_id    text,
  failure_message             text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  charged_at                  timestamptz
);

-- A job can have only 1 payment in play at a time, so the card cannot be charged twice for the same job.
create unique index if not exists job_payments_one_active_idx
  on public.job_payments (job_id)
  where status in ('awaiting_card', 'card_saved', 'charged', 'free_launch');
create index if not exists job_payments_employer_idx on public.job_payments (employer_id, created_at desc);

alter table public.job_payments enable row level security;
drop policy if exists "Clinics can read the status of their own payments" on public.job_payments;
create policy "Clinics can read the status of their own payments"
  on public.job_payments for select
  to authenticated
  using (public.can_view_employer(employer_id));

-- Everything is closed to visitors and to signed in people except reading these columns, which hold no Stripe ids.
revoke all on public.job_payments from anon, authenticated;
grant select (id, job_id, employer_id, job_title, clinic_name, band, amount_cents, currency, status, created_at, charged_at)
  on public.job_payments to authenticated;

-- Which Stripe customer is a clinic, so the same clinic is not made a new customer for every post. For the server only.
create table if not exists public.employer_billing (
  employer_id         uuid primary key references public.employers (id) on delete cascade,
  stripe_customer_id  text not null unique,
  created_at          timestamptz not null default now()
);
alter table public.employer_billing enable row level security;
revoke all on public.employer_billing from anon, authenticated;
