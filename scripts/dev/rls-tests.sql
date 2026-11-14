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
  ('ann', gen_random_uuid()), ('bo', gen_random_uuid()), ('clinic_c', gen_random_uuid()), ('clinic_d', gen_random_uuid()), ('admin', gen_random_uuid()),
  -- 0045: clinic C's team. Edith can view and edit, Vic can view only, Nell has a clinic account but no clinic, m3 to m5 fill the team up.
  ('clinic_edith', gen_random_uuid()), ('clinic_vic', gen_random_uuid()), ('clinic_nell', gen_random_uuid()),
  ('clinic_m3', gen_random_uuid()), ('clinic_m4', gen_random_uuid()), ('clinic_m5', gen_random_uuid());

insert into auth.users (id, email, raw_user_meta_data)
select id, name || '@rls.test',
       jsonb_build_object('role', case when name like 'clinic%' then 'clinic' else 'candidate' end, 'first_name', initcap(name), 'last_name', 'Test',
                          'signup_ticket', public.issue_signup_ticket())
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

insert into public.employer_members (employer_id, user_id, level)
values ((select id from t.things where name = 'employer_c'), (select id from t.people where name = 'clinic_edith'), 'edit'),
       ((select id from t.things where name = 'employer_c'), (select id from t.people where name = 'clinic_vic'), 'view');

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

-- who:  'visitor' (not signed in), 'server' (the website's own key), 'sign_up_service' (Supabase's own sign up service, which anyone
--       can reach with the public browser key), or a name from t.people (signed in as that person)
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
    if who = 'visitor' then set local role anon; elsif who = 'sign_up_service' then set local role supabase_auth_admin; elsif who <> 'server' then set local role authenticated; end if;
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

-- Payments (0048): clinic C has 2, clinic D has 1.
insert into public.job_payments (job_id, employer_id, job_title, clinic_name, band, amount_cents, status, stripe_payment_method_id, stripe_payment_intent_id)
values
  ((select id from t.things where name = 'job_c_draft'), (select id from t.things where name = 'employer_c'), 'Optician', 'Clinic C', 'opticians', 7900, 'card_saved', 'pm_test_c', null),
  ((select id from t.things where name = 'job_c_live'), (select id from t.things where name = 'employer_c'), 'Optician', 'Clinic C', 'opticians', 7900, 'charged', 'pm_test_c', 'pi_test_c'),
  ((select id from t.things where name = 'job_d_live'), (select id from t.things where name = 'employer_d'), 'Optician', 'Clinic D', 'opticians', 7900, 'card_saved', 'pm_test_d', null);

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

select t.try('P1-57', 'a field based job based in Ontario can cover an area that includes Quebec (Steve allowed it, 12th November 2026)', 'clinic_c', 'write', $$insert into public.jobs (employer_id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening, description, status, work_arrangement, territory) values ('{employer_c}', 'Territory representative', 'Sales or territory representative', 'Full time', 'Ontario', 'Ottawa', 'year', 70000, 90000, true, false, 'A made up job used only by the access tests in scripts/dev.', 'in_review', 'field', 'Eastern Ontario and western Quebec')$$, '1 rows');

-- ---------------------------------------------------------------- P1-44: percentages and daily rates are for optometrist roles

select t.try('P1-44', 'an optician job cannot use a daily rate', 'clinic_c', 'write', $$insert into public.jobs (employer_id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening, description, status) values ('{employer_c}', 'Optician', 'Optician', 'Locum', 'Ontario', 'Guelph', 'day', 300, 400, true, false, 'A made up job used only by the access tests in scripts/dev.', 'in_review')$$, 'refused');
select t.try('P1-44', 'an optician job cannot be paid by percentage', 'clinic_c', 'write', $$insert into public.jobs (employer_id, title, role_category, employment_type, province, city, pay_percent_min, pay_percent_max, pay_percent_of, is_existing_vacancy, uses_ai_screening, description, status) values ('{employer_c}', 'Optician', 'Optician', 'Full time', 'Ontario', 'Guelph', 30, 35, 'production', true, false, 'A made up job used only by the access tests in scripts/dev.', 'in_review')$$, 'refused');
select t.try('P1-44', 'an optometrist job can use a daily rate', 'clinic_c', 'write', $$insert into public.jobs (employer_id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening, description, status) values ('{employer_c}', 'Optometrist', 'Optometrist', 'Locum', 'Ontario', 'Guelph', 'day', 700, 900, true, false, 'A made up job used only by the access tests in scripts/dev.', 'in_review')$$, '1 rows');
select t.try('P1-44', 'an optometrist job can be paid by percentage', 'clinic_c', 'write', $$insert into public.jobs (employer_id, title, role_category, employment_type, province, city, pay_percent_min, pay_percent_max, pay_percent_of, is_existing_vacancy, uses_ai_screening, description, status) values ('{employer_c}', 'Optometrist', 'Optometrist', 'Full time', 'Ontario', 'Guelph', 30, 35, 'production', true, false, 'A made up job used only by the access tests in scripts/dev.', 'in_review')$$, '1 rows');

-- ---------------------------------------------------------------- 0043: expected earnings beside a percentage, and no career stage
select t.try('0043', 'a clinic can send a percentage job with its expected earnings', 'clinic_c', 'write', $$insert into public.jobs (employer_id, title, role_category, employment_type, province, city, pay_percent_min, pay_percent_max, pay_percent_of, pay_expected_min, pay_expected_max, pay_expected_period, is_existing_vacancy, uses_ai_screening, description, status) values ('{employer_c}', 'Optometrist', 'Optometrist', 'Full time', 'Ontario', 'Guelph', 30, 35, 'production', 800, 1000, 'day', true, false, 'A made up job used only by the access tests in scripts/dev.', 'in_review')$$, '1 rows');
select t.try('0043', 'expected earnings must be complete (a minimum with no maximum is refused)', 'clinic_c', 'write', $$insert into public.jobs (employer_id, title, role_category, pay_expected_min, pay_expected_period, status) values ('{employer_c}', 'Draft', 'Optometrist', 800, 'day', 'draft')$$, 'refused');
select t.try('0043', 'a visitor can read the expected earnings of a live job', 'visitor', 'count', 'select pay_expected_min, pay_expected_max, pay_expected_period from public.jobs', '2 rows');
select t.try('0043', 'a candidate can no longer save a career stage answer', 'ann', 'write', $$update public.candidate_profiles set career_stage = 'working' where user_id = '{ann}'$$, 'refused');
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
select t.try('P1-42', 'candidate_job_hides: read and remove for signed in people (adding is given column by column, tested above by "Ann can hide a job for herself")', 'server', 'value', $$select string_agg(privilege_type, ', ' order by privilege_type) from information_schema.role_table_grants where table_schema = 'public' and table_name = 'candidate_job_hides' and grantee = 'authenticated'$$, 'DELETE, SELECT');
select t.try('P1-42', 'candidate_job_hides: a candidate cannot backdate a hidden job', 'ann', 'write', $$insert into public.candidate_job_hides (user_id, job_id, created_at) values ('{ann}', '{job_d_live}', '2020-01-01')$$, 'refused');
select t.try('P1-42', 'profiles: nothing for visitors', 'server', 'value', $$select string_agg(privilege_type, ', ' order by privilege_type) from information_schema.role_table_grants where table_schema = 'public' and table_name = 'profiles' and grantee = 'anon'$$, '(nothing)');
select t.try('P1-42', 'profiles: read only for signed in people', 'server', 'value', $$select string_agg(privilege_type, ', ' order by privilege_type) from information_schema.role_table_grants where table_schema = 'public' and table_name = 'profiles' and grantee = 'authenticated'$$, 'SELECT');
select t.try('P1-42', 'no table lets a visitor or signed in person truncate, add triggers or add references', 'server', 'value', $$select string_agg(distinct table_name, ', ' order by table_name) from information_schema.role_table_grants where table_schema = 'public' and grantee in ('anon', 'authenticated') and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES')$$, '(nothing)');
select t.try('P1-42', 'Ann can still bring back a hidden job', 'ann', 'write', $$delete from public.candidate_job_hides where user_id = '{ann}'$$, '0 rows');

-- ---------------------------------------------------------------- P1-15, the design Steve chose (C): the database hands a candidate a masked copy
select t.try('P1-15', 'Ann reads her application through my_applications', 'ann', 'count', 'select * from public.my_applications()', '1 rows');
select t.try('P1-15', 'my_applications shows a shortlist as Viewed', 'ann', 'value', 'select status from public.my_applications()', 'viewed');
select t.try('P1-15', 'my_applications does not give away when the shortlist happened', 'ann', 'value', 'select (status_changed_at = viewed_at)::text from public.my_applications()', 'true');
select t.try('P1-15', 'Ann reads her history without the shortlist step', 'ann', 'value', $$select string_agg(status, ', ' order by created_at) from public.my_application_events('{app_ann_c}')$$, 'applied, viewed');
select t.try('P1-15', 'Ann cannot read her applications table directly any more', 'ann', 'count', 'select id from public.applications', 'blocked');
select t.try('P1-15', 'Bo gets nothing from my_applications', 'bo', 'count', 'select * from public.my_applications()', '0 rows');
select t.try('P1-15', 'Bo gets nothing from Ann''s history', 'bo', 'count', $$select * from public.my_application_events('{app_ann_c}')$$, '0 rows');
select t.try('P1-15', 'clinic C gets nothing from my_applications (it is for the candidate)', 'clinic_c', 'count', 'select * from public.my_applications()', '0 rows');
select t.try('P1-15', 'a visitor cannot call my_applications', 'visitor', 'count', 'select * from public.my_applications()', 'refused');
select t.try('P1-15', 'a visitor cannot call my_application_events', 'visitor', 'count', $$select * from public.my_application_events('{app_ann_c}')$$, 'refused');

-- ---------------------------------------------------------------- P1-03: Supabase's sign up service needs Kestrel's ticket, even with the gate open
-- Anyone can send a sign up straight to Supabase with the public key. The website only issues a ticket after the bot check, the terms
-- tick and (for a clinic) the invitation code, so a sign up without one skipped those checks. A Google sign up has no ticket, so it is
-- let in without a role, and the person then chooses on the welcome page, which asks for the terms and the invitation code.
insert into t.things (name) values ('ticket_1');
insert into public.signup_tickets (ticket) select id from t.things where name = 'ticket_1';
update public.signup_gate set open = true;
select t.try('P1-03', 'gate open: a clinic sign up sent straight to Supabase with no ticket is refused', 'sign_up_service', 'write', $$insert into auth.users (email, raw_app_meta_data, raw_user_meta_data) values ('x1@rls.test', '{"provider":"email","providers":["email"]}', '{"role":"clinic","first_name":"X"}')$$, 'refused');
select t.try('P1-03', 'gate open: a candidate sign up sent straight to Supabase with no ticket is refused', 'sign_up_service', 'write', $$insert into auth.users (email, raw_app_meta_data, raw_user_meta_data) values ('x2@rls.test', '{"provider":"email","providers":["email"]}', '{"role":"candidate","first_name":"X"}')$$, 'refused');
select t.try('P1-03', 'gate open: a sign up with no provider named and no ticket is refused', 'sign_up_service', 'write', $$insert into auth.users (email, raw_user_meta_data) values ('x3@rls.test', '{"role":"clinic"}')$$, 'refused');
select t.try('P1-03', 'gate open: a made up ticket is refused', 'sign_up_service', 'write', $$insert into auth.users (email, raw_app_meta_data, raw_user_meta_data) values ('x4@rls.test', '{"provider":"email"}', '{"role":"clinic","signup_ticket":"00000000-0000-4000-8000-000000000000"}')$$, 'refused');
select t.try('P1-03', 'gate open: a sign up through the website, with its ticket, goes through', 'sign_up_service', 'write', $$insert into auth.users (email, raw_app_meta_data, raw_user_meta_data) values ('x5@rls.test', '{"provider":"email"}', '{"role":"clinic","signup_ticket":"{ticket_1}"}')$$, '1 rows');
select t.try('P1-03', 'gate open: the ticket is not kept on the account', 'sign_up_service', 'value', $$insert into auth.users (email, raw_app_meta_data, raw_user_meta_data) values ('x6@rls.test', '{"provider":"email"}', '{"role":"clinic","signup_ticket":"{ticket_1}"}') returning coalesce(raw_user_meta_data ->> 'signup_ticket', 'gone')$$, 'gone');
select t.try('P1-03', 'gate open: 1 ticket cannot make 2 accounts', 'sign_up_service', 'write', $$insert into auth.users (email, raw_app_meta_data, raw_user_meta_data) values ('x7@rls.test', '{"provider":"email"}', '{"signup_ticket":"{ticket_1}"}'), ('x8@rls.test', '{"provider":"email"}', '{"signup_ticket":"{ticket_1}"}')$$, 'refused');
select t.try('P1-03', 'gate open: a Google sign up goes through without a ticket', 'sign_up_service', 'write', $$insert into auth.users (email, raw_app_meta_data, raw_user_meta_data) values ('x9@rls.test', '{"provider":"google","providers":["google"]}', '{"full_name":"X Y"}')$$, '1 rows');
select t.try('P1-03', 'gate open: a Google sign up cannot name itself a clinic (the role is removed, so the welcome page asks)', 'sign_up_service', 'value', $$insert into auth.users (email, raw_app_meta_data, raw_user_meta_data) values ('x10@rls.test', '{"provider":"google"}', '{"role":"clinic","full_name":"X Y"}') returning coalesce(raw_user_meta_data ->> 'role', 'none')$$, 'none');
select t.try('P1-03', 'gate open: any other kind of sign up (a phone, say) needs a ticket', 'sign_up_service', 'write', $$insert into auth.users (email, raw_app_meta_data, raw_user_meta_data) values ('x11@rls.test', '{"provider":"phone"}', '{"role":"clinic"}')$$, 'refused');
update public.signup_gate set open = false;
select t.try('P1-03', 'gate closed: a Google sign up is refused, as before', 'sign_up_service', 'write', $$insert into auth.users (email, raw_app_meta_data, raw_user_meta_data) values ('x12@rls.test', '{"provider":"google"}', '{"full_name":"X Y"}')$$, 'refused');
select t.try('P1-03', 'gate closed: a sign up through the website, with its ticket, goes through, as before', 'sign_up_service', 'write', $$insert into auth.users (email, raw_app_meta_data, raw_user_meta_data) values ('x13@rls.test', '{"provider":"email"}', '{"role":"candidate","signup_ticket":"{ticket_1}"}')$$, '1 rows');
update public.signup_gate set open = true;

-- ---------------------------------------------------------------- P1-24: 1 count of emails sent today, for the website's server only
select t.try('P1-24', 'the server counts an email and gets the total back', 'server', 'value', $$select (public.count_email_send(50) ->> 'sent')$$, '1');
select t.try('P1-24', 'the warning is claimed once, when the count reaches 80%', 'server', 'value', $$select string_agg(public.count_email_send(5) ->> 'warn', ',') from generate_series(1, 6)$$, 'false,false,false,true,false,false');
select t.try('P1-24', 'a visitor cannot read the count', 'visitor', 'count', 'select * from public.email_send_counts', 'refused');
select t.try('P1-24', 'a signed in person cannot read the count', 'bo', 'count', 'select * from public.email_send_counts', 'refused');
select t.try('P1-24', 'a signed in person cannot add to the count', 'bo', 'value', $$select public.count_email_send(50)::text$$, 'refused');
select t.try('P1-24', 'a visitor cannot add to the count', 'visitor', 'value', $$select public.count_email_send(50)::text$$, 'refused');

-- ---------------------------------------------------------------- 0045: a clinic's team (owner, can view and edit, view only)
select t.try('0045', 'Edith (view and edit) sees Ann''s application to clinic C', 'clinic_edith', 'count', 'select id from public.applications', '1 rows');
select t.try('0045', 'Vic (view only) sees Ann''s application to clinic C', 'clinic_vic', 'count', 'select id from public.applications', '1 rows');
select t.try('0045', 'Vic sees its history', 'clinic_vic', 'count', 'select id from public.application_events', '3 rows');
select t.try('0045', 'Nell (a clinic account with no clinic) sees no applications', 'clinic_nell', 'count', 'select id from public.applications', 'blocked');
select t.try('0045', 'Nell sees no jobs through her own sign in', 'clinic_nell', 'count', 'select id from public.jobs', 'blocked');
select t.try('0045', 'Edith reads clinic C''s 2 jobs', 'clinic_edith', 'count', 'select * from public.jobs', '2 rows');
select t.try('0045', 'Vic reads clinic C''s 2 jobs', 'clinic_vic', 'count', 'select * from public.jobs', '2 rows');
select t.try('0045', 'Edith reads her clinic', 'clinic_edith', 'count', 'select id from public.employers', '1 rows');
select t.try('0045', 'Edith can send a job for review', 'clinic_edith', 'write', $$insert into public.jobs (employer_id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening, description, status) values ('{employer_c}', 'Optician', 'Optician', 'Full time', 'Ontario', 'Guelph', 'year', 50000, 60000, true, false, 'A made up job used only by the access tests in scripts/dev.', 'in_review')$$, '1 rows');
select t.try('0045', 'Vic cannot send a job for review', 'clinic_vic', 'write', $$insert into public.jobs (employer_id, title, status) values ('{employer_c}', 'Draft', 'draft')$$, 'refused');
select t.try('0045', 'Edith can change a draft', 'clinic_edith', 'write', $$update public.jobs set title = 'Changed' where id = '{job_c_draft}'$$, '1 rows');
select t.try('0045', 'Vic cannot change a draft', 'clinic_vic', 'write', $$update public.jobs set title = 'Changed' where id = '{job_c_draft}'$$, 'blocked');
select t.try('0045', 'Edith can delete a draft', 'clinic_edith', 'write', $$delete from public.jobs where id = '{job_c_draft}'$$, '1 rows');
select t.try('0045', 'Vic cannot delete a draft', 'clinic_vic', 'write', $$delete from public.jobs where id = '{job_c_draft}'$$, 'blocked');
select t.try('0045', 'Edith cannot touch clinic D''s job', 'clinic_edith', 'write', $$update public.jobs set status = 'closed' where id = '{job_d_live}'$$, 'blocked');
select t.try('0045', 'Edith cannot change the clinic profile (owner only)', 'clinic_edith', 'write', $$update public.employers set clinic_name = 'Mine' where id = '{employer_c}'$$, 'blocked');
select t.try('0045', 'Vic cannot change the clinic profile', 'clinic_vic', 'write', $$update public.employers set clinic_name = 'Mine' where id = '{employer_c}'$$, 'blocked');
select t.try('0045', 'Edith cannot read the private alert address (owner only)', 'clinic_edith', 'count', 'select notify_email from public.employer_contacts', 'blocked');
select t.try('0045', 'Vic can add a private note', 'clinic_vic', 'write', $$insert into public.application_notes (application_id, note) values ('{app_ann_c}', 'Looks good')$$, '1 rows');
select t.try('0045', 'Nell cannot add a note', 'clinic_nell', 'write', $$insert into public.application_notes (application_id, note) values ('{app_ann_c}', 'x')$$, 'refused');
select t.try('0045', 'Vic still cannot change an application directly', 'clinic_vic', 'write', $$update public.applications set status = 'offer' where id = '{app_ann_c}'$$, 'refused');
select t.try('0045', 'Vic reads the numbers for clinic C''s jobs', 'clinic_vic', 'count', 'select * from public.job_daily_stats', '0 rows');
select t.try('0045', 'Vic cannot read templates (they are for posting)', 'clinic_vic', 'count', 'select * from public.job_templates', 'blocked');
select t.try('0045', 'the owner sees the 2 team members', 'clinic_c', 'count', 'select * from public.employer_members', '2 rows');
select t.try('0045', 'Vic sees the team too', 'clinic_vic', 'count', 'select * from public.employer_members', '2 rows');
select t.try('0045', 'clinic D sees nothing of clinic C''s team', 'clinic_d', 'count', 'select * from public.employer_members', 'blocked');
select t.try('0045', 'nobody adds a member with their own sign in, not even the owner', 'clinic_c', 'write', $$insert into public.employer_members (employer_id, user_id, level) values ('{employer_c}', '{clinic_nell}', 'edit')$$, 'refused');
select t.try('0045', 'Vic cannot raise herself to view and edit', 'clinic_vic', 'write', $$update public.employer_members set level = 'edit' where user_id = '{clinic_vic}'$$, 'refused');
select t.try('0045', 'Edith cannot remove someone', 'clinic_edith', 'write', $$delete from public.employer_members where user_id = '{clinic_vic}'$$, 'refused');
select t.try('0045', 'nobody reads invitations with their own sign in', 'clinic_c', 'count', 'select * from public.employer_invites', 'refused');
select t.try('0045', 'the admin record is for the server only', 'admin', 'count', 'select * from public.admin_actions', 'refused');
select t.try('0045', 'the server can add 2 more (5 people with the owner)', 'server', 'write', $$insert into public.employer_members (employer_id, user_id, level) values ('{employer_c}', '{clinic_m3}', 'view'), ('{employer_c}', '{clinic_m4}', 'view')$$, '2 rows');
select t.try('0045', 'a 6th person is refused', 'server', 'write', $$insert into public.employer_members (employer_id, user_id, level) values ('{employer_c}', '{clinic_m3}', 'view'), ('{employer_c}', '{clinic_m4}', 'view'), ('{employer_c}', '{clinic_m5}', 'view')$$, 'refused');
select t.try('0047', 'the owner of a clinic cannot be on its own team', 'server', 'write', $$insert into public.employer_members (employer_id, user_id, level) values ('{employer_c}', '{clinic_c}', 'view')$$, 'refused');
select t.try('0047', 'the owner of another clinic can join clinic C', 'server', 'write', $$insert into public.employer_members (employer_id, user_id, level) values ('{employer_c}', '{clinic_d}', 'view')$$, '1 rows');
select t.try('0047', 'a person can be on 2 locations'' teams', 'server', 'write', $$insert into public.employer_members (employer_id, user_id, level) values ('{employer_d}', '{clinic_vic}', 'view')$$, '1 rows');
select t.try('0047', 'a team member cannot be made the owner of the location they are on', 'server', 'write', $$update public.employers set owner_id = '{clinic_vic}' where id = '{employer_c}'$$, 'refused');
select t.try('0047', 'but may own a clinic of their own', 'clinic_vic', 'write', $$insert into public.employers (owner_id, clinic_name, practice_type, province, city) values ('{clinic_vic}', 'Vic Eye Care', 'independent', 'Ontario', 'Guelph')$$, '1 rows');
select t.try('0045', 'the database knows Vic as view only', 'clinic_vic', 'value', $$select public.employer_level('{employer_c}')$$, 'view');
select t.try('0045', 'and Edith as view and edit', 'clinic_edith', 'value', $$select public.employer_level('{employer_c}')$$, 'edit');
select t.try('0045', 'and the owner as owner', 'clinic_c', 'value', $$select public.employer_level('{employer_c}')$$, 'owner');
select t.try('0045', 'and Nell as nothing', 'clinic_nell', 'value', $$select public.employer_level('{employer_c}')$$, '(nothing)');
select t.try('0045', 'a visitor cannot ask', 'visitor', 'value', $$select public.employer_level('{employer_c}')$$, 'refused');

-- ---------------------------------------------------------------- 0046: help requests and feedback are for the website's server only
select t.try('0046', 'a visitor cannot read help requests', 'visitor', 'count', 'select * from public.support_requests', 'refused');
select t.try('0046', 'a clinic cannot read help requests with its own sign in', 'clinic_c', 'count', 'select * from public.support_requests', 'refused');
select t.try('0046', 'a clinic cannot give Kestrel access by writing a request itself', 'clinic_c', 'write', $$insert into public.support_requests (user_id, employer_id, kind, message, access_until, access_text) values ('{clinic_c}', '{employer_c}', 'help', 'Please help me', now() + interval '7 days', 'x')$$, 'refused');
select t.try('0046', 'the admin cannot read them with their own sign in either', 'admin', 'count', 'select * from public.support_requests', 'refused');
select t.try('0046', 'the server records a help request with access', 'server', 'write', $$insert into public.support_requests (user_id, employer_id, kind, reason, message, access_until, access_text) values ('{clinic_c}', '{employer_c}', 'help', 'team', 'Cannot invite my manager', now() + interval '7 days', 'I allow Kestrel')$$, '1 rows');
select t.try('0046', 'access can only come with a help request from a clinic', 'server', 'write', $$insert into public.support_requests (user_id, kind, message, access_until, access_text) values ('{ann}', 'bug', 'The page is slow', now() + interval '7 days', 'x')$$, 'refused');
select t.try('0046', 'the server records feedback from a candidate', 'server', 'write', $$insert into public.support_requests (user_id, kind, message) values ('{ann}', 'idea', 'Let me save searches')$$, '1 rows');

-- ---------------------------------------------------------------- 0047: several locations under 1 owner
select t.try('0047', 'an owner can add a second location', 'clinic_c', 'write', $$insert into public.employers (owner_id, clinic_name, practice_type, province, city) values ('{clinic_c}', 'Clinic C West', 'independent', 'Ontario', 'Kitchener')$$, '1 rows');
select t.try('0047', 'nobody adds a location for someone else', 'clinic_c', 'write', $$insert into public.employers (owner_id, clinic_name, practice_type, province, city) values ('{clinic_d}', 'Not mine', 'independent', 'Ontario', 'Guelph')$$, 'refused');
select t.try('0047', 'a candidate still cannot create a clinic', 'ann', 'write', $$insert into public.employers (owner_id, clinic_name, practice_type, province, city) values ('{ann}', 'Fake', 'independent', 'Ontario', 'Guelph')$$, 'refused');
select t.try('0047', 'the 26th location is refused', 'server', 'write', $$insert into public.employers (owner_id, clinic_name, practice_type, province, city) select '{clinic_d}', 'Location ' || n, 'corporate', 'Alberta', 'Red Deer' from generate_series(1, 25) n$$, 'refused');
select t.try('0047', '25 locations are fine', 'server', 'write', $$insert into public.employers (owner_id, clinic_name, practice_type, province, city) select '{clinic_d}', 'Location ' || n, 'corporate', 'Alberta', 'Red Deer' from generate_series(1, 24) n$$, '24 rows');
select t.try('0047', 'an invitation can cover more locations', 'server', 'value', $$select coalesce(array_length(also_employer_ids, 1), 0)::text from public.employer_invites limit 1$$, '(nothing)');

-- ---------------------------------------------------------------- 0048: job payments (a card saved at submission, charged at approval)
select t.try('0048', 'the server records a saved card for a job', 'server', 'write', $$insert into public.job_payments (job_id, employer_id, job_title, clinic_name, band, amount_cents, status, stripe_payment_method_id) values (null, '{employer_c}', 'Optician', 'Clinic C', 'opticians', 7900, 'card_saved', 'pm_test')$$, '1 rows');
select t.try('0048', 'the same job cannot have 2 payments in play (no double charge)', 'server', 'write', $$insert into public.job_payments (job_id, employer_id, job_title, clinic_name, band, amount_cents, status) values ('{job_c_live}', '{employer_c}', 'Optician', 'Clinic C', 'opticians', 7900, 'awaiting_card')$$, 'refused');
select t.try('0048', 'a failed payment does not block a new card for the same job', 'server', 'write', $$insert into public.job_payments (job_id, employer_id, job_title, clinic_name, band, amount_cents, status) values ('{job_d_live}', '{employer_d}', 'Optician', 'Clinic D', 'opticians', 7900, 'failed')$$, '1 rows');
select t.try('0048', 'a price below zero is refused', 'server', 'write', $$insert into public.job_payments (job_id, employer_id, job_title, clinic_name, band, amount_cents, status) values (null, '{employer_c}', 'Optician', 'Clinic C', 'opticians', -1, 'failed')$$, 'refused');
select t.try('0048', 'the owner reads the status of their own 2 payments', 'clinic_c', 'count', 'select id, status, amount_cents from public.job_payments', '2 rows');
select t.try('0048', 'a team member with view and edit reads them too', 'clinic_edith', 'count', 'select id, status from public.job_payments', '2 rows');
select t.try('0048', 'another clinic reads only its own', 'clinic_d', 'count', 'select id from public.job_payments', '1 rows');
select t.try('0048', 'the Stripe card is never readable by a clinic', 'clinic_c', 'count', 'select stripe_payment_method_id from public.job_payments', 'refused');
select t.try('0048', 'the Stripe payment id is never readable by a clinic', 'clinic_c', 'count', 'select stripe_payment_intent_id from public.job_payments', 'refused');
select t.try('0048', 'a clinic cannot add a payment of its own', 'clinic_c', 'write', $$insert into public.job_payments (job_id, employer_id, job_title, clinic_name, band, amount_cents, status) values (null, '{employer_c}', 'Optician', 'Clinic C', 'opticians', 0, 'free_launch')$$, 'refused');
select t.try('0048', 'a clinic cannot change what it was charged', 'clinic_c', 'write', $$update public.job_payments set amount_cents = 0$$, 'refused');
select t.try('0048', 'a clinic cannot delete a payment record', 'clinic_c', 'write', $$delete from public.job_payments$$, 'refused');
select t.try('0048', 'a candidate reads none of them', 'ann', 'count', 'select id from public.job_payments', '0 rows');
select t.try('0048', 'a visitor cannot read them', 'visitor', 'count', 'select id from public.job_payments', 'refused');
select t.try('0048', 'which Stripe customer a clinic is stays on the server', 'clinic_c', 'count', 'select * from public.employer_billing', 'refused');
select t.try('0048', 'a visitor cannot read the billing table', 'visitor', 'count', 'select * from public.employer_billing', 'refused');
select t.try('0048', 'the server links a clinic to a Stripe customer', 'server', 'write', $$insert into public.employer_billing (employer_id, stripe_customer_id) values ('{employer_c}', 'cus_test')$$, '1 rows');
select t.try('0048', 'a clinic is 1 Stripe customer only', 'server', 'write', $$insert into public.employer_billing (employer_id, stripe_customer_id) values ('{employer_c}', 'cus_a'), ('{employer_c}', 'cus_b')$$, 'refused');
select t.try('0048', 'the payment record outlives the job (the link is cleared when a job is deleted)', 'server', 'value', $$select confdeltype::text from pg_constraint where conrelid = 'public.job_payments'::regclass and confrelid = 'public.jobs'::regclass$$, 'n');

-- ---------------------------------------------------------------- 0049: the notes log for each job is for the website's server only
select t.try('0049', 'the server adds a note to a job', 'server', 'write', $$insert into public.job_activity (job_id, actor, text, detail) values ('{job_c_live}', 'admin', 'Approved', 'x')$$, '1 rows');
select t.try('0049', 'a note must say who made it (system, admin or clinic)', 'server', 'write', $$insert into public.job_activity (job_id, actor, text) values ('{job_c_live}', 'stranger', 'x')$$, 'refused');
select t.try('0049', 'a note belongs to a real job', 'server', 'write', $$insert into public.job_activity (job_id, actor, text) values ('00000000-0000-0000-0000-000000000000', 'system', 'x')$$, 'refused');
select t.try('0049', 'a clinic cannot read the notes log with its own sign in', 'clinic_c', 'count', 'select * from public.job_activity', 'refused');
select t.try('0049', 'a candidate cannot read it', 'ann', 'count', 'select * from public.job_activity', 'refused');
select t.try('0049', 'a visitor cannot read it', 'visitor', 'count', 'select * from public.job_activity', 'refused');
select t.try('0049', 'the admin cannot read it with their own sign in either (the server does)', 'admin', 'count', 'select * from public.job_activity', 'refused');
select t.try('0049', 'a clinic cannot write a note', 'clinic_c', 'write', $$insert into public.job_activity (job_id, actor, text) values ('{job_c_live}', 'clinic', 'x')$$, 'refused');
select t.try('0049', 'the notes go when their job is deleted', 'server', 'value', $$select confdeltype::text from pg_constraint where conrelid = 'public.job_activity'::regclass and confrelid = 'public.jobs'::regclass$$, 'c');

-- ---------------------------------------------------------------- 0050: invoice links on payments
select t.try('0050', 'the server saves the invoice for a payment', 'server', 'write', $$update public.job_payments set stripe_invoice_id = 'in_test', invoice_number = 'KEST-0001', invoice_url = 'https://invoice.example/x', invoice_pdf_url = 'https://invoice.example/x.pdf' where status = 'charged'$$, '1 rows');
select t.try('0050', 'a clinic reads the number and links for its own payments', 'clinic_c', 'count', 'select invoice_number, invoice_url, invoice_pdf_url from public.job_payments', '2 rows');
select t.try('0050', 'a clinic never reads the Stripe invoice id', 'clinic_c', 'count', 'select stripe_invoice_id from public.job_payments', 'refused');
select t.try('0050', 'another clinic reads only its own invoice links', 'clinic_d', 'count', 'select invoice_url from public.job_payments', '1 rows');
select t.try('0050', 'a clinic cannot change an invoice link', 'clinic_c', 'write', $$update public.job_payments set invoice_url = 'https://evil.example'$$, 'refused');
select t.try('0050', 'a visitor cannot read invoice links', 'visitor', 'count', 'select invoice_url from public.job_payments', 'refused');
