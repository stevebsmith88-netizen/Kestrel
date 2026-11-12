-- Development only. The access tests from audit part 1 (area B), kept so they can be run again. Run with: bash scripts/dev/rls-tests.sh
-- It seeds 2 candidates (Ann, Bo), 2 clinics (C, D) and an admin, then tries things as each of them, as a visitor and as the website's server,
-- and writes one row per test into t.results. Every attempt is undone straight away, so the tests do not disturb one another.
-- Never run this on the live or demo database: it opens the sign up gate and adds made up people.

drop schema if exists t cascade;
create schema t;
create table t.people (name text primary key, id uuid not null);
create table t.results (n serial primary key, finding text, label text, want text, got text, detail text, pass boolean);

-- ---------------------------------------------------------------- the made up people and their records

update public.signup_gate set open = true;
delete from auth.users where email like '%@rls.test';

insert into t.people values
  ('ann', gen_random_uuid()), ('bo', gen_random_uuid()), ('clinic_c', gen_random_uuid()), ('clinic_d', gen_random_uuid()), ('admin', gen_random_uuid());

insert into auth.users (id, email, raw_user_meta_data)
select id, name || '@rls.test',
       jsonb_build_object('role', case when name like 'clinic%' then 'clinic' else 'candidate' end, 'first_name', initcap(name), 'last_name', 'Test')
from t.people;
update public.profiles set role = 'admin' where id = (select id from t.people where name = 'admin');
-- Ann changed her name a moment ago, so her 30 day hold is on.
update public.profiles set name_changed_at = now() where id = (select id from t.people where name = 'ann');

create table t.things (name text primary key, id uuid not null default gen_random_uuid());
insert into t.things (name) values ('employer_c'), ('employer_d'), ('job_c_live'), ('job_c_draft'), ('job_d_live'), ('app_ann_c');

insert into public.employers (id, owner_id, clinic_name, practice_type, province, city)
values ((select id from t.things where name = 'employer_c'), (select id from t.people where name = 'clinic_c'), 'Clinic C', 'independent', 'Ontario', 'Guelph'),
       ((select id from t.things where name = 'employer_d'), (select id from t.people where name = 'clinic_d'), 'Clinic D', 'independent', 'Alberta', 'Red Deer');
insert into public.employer_contacts (employer_id, notify_email)
values ((select id from t.things where name = 'employer_c'), 'c@rls.test'), ((select id from t.things where name = 'employer_d'), 'd@rls.test');

insert into public.jobs (id, employer_id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening, description, status, posted_at, expires_at, review_note)
values
  ((select id from t.things where name = 'job_c_live'), (select id from t.things where name = 'employer_c'), 'Optician', 'Optician', 'Full time', 'Ontario', 'Guelph', 'year', 50000, 60000, true, false,
   'A made up job used only by the access tests in scripts/dev.', 'live', now(), now() + interval '20 days', 'a private note from the review'),
  ((select id from t.things where name = 'job_d_live'), (select id from t.things where name = 'employer_d'), 'Optometrist', 'Optometrist', 'Full time', 'Alberta', 'Red Deer', 'year', 120000, 150000, true, false,
   'A made up job used only by the access tests in scripts/dev.', 'live', now(), now() + interval '20 days', null);
insert into public.jobs (id, employer_id, title, status)
values ((select id from t.things where name = 'job_c_draft'), (select id from t.things where name = 'employer_c'), 'Draft job', 'draft');

insert into public.candidate_profiles (user_id, profession) select id, 'Optician' from t.people where name in ('ann', 'bo');

insert into public.applications (id, job_id, candidate_id, status, applicant, job_title, clinic_name, job_location, viewed_at)
values ((select id from t.things where name = 'app_ann_c'), (select id from t.things where name = 'job_c_live'), (select id from t.people where name = 'ann'),
        'shortlisted', '{"name": "Ann Test"}', 'Optician', 'Clinic C', 'Guelph, Ontario', now());
insert into public.application_events (application_id, status, created_at)
select (select id from t.things where name = 'app_ann_c'), s, now() - interval '3 hours' + (o || ' hours')::interval
from unnest(array['applied', 'viewed', 'shortlisted']) with ordinality as x(s, o);

insert into public.notifications (user_id, kind, title) select id, 'test', 'A message for ' || name from t.people;
insert into public.waitlist (audience, first_name, email, province, consent, consent_text) values ('candidate', 'Wendy', 'wendy@rls.test', 'Ontario', true, 'test wording')
on conflict (email) do nothing;

-- ---------------------------------------------------------------- the helper

-- who:  'visitor' (not signed in), 'server' (the website's own key), or a name from t.people (signed in as that person)
-- kind: 'count' (how many rows a read returns), 'value' (the first value a read returns), 'write' (how many rows a change touches)
-- want: 'refused' (the database said no), 'blocked' (said no, or 0 rows), 'N rows', an exact value, or 'not X' (anything except X)
-- In the SQL, {name} is replaced by that person's or thing's id.
create or replace function t.try(finding text, label text, who text, kind text, statement text, want text) returns void language plpgsql as $$
declare
  got text; detail text; n bigint; r record;
  uid text := coalesce((select id::text from t.people where name = who), '');
begin
  for r in select name, id from t.people union all select name, id from t.things loop
    statement := replace(statement, '{' || r.name || '}', r.id::text);
  end loop;
  begin
    perform set_config('request.jwt.claim.sub', uid, true);
    if who = 'visitor' then set local role anon; elsif who <> 'server' then set local role authenticated; end if;
    if kind = 'count' then
      execute 'select count(*) from (' || statement || ') q' into n; got := n || ' rows';
    elsif kind = 'value' then
      execute statement into got; got := coalesce(got, '(nothing)');
    else
      execute statement; get diagnostics n = row_count; got := n || ' rows';
    end if;
    raise exception using errcode = 'KT001', message = 'undo this attempt';
  exception
    when sqlstate 'KT001' then null;
    when others then got := 'refused'; detail := sqlerrm;
  end;
  insert into t.results (finding, label, want, got, detail, pass)
  values (finding, label, want, got, detail,
          case when want = 'blocked' then got in ('refused', '0 rows')
               when want like 'not %' then got <> substr(want, 5)
               else got = want end);
end;
$$;

-- ---------------------------------------------------------------- what already held in the audit (kept so it stays that way)

select t.try('held', 'visitor cannot read profiles', 'visitor', 'count', 'select id from public.profiles', 'blocked');
select t.try('held', 'visitor cannot read candidate profiles', 'visitor', 'count', 'select user_id from public.candidate_profiles', 'blocked');
select t.try('held', 'visitor cannot read applications', 'visitor', 'count', 'select id from public.applications', 'blocked');
select t.try('held', 'visitor cannot read inbox messages', 'visitor', 'count', 'select id from public.notifications', 'blocked');
select t.try('held', 'visitor cannot read the waitlist', 'visitor', 'count', 'select id from public.waitlist', 'blocked');
select t.try('held', 'visitor cannot read clinic contact emails', 'visitor', 'count', 'select notify_email from public.employer_contacts', 'blocked');
select t.try('held', 'visitor cannot read the first week email record', 'visitor', 'count', 'select user_id from public.onboarding_emails', 'blocked');
select t.try('held', 'visitor cannot write to the waitlist', 'visitor', 'write', $$insert into public.waitlist (audience, first_name, email, province, consent, consent_text) values ('candidate', 'X', 'x@rls.test', 'Ontario', true, 'x')$$, 'refused');
select t.try('held', 'visitor cannot write to an inbox', 'visitor', 'write', $$insert into public.notifications (user_id, kind, title) values ('{ann}', 'x', 'x')$$, 'refused');
select t.try('held', 'visitor sees the 2 live jobs', 'visitor', 'count', 'select id, title, pay_min from public.jobs', '2 rows');
select t.try('held', 'visitor sees the 2 clinics with live jobs', 'visitor', 'count', 'select id, clinic_name from public.employers', '2 rows');
select t.try('held', 'visitor cannot read a review note', 'visitor', 'count', 'select review_note from public.jobs', 'refused');
select t.try('held', 'visitor cannot read a clinic owner id', 'visitor', 'count', 'select owner_id from public.employers', 'refused');

select t.try('held', 'Bo reads only her own profile', 'bo', 'count', 'select id from public.profiles', '1 rows');
select t.try('held', 'Bo reads only her own candidate profile', 'bo', 'count', 'select user_id from public.candidate_profiles', '1 rows');
select t.try('held', 'Bo reads only her own inbox', 'bo', 'count', 'select id from public.notifications', '1 rows');
select t.try('held', 'Bo sees none of Ann''s applications', 'bo', 'count', 'select id from public.applications', 'blocked');
select t.try('held', 'Bo cannot change Ann''s name', 'bo', 'write', $$update public.profiles set first_name = 'Hacked' where id = '{ann}'$$, 'blocked');
select t.try('held', 'Bo cannot change Ann''s inbox', 'bo', 'write', $$update public.notifications set read_at = now() where user_id = '{ann}'$$, 'blocked');
select t.try('held', 'nobody can make themselves an admin', 'bo', 'write', $$update public.profiles set role = 'admin' where id = '{bo}'$$, 'refused');
select t.try('held', 'nobody can clear their own name hold', 'ann', 'write', $$update public.profiles set name_changed_at = null where id = '{ann}'$$, 'refused');

select t.try('held', 'Ann cannot change her application', 'ann', 'write', $$update public.applications set status = 'offer' where id = '{app_ann_c}'$$, 'refused');
select t.try('held', 'Ann cannot create an application without the website', 'ann', 'write', $$insert into public.applications (job_id, candidate_id, applicant, job_title, clinic_name, job_location) values ('{job_d_live}', '{ann}', '{}', 'x', 'x', 'x')$$, 'refused');
select t.try('held', 'Ann cannot repoint her resume file', 'ann', 'write', $$update public.candidate_profiles set cv_path = 'someone/else.pdf' where user_id = '{ann}'$$, 'refused');
select t.try('held', 'Ann cannot forge an inbox message', 'ann', 'write', $$insert into public.notifications (user_id, kind, title) values ('{ann}', 'x', 'x')$$, 'refused');
select t.try('held', 'Ann cannot edit an inbox message', 'ann', 'write', $$update public.notifications set title = 'x' where user_id = '{ann}'$$, 'refused');
select t.try('held', 'Ann cannot delete an inbox message', 'ann', 'write', $$delete from public.notifications where user_id = '{ann}'$$, 'refused');
select t.try('held', 'Ann can mark her own message read', 'ann', 'write', $$update public.notifications set read_at = now() where user_id = '{ann}'$$, '1 rows');
select t.try('held', 'Ann can hide a job for herself', 'ann', 'write', $$insert into public.candidate_job_hides (user_id, job_id) values ('{ann}', '{job_d_live}')$$, '1 rows');
select t.try('held', 'Ann cannot hide a job for Bo', 'ann', 'write', $$insert into public.candidate_job_hides (user_id, job_id) values ('{bo}', '{job_d_live}')$$, 'refused');
select t.try('held', 'a candidate account cannot create a clinic', 'ann', 'write', $$insert into public.employers (owner_id, clinic_name, practice_type, province, city) values ('{ann}', 'Fake', 'independent', 'Ontario', 'Guelph')$$, 'refused');

select t.try('held', 'clinic D sees no candidate profiles', 'clinic_d', 'count', 'select user_id from public.candidate_profiles', 'blocked');
select t.try('held', 'clinic D sees no applications', 'clinic_d', 'count', 'select id from public.applications', 'blocked');
select t.try('held', 'clinic D sees no application history', 'clinic_d', 'count', 'select id from public.application_events', 'blocked');
select t.try('held', 'clinic C sees Ann''s application', 'clinic_c', 'count', 'select id from public.applications', '1 rows');
select t.try('held', 'clinic C sees nothing of Ann''s profile', 'clinic_c', 'count', 'select user_id from public.candidate_profiles', 'blocked');
select t.try('held', 'a clinic cannot change an application directly', 'clinic_c', 'write', $$update public.applications set status = 'offer' where id = '{app_ann_c}'$$, 'refused');
select t.try('held', 'a clinic cannot publish its own job', 'clinic_c', 'write', $$update public.jobs set status = 'live' where id = '{job_c_draft}'$$, 'refused');
select t.try('held', 'a clinic cannot edit a live job', 'clinic_c', 'write', $$update public.jobs set title = 'Changed' where id = '{job_c_live}'$$, 'refused');
select t.try('held', 'a clinic cannot edit another clinic''s job', 'clinic_c', 'write', $$update public.jobs set status = 'closed' where id = '{job_d_live}'$$, 'blocked');
select t.try('held', 'a clinic cannot delete another clinic''s job', 'clinic_c', 'write', $$delete from public.jobs where id = '{job_d_live}'$$, 'blocked');
select t.try('held', 'a clinic cannot take over another clinic', 'clinic_c', 'write', $$update public.employers set clinic_name = 'Mine now' where id = '{employer_d}'$$, 'blocked');
select t.try('held', 'a clinic cannot mark itself claimed', 'clinic_c', 'write', $$update public.employers set claimed = true where id = '{employer_c}'$$, 'refused');
select t.try('held', 'a clinic can send a complete Ontario job for review', 'clinic_c', 'write', $$insert into public.jobs (employer_id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening, description, status) values ('{employer_c}', 'Optician', 'Optician', 'Full time', 'Ontario', 'Guelph', 'year', 50000, 60000, true, false, 'A made up job used only by the access tests in scripts/dev.', 'in_review')$$, '1 rows');
select t.try('held', 'a job with no pay cannot go to review', 'clinic_c', 'write', $$insert into public.jobs (employer_id, title, role_category, employment_type, province, city, is_existing_vacancy, uses_ai_screening, description, status) values ('{employer_c}', 'Optician', 'Optician', 'Full time', 'Ontario', 'Guelph', true, false, 'A made up job used only by the access tests in scripts/dev.', 'in_review')$$, 'refused');

select t.try('held', 'a signed in person cannot call claim_job_run', 'bo', 'value', $$select public.claim_job_run('daily', 60)::text$$, 'refused');
select t.try('held', 'a signed in person cannot call issue_signup_ticket', 'bo', 'value', 'select public.issue_signup_ticket()::text', 'refused');
select t.try('held', 'a visitor cannot call issue_signup_ticket', 'visitor', 'value', 'select public.issue_signup_ticket()::text', 'refused');
select t.try('held', 'a visitor cannot call record_job_event', 'visitor', 'value', $$select public.record_job_event('{job_c_live}', 'view')::text$$, 'refused');

-- ---------------------------------------------------------------- P1-15: the shortlist stays private from the candidate

select t.try('P1-15', 'Ann cannot read "shortlisted" on her application', 'ann', 'value', $$select status from public.applications where id = '{app_ann_c}'$$, 'not shortlisted');
select t.try('P1-15', 'Ann cannot read a "shortlisted" step in the history', 'ann', 'count', $$select id from public.application_events where status = 'shortlisted'$$, 'blocked');
select t.try('P1-15', 'clinic C still sees the shortlist', 'clinic_c', 'value', $$select status from public.applications where id = '{app_ann_c}'$$, 'shortlisted');
select t.try('P1-15', 'clinic C still sees the full history', 'clinic_c', 'count', 'select id from public.application_events', '3 rows');

-- ---------------------------------------------------------------- P1-16 and P1-33: the name hold cannot be skipped

select t.try('P1-16', 'Ann cannot change her own name directly', 'ann', 'write', $$update public.profiles set first_name = 'Zed', last_name = 'New', full_name = 'Zed New' where id = '{ann}'$$, 'refused');
select t.try('P1-16', 'Bo (no hold) cannot change her name directly either', 'bo', 'write', $$update public.profiles set full_name = 'Zed New' where id = '{bo}'$$, 'refused');
select t.try('P1-16', 'the website''s server can save a name', 'server', 'write', $$update public.profiles set first_name = 'Zed', last_name = 'New', full_name = 'Zed New', name_changed_at = now() where id = '{bo}'$$, '1 rows');
select t.try('P1-16', 'Ann can still read her own profile', 'ann', 'value', $$select first_name from public.profiles where id = '{ann}'$$, 'Ann');

-- ---------------------------------------------------------------- P1-28: no Quebec job past a draft

select t.try('P1-28', 'a clinic cannot send a Quebec job for review', 'clinic_c', 'write', $$insert into public.jobs (employer_id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening, description, status) values ('{employer_c}', 'Optician', 'Optician', 'Full time', 'Quebec', 'Gatineau', 'year', 50000, 60000, true, false, 'A made up job used only by the access tests in scripts/dev.', 'in_review')$$, 'refused');
select t.try('P1-28', 'a clinic cannot move a draft to Quebec and send it', 'clinic_c', 'write', $$update public.jobs set role_category = 'Optician', employment_type = 'Full time', province = 'Quebec', city = 'Gatineau', pay_period = 'year', pay_min = 50000, pay_max = 60000, is_existing_vacancy = true, uses_ai_screening = false, description = 'A made up job used only by the access tests in scripts/dev.', status = 'in_review' where id = '{job_c_draft}'$$, 'refused');
select t.try('P1-28', 'even the server cannot make a Quebec job live', 'server', 'write', $$update public.jobs set province = 'Quebec' where id = '{job_c_live}'$$, 'refused');
select t.try('P1-28', 'a Quebec job that somehow exists can still be closed', 'server', 'write', $$update public.jobs set province = 'Quebec', status = 'closed' where id = '{job_c_live}'$$, '1 rows');

-- ---------------------------------------------------------------- P1-44: percentages and daily rates are for optometrist roles

select t.try('P1-44', 'an optician job cannot use a daily rate', 'clinic_c', 'write', $$insert into public.jobs (employer_id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening, description, status) values ('{employer_c}', 'Optician', 'Optician', 'Locum', 'Ontario', 'Guelph', 'day', 300, 400, true, false, 'A made up job used only by the access tests in scripts/dev.', 'in_review')$$, 'refused');
select t.try('P1-44', 'an optician job cannot be paid by percentage', 'clinic_c', 'write', $$insert into public.jobs (employer_id, title, role_category, employment_type, province, city, pay_percent_min, pay_percent_max, pay_percent_of, is_existing_vacancy, uses_ai_screening, description, status) values ('{employer_c}', 'Optician', 'Optician', 'Full time', 'Ontario', 'Guelph', 30, 35, 'production', true, false, 'A made up job used only by the access tests in scripts/dev.', 'in_review')$$, 'refused');
select t.try('P1-44', 'an optometrist job can use a daily rate', 'clinic_c', 'write', $$insert into public.jobs (employer_id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening, description, status) values ('{employer_c}', 'Optometrist', 'Optometrist', 'Locum', 'Ontario', 'Guelph', 'day', 700, 900, true, false, 'A made up job used only by the access tests in scripts/dev.', 'in_review')$$, '1 rows');
select t.try('P1-44', 'an optometrist job can be paid by percentage', 'clinic_c', 'write', $$insert into public.jobs (employer_id, title, role_category, employment_type, province, city, pay_percent_min, pay_percent_max, pay_percent_of, is_existing_vacancy, uses_ai_screening, description, status) values ('{employer_c}', 'Optometrist', 'Optometrist', 'Full time', 'Ontario', 'Guelph', 30, 35, 'production', true, false, 'A made up job used only by the access tests in scripts/dev.', 'in_review')$$, '1 rows');
select t.try('P1-44', 'an optician draft with a daily rate can still be saved and fixed', 'clinic_c', 'write', $$insert into public.jobs (employer_id, title, role_category, pay_period, pay_min, pay_max, status) values ('{employer_c}', 'Optician', 'Optician', 'day', 300, 400, 'draft')$$, '1 rows');

-- ---------------------------------------------------------------- P1-41: signed in people get no wider view of other people's jobs and clinics

select t.try('P1-41', 'Bo cannot read review notes on live jobs', 'bo', 'count', 'select review_note from public.jobs', 'blocked');
select t.try('P1-41', 'Bo cannot read who posted or who was hired', 'bo', 'count', 'select posted_by_admin_id, filled_application_id from public.jobs', 'blocked');
select t.try('P1-41', 'Bo cannot read a clinic owner id', 'bo', 'count', 'select owner_id from public.employers', 'blocked');
select t.try('P1-41', 'clinic C cannot read the private columns of clinic D''s job', 'clinic_c', 'count', $$select review_note from public.jobs where id = '{job_d_live}'$$, 'blocked');
select t.try('P1-41', 'clinic C reads every column of its own 2 jobs', 'clinic_c', 'count', 'select * from public.jobs', '2 rows');
select t.try('P1-41', 'clinic C reads its own review note', 'clinic_c', 'value', $$select review_note from public.jobs where id = '{job_c_live}'$$, 'a private note from the review');
select t.try('P1-41', 'clinic C reads its own clinic by owner', 'clinic_c', 'count', $$select * from public.employers where owner_id = '{clinic_c}'$$, '1 rows');
select t.try('P1-41', 'the admin reads every job', 'admin', 'count', 'select * from public.jobs', '3 rows');
select t.try('P1-41', 'the admin reads every clinic', 'admin', 'count', 'select * from public.employers', '2 rows');
select t.try('P1-41', 'a clinic still reads the numbers for its own jobs', 'clinic_c', 'count', 'select * from public.job_daily_stats', '0 rows');

-- ---------------------------------------------------------------- P1-42: no leftover default permissions

select t.try('P1-42', 'a visitor cannot empty the waitlist', 'visitor', 'write', 'truncate public.waitlist', 'refused');
select t.try('P1-42', 'a signed in person cannot empty profiles', 'bo', 'write', 'truncate public.profiles cascade', 'refused');
select t.try('P1-42', 'waitlist: nothing for visitors', 'server', 'value', $$select string_agg(privilege_type, ', ' order by privilege_type) from information_schema.role_table_grants where table_schema = 'public' and table_name = 'waitlist' and grantee = 'anon'$$, '(nothing)');
select t.try('P1-42', 'waitlist: nothing for signed in people', 'server', 'value', $$select string_agg(privilege_type, ', ' order by privilege_type) from information_schema.role_table_grants where table_schema = 'public' and table_name = 'waitlist' and grantee = 'authenticated'$$, '(nothing)');
select t.try('P1-42', 'onboarding_emails: nothing for visitors or signed in people', 'server', 'value', $$select string_agg(privilege_type, ', ' order by privilege_type) from information_schema.role_table_grants where table_schema = 'public' and table_name = 'onboarding_emails' and grantee in ('anon', 'authenticated')$$, '(nothing)');
select t.try('P1-42', 'candidate_job_hides: nothing for visitors', 'server', 'value', $$select string_agg(privilege_type, ', ' order by privilege_type) from information_schema.role_table_grants where table_schema = 'public' and table_name = 'candidate_job_hides' and grantee = 'anon'$$, '(nothing)');
select t.try('P1-42', 'candidate_job_hides: read, add and remove for signed in people', 'server', 'value', $$select string_agg(privilege_type, ', ' order by privilege_type) from information_schema.role_table_grants where table_schema = 'public' and table_name = 'candidate_job_hides' and grantee = 'authenticated'$$, 'DELETE, INSERT, SELECT');
select t.try('P1-42', 'profiles: nothing for visitors', 'server', 'value', $$select string_agg(privilege_type, ', ' order by privilege_type) from information_schema.role_table_grants where table_schema = 'public' and table_name = 'profiles' and grantee = 'anon'$$, '(nothing)');
select t.try('P1-42', 'profiles: read only for signed in people', 'server', 'value', $$select string_agg(privilege_type, ', ' order by privilege_type) from information_schema.role_table_grants where table_schema = 'public' and table_name = 'profiles' and grantee = 'authenticated'$$, 'SELECT');
select t.try('P1-42', 'no table lets a visitor or signed in person truncate, add triggers or add references', 'server', 'value', $$select string_agg(distinct table_name, ', ' order by table_name) from information_schema.role_table_grants where table_schema = 'public' and grantee in ('anon', 'authenticated') and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES')$$, '(nothing)');
select t.try('P1-42', 'Ann can still bring back a hidden job', 'ann', 'write', $$delete from public.candidate_job_hides where user_id = '{ann}'$$, '0 rows');
