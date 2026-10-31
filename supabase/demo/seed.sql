-- DEMO SITE ONLY. Fills a separate demo copy of Kestrel with sample clinics, jobs and (optionally) sample applicants.
-- NEVER run this on the live Supabase project: it would publish fake jobs on eyecarejobs.ca.
-- Safe to run more than once. It only touches its own sample data (clinics whose names end in "(sample)", and the 2 demo accounts below).
--
-- Part 1 needs nothing but the migrations (supabase/combined/run-everything.sql).
-- Part 2 needs the 2 demo accounts to exist first: sign up on the demo site with the 2 addresses below (candidate and clinic),
-- then run this file again. If an account is missing, that part is simply skipped.

-- ------------------------------------------------------------------ PART 1: the demo marker, an open gate and sample clinics and jobs

create table if not exists public.demo_marker (id boolean primary key default true check (id));
insert into public.demo_marker (id) values (true) on conflict (id) do nothing;
alter table public.demo_marker enable row level security;
revoke all on public.demo_marker from anon, authenticated;

-- People can create their own demo accounts on the demo site.
update public.signup_gate set open = true, updated_at = now();

delete from public.employers where clinic_name like '% (sample)';

insert into public.employers (owner_id, clinic_name, practice_type, website, province, city, about, claimed) values
  (null, 'Harbourside Optical (sample)', 'independent', null, 'British Columbia', 'Victoria', 'A family owned clinic near the harbour, with 3 optometrists and a team of 9. We have been fitting glasses in Victoria for more than 20 years.', true),
  (null, 'Maple Grove Eye Care (sample)', 'corporate', null, 'Ontario', 'Toronto', 'A group of 14 clinics across the Greater Toronto Area, with training and room to grow for every role.', true),
  (null, 'Northern Lights Optometry (sample)', 'independent', null, 'Alberta', 'Edmonton', 'A busy independent practice with a strong contact lens and children''s vision focus.', true),
  (null, 'Prairie Vision Centre (sample)', 'independent', null, 'Manitoba', 'Winnipeg', 'A friendly 2 optometrist clinic in the heart of Winnipeg.', true),
  (null, 'Fundy Family Eye Care (sample)', 'independent', null, 'New Brunswick', 'Moncton', 'A family eye care clinic serving Moncton and the surrounding communities.', true),
  (null, 'Granite Coast Optical (sample)', 'corporate', null, 'Nova Scotia', 'Halifax', 'A regional optical group with 6 stores across Nova Scotia.', true),
  (null, 'Okanagan Eye Group (sample)', 'corporate', null, 'British Columbia', 'Kelowna', 'A group of 5 clinics across the Okanagan, with an in house lab.', true),
  (null, 'Capital Optometry (sample)', 'independent', null, 'Ontario', 'Ottawa', 'An independent practice a short walk from Parliament Hill, seeing patients of all ages.', true),
  (null, 'Clearview Lens Co (sample)', 'supplier', null, 'Ontario', 'Mississauga', 'A Canadian lens manufacturer supplying independent and corporate practices from coast to coast.', true),
  (null, 'Lakeshore Optical (sample)', 'independent', null, 'Ontario', 'Hamilton', null, false),
  (null, 'Riverbend Eye Clinic (sample)', 'independent', null, 'Saskatchewan', 'Saskatoon', null, false);

-- Each row: clinic, title, role, type, pay period, min, max, existing vacancy, description, how to apply, field area, extra pay, days since posted
with sample(clinic, title, role, etype, period, pmin, pmax, vacancy, descr, how, territory, extras, days_ago, seeded) as (values
  ('Harbourside Optical (sample)', 'Optician', 'Optician', 'Full time', 'year', 62000, 74000, true,
   'Join a friendly independent clinic as our full time optician. You will fit and adjust frames, help patients choose lenses and work closely with our optometrists. We offer a 4 day week, mentoring and extended health benefits.', 'kestrel', null, null, 3, false),
  ('Harbourside Optical (sample)', 'Optometric assistant', 'Optometric assistant or technician', 'Part time', 'hour', 22, 26, true,
   'We are looking for a part time optometric assistant to run pre-testing and help patients before their exam. Training is provided. 2 to 3 days a week, including some Saturdays.', 'kestrel', null, null, 6, false),
  ('Maple Grove Eye Care (sample)', 'Optometrist', 'Optometrist', 'Full time', 'year', 125000, 165000, true,
   'An optometrist is needed at our Etobicoke clinic. You would see a mix of family patients, with modern equipment, a full support team and a clear path to mentoring newer colleagues.', 'kestrel', null, null, 2, false),
  ('Maple Grove Eye Care (sample)', 'Practice manager', 'Practice or clinic manager', 'Full time', 'year', 72000, 90000, false,
   'Lead the front and back of one of our busiest clinics: scheduling, staff, stock and patient experience. You will report to the regional manager and work with a team of 12.', 'kestrel', null, null, 9, false),
  ('Northern Lights Optometry (sample)', 'Locum optometrist', 'Optometrist', 'Locum', 'hour', 70, 90, true,
   'We need a locum optometrist for 6 weeks while one of our team is away. Full schedule, a supportive team and help finding short term accommodation if you are travelling in.', 'kestrel', null, null, 1, false),
  ('Northern Lights Optometry (sample)', 'Optician', 'Optician', 'Full time', 'year', 58000, 70000, true,
   'A full time optician for a clinic with a strong contact lens focus. You will dispense, adjust and educate patients, and share the front of house with 2 other opticians.', 'kestrel', null, null, 12, false),
  ('Prairie Vision Centre (sample)', 'Patient care coordinator', 'Patient care or reception', 'Full time', 'hour', 21, 25, true,
   'Be the first friendly face patients meet. You will book appointments, manage the schedule and help with insurance questions. Eye care experience is helpful, but we will train the right person.', 'kestrel', null, null, 5, false),
  ('Fundy Family Eye Care (sample)', 'Optometric technician', 'Optometric assistant or technician', 'Full time', 'hour', 23, 28, true,
   'Join our team as an optometric technician. You will run pre-testing, take retinal images and support our optometrists through a busy day. Paid training towards certification.', 'kestrel', null, null, 8, false),
  ('Granite Coast Optical (sample)', 'Optician', 'Optician', 'Part time', 'hour', 26, 32, false,
   'A part time optician for our Halifax store, 20 to 25 hours a week including weekends. You will fit frames, take measurements and help patients find glasses they love.', 'kestrel', null, null, 14, false),
  ('Okanagan Eye Group (sample)', 'Optometrist', 'Optometrist', 'Contract', 'year', 120000, 160000, true,
   'A contract optometrist for our Kelowna clinic, with a flexible schedule and support from our in house team. Many of our optometrists stay for years, and we would love you to as well.', 'kestrel', null, null, 4, false),
  ('Okanagan Eye Group (sample)', 'Lab optician', 'Optician', 'Full time', 'year', 52000, 64000, true,
   'Work in our in house lab, cutting and edging lenses and checking finished glasses for quality. Experience with an edger is an asset, and we will train you on our equipment.', 'kestrel', null, null, 10, false),
  ('Capital Optometry (sample)', 'Optometric assistant', 'Optometric assistant or technician', 'Full time', 'hour', 22, 27, true,
   'A full time optometric assistant for a busy practice that sees patients of all ages. You will do pre-testing, help with contact lens teaching and keep the exam rooms running smoothly.', 'kestrel', null, null, 7, false),
  ('Capital Optometry (sample)', 'Clinic receptionist', 'Patient care or reception', 'Part time', 'hour', 20, 23, true,
   'Part time reception, mostly afternoons, greeting patients, handling bookings and answering the phone. A calm, friendly manner matters more to us than experience.', 'kestrel', null, null, 11, false),
  ('Clearview Lens Co (sample)', 'Territory representative, Southern Ontario', 'Sales or territory representative', 'Full time', 'year', 62000, 78000, true,
   'Visit optical practices across Southern Ontario, show our lens range and look after your accounts. Around 2 nights away a month. Experience in an optical practice or lab is a strong advantage.', 'kestrel', 'Southern Ontario and Ottawa', 'Plus commission and a company vehicle', 5, false),
  ('Clearview Lens Co (sample)', 'Clinical trainer', 'Trainer or clinical educator', 'Full time', 'year', 70000, 88000, false,
   'Teach clinic teams how to get the most from our lens designs, in the clinic and online. You will work with opticians and optometric assistants, and travel about a week a month.', 'kestrel', 'Ontario and the Maritimes', 'Plus a travel allowance', 13, false),
  ('Clearview Lens Co (sample)', 'Field service technician', 'Field service or equipment technician', 'Full time', 'hour', 32, 42, true,
   'Install, calibrate and repair lens equipment such as edgers and lensometers at clinics and labs across the Greater Toronto Area. You will be home most nights.', 'kestrel', 'Greater Toronto Area', 'Company van and tools provided', 15, false),
  ('Lakeshore Optical (sample)', 'Optician', 'Optician', 'Full time', 'year', 56000, 68000, true,
   'An optician role listed from the clinic''s own careers page. Fit and dispense glasses in a friendly independent store. Apply on the clinic''s website.', 'external', null, null, 4, true),
  ('Riverbend Eye Clinic (sample)', 'Optometric assistant', 'Optometric assistant or technician', 'Part time', 'hour', 20, 24, true,
   'A part time optometric assistant listed from the clinic''s own careers page. Pre-testing and patient support in a small clinic. Apply on the clinic''s website.', 'external', null, null, 6, true)
)
insert into public.jobs (employer_id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening,
                         description, apply_method, apply_url, work_arrangement, territory, pay_extras, status, is_seeded, source_url, posted_at, expires_at)
select e.id, s.title, s.role, s.etype, e.province, e.city, s.period, s.pmin, s.pmax, s.vacancy, false,
       s.descr, s.how, case when s.how = 'external' then 'https://example.com/careers' end,
       case when s.territory is not null then 'field' else 'on_site' end, s.territory, s.extras,
       'live', s.seeded, case when s.seeded then 'https://example.com/careers' end,
       now() - make_interval(days => s.days_ago),
       now() - make_interval(days => s.days_ago) + make_interval(days => case when s.seeded then 21 else 30 end)
from sample s join public.employers e on e.clinic_name = s.clinic;

-- ------------------------------------------------------------------ PART 2: the 2 demo accounts (skipped if they do not exist yet)
-- Change the 2 addresses below if you used different ones. They are the addresses you signed up with on the demo site.
do $$
declare
  clinic_email    text := 'kestrel+democlinic@eyecarejobs.ca';
  candidate_email text := 'kestrel+democandidate@eyecarejobs.ca';
  clinic_user uuid := (select id from auth.users where email = clinic_email limit 1);
  cand_user   uuid := (select id from auth.users where email = candidate_email limit 1);
  emp uuid;
  j_optician uuid; j_assistant uuid; j_other uuid;
  names text[] := array['Alex Morgan', 'Priya Raman', 'Jordan Lee', 'Maya Chen', 'Daniel Okafor', 'Sofia Martins'];
  jobs_for int[] := array[1, 1, 1, 1, 2, 2];
  statuses text[] := array['applied', 'viewed', 'shortlisted', 'interview', 'applied', 'applied'];
  professions text[] := array['Optician', 'Optician', 'Optician', 'Optician', 'Optometric assistant or technician', 'Optometric assistant or technician'];
  years text[] := array['5 to 9 years', '1 to 4 years', '10 or more years', '5 to 9 years', '1 to 4 years', 'Under 1 year'];
  i int; u uuid; app uuid; target uuid;
begin
  if clinic_user is not null then
    -- the demo clinic: a profile, a live job with applicants, a job waiting in the review queue, and a draft
    delete from public.employers where owner_id = clinic_user;
    insert into public.employers (owner_id, clinic_name, practice_type, website, province, city, about, claimed, direct_hire_confirmed_at)
    values (clinic_user, 'Riverside Family Eye Care (demo)', 'independent', 'https://example.com', 'Ontario', 'Toronto',
            'A friendly independent clinic in east Toronto. This is a demo account, and nothing here is real.', true, now())
    returning id into emp;
    insert into public.employer_contacts (employer_id, notify_email) values (emp, clinic_email)
    on conflict (employer_id) do update set notify_email = excluded.notify_email;
    insert into public.jobs (employer_id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening, description, apply_method, status, posted_at, expires_at)
    values (emp, 'Optician', 'Optician', 'Full time', 'Ontario', 'Toronto', 'year', 60000, 72000, true, false,
            'Join our friendly team as a full time optician. You will fit and dispense glasses, work with our optometrists and help patients feel confident in their choice.', 'kestrel', 'live', now() - interval '4 days', now() + interval '26 days')
    returning id into j_optician;
    insert into public.jobs (employer_id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening, description, apply_method, status, posted_at, expires_at)
    values (emp, 'Optometric assistant', 'Optometric assistant or technician', 'Part time', 'Ontario', 'Toronto', 'hour', 22, 26, true, false,
            'A part time optometric assistant to run pre-testing and support our optometrists. Training provided, with some Saturdays.', 'kestrel', 'live', now() - interval '2 days', now() + interval '28 days')
    returning id into j_assistant;
    insert into public.jobs (employer_id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening, description, apply_method, status)
    values (emp, 'Practice manager', 'Practice or clinic manager', 'Full time', 'Ontario', 'Toronto', 'year', 70000, 88000, false, false,
            'Run the day to day of our clinic, including scheduling, supplies and a team of 8. This post is waiting for review, so you can show how approval works.', 'kestrel', 'in_review');
    insert into public.jobs (employer_id, title, province, city, status) values (emp, 'Locum optometrist', 'Ontario', 'Toronto', 'draft');

    -- sample applicants, who cannot sign in, so the applicants board has something to show
    for i in 1..6 loop
      u := (select id from auth.users where email = format('sample.applicant%s@demo.invalid', i) limit 1);
      if u is null then
        u := gen_random_uuid();
        insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        values (u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', format('sample.applicant%s@demo.invalid', i), now(),
                '{"provider":"email","providers":["email"]}', jsonb_build_object('role', 'candidate', 'full_name', names[i]), now(), now());
      end if;
      target := case jobs_for[i] when 1 then j_optician else j_assistant end;
      insert into public.applications (job_id, candidate_id, cover_letter, status, applicant, job_title, clinic_name, job_location, viewed_at)
      values (target, u,
              'Hello, I am excited to apply. I enjoy helping patients and have worked in a busy clinic. I would love to talk about how I could help your team.',
              statuses[i],
              jsonb_build_object('name', names[i], 'email', format('sample.applicant%s@demo.invalid', i), 'phone', '416 555 01' || (10 + i), 'profession', professions[i],
                                 'licensed_provinces', jsonb_build_array('Ontario'), 'years_experience', years[i], 'available_from', (current_date + 21)::text),
              case jobs_for[i] when 1 then 'Optician' else 'Optometric assistant' end, 'Riverside Family Eye Care (demo)', 'Toronto, Ontario',
              case when statuses[i] = 'applied' then null else now() - interval '1 day' end)
      returning id into app;
      insert into public.application_events (application_id, status) values (app, 'applied');
      if statuses[i] <> 'applied' then insert into public.application_events (application_id, status) values (app, statuses[i]); end if;
    end loop;
  end if;

  if cand_user is not null then
    -- the demo candidate: a profile, one application to follow in the tracker, and a job alert
    insert into public.candidate_profiles (user_id, profession, licensed_provinces, years_experience, available_from, phone)
    values (cand_user, 'Optician', array['Ontario'], '5 to 9 years', current_date + 14, '416 555 0199')
    on conflict (user_id) do update set profession = excluded.profession, licensed_provinces = excluded.licensed_provinces,
      years_experience = excluded.years_experience, available_from = excluded.available_from, phone = excluded.phone;
    delete from public.applications where candidate_id = cand_user;
    app := null;
    insert into public.applications (job_id, candidate_id, cover_letter, status, applicant, job_title, clinic_name, job_location, viewed_at)
    select j.id, cand_user, 'Hello, I would love to join your team. I have 5 to 9 years of experience as an optician and enjoy helping patients choose glasses they love.', 'viewed',
           jsonb_build_object('name', coalesce(p.full_name, 'Demo Candidate'), 'email', candidate_email, 'phone', '416 555 0199', 'profession', 'Optician',
                              'licensed_provinces', jsonb_build_array('Ontario'), 'years_experience', '5 to 9 years', 'available_from', (current_date + 14)::text),
           j.title, e.clinic_name, j.city || ', ' || j.province, now() - interval '1 day'
    from public.jobs j join public.employers e on e.id = j.employer_id left join public.profiles p on p.id = cand_user
    where j.id = (select jj.id from public.jobs jj join public.employers ee on ee.id = jj.employer_id where ee.clinic_name = 'Harbourside Optical (sample)' and jj.title = 'Optician' limit 1)
    returning id into app;
    if app is not null then
      insert into public.application_events (application_id, status) values (app, 'applied'), (app, 'viewed');
    end if;
    delete from public.job_alerts where user_id = cand_user;
    insert into public.job_alerts (user_id, role_category, province, frequency) values (cand_user, 'Optician', 'Ontario', 'weekly');
  end if;
end $$;
