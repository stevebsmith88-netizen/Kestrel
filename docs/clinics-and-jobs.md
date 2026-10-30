# Clinics, jobs and the review queue

## How it works

1. A person signs up as a **clinic**, and sets up a clinic profile (`/clinic/profile`). The alert email they give is private and is never shown on a page.
2. They write a job at `/clinic/jobs/new`. A draft only needs a title. To **submit for review** a job needs everything, including a pay range and the two questions (existing vacancy, uses AI to screen). Pay ranges can be up to $50,000 a year wide unless the top is over $200,000. Mentioning Canadian experience is refused.
3. The admin sees it at `/admin/review`, with automatic flags (Canadian experience, pay range, age wording, links, email addresses or phone numbers). **Approve and publish** makes it live for 30 days. **Send back** needs a note, which the clinic sees on their dashboard.
4. Live jobs appear at `/jobs` (search and filters) and `/jobs/[id]` (with Google structured data). Expired jobs disappear from the public pages at once, because the database stops showing them.

## Rules enforced by the database (migration 0005)

- Only an admin action on the server can make a job live. A clinic can never publish its own job.
- A live or in review job cannot be edited, only closed or taken back to a draft.
- The public can read live jobs and the clinics that have them, nothing else. The alert email lives in its own private table.
- Pay range and "complete before review" rules are checked by the database as well as the form.

## Setting up

1. Run `supabase/migrations/0005_clinics_and_jobs.sql` in the Supabase SQL editor. It is safe to run twice.
2. Nothing else to set up. The same Supabase keys are used.

## Trying it

1. Sign in as the clinic test account, create the clinic profile, then post a job and submit it.
2. Sign in as the admin, open Review queue, approve it.
3. Open `/jobs` (signed out) and check the job appears, then open its page.

## Tests

`npm test` runs the job rules (pay range, Canadian experience, flags, dates, structured data).

## Keeping recruiters and spam out

Layers, none of which is perfect on its own:
1. Every clinic ticks a box confirming it hires directly and is not a recruiter, staffing agency or broker (date saved in `employers.direct_hire_confirmed_at`).
2. Every post is read by an admin before it goes live. The review queue flags agency wording ("our client", "on behalf of"), a missing website, alerts going to a free email address (gmail and similar), and a missing confirmation.
3. A clinic can have at most 10 open jobs (drafts, in review, live) at a time (migration 0009).
4. Contact details are masked, so candidates apply through Kestrel and recruiters cannot harvest clinic emails.
5. Still to add before launch: a bot check on sign up (Cloudflare Turnstile), written terms of use that ban agencies (needs a lawyer), and a "report this job" link.

## Accessibility

The target is WCAG 2.2 level AA. Done so far: a skip to main content link on every page, a two tone focus ring on everything reachable by keyboard, form hints and errors linked to their fields for screen readers, input borders at 3:1 contrast or better, text colours checked at 4.5:1 or better, body text that scales with the browser's text size setting, no motion when the visitor asks for reduced motion, and plain language throughout. Still to do: a full audit with a screen reader and an automated checker before launch, and converting the remaining fixed pixel sizes to relative sizes.

## Claim your listing

A listing we found on a clinic's own website (a seeded listing) belongs to a clinic profile with no owner and `claimed = false`. The job page shows "Found on the clinic's website, not yet claimed" with a link to `/jobs/<id>/claim`.

1. The clinic signs in with a clinic account and fills in the claim form: work email, role, and a confirmation that it may post for the clinic.
2. If the email is at the clinic's own website (free email and shared website builders do not count), we send a link there. If not, the clinic ticks a box and explains how we can confirm it, and a person checks by hand.
3. The link opens `/claim/verify`. A button, not the link itself, confirms it, so an email scanner cannot do it by accident. The link works for 2 days and only for the account that made the claim.
4. A confirmed claim waits in Admin, Claims. Approving it makes the clinic account the owner of the profile and its listings (only while `claimed` is still false, so two claims cannot both win), and emails the clinic. Declining needs a note, which is emailed.
5. A person can make up to 5 claims a day, hold one open claim per clinic, and an account that already has a clinic profile cannot take over another (they email us).

"Ask us to remove it" opens an email to hello@eyecarejobs.ca. To take a listing down, close the job from Admin or use the report flow.

To try it without a real clinic, run `docs/test-claim.sql` (a fake clinic whose website is eyecarejobs.ca, so `steve+claim@eyecarejobs.ca` counts as an address at its own website). Delete it afterwards.

Not built yet: the admin tool to add found listings (seeding), and editing a live job (a live job can only be closed and reposted).
