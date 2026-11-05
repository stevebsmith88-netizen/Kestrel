-- The clinic outreach sequence: 4 emails over about 5 weeks to a clinic address found by the province search
-- (clinic_leads). Steve adds clinics in batches on the admin Outreach page, which is his approval of each send list.
-- The daily job sends what is due, only while ENABLE_OUTREACH is "yes". Private: only the server can read or write.
-- Safe to run more than once.

create table if not exists public.outreach_contacts (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid references public.clinic_leads (id) on delete set null,
  email         text not null check (char_length(email) between 3 and 254), -- always lower case
  clinic_name   text not null check (char_length(clinic_name) between 1 and 160),
  -- The CASL record of implied consent: where the address was published and when we found it.
  email_source_url text not null check (char_length(email_source_url) <= 500),
  email_found_at   timestamptz not null,
  steps_sent    integer not null default 0 check (steps_sent between 0 and 4),
  status        text not null default 'active' check (status in ('active', 'stopped', 'finished')),
  stop_reason   text check (stop_reason is null or stop_reason in ('unsubscribed', 'replied', 'joined', 'claimed', 'bounced', 'manual')),
  next_due_at   timestamptz,
  last_sent_at  timestamptz,
  approved_by   uuid references auth.users (id) on delete set null,
  approved_at   timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index if not exists outreach_contacts_email_idx on public.outreach_contacts (email);
create index if not exists outreach_contacts_due_idx on public.outreach_contacts (status, next_due_at);
alter table public.outreach_contacts enable row level security;
revoke all on public.outreach_contacts from anon, authenticated;

-- One row per email sent, kept as the record of what went to whom and when.
create table if not exists public.outreach_sends (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid not null references public.outreach_contacts (id) on delete cascade,
  step        integer not null check (step between 1 and 4),
  subject     text not null,
  sent_at     timestamptz not null default now()
);
create index if not exists outreach_sends_contact_idx on public.outreach_sends (contact_id, sent_at);
alter table public.outreach_sends enable row level security;
revoke all on public.outreach_sends from anon, authenticated;
