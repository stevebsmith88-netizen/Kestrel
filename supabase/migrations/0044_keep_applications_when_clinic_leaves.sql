-- 0044: a candidate keeps their own record of an application when the clinic deletes its account or the job (post audit review X-01,
-- the paralegal's first point; Steve, 13th November 2026). Safe to run twice.
--
-- Before: deleting a clinic's account deleted its jobs, and with them every application to those jobs, so they vanished from the
-- candidates' lists too.
-- From here, when a job is deleted (on its own, or because the clinic's account is deleted):
--   * each application to it is kept, with its own copy of the job title, clinic name and place, and is no longer linked to a job, so the
--     clinic cannot see it any more;
--   * clinic_left_at records when, for the 2 year retention period (lib/retention.ts deletes it 2 years later);
--   * the clinic's private note on it is deleted (it belonged to the clinic);
--   * a line "clinic left" is added to its history, and a candidate whose application was still open gets an inbox message.
-- A candidate who deletes their own account still deletes their applications, as before.

alter table public.applications alter column job_id drop not null;
alter table public.applications drop constraint if exists applications_job_id_fkey;
alter table public.applications add constraint applications_job_id_fkey foreign key (job_id) references public.jobs (id) on delete set null;
alter table public.applications add column if not exists clinic_left_at timestamptz;

create or replace function public.keep_applications_when_job_goes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.application_notes n using public.applications a where n.application_id = a.id and a.job_id = old.id;
  insert into public.application_events (application_id, status, note)
    select a.id, 'clinic_left', null from public.applications a where a.job_id = old.id and a.clinic_left_at is null;
  insert into public.notifications (user_id, kind, title, body, href)
    select a.candidate_id, 'clinic_left',
           left(a.clinic_name || ' has left Kestrel', 160),
           left('Your application for ' || a.job_title || ' is kept in My applications, marked closed. The clinic can no longer see it.', 500),
           '/candidate/applications/' || a.id
    from public.applications a
    where a.job_id = old.id and a.clinic_left_at is null and a.status not in ('withdrawn', 'not_selected', 'role_filled', 'no_update');
  update public.applications set clinic_left_at = now(), updated_at = now() where job_id = old.id and clinic_left_at is null;
  return old;
end;
$$;
revoke execute on function public.keep_applications_when_job_goes() from public, anon, authenticated;

drop trigger if exists jobs_keep_applications on public.jobs;
create trigger jobs_keep_applications before delete on public.jobs for each row execute function public.keep_applications_when_job_goes();
