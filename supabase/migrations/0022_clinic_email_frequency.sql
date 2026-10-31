-- How often a clinic is emailed about new applicants. Safe to run more than once.
--  each      one email for every application (what happens today)
--  few_days  one summary email every 2 to 3 days (recommended)
--  weekly    one summary email a week
--  off       no emails, the clinic checks its dashboard

alter table public.employer_contacts add column if not exists notify_frequency text not null default 'each';
alter table public.employer_contacts add column if not exists last_digest_at timestamptz;

alter table public.employer_contacts drop constraint if exists employer_contacts_notify_frequency_check;
alter table public.employer_contacts add constraint employer_contacts_notify_frequency_check check (notify_frequency in ('each', 'few_days', 'weekly', 'off'));

-- Clinics that had already turned new applicant emails off stay off.
update public.employer_contacts set notify_frequency = 'off' where notify_new_applications = false and notify_frequency = 'each';
