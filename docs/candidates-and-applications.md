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

## Hired (decided with Steve, November 2026, migration 0036)

When a clinic marks a job as filled and says it found the person through Kestrel (the "How did you find the person?" list on the job's "Filled it?" page and on the applicants page), a second list asks "Who did you hire?" and shows everyone still in the running (`HIREABLE` in `lib/applications.ts`: applied, viewed, shortlisted, interview, offer). The person named:

- moves to a new final step, **Hired**, which sits with the offers in the lists and ends both progress bars (a clinic sees 6 steps, a candidate 5);
- is told by email (unless they turned status emails off) and in their account, with a warm message that names the clinic;
- is left out of the "role filled" message that goes to everyone else still waiting (`markHired` runs before `closeWaiting` in `fillRole`, `lib/applicant-actions.ts`);
- is remembered on the job as `jobs.filled_application_id`, so Kestrel can count hires made through the site. Nothing shows that count yet. A tile in Admin is the natural next step.

Hired cannot be chosen from the one application status form, and a hired application cannot be moved on. One hire per job: a clinic filling 2 roles from one advert is a question for the time of posting (a number of openings), not for this step. Run migration 0036 on both databases before merging the code that uses it.

## First step page (12th November 2026)

A brand new candidate (no role yet, and not shown it before) is sent from their dashboard to `/candidate/start` once. It has 2 or 3 optional questions and a **Skip for now** button: their role, the **Open to field and supplier roles** tick (shown only for some roles, and not for optometrists), and **Where are you in eye care** (working in eye care now, studying or training, or not working in eye care yet). Saving or skipping both go on to the profile page, where the "To apply you need" list shows what is left.

- **Needs migration 0037** (`career_stage`, `start_seen_at`) on both databases. Until it has been run, the site skips the page and saves what it can, so nothing breaks.
- **The stage is private.** It is never shown to a clinic, never ranks or filters jobs, and never blocks anything. Whether a clinic may ever see it is for the lawyer, because answers about a person's situation could hint at protected grounds. It cannot be edited on the profile page yet.
- Code: `lib/career-stage.ts` (the 3 answers), `saveFirstStep` in `lib/candidate-actions.ts`, `needsFirstStep` in `lib/candidate.ts`, `components/FirstStepForm.tsx`.

## The inbox (12th November 2026)

An envelope beside the initials in the top bar (and **Inbox** in the phone menu and the initials menu) opens `/account/inbox`, for candidates and clinics. The number on the envelope is the unread count. One way only: Kestrel tells people things, and nobody replies in it.

- **Who gets what.** Candidates: an application moved to a new step (with the clinic's message if there is one). A shortlist is never announced, because it is the clinic's private working list. Clinics: a new applicant (no applicant details in the message), a job approved, a change asked for, or a job taken down after a report.
- **How it works.** `lib/notify-text.ts` has the wording (tested), `lib/notifications.ts` writes and reads messages, and the messages are added where the emails are already sent (`tellCandidate` in `lib/applicant-actions.ts`, the new application step in `lib/candidate-actions.ts`, `emailClinic` and the take down step in `lib/admin-actions.ts`). The inbox always gets the update, whatever the person chose about email.
- **Safe before the SQL.** Needs migration 0038 (table `notifications`). Until it has been run, writing a message is logged and skipped, the count shows 0 and the page shows nothing, so nothing breaks.
- **Privacy.** Row level security: a person can read their own messages and set `read_at` on them, and nothing else. Only the server adds messages. They are deleted with the account and included in the data download.
- **Not built yet:** clearing old messages (they stay until the account is deleted), a message when a job match arrives, and anything two way.

## Changing your name (12th November 2026)

On the account page the first name change is free, and each change starts a 30 day hold (`lib/name-hold.ts`, `updateName` in `lib/account-settings-actions.ts`). While the hold is on, the name boxes are switched off and the page says when the next change is allowed. A change to what the name already is does not count. An application already sent keeps the name used when it was sent (`applicant.name`).

- **Needs migration 0039** (`profiles.name_changed_at`). Until it is run on a database, there is no hold there.
- **Unlocking someone early** (a typo or a legal name change, after they write to hello@): run this in the Supabase SQL editor, with their email.

```sql
update public.profiles set name_changed_at = null
where id = (select id from auth.users where email = 'their@email.ca');
```

- **Not built:** a lock while a candidate has an active application. It was suggested before it was noticed that an application keeps the name it was sent with. It is Steve's call whether it is still wanted.

## Fill in from my resume (12th November 2026, no AI)

On the profile page, once a resume is saved, **Read my resume** suggests profile answers. Kestrel's own server reads the text and uses fixed rules (`lib/resume-reader.ts`, tested on made up resumes in several styles). Nothing is sent to another service, the text is not stored, and nothing is saved until the person ticks the answers and presses **Save the ticked answers** (the server reads the resume again at that point, so only what the rules really found can be saved).

- **What it suggests:** role (from job titles, weighting title lines, ignoring plurals like "optometrists" in an assistant's duties), years of experience (adds up the dates of jobs in the experience part, skips education and overlaps, and prefers jobs that mention eye care), registered provinces (only for optometrists and opticians, from lines with registered or licensed), phone, town and province (from the address in the first lines, checked against our places list), and practice software (our fixed list).
- **Files:** PDF and Word .docx. An older .doc, a scan or a picture of a page is not read, and the person is told what to do.
- **Limits:** a 3 MB file. A PDF is read 1 page at a time, up to 12 pages or 8 seconds. A .docx is only unzipped for its main text, up to 1 MB of it, and read in a single pass (details in `docs/cv-scanning.md`). Two small libraries were added: `unpdf` and `fflate`.
- **No SQL.** It uses columns that already exist.
- **To improve it,** Steve uploads sample resumes in different styles and sends what it missed. Add each as a test in `lib/resume-reader.test.ts`.
- **Privacy wording** on the privacy and security pages and in the help centre was updated. These pages are with the lawyer, so tell them.
