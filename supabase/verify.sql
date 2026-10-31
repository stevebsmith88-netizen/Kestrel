-- ======================================================================
-- CHECK: after everything above has run, this lists every part of the
-- database Kestrel needs. Every row should say OK.
-- ======================================================================
select thing, case when present then 'OK' when thing = 'private CV storage' then 'NOT YET (normal: it is created when the first CV is uploaded)' else 'MISSING' end as status
from (
  values
    ('table: waitlist', to_regclass('public.waitlist') is not null),
    ('table: profiles', to_regclass('public.profiles') is not null),
    ('table: employers', to_regclass('public.employers') is not null),
    ('table: employer_contacts', to_regclass('public.employer_contacts') is not null),
    ('table: jobs', to_regclass('public.jobs') is not null),
    ('table: candidate_profiles', to_regclass('public.candidate_profiles') is not null),
    ('table: applications', to_regclass('public.applications') is not null),
    ('table: application_events', to_regclass('public.application_events') is not null),
    ('table: application_notes', to_regclass('public.application_notes') is not null),
    ('table: ad_builder_uses', to_regclass('public.ad_builder_uses') is not null),
    ('table: job_alerts', to_regclass('public.job_alerts') is not null),
    ('table: job_reports', to_regclass('public.job_reports') is not null),
    ('table: email_suppressions (do not email list)', to_regclass('public.email_suppressions') is not null),
    ('table: listing_claims', to_regclass('public.listing_claims') is not null),
    ('table: job_templates', to_regclass('public.job_templates') is not null),
    ('table: cover_letter_templates', to_regclass('public.cover_letter_templates') is not null),
    ('table: application_drafts', to_regclass('public.application_drafts') is not null),
    ('column: candidate application email choice', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'notify_application_updates')),
    ('column: clinic new applicant email choice', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'employer_contacts' and column_name = 'notify_new_applications')),
    ('column: terms agreed record', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'terms_version')),
    ('table: job_versions (copy of live wording)', to_regclass('public.job_versions') is not null),
    ('table: account_deletions', to_regclass('public.account_deletions') is not null),
    ('column: Google sign in account type', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'account_type_confirmed')),
    ('column: job alert frequency', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'job_alerts' and column_name = 'frequency')),
    ('column: clinic confirmed direct hire', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'employers' and column_name = 'direct_hire_confirmed_at')),
    ('column: field based role area', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'jobs' and column_name = 'territory')),
    ('column: extra pay', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'jobs' and column_name = 'pay_extras')),
    ('column: work arrangement', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'jobs' and column_name = 'work_arrangement')),
    ('column: waitlist email confirmed', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'waitlist' and column_name = 'confirmed_at')),
    ('column: unsubscribed date on profiles', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'unsubscribed_at')),
    ('column: unopened reminder on applications', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'applications' and column_name = 'reminded_at')),
    ('private CV storage', exists (select 1 from storage.buckets where id = 'cvs')),
    ('people without a profile (should be 0 problems)', not exists (select 1 from auth.users u where not exists (select 1 from public.profiles p where p.id = u.id)))
) as checks(thing, present)
order by 2, 1;
