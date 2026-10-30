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
