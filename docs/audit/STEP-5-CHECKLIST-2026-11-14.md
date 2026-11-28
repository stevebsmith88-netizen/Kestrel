# Step 5 checklist for Steve (14th November 2026)

Two checks from the post audit (`docs/audit/POST-AUDIT-2026-11-12.md`, section 7) that only Steve can do. No code is left in step 5: D-01 (jobs first on a phone), D-02 and D-06 (ad builder), D-03, D-04, D-05, X-03 and X-07 are fixed (see `docs/audit/AUDIT-FIXES-LOG.md`). Never paste a key into chat. Tell Claude only what you see.

## Check 1: previews must not use the live database (R9), about 20 minutes

Why: a preview link runs code that has not been approved yet. If it uses the live database and the live email key, a preview can change real records or email real people.

1. Open Vercel, then the **kestrel** project (the live one), then Settings, Environment Variables.
2. Find `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY`. Look at which environments are ticked beside each: Production, Preview, Development.
3. **Good:** Preview is not ticked on the live values. **Needs fixing:** Preview is ticked, which means previews use live data.
4. Settings, then Deployment Protection: check Vercel Authentication is on for previews.
5. Tell Claude what you see (which boxes are ticked, and whether protection is on). If Preview is ticked, Claude will say what to put there instead, a separate preview database and a test email key, and nothing is changed until you agree.

Note: the **kestrel-demo** project is meant to use its own demo database, so check that one too, and confirm none of its keys match the live project.

## Check 2: walk the clinic's applicant steps on a phone (4B and 4C), about 30 minutes

Why: the earlier walk could not finish, because no job could be approved, so these screens have not been seen in a browser.

Before you start: reset and reseed the demo if it has junk in it (`supabase/demo/reset.sql`, then `supabase/demo/seed.sql`, in the demo project's SQL editor only).

1. Sign in on your phone as a demo clinic at https://demo.eyecarejobs.ca and post a job (the title should now fill itself in as you choose the role).
2. Sign in as admin, open Review queue, approve the job.
3. Sign in as a demo candidate in a second browser or a private window, find the job and apply.
4. Back as the clinic, open the applicant. Look for:
   - the applicant's details are all there, and match what the candidate sent
   - shortlist, interview, offer and decline all work, and the candidate sees each as expected
   - "Filled it?" works and asks how the role was filled
   - nothing is cut off, overlapping or too small to tap
5. As the candidate, check the application shows the right status each time (a shortlist shows as Viewed).
6. Note anything that looks wrong with the page and a screenshot, and send it to Claude.

Tick each box as you go. If anything fails, it goes straight onto the next tasks list.
