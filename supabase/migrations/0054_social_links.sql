-- 0054: optional social links (Steve, 15th November 2026). Safe to run twice.
--
-- A clinic or company can add its Instagram, Facebook and LinkedIn page, shown as small icons on its public page. A candidate can add their
-- LinkedIn profile, which goes to a clinic only with an application (it is saved with the application, like the phone number).
-- The website checks every address (lib/social-links.ts: https only, on the platform's own website). The database only limits the length.

alter table public.employers add column if not exists social_instagram text;
alter table public.employers add column if not exists social_facebook text;
alter table public.employers add column if not exists social_linkedin text;

alter table public.employers drop constraint if exists employers_social_length;
alter table public.employers add constraint employers_social_length check (
  char_length(coalesce(social_instagram, '')) <= 200 and char_length(coalesce(social_facebook, '')) <= 200 and char_length(coalesce(social_linkedin, '')) <= 200
);

-- Public columns: visitors see the links on a clinic's page. Only the clinic's own people change them (the row rules already decide who).
grant select (social_instagram, social_facebook, social_linkedin) on public.employers to anon;
grant insert (social_instagram, social_facebook, social_linkedin) on public.employers to authenticated;
grant update (social_instagram, social_facebook, social_linkedin) on public.employers to authenticated;

-- A candidate's LinkedIn profile. Private: not readable by visitors, and a clinic gets it only inside an application the candidate sends.
alter table public.candidate_profiles add column if not exists linkedin_url text;

alter table public.candidate_profiles drop constraint if exists candidate_profiles_linkedin_length;
alter table public.candidate_profiles add constraint candidate_profiles_linkedin_length check (linkedin_url is null or char_length(linkedin_url) <= 200);

grant insert (linkedin_url) on public.candidate_profiles to authenticated;
grant update (linkedin_url) on public.candidate_profiles to authenticated;
