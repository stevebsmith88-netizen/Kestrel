# First week emails for new accounts

Built 7th November 2026 (marketing audit item 14). **Off** until Steve sets `ENABLE_ONBOARDING_EMAILS` to `yes` in Vercel (live and demo separately; the demo never sends email whatever is set). Needs migration 0033 (`supabase/migrations/0033_onboarding_emails.sql`, also in `supabase/combined/run-everything.sql`) on both databases first.

## What it sends

At most 3 emails per account, on day 1, day 3 and day 7 after the account is opened, and only when the step still helps. Nobody gets a generic note: if a step does not apply, it is skipped.

| Account | Day 1 | Day 3 | Day 7 |
| --- | --- | --- | --- |
| Clinic | No profile yet: set up the profile. Profile but no post: post your first job. Skipped if a job is already submitted | Not submitted: offer help and say we can post for them. Submitted, not live: what happens to a post. Live, no applications: 3 ways to get the first applications | Has applications: reply within 5 days. Live, none yet: 3 things to check. Nothing posted: offer to help |
| Candidate | Profile not ready: add role and CV. Ready: jobs that fit you | Set a job alert (skipped if one exists) | Ready to apply, with a reminder that a cover letter can be saved and reused. All skipped once the candidate has applied |

The aim behind each is the agreed definitions in `docs/definitions.md`: a clinic's first application received, a candidate's first application sent.

**Wording (12th November 2026):** the first email to a clinic with no post yet, and to a candidate whose profile is not ready, both start with "Thanks for registering with Kestrel". The clinic one offers help with the first advert (reply and we will help, or post it for you), and the candidate one says to come back to finish the profile or look at the jobs available. Replies go to Kestrel's own address.

## How it works

- `lib/onboarding-emails.ts`: the rules and the wording, tested in `lib/onboarding-emails.test.ts`.
- `lib/onboarding-run.ts`: part of the daily job. It looks at accounts opened in the last 12 days, works out what each has done, and sends at most 1 email each. A step missed by up to 3 days (budget spent, job off) is still sent, then dropped.
- Each step is claimed in the `onboarding_emails` table before sending, so a second copy of the daily job can never send it twice. If sending fails the claim is removed and it is tried again the next day.
- Counts against the daily email budget (`DAILY_EMAIL_BUDGET`, default 50) like every other email, and shows in the daily job's summary as `onboardingSent`.
- Every email has the unsubscribe link, the mailing address and the line "You are receiving this because you created a Kestrel Eye Care Jobs account." It never goes to anyone on the do not email list or anyone who has unsubscribed.

## To check before switching on

- **Lawyer:** these are help emails to people who made an account, so the account is the relationship that lets us write to them (CASL calls this an existing business relationship). Ask the lawyer to confirm the wording and the unsubscribe handling, and add the question to the pack.
- **Preview:** use the demo with a test account and temporarily allow the demo to send to your own address, or read the wording in the tests. The wording is plain and short, so it should be read once by Steve.
- **After launch:** compare how many accounts reach their first application with and without these emails (test log, `docs/marketing/operating-rhythm.md`).
