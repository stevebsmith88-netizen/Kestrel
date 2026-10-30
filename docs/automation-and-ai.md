# Daily housekeeping, the welcome email and the ad builder

## Daily housekeeping (`/api/cron/daily`)

Vercel runs this once a day (see `vercel.json`). It:

1. Marks live jobs that have passed their 30 days as **expired**. (The public pages already hide them the moment they pass their date, so this only keeps the records tidy.)
2. Closes out applications still waiting on a job that ended a week ago, marking them **No update from the clinic** and emailing the candidate, so nobody is left waiting.
3. Reminds clinics, with one email each, about applications unopened for 14 days.

To switch it on, add `CRON_SECRET` in Vercel (Settings, Environment Variables) as a long random string, and redeploy. Vercel sends it with every run, and the route refuses anything without it. To try it by hand: `curl -H "Authorization: Bearer YOUR_SECRET" https://eyecarejobs.ca/api/cron/daily`.

## Emails

- The waitlist now sends a "You're on the list" email to people who are **new**, with the mailing address and a working unsubscribe link. Signing up twice never sends two.
- Application alerts (to the clinic) and status updates (to the candidate) are sent by the website.
- All of these use `RESEND_API_KEY`. Without it, the site works and skips them, noting "Email skipped" in the logs.

## The ad builder

On the Post a job page, a clinic types a few lines about the role and presses **Write my ad**. Claude writes a draft (never including pay, contact details, Canadian experience requirements or invented facts), which goes into the ad box for the clinic to edit. The clinic always reads it before submitting, and our review still checks every post.

- Needs `ANTHROPIC_API_KEY` (create one at console.anthropic.com). Without it, the builder is hidden and clinics write by hand.
- Uses Claude Opus 5.5, with the safety fallback switched on. Each draft costs roughly a cent or two.
- Each clinic can use it 15 times a day (counted in `ad_builder_uses`, migration 0007).

## Setting up

1. Run `supabase/migrations/0007_housekeeping.sql` in the Supabase SQL editor. Safe to run twice.
2. Add to Vercel (Production, and Preview if you want to test there): `CRON_SECRET`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`.

## Job alerts

Candidates can set up to 5 alerts at /candidate/alerts (role, province, practice type; any can be left as "any"), each daily, weekly (the default) or monthly. The daily housekeeping job (step 4) emails each person one digest covering the alerts that are due, listing live jobs posted since the alert was last sent, with an unsubscribe link. People who have unsubscribed are skipped. Needs migrations 0008 and 0009 and RESEND_API_KEY.

## Setup order for everything built since accounts

1. Run `supabase/combined/run-0005-to-0009.sql` in the Supabase SQL editor (it is migrations 0005 to 0009 in order, and is safe to run twice).
2. Vercel environment variables (Production and Preview): `RESEND_API_KEY` (a website sending key), `ANTHROPIC_API_KEY` (ad builder), `CRON_SECRET` (any long random string).
3. Redeploy without the build cache after adding variables.
