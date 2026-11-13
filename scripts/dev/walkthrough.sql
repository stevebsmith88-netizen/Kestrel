-- Development only (audit P1-19c). A scripted walk through of the life of an application, run against the throwaway scratch database:
-- sign up, a clinic sets up and posts, a candidate applies, the clinic views, shortlists and declines, then both kinds of account are deleted.
-- At every step it checks what the database rules allow, as each person and as the website's own server. It does what the website does,
-- in the same order, with the same columns (lib/auth-actions.ts, lib/candidate-actions.ts, lib/applicant-actions.ts, lib/account-actions.ts).
-- Run with: npm run test:db   (or bash scripts/dev/walkthrough.sh). Never run this on the live or demo database: it adds made up people.

drop schema if exists w cascade;
create schema w;
create table w.ids (name text primary key, id uuid not null default gen_random_uuid());
create table w.tickets (name text primary key, ticket uuid not null);
create table w.results (n serial primary key, step text, label text, want text, got text, pass boolean);
grant usage on schema w to public;
grant select, update on w.ids to public;
grant all on w.tickets to public;

insert into w.ids (name) values ('ann'), ('bo'), ('sneaky'), ('spare'), ('clinic_c'), ('clinic_d'), ('employer_c'), ('employer_d'), ('job_c'),
                                ('app_ann'), ('app_bo'), ('app_bo_again');

-- Records a result. Runs as its owner so every role can call it.
create function w.check(step text, label text, got text, want text) returns void language sql security definer as $$
  insert into w.results (step, label, want, got, pass) values (step, label, want, got, got is not distinct from want)
$$;

-- Switches the session to one of the people (or the website's server). Any switch is allowed because the session itself is the database owner.
create function w.be(who text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce((select id::text from w.ids where name = who), ''), false);
  perform set_config('role', case who when 'visitor' then 'anon' when 'server' then 'service_role' when 'auth_service' then 'supabase_auth_admin'
                                      when 'owner' then 'postgres' else 'authenticated' end, false);
end $$;

-- Tries a statement as the current person, undoes it, and says what happened: 'refused' or 'N rows'. {name} is replaced by that person's or thing's id.
create function w.attempt(statement text) returns text language plpgsql as $$
declare n bigint; r record;
begin
  for r in select name, id from w.ids loop statement := replace(statement, '{' || r.name || '}', r.id::text); end loop;
  begin
    execute statement;
    get diagnostics n = row_count;
    raise exception using errcode = 'KT001', message = 'undo this attempt';
  exception
    when sqlstate 'KT001' then return n || ' rows';
    when others then return 'refused';
  end;
end $$;
grant execute on function w.check(text, text, text, text), w.be(text), w.attempt(text) to public;

-- The id of a person or thing, as text.
create function w.id(name text) returns text language sql stable security definer as $$ select id::text from w.ids where name = $1 $$;
grant execute on function w.id(text) to public;

-- A sign up the way Supabase's own sign up service does it: a new row in auth.users, carrying the ticket the website asked the database for.
create function w.sign_up(name text, role text, ticket uuid) returns void language plpgsql as $$
begin
  insert into auth.users (id, email, raw_user_meta_data)
  values (w.id(name)::uuid, name || '@walk.test',
          jsonb_build_object('role', role, 'first_name', initcap(replace(name, '_', ' ')), 'last_name', 'Walker', 'signup_ticket', ticket));
end $$;
grant execute on function w.sign_up(text, text, uuid) to public;

update public.signup_gate set open = false;
delete from auth.users where email like '%@walk.test';

-- ================================================================ 1. sign up

select w.be('auth_service');
select w.check('1 sign up', 'no ticket and the gate shut: refused', w.attempt($$insert into auth.users (email, raw_user_meta_data) values ('x@walk.test', '{"role":"candidate"}')$$), 'refused');
select w.be('owner');
update public.signup_gate set open = true;
select w.be('auth_service');
select w.check('1 sign up', 'no ticket and the gate open: still refused for an email sign up (P1-03)', w.attempt($$insert into auth.users (email, raw_user_meta_data) values ('x@walk.test', '{"role":"candidate"}')$$), 'refused');
select w.be('owner');
update public.signup_gate set open = false;

select w.be('visitor');
select w.check('1 sign up', 'a visitor cannot ask the database for a ticket', w.attempt('select public.issue_signup_ticket()'), 'refused');
select w.be('server');
insert into w.tickets select n, public.issue_signup_ticket() from unnest(array['ann', 'bo', 'clinic_c', 'clinic_d', 'sneaky', 'spare']) as n;
select w.be('auth_service');
select w.sign_up('ann', 'candidate', (select ticket from w.tickets where name = 'ann'));
select w.check('1 sign up', 'the same ticket cannot be used twice', w.attempt($$select w.sign_up('spare', 'candidate', (select ticket from w.tickets where name = 'ann'))$$), 'refused');
select w.sign_up('bo', 'candidate', (select ticket from w.tickets where name = 'bo'));
select w.sign_up('clinic_c', 'clinic', (select ticket from w.tickets where name = 'clinic_c'));
select w.sign_up('clinic_d', 'clinic', (select ticket from w.tickets where name = 'clinic_d'));
-- Someone who puts "admin" in the sign up details becomes an ordinary candidate.
insert into auth.users (id, email, raw_user_meta_data)
values (w.id('sneaky')::uuid, 'sneaky@walk.test', jsonb_build_object('role', 'admin', 'first_name', 'Sneaky', 'signup_ticket', (select ticket from w.tickets where name = 'sneaky')));
select w.be('owner');
select w.check('1 sign up', 'a candidate sign up makes a candidate profile', (select role from public.profiles where id = w.id('ann')::uuid), 'candidate');
select w.check('1 sign up', 'a clinic sign up makes a clinic profile', (select role from public.profiles where id = w.id('clinic_c')::uuid), 'clinic');
select w.check('1 sign up', 'asking for admin at sign up gives a candidate', (select role from public.profiles where id = w.id('sneaky')::uuid), 'candidate');
select w.check('1 sign up', 'the used ticket is not left in the account details', (select count(*)::text from auth.users where email like '%@walk.test' and raw_user_meta_data ? 'signup_ticket'), '0');
select w.check('1 sign up', 'only the 1 unused ticket is left waiting', (select count(*)::text from public.signup_tickets), '1');
select w.be('bo');
select w.check('1 sign up', 'Bo reads only her own profile', (select count(*)::text from public.profiles), '1');
select w.check('1 sign up', 'Bo cannot make herself an admin', w.attempt($$update public.profiles set role = 'admin' where id = '{bo}'$$), 'refused');

-- ================================================================ 2. a clinic sets up and posts a job

select w.be('clinic_c');
-- A clinic saves its own profile and jobs with its own sign in, and the database makes the ids.
insert into public.employers (owner_id, clinic_name, practice_type, province, city) values (w.id('clinic_c')::uuid, 'Walk Clinic C', 'independent', 'Ontario', 'Guelph');
update w.ids set id = (select id from public.employers where owner_id = w.id('clinic_c')::uuid) where name = 'employer_c';
insert into public.employer_contacts (employer_id, notify_email) values (w.id('employer_c')::uuid, 'c@walk.test');
insert into public.jobs (employer_id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening, description, status)
values (w.id('employer_c')::uuid, 'Optician', 'Optician', 'Full time', 'Ontario', 'Guelph', 'year', 50000, 60000, true, false, 'A made up job used only by the walk through in scripts/dev.', 'in_review');
update w.ids set id = (select id from public.jobs where employer_id = w.id('employer_c')::uuid) where name = 'job_c';
select w.check('2 clinic', 'a clinic cannot publish its own job', w.attempt($$update public.jobs set status = 'live', posted_at = now(), expires_at = now() + interval '30 days' where id = '{job_c}'$$), 'refused');
select w.be('visitor');
select w.check('2 clinic', 'a job waiting for review is not public', (select count(*)::text from public.jobs), '0');
select w.be('server');
update public.jobs set status = 'live', posted_at = now(), expires_at = now() + interval '30 days' where id = w.id('job_c')::uuid;
select w.be('visitor');
select w.check('2 clinic', 'once approved, the job is public', (select count(*)::text from public.jobs), '1');
select w.be('clinic_d');
insert into public.employers (owner_id, clinic_name, practice_type, province, city) values (w.id('clinic_d')::uuid, 'Walk Clinic D', 'independent', 'Alberta', 'Red Deer');
update w.ids set id = (select id from public.employers where owner_id = w.id('clinic_d')::uuid) where name = 'employer_d';
select w.check('2 clinic', 'clinic D cannot change clinic C''s job (rows)', w.attempt($$update public.jobs set title = 'Hacked' where id = '{job_c}'$$), '0 rows');

-- ================================================================ 3. candidates set up their profiles

select w.be('ann');
insert into public.candidate_profiles (user_id, profession, licensed_provinces) values (w.id('ann')::uuid, 'Optician', array['Ontario']);
select w.check('3 profile', 'Ann cannot point her profile at a resume she did not upload', w.attempt($$update public.candidate_profiles set cv_path = 'someone/else.pdf' where user_id = '{ann}'$$), 'refused');
select w.be('bo');
insert into public.candidate_profiles (user_id, profession, licensed_provinces) values (w.id('bo')::uuid, 'Optician', array['Ontario']);
select w.check('3 profile', 'Bo reads only her own candidate profile', (select count(*)::text from public.candidate_profiles), '1');
select w.be('server');
update public.candidate_profiles set cv_path = user_id || '/resume.pdf', cv_filename = 'resume.pdf', cv_uploaded_at = now() where user_id in (w.id('ann')::uuid, w.id('bo')::uuid);
select w.be('clinic_c');
select w.check('3 profile', 'a clinic cannot read any candidate profile', (select count(*)::text from public.candidate_profiles), '0');

-- ================================================================ 4. a candidate applies

select w.be('ann');
select w.check('4 apply', 'Ann cannot create an application herself', w.attempt($$insert into public.applications (job_id, candidate_id, applicant, job_title, clinic_name, job_location) values ('{job_c}', '{ann}', '{}', 'x', 'x', 'x')$$), 'refused');
select w.be('server');
-- The website's server saves the application with a copy of what the candidate chose to send, then the first history line, and tells the clinic.
insert into public.applications (id, job_id, candidate_id, cover_letter, keep_details, applicant, job_title, clinic_name, job_location)
values (w.id('app_ann')::uuid, w.id('job_c')::uuid, w.id('ann')::uuid, 'Hello from Ann', true, '{"name": "Ann Walker", "email": "ann@walk.test"}', 'Optician', 'Walk Clinic C', 'Guelph, Ontario'),
       (w.id('app_bo')::uuid, w.id('job_c')::uuid, w.id('bo')::uuid, 'Hello from Bo', false, '{"name": "Bo Walker", "email": "bo@walk.test"}', 'Optician', 'Walk Clinic C', 'Guelph, Ontario');
insert into public.application_events (application_id, status) values (w.id('app_ann')::uuid, 'applied'), (w.id('app_bo')::uuid, 'applied');
insert into public.notifications (user_id, kind, title, href) values (w.id('clinic_c')::uuid, 'application', 'A new applicant for Optician', '/clinic');
select w.check('4 apply', 'a second application to the same job by the same person is refused', w.attempt($$insert into public.applications (job_id, candidate_id, applicant, job_title, clinic_name, job_location) values ('{job_c}', '{ann}', '{}', 'x', 'x', 'x')$$), 'refused');
-- Saved drafts, a saved letter and a hidden job, so there is something personal to delete later.
insert into public.cover_letter_templates (user_id, name, body) values (w.id('ann')::uuid, 'My letter', 'Hello');
insert into public.application_drafts (user_id, job_id, cover_letter) values (w.id('ann')::uuid, w.id('job_c')::uuid, 'half written');

select w.be('ann');
select w.check('4 apply', 'Ann sees her 1 application through the masked copy', (select count(*)::text from public.my_applications()), '1');
select w.check('4 apply', 'it shows Applied', (select status from public.my_applications()), 'applied');
select w.check('4 apply', 'Ann cannot read the applications table directly (0040)', (select count(*)::text from public.applications), '0');
select w.be('bo');
select w.check('4 apply', 'Bo sees only her own application', (select count(*)::text from public.my_applications()), '1');
select w.check('4 apply', 'Bo cannot read Ann''s history', (select count(*)::text from public.my_application_events(w.id('app_ann')::uuid)), '0');
select w.be('clinic_c');
select w.check('4 apply', 'clinic C sees both applications to its job', (select count(*)::text from public.applications), '2');
select w.check('4 apply', 'clinic C has 1 inbox message', (select count(*)::text from public.notifications), '1');
select w.be('clinic_d');
select w.check('4 apply', 'clinic D sees none of them', (select count(*)::text from public.applications), '0');
select w.check('4 apply', 'clinic D sees none of the history', (select count(*)::text from public.application_events), '0');
select w.be('visitor');
select w.check('4 apply', 'a visitor sees no application', w.attempt('select id from public.applications'), 'refused');

-- ================================================================ 5. the clinic views and shortlists

select w.be('clinic_c');
select w.check('5 shortlist', 'a clinic cannot move an application itself, only the website can', w.attempt($$update public.applications set status = 'viewed' where id = '{app_ann}'$$), 'refused');
select w.be('server');
update public.applications set status = 'viewed', viewed_at = now(), status_changed_at = now(), updated_at = now() where id = w.id('app_ann')::uuid and status = 'applied';
insert into public.application_events (application_id, status) values (w.id('app_ann')::uuid, 'viewed');
select w.be('ann');
select w.check('5 shortlist', 'Ann sees Viewed once the clinic opens it', (select status from public.my_applications()), 'viewed');
select w.be('server');
-- Shortlisting is quiet: the status and the history line change, and nobody is emailed or sent an inbox message.
update public.applications set status = 'shortlisted', clinic_message = null, status_changed_at = now(), updated_at = now() where id = w.id('app_ann')::uuid;
insert into public.application_events (application_id, status) values (w.id('app_ann')::uuid, 'shortlisted');
select w.be('ann');
select w.check('5 shortlist', 'Ann still sees Viewed, never Shortlisted', (select status from public.my_applications()), 'viewed');
select w.check('5 shortlist', 'her history has 2 steps', (select count(*)::text from public.my_application_events(w.id('app_ann')::uuid)), '2');
select w.check('5 shortlist', 'and none of them is Shortlisted', (select count(*)::text from public.my_application_events(w.id('app_ann')::uuid) where status = 'shortlisted'), '0');
select w.check('5 shortlist', 'she cannot read Shortlisted from the table directly', (select count(*)::text from public.applications where status = 'shortlisted'), '0');
select w.check('5 shortlist', 'she cannot read it from the history table directly', (select count(*)::text from public.application_events where status = 'shortlisted'), '0');
select w.check('5 shortlist', 'she has no inbox message about it', (select count(*)::text from public.notifications), '0');
select w.check('5 shortlist', 'she cannot change her own status', w.attempt($$update public.applications set status = 'offer' where id = '{app_ann}'$$), 'refused');
select w.be('clinic_c');
select w.check('5 shortlist', 'clinic C sees Shortlisted', (select status from public.applications where id = w.id('app_ann')::uuid), 'shortlisted');
select w.check('5 shortlist', 'clinic C sees Bo still at Applied', (select status from public.applications where id = w.id('app_bo')::uuid), 'applied');
select w.check('5 shortlist', 'clinic C sees the 3 steps of Ann''s history', (select count(*)::text from public.application_events where application_id = w.id('app_ann')::uuid), '3');

-- ================================================================ 6. the clinic declines

select w.be('server');
update public.applications set status = 'not_selected', clinic_message = 'Thank you for applying. We have chosen other candidates this time.', status_changed_at = now(), updated_at = now() where id = w.id('app_ann')::uuid;
insert into public.application_events (application_id, status, note) values (w.id('app_ann')::uuid, 'not_selected', 'Thank you for applying. We have chosen other candidates this time.');
insert into public.notifications (user_id, kind, title, href) values (w.id('ann')::uuid, 'application', 'An update on Optician at Walk Clinic C', '/candidate/applications');
select w.be('ann');
select w.check('6 decline', 'Ann sees Not selected', (select status from public.my_applications()), 'not_selected');
select w.check('6 decline', 'with the clinic''s message', (select clinic_message from public.my_applications()), 'Thank you for applying. We have chosen other candidates this time.');
select w.check('6 decline', 'her history has 3 steps', (select count(*)::text from public.my_application_events(w.id('app_ann')::uuid)), '3');
select w.check('6 decline', 'the last step carries the message', (select note from public.my_application_events(w.id('app_ann')::uuid) where status = 'not_selected'), 'Thank you for applying. We have chosen other candidates this time.');
select w.check('6 decline', 'she has 1 inbox message', (select count(*)::text from public.notifications), '1');
select w.check('6 decline', 'she can mark it read', w.attempt($$update public.notifications set read_at = now() where user_id = '{ann}'$$), '1 rows');
select w.check('6 decline', 'she cannot delete it', w.attempt($$delete from public.notifications where user_id = '{ann}'$$), 'refused');
insert into public.candidate_job_hides (user_id, job_id) values (w.id('ann')::uuid, w.id('job_c')::uuid);
select w.check('6 decline', 'she can hide a job for herself', (select count(*)::text from public.candidate_job_hides), '1');
select w.be('bo');
select w.check('6 decline', 'Bo is not affected and is still at Applied', (select status from public.my_applications()), 'applied');
select w.check('6 decline', 'Bo cannot read Ann''s inbox', (select count(*)::text from public.notifications), '0');

-- ================================================================ 7. Ann deletes her account

-- The website removes her resume files, then asks Supabase's auth service to delete the account, and the database cascades.
select w.be('owner');
delete from auth.users where id = w.id('ann')::uuid;
select w.be('server');
insert into public.account_deletions (account_role, jobs_count, applications_count) values ('candidate', 0, 1);
select w.be('owner');
select w.check('7 delete Ann', 'her sign in is gone', (select count(*)::text from auth.users where id = w.id('ann')::uuid), '0');
select w.check('7 delete Ann', 'her profile is gone', (select count(*)::text from public.profiles where id = w.id('ann')::uuid), '0');
select w.check('7 delete Ann', 'her candidate profile is gone', (select count(*)::text from public.candidate_profiles where user_id = w.id('ann')::uuid), '0');
select w.check('7 delete Ann', 'her application is gone', (select count(*)::text from public.applications where id = w.id('app_ann')::uuid), '0');
select w.check('7 delete Ann', 'its history is gone', (select count(*)::text from public.application_events where application_id = w.id('app_ann')::uuid), '0');
select w.check('7 delete Ann', 'her inbox is gone', (select count(*)::text from public.notifications where user_id = w.id('ann')::uuid), '0');
select w.check('7 delete Ann', 'her saved letter is gone', (select count(*)::text from public.cover_letter_templates where user_id = w.id('ann')::uuid), '0');
select w.check('7 delete Ann', 'her draft is gone', (select count(*)::text from public.application_drafts where user_id = w.id('ann')::uuid), '0');
select w.check('7 delete Ann', 'her hidden job is gone', (select count(*)::text from public.candidate_job_hides where user_id = w.id('ann')::uuid), '0');
select w.check('7 delete Ann', 'nothing with her email is left in what clinics were sent', (select count(*)::text from public.applications where applicant ->> 'email' = 'ann@walk.test'), '0');
select w.check('7 delete Ann', 'the deletion record has no names or addresses (only 5 plain columns)',
  (select string_agg(column_name, ',' order by column_name) from information_schema.columns where table_schema = 'public' and table_name = 'account_deletions'),
  'account_role,applications_count,deleted_at,id,jobs_count');
select w.check('7 delete Ann', 'Bo''s account and application are untouched', (select count(*)::text from public.applications where candidate_id = w.id('bo')::uuid), '1');
select w.be('clinic_c');
select w.check('7 delete Ann', 'clinic C now has only Bo''s application', (select count(*)::text from public.applications), '1');
select w.be('bo');
select w.check('7 delete Ann', 'Bo still sees hers', (select count(*)::text from public.my_applications()), '1');

-- ================================================================ 8. the clinic deletes its account

select w.be('owner');
delete from auth.users where id = w.id('clinic_c')::uuid;
select w.be('server');
insert into public.account_deletions (account_role, jobs_count, applications_count) values ('clinic', 1, 1);
select w.be('owner');
select w.check('8 delete clinic', 'the clinic profile is gone', (select count(*)::text from public.profiles where id = w.id('clinic_c')::uuid), '0');
select w.check('8 delete clinic', 'the clinic is gone', (select count(*)::text from public.employers where id = w.id('employer_c')::uuid), '0');
select w.check('8 delete clinic', 'its contact details are gone', (select count(*)::text from public.employer_contacts where employer_id = w.id('employer_c')::uuid), '0');
select w.check('8 delete clinic', 'its job is gone', (select count(*)::text from public.jobs where id = w.id('job_c')::uuid), '0');
select w.check('8 delete clinic', 'Bo''s application is kept, no longer linked to the job (0044)', (select count(*)::text from public.applications where candidate_id = w.id('bo')::uuid and job_id is null and clinic_left_at is not null), '1');
select w.check('8 delete clinic', 'it keeps its own copy of the job title and clinic name', (select count(*)::text from public.applications where candidate_id = w.id('bo')::uuid and job_title <> '' and clinic_name <> ''), '1');
select w.check('8 delete clinic', 'the clinic''s private notes on it are gone', (select count(*)::text from public.application_notes n join public.applications a on a.id = n.application_id where a.candidate_id = w.id('bo')::uuid), '0');
select w.check('8 delete clinic', 'its history says the clinic left', (select count(*)::text from public.application_events e join public.applications a on a.id = e.application_id where a.candidate_id = w.id('bo')::uuid and e.status = 'clinic_left'), '1');
select w.check('8 delete clinic', 'Bo is told in her inbox that the clinic left', (select count(*)::text from public.notifications where user_id = w.id('bo')::uuid and kind = 'clinic_left'), '1');
select w.check('8 delete clinic', 'its inbox is gone', (select count(*)::text from public.notifications where user_id = w.id('clinic_c')::uuid), '0');
select w.check('8 delete clinic', 'Bo''s account is still there', (select count(*)::text from public.profiles where id = w.id('bo')::uuid), '1');
select w.check('8 delete clinic', 'and so is clinic D''s', (select count(*)::text from public.employers where id = w.id('employer_d')::uuid), '1');
select w.be('bo');
select w.check('8 delete clinic', 'Bo still sees her application, with no job attached (0044)', (select count(*)::text from public.my_applications() where job_id is null), '1');
select w.check('8 delete clinic', 'and still sees its history', (select count(*)::text from public.my_application_events((select id from public.my_applications() limit 1)) where status = 'clinic_left'), '1');
select w.be('clinic_d');
select w.check('8 delete clinic', 'another clinic cannot see the kept application', (select count(*)::text from public.applications), '0');
select w.be('visitor');
select w.check('8 delete clinic', 'a visitor sees no live job', (select count(*)::text from public.jobs), '0');
select w.be('owner');
select w.check('8 delete clinic', 'both deletions were recorded', (select count(*)::text from public.account_deletions), '2');

-- ================================================================ tidy up (this is a throwaway database, but leave it clean)

select w.be('owner');
delete from auth.users where email like '%@walk.test';
delete from public.account_deletions;
update public.signup_gate set open = false;
