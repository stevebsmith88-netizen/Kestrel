-- Clinics can extend a job by 30 days near the end of its run (or within 7 days of it ending), and tell us
-- how they filled a role when they close it. Both are written on the server after the clinic is checked,
-- so clinics are not given any new rights over these columns. Safe to run more than once.

alter table public.jobs add column if not exists extended_count integer not null default 0;
alter table public.jobs add column if not exists last_extended_at timestamptz;
alter table public.jobs add column if not exists filled_at timestamptz;
alter table public.jobs add column if not exists filled_via text;
alter table public.jobs add column if not exists filled_via_other text;

alter table public.jobs drop constraint if exists jobs_filled_via_check;
alter table public.jobs add constraint jobs_filled_via_check check (filled_via is null or filled_via in (
  'kestrel', 'indeed', 'linkedin', 'word_of_mouth', 'own_website', 'other'));

alter table public.jobs drop constraint if exists jobs_filled_via_other_length;
alter table public.jobs add constraint jobs_filled_via_other_length check (filled_via_other is null or char_length(filled_via_other) <= 200);
