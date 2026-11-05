-- Clinic leads: clinics that appear to be hiring, found by the province search (Admin, Found listings). Safe to run more than once.
-- A lead is a note about a clinic, not a listing. Nothing here is public, and nothing is sent to anyone from it.
--  * One lead per clinic website. Saving again updates it.
--  * contact_email is only kept with the page it was published on (email_source_url) and the date, which is the record
--    CASL asks for before any outreach. Outreach stays off until the disclosure conversation has happened.
--  * Private: only the server can read or write it.

create table if not exists public.clinic_leads (
  id               uuid primary key default gen_random_uuid(),
  added_by         uuid references auth.users (id) on delete set null,
  clinic_name      text not null check (char_length(clinic_name) between 1 and 160),
  website          text not null check (char_length(website) <= 300),
  website_key      text not null check (char_length(website_key) between 3 and 253),
  city             text check (city is null or char_length(city) <= 80),
  province         text not null,
  practice_type    text check (practice_type is null or practice_type in ('independent', 'corporate', 'supplier')),
  careers_url      text check (careers_url is null or char_length(careers_url) <= 500),
  job_title        text check (job_title is null or char_length(job_title) <= 120),
  role_category    text check (role_category is null or char_length(role_category) <= 80),
  posted_text      text check (posted_text is null or char_length(posted_text) <= 60),
  pay_as_written   text check (pay_as_written is null or char_length(pay_as_written) <= 120),
  source_url       text check (source_url is null or char_length(source_url) <= 500),
  source_kind      text check (source_kind is null or source_kind in ('own_site', 'hiring_system', 'job_board')),
  contact_email    text check (contact_email is null or char_length(contact_email) <= 254),
  email_source_url text check (email_source_url is null or char_length(email_source_url) <= 500),
  email_found_at   timestamptz,
  note             text check (note is null or char_length(note) <= 300),
  status           text not null default 'new' check (status in ('new', 'listed', 'skipped')),
  found_at         timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- An email is never kept without where and when it was found.
  constraint clinic_leads_email_has_source check (contact_email is null or (email_source_url is not null and email_found_at is not null))
);
create unique index if not exists clinic_leads_website_idx on public.clinic_leads (website_key);
create index if not exists clinic_leads_province_idx on public.clinic_leads (province, found_at desc);
alter table public.clinic_leads enable row level security;
revoke all on public.clinic_leads from anon, authenticated;
