-- Email preferences people can change themselves on their Account page. Safe to run more than once.
--  * Candidates can turn off emails about their applications.
--  * Clinics can turn off new applicant emails and the reminders about unopened applications.
-- Emails about security (password resets, email changes) and about an account (a job taken down) are always sent.

alter table public.profiles add column if not exists notify_application_updates boolean not null default true;
alter table public.employer_contacts add column if not exists notify_new_applications boolean not null default true;
alter table public.employer_contacts add column if not exists notify_reminders boolean not null default true;
