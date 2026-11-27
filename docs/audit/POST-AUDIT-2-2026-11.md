# Audit round 3 (post audit 2), 27th November 2026

Scope: `docs/plans/post-audit-2.md`. Read only: no code was changed. Commit audited: 153e05c on `claude/pensive-albattani-rgbrvp` (same as `main` at the time).

## 1. For Steve (one page)

The foundations are holding. Every automated check passes, there are no known weaknesses in the libraries Kestrel uses, and the new public features (Follow, Save job, the applicant counts on job pages) are built safely.

There is **1 finding that needs fixing before clinics with teams use Kestrel (P2-01)**. A person on 2 clinics' teams, for example someone who owns their own clinic and is also "view only" on a friend's clinic, could move the friend's applicants along and send them emails in that clinic's name. The check looks at the clinic they currently have picked, not the clinic the applicant belongs to. It needs 2 clinics, a team invitation and a deliberate act, so it is unlikely today, but it breaks the promise that "view only" means view only. The fix is small and needs no SQL.

Everything else is low or for later: 1 money edge case (a charge could happen twice if 2 people approve the same job at almost the same moment), the data download missing a few newer records, and 3 small tidy ups.

**Recommended order:** fix P2-01 and P2-02 together (1 short session, no SQL), then P2-03 and P2-04 in 1 more session. The rest can wait for the next tidy up branch.

## 2. Health check

| Check | Result |
| --- | --- |
| `npm run test:db`: migrations run twice | 108 OK, 1 "not yet" (the resume bucket, normal) |
| Access tests (`scripts/dev/rls-tests.sql`) | 293 of 293 passed (117 on 12th November) |
| Walk through, sign up to account deletion | 83 of 83 passed |
| `npm test` | 863 of 863 passed |
| Type check (`tsc --noEmit`) | Clean |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `npm run build` | Passed, all 196 pages (section 6) |

## 3. Findings

Severity: **High** means fix before the feature is used by real clinics. **Medium** means fix before launch. **Low** means fix when convenient. **Pre launch** means a step that must happen before a switch is turned on.

### P2-01 (High): "View only" can be bypassed by someone on more than 1 clinic's team

**Status: fixed 27th November 2026** (see `docs/audit/AUDIT-FIXES-LOG.md`).

**Where:** `lib/applicant-actions.ts`, in `mayMoveApplicants` (line 29) and `saveApplicantNote` (line 298).

**What happens:** every change to an applicant is made with the server key, so the website checks the person's level first. It asks for their level **at the location they currently have picked** (`getMyEmployer`, from the location cookie). The application itself is then read through the person's own sign in, and the database allows that for **any** location they can view (`owns_application_job` uses `can_view_employer`). The 2 checks look at different clinics.

**Example:** Dana owns Clinic A. Clinic B's owner invites Dana as "View only, with notes". Since migration 0047 that is allowed, and `joinWithCode` supports it. With Clinic A picked, Dana's level reads as "owner", so she can:
- invite Clinic B's applicants to interview, make offers or send a "no", each emailed to the candidate in Clinic B's name (`setApplicationStatus`, `declineSelected`, `declineSelectedQuiet`, `shortlistSelectedQuiet`);
- press "role filled" on a Clinic B job (`fillRole`). The job itself does not close, since the database refuses that, but `filled_at` is saved with the server key and every waiting applicant is sent the "role filled" message;
- replace Clinic B's private note on an applicant instead of adding under it (`saveApplicantNote` takes the editor branch, and the database allows note writes to anyone who can view).

The screens hide the buttons, so this needs a hand made request, but nothing on the server stops it.

**Fix (no SQL):** work out the level from the application's own clinic, not the picked one. Either call the database's `employer_level(<the job's employer_id>)` through the person's own sign in, or refuse unless the application's job belongs to the picked location. Use 1 helper for all 6 actions, and add tests for "owner of A, view only on B".

### P2-02 (Medium): Job actions can act on a different location from the one picked

**Status: fixed 27th November 2026** (see `docs/audit/AUDIT-FIXES-LOG.md`).

**Where:** `saveJob` in `lib/clinic-actions.ts`, line 140 onward.

**What happens:** same root cause. The job is updated through the person's own sign in, which the database allows for any location they can edit. The pass check and the payment record then use the **picked** location (`employer.id`). Someone with 2 locations who switches location in 1 tab, then sends a job from an older tab for the other location, could have that job counted against the wrong location's pass, or have the payment recorded against the wrong location.

**Fix:** the same helper as P2-01. Refuse unless the job belongs to the picked location, or switch to the job's own location first. `doExtend` and `repostJob` already pin the location (`.eq("employer_id", employer.id)`), so follow that pattern.

### P2-03 (Low): 2 approvals at almost the same moment could charge twice

**Status: fixed 27th November 2026** (see `docs/audit/AUDIT-FIXES-LOG.md`).

**Where:** `approveJobNow` in `lib/job-approval.ts` and `chargeForJob` in `lib/job-payment-flow.ts`, line 224.

**What happens:** the card is charged before the job is marked live. Repeat charges are blocked by a Stripe idempotency key, but that key includes a 10 minute time window. Picture Approve pressed in Slack and in the review queue at the same time, or a double click, landing either side of a 10 minute mark (10:09:59 and 10:10:01). Both find the card "saved", and Stripe treats them as 2 different invoices. This is rare, but it is the kind of mistake that costs a clinic's trust.

**Fix:** claim the payment first, by moving the row from `card_saved` to a "charging" state in 1 update and going ahead only if that update changed a row. Or drop the time window from the key for the job charge. Add a test.

### P2-04 (Low): The data download misses some newer records

**Status: fixed 27th November 2026** (see `docs/audit/AUDIT-FIXES-LOG.md`).

**Where:** `buildDataExport`, `lib/data-export.ts`.

**What it holds:** a candidate's profile (with LinkedIn and registration number), follows, saved jobs and interest in clinics.

**What it is missing:**
- help requests and feedback the person sent (`support_requests`);
- for a clinic person, which clinic teams they are on and at what level (`employer_members`);
- the clinic's payments and passes (`job_payments`, `location_passes`).

**Why it matters:** people have a right to see what Kestrel holds about them. The help request text is the most personal of these, since it is their own words.

**Fix:** add these 3 to the download, with tests in `lib/data-export.test.ts`. No SQL.

### P2-05 (Low): An invitation can add someone to a location the inviter no longer owns

**Where:** `acceptInvite`, `lib/team-server.ts`, line 39.

**What happens:** the extra locations on an invitation (`also_employer_ids`) are checked when it is sent, not when it is accepted. If the owner hands 1 of those locations to someone else in the 14 days before the invitation is accepted, the invitee still joins that location's team, at the level the old owner chose.

**Fix:** when accepting, only add locations still owned by the person who sent the invitation.

### P2-06 (Low): The 25 location limit can be passed by a hand over

**Where:** migration 0047, `limit_locations`. It runs only when a clinic is created, not when ownership moves (`transferOwnership`).

**What happens:** someone who already holds 25 locations can be handed a 26th.

**Fix:** a 1 line check in `transferOwnership`, so no SQL is needed. Or make the trigger also run on `update of owner_id`, which would need SQL on both databases.

### P2-07 (Low): The Slack button endpoint does not refuse on the demo by itself

**Where:** `app/api/slack/actions/route.ts`.

**What happens:** buttons are never added to demo alerts, and the endpoint refuses anything not signed with `SLACK_SIGNING_SECRET`. So the demo is safe as long as that secret is set only in the live Vercel project. The plan says "live project only", but the code relies on how the settings are set up rather than checking for itself.

**Fix:** return 404 when `DEMO_MODE=yes`. 1 line.

### P2-08 (Pre launch): The privacy policy still says payments have not started

**Where:** `app/privacy/page.tsx`, line 248.

**What it says:** "We will update this page ... when we start taking payments."

**Why it matters:** checkout is built and runs on the demo with Stripe test keys. Before live Stripe keys go in, the policy must name Stripe and say what card and billing details are kept. The draft is `docs/legal/payments-privacy-draft.md`, waiting for the paralegal. Add it to the launch switch list beside the live keys.

## 4. What was checked and holds

- **Location cookie:** it cannot be used to reach someone else's clinic. Only a location already in the person's own list is accepted (`getMyEmployer`).
- **Team changes:** inviting, sending again, cancelling, removing, changing a level and handing over all check that the person is the owner, and are limited to that clinic (`lib/team-actions.ts`).
- **Invite codes:** only a sha256 fingerprint of each code is stored, and each code works for 1 email address, 14 days and 1 use.
- **Slack approvals:**
  - every request must be signed by Slack, checked with a constant time comparison, and no more than 5 minutes old;
  - Slack's own retries are ignored;
  - the approver list is checked on every press and on every submitted form;
  - the job's flags are checked again at the moment of approval;
  - replies go only to `hooks.slack.com`;
  - a Send back or Decline note is limited in length and must be at least 10 characters.
- **Stripe webhook:** signed requests only, at most 5 minutes old (tested), and nothing in it charges a card.
- **Follow, Save job and the applicant counts on job pages:**
  - they accept JSON from Kestrel's own pages only, checked by origin;
  - only candidates can follow or save;
  - a follow must be for a clinic with a public page, and a save for a live job;
  - each person's list has a limit;
  - the applicant counts give numbers only, and only to the clinic that owns the job, as the database decides;
  - every answer is marked private and never stored.
- **Admin pages:** Candidates, Insights (including the CSV download), Interest and the clinic Contact page are all admin only. The CSV guards against spreadsheet formulas.
- **Interview details:**
  - a meeting link must be https, on an approved service's own address, with no user name or port;
  - the calendar file escapes what the clinic typed;
  - anything that does not check out is shown as plain text.
- **Registration numbers and LinkedIn:** a candidate can write only their own profile. A clinic sees these only inside an application.
- **Retention:** help requests and feedback are deleted after 2 years, as the privacy policy says.
- **Libraries:** 0 known weaknesses.

## 5. Could not verify from here

| What | Why | Who |
| --- | --- | --- |
| Previews not using the live database (R9, still open from 12th November) | It is a Vercel setting | Steve: in the Vercel live project's environment variables, check that `SUPABASE_URL` and the keys are set for Production only, not Preview |
| That `SLACK_SIGNING_SECRET` and `SLACK_APPROVER_IDS` are set only in the live project | It is a Vercel setting | Steve |
| Anything on the live site or in the Supabase and Stripe dashboards | Not reachable from this cloud session | Steve |
| A phone walk of the clinic team and location screens | Needs a browser session with real sign ins | Steve on the demo, after P2-01 is fixed |

Areas 5 and 6 of the plan (public pages and search; brand and legal rules) were checked through the automated tests only. Those tests cover saved pages never reading the session, the writing style rules, shapes, the fake jobs policy links and the settings table, and all pass. No hand review of the blog or of structured data was done in this round.

## 6. Build

`npm run build` finished with exit code 0. It compiled successfully and generated all 196 pages. It was run against a placeholder database address, so the "fetch failed" lines in its log are expected and not a fault.
