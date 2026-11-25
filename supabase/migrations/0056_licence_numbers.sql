-- 0056: registration number on a candidate's profile (Steve, 19th November 2026; plan in docs/plans/licence-numbers.md). Safe to run twice.
--
-- An optometrist or optician can give the number their college issued them, the province, and (opticians) whether they are registered for
-- eyeglasses, contact lenses or both. It is entered by the candidate and is not checked by Kestrel. It is private: visitors cannot read it,
-- and a clinic gets it only inside an application the candidate sends (it is saved with the application, like the phone number). The number
-- is text, so a leading zero is kept. The website checks the shape (lib/licence.ts); the database limits the length.

alter table public.candidate_profiles add column if not exists licence_province text;
alter table public.candidate_profiles add column if not exists licence_number text;
alter table public.candidate_profiles add column if not exists licence_does text[] not null default '{}';
alter table public.candidate_profiles add column if not exists licence_not_yet boolean not null default false;

alter table public.candidate_profiles drop constraint if exists candidate_profiles_licence_length;
alter table public.candidate_profiles add constraint candidate_profiles_licence_length check (
  char_length(coalesce(licence_province, '')) <= 40 and char_length(coalesce(licence_number, '')) <= 20
);

grant insert (licence_province, licence_number, licence_does, licence_not_yet) on public.candidate_profiles to authenticated;
grant update (licence_province, licence_number, licence_does, licence_not_yet) on public.candidate_profiles to authenticated;
