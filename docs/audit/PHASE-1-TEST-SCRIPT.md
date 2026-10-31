# Phase 1 test script

Branches stack, so the preview of `phase-1c-email-and-operations` in Vercel contains all of 1A, 1B and 1C. Open it from Vercel, Deployments (Deployment Protection means only you can open it). Use email and password, not Google (Google return addresses were deliberately limited to the live site).

Two things cannot be fully tested on a preview, because emails link to the live site: confirming a new sign up, and the password reset link. Test those on the live site straight after merging (section C).

## A. On the preview, signed in as the test accounts

| # | Do this | Expected |
| --- | --- | --- |
| 1 | Candidate: open a job, write half a cover letter, Save as a draft | "Draft saved" (check 14) |
| 2 | Candidate: Letters, save a cover letter, then save one with the same name again | Both save, no error |
| 3 | Clinic: post a job with "Also keep this as a template" ticked | Job saved, and the template appears under Post a job (check 15) |
| 4 | Clinic: leave the pay range empty, submit with the keyboard | A message appears, and your typed answers stay |
| 5 | Clinic: a brand new draft | Shows Delete. Delete works |
| 6 | Clinic: a live job | Shows Close, no Delete |
| 7 | Clinic: edit a live job and submit | "Changes are with our team" |
| 8 | Admin: open the review queue | The edited job shows "What changed since candidates last saw it". Area covered and extra pay show where used |
| 9 | Admin: approve it | The clinic's notify email gets "Your changes are live". Reject another with a note: clinic gets "needs a change" with the note |
| 10 | Share a job link into a WhatsApp chat to yourself, do not send | The preview shows the job title and pay, not "Coming soon" (check 17). Also run the live link through Google's Rich Results Test |
| 11 | Ad builder: write an ad from a few lines | A draft appears. Tell Claude if it fails or is cut off (model changed to Sonnet 5.5) |
| 12 | Waitlist: type an already used address into the form | Looks like it worked, but the existing entry is not changed |
| 13 | Admin, Waitlist: open the ready to email download | Only confirmed, not unsubscribed people, with an unsubscribe link column |
| 14 | Signed out: open a job, press Apply, Create a free account | Sign up page carries on to the job later (full test in C) |
| 15 | Sign up form | Shows the terms tick and, for clinics, an Invitation code field |

## B. Before merging

1. `CLINIC_INVITE_CODE` set in Vercel (Production and Preview) if you want to create clinic accounts. Without it nobody can.
2. Production has `CRON_SECRET`, `ADMIN_ALERT_EMAIL`, `RESEND_API_KEY` and both Turnstile keys, or `/api/health` will return 503 (UptimeRobot will alert you).
3. Know how to roll back: Vercel, Deployments, find the previous Production deployment, Instant Rollback.

## C. Straight after merging, on https://eyecarejobs.ca

| # | Do this | Expected |
| --- | --- | --- |
| 1 | Sign out. Open a job, Apply, Create a free account, tick the terms, sign up with a new test address (check 16) | Confirmation email arrives. Pressing it signs you in and lands on the job's apply page, not the dashboard |
| 2 | Complete profile: from the apply page press Complete my profile, save role and CV | A "Back to the job" card appears |
| 3 | Forgot password, use the emailed link, set a new password | Works. Opening /reset-password directly while signed in sends you to Forgot password instead |
| 4 | Open `https://eyecarejobs.ca/sign-in?next=/%09/example.com` and sign in | You land on your dashboard, not another site |
| 5 | Stay signed in 70 minutes, then open Jobs, a job, Apply, My applications (check 18) | Not signed out |
| 6 | Open `https://eyecarejobs.ca/api/health` | `{"ok":true}` |
| 7 | Next day after 14:00 UTC (10am Toronto): `/api/health` again, and check your admin email | Still ok. No error emails |
