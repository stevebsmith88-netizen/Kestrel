-- 0031: what a candidate is looking for, for the "Recommended for you" list on their home page.
-- The list is worked out by rules in the website code (no AI). These columns only hold the candidate's own choices, and row level security
-- keeps them private to the candidate (the existing candidate_profiles policies already cover new columns).
-- Safe to run more than once.

alter table public.candidate_profiles
  add column if not exists home_city            text check (home_city is null or char_length(home_city) <= 80),
  add column if not exists home_province        text check (home_province is null or char_length(home_province) <= 40),
  add column if not exists pref_radius_km       integer not null default 25 check (pref_radius_km in (10, 25, 50)),
  add column if not exists pref_provinces       text[] not null default '{}',
  add column if not exists pref_employment_types text[] not null default '{}',
  add column if not exists pref_other_roles     text[] not null default '{}',
  add column if not exists pref_min_pay         numeric(10, 2) check (pref_min_pay is null or pref_min_pay > 0),
  add column if not exists pref_pay_period      text check (pref_pay_period is null or pref_pay_period in ('hour', 'year')),
  add column if not exists pref_practice        text check (pref_practice is null or pref_practice in ('independent', 'corporate'));

-- Jobs a candidate has said they are not interested in, so they stop appearing in their recommendations.
create table if not exists public.candidate_job_hides (
  user_id    uuid not null references auth.users (id) on delete cascade,
  job_id     uuid not null references public.jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

alter table public.candidate_job_hides enable row level security;

drop policy if exists "Candidates can read their own hidden jobs" on public.candidate_job_hides;
create policy "Candidates can read their own hidden jobs"
  on public.candidate_job_hides for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Candidates can hide a job for themselves" on public.candidate_job_hides;
create policy "Candidates can hide a job for themselves"
  on public.candidate_job_hides for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Candidates can bring back a hidden job" on public.candidate_job_hides;
create policy "Candidates can bring back a hidden job"
  on public.candidate_job_hides for delete to authenticated
  using ((select auth.uid()) = user_id);
