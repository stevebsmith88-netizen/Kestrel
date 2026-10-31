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
- Uses Claude Sonnet 5.5 by default, with the safety fallback switched on and a cap of 3,000 tokens a draft. Set `AD_BUILDER_MODEL` in Vercel to try another model (for example `claude-haiku-5-5` for the lowest cost). The ad is 120 to 300 words, so each draft costs a small fraction of a cent to a few cents.
- Each clinic can use it 15 times a day (counted in `ad_builder_uses`, migration 0007).

## Setting up

1. Run `supabase/migrations/0007_housekeeping.sql` in the Supabase SQL editor. Safe to run twice.
2. Add to Vercel (Production, and Preview if you want to test there): `CRON_SECRET`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`.

## Job alerts

Candidates can set up to 5 alerts at /candidate/alerts (role, province, practice type; any can be left as "any"), each daily, weekly (the default) or monthly. The daily housekeeping job (step 4) emails each person one digest covering the alerts that are due, listing live jobs posted since the alert was last sent, with an unsubscribe link. People who have unsubscribed are skipped. Needs migrations 0008 and 0009 and RESEND_API_KEY.

## Setup order for everything built since accounts

1. Run `supabase/combined/run-everything.sql` in the Supabase SQL editor (it is migrations 0005 to 0010 in order, and is safe to run twice).
2. Vercel environment variables (Production and Preview): `RESEND_API_KEY` (a website sending key), `ANTHROPIC_API_KEY` (ad builder), `CRON_SECRET` (any long random string).
3. Redeploy without the build cache after adding variables.

## Monitoring

- `/api/health` answers 200 when the site is up and the database can be reached, and 503 when it cannot. Point a free uptime monitor (such as UptimeRobot) at it.
- Set `ADMIN_ALERT_EMAIL` and the site emails you when the daily housekeeping job fails or has a problem, and whenever a job is reported.
- Vercel keeps logs (Observability) if you need to look further.

## Waitlist confirmation

Joining the waitlist now sends one email with a "Confirm my email" button (a signed link to /waitlist/confirm; pressing the button, not opening the link, confirms it). No more than 1 confirmation email an hour goes to the same address, and the form answers the same whether or not someone is already on the list. Confirming sends the welcome email and, because the person has just proved the address is theirs, lifts an earlier unsubscribe for that address (complaints, bounces and addresses blocked by hand stay blocked). The admin waitlist page shows Confirmed, Waiting to confirm, or Joined before confirmation emails. Email the confirmed ones first. Needs migration 0014 and `RESEND_API_KEY`.
