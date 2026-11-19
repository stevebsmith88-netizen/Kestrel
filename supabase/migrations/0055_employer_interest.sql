-- 0055: "Tell us you would like to work for them" (Steve, 19th November 2026). Safe to run twice.
--
-- A candidate who looks for a clinic or company that is not on Kestrel yet can say they would like to work for it. Kestrel keeps the clinic's
-- name, town and website (if the candidate knows it), with who asked, so Admin can see how many people are asking about each. Nothing is sent
-- to the clinic now. When clinic outreach is switched on, a clinic that is asked about can be sent 1 short email to its published business
-- address, with no candidate's name or details in it. Only the website's server reads and writes this table (visitors and signed in people
-- have no access), and the candidate's own rows are in their data download and are deleted with their account.

create table if not exists public.employer_interest (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  candidate_id  uuid not null references auth.users (id) on delete cascade,
  clinic_name   text not null check (char_length(clinic_name) between 2 and 120),
  town          text check (town is null or char_length(town) <= 80),
  province      text check (province is null or char_length(province) <= 40),
  website       text check (website is null or char_length(website) <= 200),
  name_key      text not null check (char_length(name_key) <= 220),
  unique (candidate_id, name_key)
);
create index if not exists employer_interest_name_key_idx on public.employer_interest (name_key);
alter table public.employer_interest enable row level security;
revoke all on public.employer_interest from anon, authenticated;
