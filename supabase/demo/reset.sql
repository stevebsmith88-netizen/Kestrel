-- DEMO SITE ONLY. Clears everything visitors created on the demo site, so the next walkthrough starts clean.
-- It deletes every account except the 3 below (and all their data), the waitlist, and any jobs and clinics. Then run seed.sql again.
-- It refuses to run unless the database has the demo marker that seed.sql creates, so it cannot run on the live project by mistake.
do $$
declare
  keep text[] := array['kestrel+democlinic@eyecarejobs.ca', 'kestrel+democandidate@eyecarejobs.ca', 'kestrel+demoadmin@eyecarejobs.ca'];
begin
  if to_regclass('public.demo_marker') is null then
    raise exception 'This is not the demo database (no demo marker). Nothing was deleted.';
  end if;
  delete from public.employers;
  delete from auth.users where email <> all (keep);
  delete from public.waitlist;
  delete from public.email_suppressions;
end $$;
