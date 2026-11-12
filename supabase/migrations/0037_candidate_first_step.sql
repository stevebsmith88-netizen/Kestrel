-- 0037: the first step after a candidate signs in for the first time (Steve, 12th November 2026).
--   * career_stage: an optional, private answer to "where are you in eye care". Plain facts only: working in eye care now, studying or
--     training for eye care, or not working in eye care yet. It is never shown to a clinic, never used to rank or filter jobs, and never
--     a gate. Whether a clinic may ever see it is a question for the lawyer (it could hint at protected grounds).
--   * start_seen_at: when the candidate was shown the first step page (they answered it or chose Skip), so they are only sent there once.
-- Nothing else changes. Existing profiles are untouched: career_stage stays empty. A candidate who already has a role is never sent to the first
-- step page. One with no role yet is sent there once. Until this SQL has been run the site simply skips the page. Safe to run more than once.

alter table public.candidate_profiles
  add column if not exists career_stage  text check (career_stage is null or career_stage in ('working', 'studying', 'not_yet')),
  add column if not exists start_seen_at timestamptz;

-- The candidate saves these through their own sign in, so they need permission on the new columns, as for the other profile columns.
grant insert (career_stage, start_seen_at) on public.candidate_profiles to authenticated;
grant update (career_stage, start_seen_at) on public.candidate_profiles to authenticated;
