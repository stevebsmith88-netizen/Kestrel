-- 0036: "Hired" (Steve, 10th November 2026).
--   * A clinic that fills a job through Kestrel can say which applicant it hired. That application moves to a new final step, "hired", and the
--     candidate is told. The job remembers which application it was, so Kestrel can count hires made through the site.
--   * Nothing else changes. Existing applications and jobs are untouched and still valid.
-- Safe to run more than once.

alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check check (status in (
  'applied', 'viewed', 'shortlisted', 'interview', 'offer', 'hired',
  'not_selected', 'role_filled', 'kept', 'no_update', 'withdrawn'));

-- Set by the website's server when the clinic names the person it hired. Clinics cannot write it themselves (there is no column
-- permission for it), and if the application is ever deleted the job simply forgets it.
alter table public.jobs add column if not exists filled_application_id uuid references public.applications (id) on delete set null;
