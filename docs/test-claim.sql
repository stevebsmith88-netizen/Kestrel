-- A pretend "found on the clinic's website" listing, so you can try Claim your listing.
-- It is a TEST: the clinic is fake, and its website is eyecarejobs.ca so that an address like
-- steve+claim@eyecarejobs.ca counts as "an address at the clinic's own website".
-- The listing is public while it exists. Run the clean up at the bottom as soon as you have finished.

with e as (
  insert into public.employers (owner_id, clinic_name, practice_type, website, province, city, about, claimed)
  values (null, 'Test Optical (sample, not real)', 'independent', 'https://eyecarejobs.ca', 'Ontario', 'Toronto', null, false)
  returning id
)
insert into public.jobs (employer_id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max,
                         is_existing_vacancy, uses_ai_screening, description, apply_method, apply_url, status, is_seeded,
                         source_url, posted_at, expires_at)
select id, 'Optician (TEST listing)', 'Optician', 'Full time', 'Ontario', 'Toronto', 'year', 58000, 72000,
       true, false,
       'This is a sample listing used to test Kestrel. It is not a real job. The clinic is not real, and nobody should apply.',
       'external', 'https://eyecarejobs.ca', 'live', true,
       'https://eyecarejobs.ca', now(), now() + interval '21 days'
from e;

-- CLEAN UP (run when you are done). Removes the fake clinic, its job and any claims made on it.
-- delete from public.employers where clinic_name = 'Test Optical (sample, not real)';
-- If you approved a claim, that account now owns the fake clinic. Delete the test account on the Account page first.
