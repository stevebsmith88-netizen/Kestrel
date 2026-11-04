-- Found listings: jobs Kestrel lists from a clinic's own careers page (the seeding tool at /admin/found). Safe to run more than once.
--  1. page_reads: a record of every careers page the tool read (when, by whom, the address, what it found), so we can always
--     show where and when a listing was found. The page's wording is never stored. Only a set of numbers is kept, used to
--     check that our summary does not copy the clinic's wording, and the daily job clears it after 30 days.
--     Private: only the server can read or write it.
--  2. jobs.found_at and jobs.found_read_id: when, and from which reading, a found listing came.
--  3. A found listing may leave "existing vacancy" and "uses AI to screen" empty. The job page shows "Not stated by the clinic",
--     because Kestrel never states a fact the clinic has not. Posts written by clinics still need both answers (the website
--     checks this on every clinic post). Pay is still required for every live job, so only roles whose page shows pay are listed.
--  4. A found listing is live for 21 days at most.

-- 1. what the tool read
create table if not exists public.page_reads (
  id          uuid primary key default gen_random_uuid(),
  read_by     uuid references auth.users (id) on delete set null,
  url         text not null check (char_length(url) <= 600),
  final_url   text check (final_url is null or char_length(final_url) <= 600),
  page_title  text check (page_title is null or char_length(page_title) <= 200),
  outcome     text not null check (outcome in ('read', 'refused', 'failed')),
  reason      text check (reason is null or char_length(reason) <= 400),
  jobs_found  integer not null default 0,
  facts       jsonb,
  fingerprint integer[],
  read_at     timestamptz not null default now()
);
create index if not exists page_reads_by_idx on public.page_reads (read_by, read_at desc);
alter table public.page_reads enable row level security;
revoke all on public.page_reads from anon, authenticated;

-- 2. where a found listing came from
alter table public.jobs add column if not exists found_at timestamptz;
alter table public.jobs add column if not exists found_read_id uuid references public.page_reads (id) on delete set null;

-- 3. found listings may leave the 2 questions unanswered
alter table public.jobs drop constraint if exists jobs_complete_unless_draft;
alter table public.jobs add constraint jobs_complete_unless_draft check (
  status in ('draft', 'rejected')
  or (status = 'closed' and posted_at is not null)
  or (
    role_category is not null and employment_type is not null
    and province is not null and city is not null
    and pay_period is not null and pay_min is not null and pay_max is not null
    and pay_max >= pay_min
    and (is_seeded or (is_existing_vacancy is not null and uses_ai_screening is not null))
    and description is not null and char_length(description) >= 50
    and (apply_method = 'kestrel' or apply_url is not null)
    and (
      (case when pay_period = 'hour' then 2080 else 1 end) * (pay_max - pay_min) <= 50000
      or (case when pay_period = 'hour' then 2080 else 1 end) * pay_max > 200000
    )
  )
);

-- 4. 21 days at most. "not valid" leaves any older test rows alone, and still checks every new or changed row.
alter table public.jobs drop constraint if exists jobs_found_listing_21_days;
alter table public.jobs add constraint jobs_found_listing_21_days check (
  not is_seeded or posted_at is null or expires_at is null or expires_at <= posted_at + interval '21 days'
) not valid;
