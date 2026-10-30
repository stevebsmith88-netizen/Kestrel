# Test accounts

Use 3 accounts so you can see the site as each kind of person. They are your own, in your own database.

| Account | Sign up as | Suggested email |
| --- | --- | --- |
| Candidate | Candidate | steve+candidate@eyecarejobs.ca |
| Clinic | Clinic | steve+clinic@eyecarejobs.ca |
| Admin | Candidate (then promoted) | steve+admin@eyecarejobs.ca |

The part after the plus is ignored by Google, so all 3 confirmation emails arrive in your steve@ inbox. Choose a different password for each and keep them in a password manager. Never reuse a password from anywhere else. (Claude cannot create the accounts, because it has no access to your Supabase and should never hold your passwords.)

## Set up

1. Go to https://eyecarejobs.ca/sign-up and create each account. Confirm each email.
2. In the Supabase SQL editor, make the third one the admin:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'steve+admin@eyecarejobs.ca');
```

3. Sign out and back in as the admin so the change is picked up.

## A good end to end run

1. Clinic: set up the clinic profile, then post a job with the ad builder and submit it.
2. Admin: open the review queue, check the flags, approve the job.
3. Candidate: find the job under Find jobs, fill in the profile and upload a CV, then apply with a cover letter. Add a job alert.
4. Clinic: open the applicant, view the CV, move the status along.
5. Candidate: watch the tracker update.
6. Anyone: open the job and use "Report this job". Then, as admin, look under Reports.
7. Candidate: download your information from the Account page.
8. Clinic: edit the live job. It goes offline and appears in the admin review queue with a note that it was already live. Approve it as admin and check the closing date has not changed.
9. Anyone: join the waitlist on the home page with a new test address (such as steve+waitlist@eyecarejobs.ca). Open the email, press Confirm, and check the admin waitlist page says Confirmed.

The test job is public while it is live, and search engines can see it. Close it as soon as you have finished testing, and give it an obviously fake clinic name.

## Clean up afterwards

Use "Delete my account" on the Account page for the candidate and clinic accounts. That removes their CV files too. The admin account has no delete button. Remove it in the SQL editor:

```sql
delete from auth.users where email = 'steve+admin@eyecarejobs.ca';
```

## Also try (templates, drafts, quiz and numbers)

1. Clinic: start a post, press Save draft, and find it on the dashboard. Open it, finish it, tick "Also keep this as a template" and submit. Then go to Post a job and start from the template.
2. Candidate: open an application, write half a letter, press "Save as a draft", leave, and come back. Then send it with "Keep this letter" ticked and check it appears under My saved letters.
3. Anyone: open Find your fit, answer the 6 questions and follow a result to the job search.
4. Admin: open Overview, switch between the 3 periods, and press Export CSV.
