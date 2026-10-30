# Lens 2: Data and row level security
Reach: read all 17 migrations, the combined file, verify.sql and the auth stub, plus the server code that writes to the database. Tested on scratch Postgres 16 databases I built (lens2_sb emulates Supabase's default permissions; lens2_stub is the repo's plain stub) with a 9 persona fixture. Could not reach live Supabase, so real grants, Storage policies and Auth are checked by reading only.

## Findings

### 2.1 Deleting one account wipes the other side's records, including report evidence
- Severity: Medium  | Confidence: Confirmed
- For Steve: When a candidate deletes their account, the clinic's copy of every application from them (and the clinic's private notes) disappears. When a clinic deletes its account, every job it posted, every application candidates sent it, and every "Report this job" complaint about it disappears too, so a scam clinic that gets reported can erase the evidence in 1 click. Ontario now expects employers to keep postings and application records for 3 years, so this needs a lawyer's view before real users arrive.
- Evidence: every foreign key cascades (pg_constraint listing): `applications.candidate_id -> auth.users on delete CASCADE`, `employers.owner_id -> auth.users CASCADE`, `jobs.employer_id -> employers CASCADE`, `applications.job_id -> jobs CASCADE`, `job_reports.job_id -> jobs CASCADE`, `application_notes / application_events -> applications CASCADE` (0005:35,76; 0006:71-72,99,109; 0010:100). Test $S/lens-2/deletion.sql on the fixture:
  `before            | apps 4 | notes 2 | reports 2 | jobs 7`
  `delete candidate A| apps 1 | notes 0 | reports 2` (clinic X and Y lose all 3 of Ann's applications and their notes)
  `delete clinic X   | apps 1 | notes 1 | reports 1 | jobs 2` (the "scam" report on clinic X's live job is gone; candidates A and B lose 3 tracker entries)
  `W claimed a seeded clinic, then deleted account | emp 2 | jobs 6 | reports 1` (the found listing and its report vanish with the claimant).
  lib/account-actions.ts:57-58 relies on these cascades and writes no record of the deletion, although app/privacy/page.tsx:142-143 promises "a minimal record that we received and carried out your request". There is no table for it.
- Detail: hard delete everywhere is simple and good for candidates' privacy, but it removes data that belongs to the other party or to Kestrel's trust and safety work. Applications already hold a snapshot (applicant JSON, job title, clinic name), so they can survive without the account.
- Proposed fix: decide with a lawyer what to keep and for how long. Likely shape: on candidate deletion, keep the application row for the clinic but strip it to the snapshot (or anonymise after a set period); on clinic deletion, keep jobs and reports with the employer marked deleted (change `on delete cascade` to `set null` or soft delete), and add a small `account_deletions` log (user id hash, date, who). Then update the privacy policy to match.  | Effort: 1 day  | Who: Lawyer, then Claude


### 2.2 CVs are left behind when an account is deleted any way other than the Account page
- Severity: Medium  | Confidence: Confirmed (from code and schema; Storage itself not testable here)
- For Steve: The database tidies itself when an account is deleted, but CV files are separate and only the "Delete my account" button removes them. If you delete someone by hand (the privacy policy and the error message both say "email privacy@ and we will do it for you", and docs/test-accounts.md shows deleting a user in the SQL editor), their CV and every copy sent with their applications stay in storage for ever, with nothing pointing at them, so you could not even find them to answer a later request.
- Evidence: lib/account-actions.ts:37-55 collects `candidate_profiles.cv_path` and `applications.cv_path` and removes those files before `auth.admin.deleteUser`; nothing in the 17 migrations touches storage (grep for `storage.` in supabase/migrations: 0 statements), so a delete through the Supabase dashboard or `delete from auth.users` (docs/test-accounts.md:45) cascades the rows away (2.1 test: `delete candidate A | apps 1`) and loses the only record of the file paths (`<user id>/<uuid>.pdf` and `applications/<application id>/cv.pdf`, lib/candidate-actions.ts:82,170). The error path at lib/account-actions.ts:61 tells people to email privacy@eyecarejobs.ca.
- Proposed fix: add an admin "Delete this account" action that reuses deleteAccount's file clean up, and write the hand deletion steps into docs/breach-plan.md or a short privacy runbook (delete files in Storage, folder = user id, plus each application folder, before deleting the user). Optionally a weekly check that lists CV files with no matching row.  | Effort: hours  | Who: Claude

### 2.3 Nothing keeps a copy of what was published, so "compare it with what candidates saw" is impossible
- Severity: Medium  | Confidence: Confirmed
- For Steve: When a clinic edits a live job, the database overwrites the old wording, pay and answers in place. The review queue tells you to "compare it with what candidates saw", but the old version no longer exists anywhere, and an application only remembers the job title, clinic and town, not the pay range or the 2 answers the candidate applied under.
- Evidence: escalation test 14: `X: live -> in_review with edit | 1` (status change and new title accepted in 1 statement, 0014:116-121 only blocks edits while the status stays the same). No history or version table exists (17 tables, none for job versions). app/admin/review/page.tsx:61 shows "Compare it with what candidates saw". applications snapshot columns are only job_title, clinic_name, job_location (0006:83-85).
- Detail: this matters for the admin review of live edits (a clinic could change pay or the AI screening answer and the reviewer cannot see what changed), for disputes with candidates, and for the Ontario 3 year posting record. Closed and expired jobs are kept (good), but edited ones are not.
- Proposed fix: add a `job_versions` table filled by a trigger whenever a job leaves `live` (copy of the row as JSON, with the date), show the last version beside the edit in the review queue, and add pay_min, pay_max, pay_period and the 2 answers to the application snapshot.  | Effort: hours  | Who: Claude


### 2.4 Re-running an old migration on its own quietly undoes later ones (the docs invite it)
- Severity: Medium  | Confidence: Confirmed
- For Steve: Several setup pages say "run 0005 (or 0006, 0007) in the SQL editor, it is safe to run twice". Today that is no longer true: running 0005 on its own would take the public job search offline and stop clinics editing live jobs. Only ever run the combined file.
- Evidence: built lens2_sb (all migrations), copied it to lens2_rerun, then re-ran 0005 and 0002 alone:
  `anon select of jobs.work_arrangement/territory/pay_extras`: before 3 grants, after 0 rows; `set role anon; select id, work_arrangement from public.jobs` -> `ERROR: permission denied for table jobs` (lib/public-jobs.ts:51 selects work_arrangement with the anon client, so /jobs would fail).
  `enforce_job_changes allows live -> in_review`: before t, after f (0005 reinstalls the old trigger body from 0005:144-171, so "Edit a live job" fails with "That change is not allowed").
  `profiles UPDATE columns for authenticated`: before first_name,full_name,last_name, after full_name only (0002:56 table level revoke wipes the 0003 column grants). employers UPDATE loses direct_hire_confirmed_at (0009:72). Re-running 0003 alone reinstalls a sign up trigger that ignores Google sign in (account_type_confirmed logic from 0017 lost).
  Docs that say a single file is safe to re-run: docs/clinics-and-jobs.md:19, docs/candidates-and-applications.md:20, docs/automation-and-ai.md:29.
- Detail: each file is idempotent against the state it was written for, but later files replace functions and add column grants that an earlier file's `create or replace function` and `revoke all` then reset. The combined file is fine because it always runs everything in order (see Good things).
- Proposed fix: change those 3 docs to "run supabase/combined/run-everything.sql, never a single numbered file"; optionally add a comment at the top of each numbered file saying the same.  | Effort: minutes  | Who: Claude


### 2.5 Any signed in person can read clinic owners' account ids, and an account id alone unsubscribes that person
- Severity: Low  | Confidence: Confirmed
- For Steve: Anyone with a free account can list the private account number of every clinic owner that has a live job. The "unsubscribe" link for accounts is just that number, so a prankster or competitor could quietly opt every clinic out of your marketing email and put them on the do not email list.
- Evidence: 0005:283 `grant select on public.employers to authenticated` (all columns) plus the policy "Anyone can read clinics that have live jobs" (0005:201-204, `to anon, authenticated`). Test: `S: read owner_id/status of clinics with live jobs | 2` (signed in stranger reads 2 owner ids; anon is correctly refused: `anon read owner_id | ERR 42501`). The cron builds `${SITE_URL}/unsubscribe/${userId}` (app/api/cron/daily/route.ts, alert email) and lib/unsubscribe.ts:14-27 accepts any UUID with no signature, sets `profiles.unsubscribed_at`, `marketing_consent=false` and adds the address to email_suppressions. The same grant also exposes `status`, `direct_hire_confirmed_at` and `created_at`; jobs exposes `review_note` to signed in users (`S: read review_note column of live jobs | 3`, normally null once live).
- Detail: lib/unsubscribe-token.ts already has an HMAC signer used for address unsubscribes; the account link does not use it. Clinics can also read their applicants' candidate_id the same way (applications SELECT).
- Proposed fix: replace the table level grant with a column list for authenticated (same columns anon gets, plus the owner reading its own row through a separate policy or a server read), and sign account unsubscribe links like address ones.  | Effort: hours  | Who: Claude


### 2.6 The 10 open jobs limit (and the other count limits) can be beaten
- Severity: Low  | Confidence: Confirmed
- For Steve: The "at most 10 open jobs" rule that keeps agencies out can be stepped around: 2 posts sent at the same moment both get in, and a job you sent back can be reopened as a draft even when the clinic is already at 10.
- Evidence: race test on a copy of the fixture (lens2_race): `open before race: 9`, 2 concurrent inserts as clinic X, `open after race: 11`; a 12th insert then fails with "You can have up to 10 open jobs". Second path: with 10 open, `update jobs set status='draft'` on a rejected job returned `1` (11 open). Cause: `jobs_limit_open BEFORE INSERT` only (0009:89-92), counting with a plain `select count(*)` under READ COMMITTED. The same pattern is used for 5 alerts (0008:21-38), 20 templates, 5 letters and 50 drafts (0015).
- Detail: each needs a deliberate script or an admin rejection first, so it is low risk; but the 10 job limit is a stated part of the pitch.
- Proposed fix: in limit_open_jobs, take `perform pg_advisory_xact_lock(hashtext(new.employer_id::text))` before counting, and fire it on `insert or update of status` when the new status is open and the old one was not.  | Effort: minutes  | Who: Claude


### 2.7 Pay range rule has a loophole, and some posting rules live only in the website code
- Severity: Low  | Confidence: Confirmed
- For Steve: A post with pay of "$1 to $99,999,999 a year" or "1 cent an hour" passes every check, and the review queue does not flag it, because any range whose top is over $200,000 is allowed to be any width, and there is no lowest pay. Separately, a technically minded clinic can skip the website form and write to the database with its own sign in, which skips the Canadian experience check and the https only rule for apply links; your review is then the only safety net.
- Evidence: escalation tests as clinic X inserting `status='in_review'`: `submit yearly 1 to 99999999 | 1`, `submit hourly 0.01 to 0.02 | 1`, `submit with Canadian experience required | 1`, `external apply with javascript: url | 1`; while the database does block the core rules: `submit with no pay | check`, `yearly range 60001 wide | check`, `hourly range 25 wide | check`, `without the 2 questions | check`. Rule: 0005:113-116 and lib/jobs.ts:109-111 (same formula, so the review flag at lib/jobs.ts:219 never fires for these). Clinic job writes use the signed in user's own database session (lib/clinic-actions.ts:115,146,152), so the TypeScript checks (lib/jobs.ts:171-174 https, Canadian experience) are advisory. React 19.3 blocks `javascript:` links when rendering, so that case is defused, but any http link is accepted.
- Proposed fix: in both the check constraint and payRangeAllowed, apply the "no limit" exemption only when the bottom of the range is also over $200,000 (or require min to be at least half of max), add a floor (for example $15 an hour or $30,000 a year) and a review flag for ranges above $200,000 on non optometrist roles; add `apply_url ~ '^https://'` and a Canadian experience `check (description !~* 'canadian\s+experience')` to the jobs table.  | Effort: hours  | Who: Claude (pay floor wording: Steve)


### 2.8 The scratch database used for earlier "row level security tested" claims does not have Supabase's permissions
- Severity: Low  | Confidence: Confirmed (for the rig); Possible (for the live grants)
- For Steve: The practice database used to test the security rules is missing permissions that every real Supabase project has, so some earlier tests said "refused" for the wrong reason, and the server's own access could not be tested at all. I rebuilt it with Supabase's usual permissions and re-ran everything: the rules hold (see the matrix below), but a few tables are protected by 1 layer instead of 2.
- Evidence: scripts/dev/auth-stub.sql creates the roles but no default privileges (`\ddp` on database kestrel: 0 rows). Same matrix on both builds (diff of $S/lens-2/matrix-lens2_sb.txt and matrix-lens2_stub.txt): in the stub build `profiles SEL` is `no-grant` for every signed in user (in Supabase each person reads their own row, which lib/auth.ts:41 depends on), `waitlist` is `no-grant` instead of `rls-deny`, and `service_role` is `no-grant` on every table. With Supabase's defaults emulated ($S/lens-2/supabase-defaults.sql), table grants are: `waitlist|anon|DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE` (same for authenticated) and `profiles|authenticated|REFERENCES,SELECT,TRIGGER,TRUNCATE`, because 0001 and 0002 never `revoke all` the way 0005 to 0015 do.
- Detail: TRUNCATE and TRIGGER are not reachable through the website's database API, and RLS with no policy blocks the rest, so nothing leaks today. But the waitlist (public email addresses) relies on 1 switch; a future careless policy would open it.
- Proposed fix: add a migration with `revoke all on public.waitlist from anon, authenticated; revoke truncate, references, trigger on public.profiles from authenticated;` and add the 3 `alter default privileges ... grant all ... to anon, authenticated, service_role` lines to scripts/dev/auth-stub.sql (plus `grant all on all tables in schema public to service_role` after migrations) so future tests match production.  | Effort: minutes  | Who: Claude


### 2.9 Small gaps in the job rules (grouped)
- Severity: Low  | Confidence: Confirmed
- For Steve: A handful of edge cases where the database allows something the docs say cannot happen. None exposes data; they mostly create confusing states in the review queue.
- Evidence (escalation tests as clinic X unless noted, $S/lens-2/escalation-out.txt):
  1. `live -> in_review -> draft | 1`: docs/clinics-and-jobs.md says "A live job cannot be saved as a draft"; lib/clinic-actions.ts:143 stops it on save, but the trigger (0014:116-121) allows both steps and the dashboard's withdraw action (lib/clinic-actions.ts:183-187, in_review to draft, no check of posted_at) does the second step through the normal UI. The draft keeps its old posted_at and expires_at.
  2. `live but past expiry: in_review | 1`: a job whose 30 days ran out before the daily job ran can be sent to review; the cron only expires `status = 'live'` (app/api/cron/daily/route.ts:46), and approval keeps the old dates (lib/admin-actions.ts:24-25), so it "goes live" already expired and never shows.
  3. `backdate direct hire confirmation | 1`: the clinic can set `direct_hire_confirmed_at` to any date or null (0009:72 grants it), so the "record" proves little.
  4. `A: set own name to 100000 chars | 1`: profiles names have no length check in the database; the name is copied into every application snapshot.
  5. Suspended clinics: with `employers.status = 'suspended'`, anon still sees its live job (test result `10` = 1 job row, 0 clinic rows); the jobs policy (0005:240-243) does not check the clinic's status. Nothing sets this status yet.
- Proposed fix: in enforce_job_changes, allow `in_review -> draft` only when `posted_at is null`, and refuse `live -> in_review` when `expires_at <= now()`; set direct_hire_confirmed_at with `default now()` and remove it from the update grant; add `check (char_length(full_name) <= 120 ...)`; add `and exists (select 1 from employers e where e.id = employer_id and e.status = 'active')` to the public jobs policy.  | Effort: hours  | Who: Claude


## RLS matrix summary
Reproduce: build a database from scripts/dev/auth-stub.sql + $S/lens-2/supabase-defaults.sql + every migration in order, then run $S/lens-2/fixture.sql, $S/lens-2/try-fn.sql, $S/lens-2/rls-matrix.sql and $S/lens-2/pivot.sql (full output: $S/lens-2/matrix-lens2_sb.txt; escalation tests: $S/lens-2/escalation.sql and escalation-out.txt). 17 tables x 4 operations x 9 personas (anon, S signed in stranger, A and B candidates, X and Y clinics, W clinic with no profile, M admin, service role), every cell rolled back. Targets are the owner's rows, so any number above 0 for a non owner would be a leak.

| Table | Who can read (rows seen) | Who can write | Notes |
| --- | --- | --- | --- |
| waitlist | service only | service only | anon/auth: RLS deny (grants are open, see 2.8) |
| profiles | own row; admin all 7 | own names only (no role, consent, account type) | no insert or delete for anyone |
| employers | all 3 with live jobs, anyone | owner updates own; clinic with no profile can create 1 (dup for X, Y) | signed in users see owner_id (2.5) |
| employer_contacts | owner only (X 1, Y 1) | owner insert and update | admin cannot read (server does) |
| jobs | anon and others 3 live; X 7; admin 7 | owner: drafts editable and deletable; status moves per trigger | live past expiry hidden from anon at once |
| candidate_profiles | own only (clinics 0) | own; CV columns server only | |
| applications, application_events | candidate own (A 3), clinic for its jobs (X 3, Y 1); admin 0 | nobody but the server | |
| application_notes | the clinic only (candidates 0) | that clinic insert and update | |
| ad_builder_uses, job_reports, email_suppressions | reports and suppressions: admin only; ad uses: service only | service only | |
| job_alerts | own | own insert and delete | no update (by design) |
| listing_claims | claimant own (no token columns); admin all | service only | |
| job_templates, cover_letter_templates, application_drafts | own clinic / own candidate | own | |

Surprises: none in the matrix itself. All 68 table x operation rows matched the docs; the surprises are in column level exposure and limits (2.5, 2.6, 2.7, 2.9) found by the escalation tests. Escalation tests that were correctly refused include: a candidate setting `profiles.role` to admin (`permission denied`), sign up metadata `role: admin` (profile created as candidate), a clinic making a job live (`That change is not allowed`), inserting a live job (RLS deny), changing expires_at, posted_at, is_seeded or review_note (`permission denied`), editing a live job in place (`This job can no longer be edited`), taking over a seeded clinic or flipping claimed (`permission denied`), a candidate changing an application status, a clinic rewriting a cover letter or snapshot (`permission denied`), reading claim tokens (`permission denied`), and anon calling is_admin().

Combined file against numbered migrations: lens2_numbered (stub + 0001 to 0017 in order, twice) and lens2_combined (stub + run-everything.sql, twice) give identical `pg_dump --schema-only` for both public and auth (md5 cbbb7c7e... and 297584cb... in both, ignoring pg_dump's random \restrict token); each section of the combined file also matches its numbered file line for line. The check table gives 29 OK and 1 NOT YET (CV bucket) on every run.

## Good things worth keeping
- Row level security is on for all 17 tables and no table forces it off; every security definer function pins `search_path=public` and uses fully qualified names; only employer_has_live_job is callable by anon, and every ownership helper answers only about the caller (function listing in lens2_sb).
- Column grants do the real work: clinics cannot touch dates, is_seeded, review_note, owner_id, claimed or status of their clinic; candidates cannot set CV paths; nobody but the server writes applications, events, reports, claims or suppressions (escalation tests 1 to 3, 9 to 12, 30 to 32, 39 to 46).
- The job status trigger (0014) blocks a clinic publishing its own job, and the database enforces the pay range width, the 2 required answers and completeness before review (check constraint jobs_complete_unless_draft).
- Expired jobs disappear from public reads the moment expires_at passes, without waiting for the daily job (anon sees 3 jobs, not the live but past expiry one), so JobPosting data cannot outlive the post.
- One application per candidate per job (`applications_job_id_candidate_id_key`), one clinic profile per account (`employers_owner_idx`), one open claim per person per clinic (partial unique index), and claim approval is a single conditional update (`.eq("claimed", false)`, lib/claim-actions.ts:131), so 2 claims cannot both win.
- The clinic CV route asks the database, under the clinic's own session, whether the application is theirs before signing a 60 second link (app/clinic/applications/[id]/cv/route.ts:18-20); there are no Storage policies at all, so the private bucket is reachable only through the server.
- Both the combined file and the numbered files re-run cleanly twice, and no migration drops a table, truncates or deletes data (the only data update, 0003:8-11, is guarded).

## Steve's checks
1. Supabase, SQL Editor, run: `select table_name, grantee, string_agg(privilege_type, ',') from information_schema.role_table_grants where table_schema = 'public' and table_name in ('waitlist', 'profiles') and grantee in ('anon', 'authenticated') group by 1, 2;` You should see 4 rows (waitlist for anon and authenticated with 7 privileges each, profiles for authenticated with REFERENCES, SELECT, TRIGGER, TRUNCATE). If waitlist has no rows, your project was created without automatic API access and 2.8 is smaller than described.
2. Supabase, Storage, bucket `cvs`: it should say Private, with a 3 MB limit, and the Policies tab should show no policies for the bucket. If any policy is listed, tell Claude before launch.
3. Supabase, Database, Functions: you should see the 16 functions listed in this lens, and none you do not recognise. Then run the combined file once more and check every row says OK (it is safe to run again; a single numbered file is not, see 2.4).
4. If anyone has asked you to delete their account by email, check Storage, `cvs`, for a folder named after their account id, and tell Claude (2.2).

## Not audited, and why
- Real Supabase grants, Auth (sign up metadata, JWT claims, the new secret key format) and Storage policies: no access to the live project; the stub emulates them, and item 1 and 2 of Steve's checks confirm the two that matter.
- Concurrency beyond the limit triggers (for example 2 admins approving at once, or the daily job running twice): left to lens 3.
- Whether the retention choices meet PIPEDA and Ontario's posting and application record rules: needs lawyer review (lens 4); this lens only shows what the schema keeps.
- Performance of the RLS helper functions on large tables (each policy calls a security definer function per row): not measurable with 7 rows of fixture data.
