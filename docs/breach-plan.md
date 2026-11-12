# If personal information is lost or seen by the wrong person

One page. Keep it where you can find it quickly. A plain English summary of Canada's privacy law (PIPEDA), not legal advice. Alberta, British Columbia and Quebec also have their own rules, so ask the lawyer which apply. Read with `docs/security.md`.

**Privacy officer:** Steve Smith, privacy@eyecarejobs.ca
**Backup person:** held offline by Steve (in his password manager notes). Deliberately not written in this repository.
**Lawyer:** (add after the first meeting; keep the number in Steve's contacts, not here)
**Last reviewed:** 5th November 2026

## What counts

Any time personal information we hold (names, emails, phone numbers, resumes, cover letters, who applied where) is lost, or seen, taken or shared by someone who should not have it. Examples: a stolen key, a bug that shows one clinic another clinic's applicants, an email sent to the wrong list, a lost laptop with a downloaded spreadsheet, or a service we use telling us they were breached.

## What to do

**1. In the first hour: stop it getting worse.**
- Change the keys involved, most powerful first (`docs/security.md`). Sign people out if needed. Take down the page or switch off the feature.
- Write down the time you found out and who told you.

**2. The same day: write it down.** Add a line to the log below. Do this even if you are not sure it matters. Do not delete anything that might show what happened (logs, emails, deployments).

**3. Within a day or two: decide if it is serious.** The law asks whether there is a **real risk of significant harm** to the people involved. Think about:
- How sensitive is it? A resume and phone number is personal. A health record or bank detail would be worse. We hold no health or payment details.
- How likely is it to be misused? Was it taken on purpose by a criminal, or seen briefly by one trusted person who has deleted it? Was it scrambled so it cannot be read?
- How many people?
If you are not sure, treat it as serious and call the lawyer.

**4. If it is serious: tell people, quickly.**
- Report it to the **Office of the Privacy Commissioner of Canada** as soon as you can, using their online breach report form.
- Tell **each person affected** directly, by email. See the message below.
- If the people affected are candidates whose applications a **clinic** can see (or the reverse), also tell that clinic. Ask the lawyer who is responsible for the information once a clinic has opened an application.
- Tell anyone else who can help reduce the harm, if that applies.
- Ask the lawyer whether Alberta, British Columbia or Quebec's regulators also need to hear.

**5. Always: keep the record for 24 months,** including breaches that did not need reporting.

**6. Afterwards:** fix the cause, update `docs/security.md`, and tell the lawyer what changed.

## Four emergency switches (click by click)

For the first hour of step 1 above. Each one is reversible. Try the sign out and the email steps once on a quiet day against the **demo** project (sample data only), so you know what they do before you need them. Vercel and Supabase change their menus now and then. If a name below has moved, look for the closest one.

**1. Switch the whole site off (a "back soon" page)**
1. Vercel, open the `kestrel` project, Settings, Environment Variables.
2. Add `MAINTENANCE_MODE` with the value `yes`, for Production.
3. Deployments, open the latest Production deployment, the three dots, Redeploy.
4. To switch it back on: delete the `MAINTENANCE_MODE` variable and redeploy.

Every page and form shows the "back soon" page. The waitlist, the daily job (so its alerts and reminder emails) and the job view counter stop too (audit P1-22). 2 things keep working on purpose: `/api/health`, so the uptime monitor can still see the site, and `/api/resend`, so a bounce or spam complaint that arrives during the outage is still recorded and that address is never emailed again. While the switch is on the daily job does not run, so after 36 hours the health check reports it as late: that is expected. Account emails sent by people pressing buttons also stop, because every page is closed. Supabase's own sign up and password emails are not covered: use switch 3 for those. The demo site is a separate Vercel project, so do the same there if needed.

**2. Sign everyone out**
1. Supabase, open the project, SQL Editor.
2. Run: `delete from auth.refresh_tokens; delete from auth.sessions;`
3. People are asked to sign in again. A sign in that is already open can keep working until it expires, up to an hour, so switch the site off (switch 1) at the same time if this is a breach.

**3. Stop all email**
1. Resend, API Keys, delete the `kestrel-website` key. Everything the website sends stops, and the site keeps working.
2. Sign up emails go through Supabase, with a second Resend key (Supabase, Authentication, SMTP settings). Delete that key in Resend as well.
3. Make new keys afterwards and put them in Vercel and Supabase (`docs/security.md`).
4. A softer option: set `DAILY_EMAIL_BUDGET` to `0` in Vercel and redeploy. That stops only the daily job's emails (alerts and reminders). Once migration 0042 is run you will also get 1 "close to today's email limit" warning that day, because the warning is set at 80% of the budget: that is expected.

**4. Go back to the last good version of the site**
1. Vercel, open the `kestrel` project, Deployments.
2. Find the last Production deployment that was fine, the three dots, Promote to Production (some plans call it Instant Rollback).
3. This does not undo database changes. Ask for help before changing the database back.

## What to say to the people affected

> Subject: An important message about your Kestrel information
>
> Hello [first name],
>
> We are writing to tell you about a security problem at Kestrel Eye Care Jobs. On [date], we found that [what happened, in plain words]. This involved your [what information, for example name, email address and resume].
>
> What we have done: [what you did to stop it and fix it].
>
> What you can do: [for example, be careful with unexpected emails that mention Kestrel, and change your password if you used the same one elsewhere].
>
> We are sorry. If you have questions, write to privacy@eyecarejobs.ca and a person will answer. You can also contact the Office of the Privacy Commissioner of Canada.
>
> The Kestrel team

Say what you know and what you do not know yet. Do not guess, blame or promise what you cannot be sure of.

## Breach log (keep one line per incident)

| Date found | What happened | Who and how many people | Information involved | Serious? Why | Told the Commissioner and people (dates) | What we fixed |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |
