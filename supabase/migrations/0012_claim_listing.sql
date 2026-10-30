-- Claim your listing. A clinic whose job we found on its own website can claim it. Safe to run more than once.

-- 1. A listing we found has no owner until someone claims it.
alter table public.employers alter column owner_id drop not null;

-- 2. Claims. Written by the server only. A person can read their own, and admins can read all.
create table if not exists public.listing_claims (
  id               uuid primary key default gen_random_uuid(),
  employer_id      uuid not null references public.employers (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  claimant_name    text not null default '' check (char_length(claimant_name) <= 120),
  claimant_email   text not null check (char_length(claimant_email) <= 254),
  role_at_clinic   text not null check (role_at_clinic in ('Owner', 'Practice manager', 'Hiring manager', 'Other')),
  -- email: confirmed by a link sent to an address at the clinic's own website. manual: checked by a person.
  method           text not null check (method in ('email', 'manual')),
  note             text check (note is null or char_length(note) <= 1000),
  status           text not null default 'pending_email' check (status in ('pending_email', 'pending_review', 'approved', 'rejected', 'expired')),
  token_hash       text,
  token_expires_at timestamptz,
  decision_note    text check (decision_note is null or char_length(decision_note) <= 1000),
  created_at       timestamptz not null default now(),
  verified_at      timestamptz,
  decided_at       timestamptz
);

create index if not exists listing_claims_status_idx on public.listing_claims (status, created_at);
create index if not exists listing_claims_user_idx on public.listing_claims (user_id, created_at);
-- One open claim per person per clinic.
create unique index if not exists listing_claims_open_idx on public.listing_claims (employer_id, user_id) where status in ('pending_email', 'pending_review');

alter table public.listing_claims enable row level security;

drop policy if exists "People can read their own claims" on public.listing_claims;
create policy "People can read their own claims"
  on public.listing_claims for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Admins can read every claim" on public.listing_claims;
create policy "Admins can read every claim"
  on public.listing_claims for select to authenticated
  using (public.is_admin());

revoke all on public.listing_claims from anon, authenticated;
grant select (id, employer_id, user_id, claimant_name, claimant_email, role_at_clinic, method, note, status, decision_note, created_at, verified_at, decided_at)
  on public.listing_claims to authenticated;
