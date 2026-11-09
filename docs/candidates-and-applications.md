# Candidates, CVs and applications

## How it works

1. A candidate signs up and completes `/candidate/profile`: their role, where they are licensed, and a CV (PDF or Word, up to 3 MB). The CV is stored in a **private** bucket called `cvs`, which the site creates the first time it is needed.
2. On a live job that takes applications through Kestrel, they press **Apply with Kestrel** (`/jobs/[id]/apply`) and write a cover letter. If they try to send without one, they are asked once whether they want to add a note.
3. Sending creates an application. The clinic sees a **snapshot** of the candidate's details as they were that day, plus a private copy of the CV, so replacing a CV later never breaks an old application.
4. The clinic gets an email (no personal details in it) and opens `/clinic/applications/[id]`. Opening it marks it **Viewed**. The clinic moves it along and writes a message. Closing an application (not selected, role filled, kept for future roles) always needs a message, and there is a kind one ready to edit.
5. The candidate follows it at `/candidate/applications`, with a five step progress bar and the clinic's message.

## Rules enforced by the database (migration 0006)

- A candidate's profile is visible to that candidate only. Clinics see a candidate only through an application sent to them.
- A clinic can read applications to its own jobs and nothing else. Its private notes are in their own table, which candidates cannot read.
- The browser can only read applications. Every change (applying, moving along, withdrawing) goes through the server, which checks who is allowed.
- Nobody can open a CV directly. The server checks who is asking and hands out a link that works for 60 seconds.

## Setting up

1. Run `supabase/migrations/0006_candidates_and_applications.sql` in the Supabase SQL editor. Safe to run twice.
2. Optional, for emails: in Vercel add `RESEND_API_KEY` (a Resend key with sending access). Add `EMAIL_FROM` only if you want a different sender. Without the key, the site works and just skips these emails.
3. Nothing to create in Supabase Storage. The `cvs` bucket is created automatically.

## Trying it

1. Sign in as the candidate account. Open **Profile and CV**, choose a role and upload a small PDF.
2. Open a live job and press **Apply with Kestrel**. Try sending without a letter to see the prompt.
3. Sign in as the clinic that owns the job. Open the dashboard, then **Applicants**, then the application. Download the CV, move it to Shortlisted, and then close it with a message.
4. Back as the candidate, open **My applications** and check the status and message.

## Tests

`npm test` covers the application rules (statuses, which moves a clinic may make, kind messages, and the check that a CV file is really a PDF or Word file).

## Recommended for you (built 6th November 2026, migration 0031)

A list of up to 8 jobs on the candidate's home page, chosen by plain rules with no AI. Each job shows why it fits ("Optician role", "About 12 km from Toronto", "Pay starts at or above your minimum", "Posted this week"), and a "Not interested" button removes it for that candidate only.

- **What the candidate tells us** (profile page, "What you are looking for", private, never shown to clinics): town and how far they would travel (10, 25 or 50 km), provinces they would work in anywhere (handy for people planning to move, including people in Quebec), type of work, lowest pay, independent or corporate, and other roles they would consider. Saved in new columns on `candidate_profiles` and a new `candidate_job_hides` table.
- **The rules** (`lib/recommend.ts`, tested in `lib/recommend.test.ts`): a job is left out if it is not one of their roles, not an employment type they chose, not the practice type they chose, cannot reach their pay minimum even at the top of its range, is outside their distance and chosen provinces, or they already applied or hid it. What remains is scored: role (40, or 25 for another role they would consider), distance (up to 25), pay (up to 15), registered in that province (8), posted this week (8), plus 5 each for a chosen type and practice. With no town or provinces chosen, the provinces they are registered in stand in. Same profile and same jobs always give the same list.
- **Where**: `lib/candidate-prefs.ts` (checking the form), `lib/recommendations.ts` (loading jobs and hidden jobs), `lib/recommendation-actions.ts` (Not interested), `app/candidate/page.tsx`, `components/CandidateProfileForm.tsx`.
- **Not built, on purpose**: AI ranking of applicants for clinics; AI reading of CVs (only if profiles prove hard to complete, and with clear consent); "learning" from hides.

## Shortlisting is private to the clinic (decided with Steve, November 2026)

A shortlist is the clinic's own working list. The candidate is not emailed, and no message goes with it, whether the clinic shortlists one person on their application or ticks several on the applicants page. A candidate is also never shown "Shortlisted": their own pages and their data download show "Viewed" until the clinic invites them to interview, makes an offer or closes the application (`candidateStatus` and `candidateHistory` in `lib/applications.ts`, used by `lib/candidate.ts` and `app/account/export/route.ts`). The clinic still sees Shortlisted everywhere. Any new place that shows a candidate their own application status should use these helpers.
