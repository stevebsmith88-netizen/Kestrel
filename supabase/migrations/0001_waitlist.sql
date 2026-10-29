-- Kestrel launch waitlist.
-- Rows are written only by the server (app/api/waitlist/route.ts) using the
-- service role key. Row level security is on with no public policies, so the
-- public anon key can neither read nor write this table.

create table if not exists public.waitlist (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  audience      text not null check (audience in ('clinic', 'candidate')),
  first_name    text not null,
  last_name     text,
  email         text not null unique, -- always stored in lower case
  clinic_name   text,
  role          text,
  province      text not null,
  consent       boolean not null check (consent = true),
  consent_text  text not null,
  consent_at    timestamptz not null default now(),
  source        text not null default 'eyecarejobs.ca waitlist',
  unsubscribed_at timestamptz
);

-- One sign up per email address; a repeat sign up updates the existing row.
alter table public.waitlist enable row level security;
