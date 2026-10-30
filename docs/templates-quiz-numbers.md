# Templates, drafts, the quiz and the admin numbers

## Job templates and drafts (clinics)

- Drafts: "Save draft" on the post a job form keeps a half finished post. Only a title is needed. Drafts are listed on the clinic dashboard, where they can be edited or deleted.
- Templates: tick "Also keep this as a template" when saving a post, or press "Save as template" on any job on the dashboard. A clinic can keep up to 20. Under Post a job, "Start from a template" fills the form in. Saving with the name of an existing template replaces it.
- The two questions every post must answer (existing vacancy and uses AI to screen) are never kept in a template, so they are answered fresh each time. Pay is kept, but is checked again by the normal rules when the post is submitted.
- Templates are private to the clinic (migration 0015, `job_templates`), and are included in "Download my information".

## Cover letter drafts and saved letters (candidates)

- On an application, "Save as a draft" keeps the half written letter for that job. It is there the next time the candidate opens the application, and is removed once the application is sent.
- A candidate can keep up to 5 cover letters (My saved letters). On an application, "Start from one of your saved letters" fills in the letter, and "Keep this letter" saves the one just written. The page reminds them to change it for each clinic.
- Private to the candidate, and included in "Download my information". Deleting an account deletes them.

## Find your fit

- Page: /find-your-fit, in the menu. 6 questions, one at a time, then up to 3 roles with a plain reason for each and a link to the job search with filters filled in.
- All the rules are in `lib/quiz.ts` (points for each answer, roles in a fixed order for ties) and are tested in `lib/quiz.test.ts`. No AI, nothing is saved or sent.
- To change a question, a role description or a rule, edit that file and run `npm test`.

## Admin numbers

- Page: Admin, Overview. Choose Last 30 days, Last 90 days or This year. It shows live jobs, clinics (claimed and found), candidate accounts, applications, the confirmed waitlist, jobs published each week, live jobs by province, a clinic funnel and a candidate funnel, and an investor snapshot.
- Compared with "the last period" means the period of the same length just before.
- Revenue, monthly recurring revenue and free to paid conversion say "Not on yet" until Stripe is switched on.
- Export CSV and Download investor summary give a spreadsheet (admin only): /admin/numbers.csv.
- The sums are in `lib/admin-stats.ts` (tested) and the database reads are in `lib/admin-stats-data.ts`. Counts include clinics we found online (not claimed) where noted.
