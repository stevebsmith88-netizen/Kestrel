# Kestrel Eye Care Jobs: context for a second opinion

As of 10th November 2026. Safe to paste into another AI assistant: it holds no keys, no personal data and no private contacts. To refresh it, ask Claude in the Kestrel project to "update docs/gemini-context.md", and paste the new version.

## What Kestrel is

Kestrel Eye Care Jobs (eyecarejobs.ca) is a self serve job board for Canadian eye care: optometrists, opticians, optometric assistants and technicians, practice managers, patient care teams, and later supplier reps and locums. Independent and corporate practices post side by side. The founder, Steve, is not a developer and works full time elsewhere in the optical industry. Claude writes the code and Steve approves every change.

Goal: $150,000 a year in revenue within 18 to 24 months of paid launch, on running costs well under $10,000 a year. Launch target: mid January 2027, with a free launch first (30 to 60 days, no card needed to post), then paid posts. Search goal: be the go to place for eye care jobs in Canada on Google, and the source AI assistants name.

Stack: Next.js on Vercel, Supabase (Canadian region) for database and sign in, Stripe for payments (not built yet), Resend for email, the Claude API for the ad builder.

## Prices (decided, before HST)

Per 30 day post: $59 for assistants, technicians and reception; $79 for opticians, contact lens fitters and practice managers; $99 for optometrists. Two monthly passes of up to 5 live posts: Clinic pass $199 (not optometrists), and Clinic pass Plus $349 (optometrists included). Founding clinics keep their pass price for 12 months. Candidates never pay.

## Rules already decided (please do not re argue these)

- Every post shows a pay range, publicly (no pay behind a login), and answers "existing vacancy" and "uses AI to screen candidates". No "Canadian experience" wording. Optometrists can post pay as salary, hourly, a daily rate, a guaranteed daily minimum, or a percentage of production, but a range is always required. Ontario's rule applies from 25 employees, and Kestrel asks for a range on every post anyway.
- No scraping, ever. A person may read Indeed by hand only to find which clinics are hiring. Listings found on a clinic's own careers page are labelled "not yet claimed", link to the clinic's own application page, and expire after 21 days. This is switched off for now.
- Clinic outreach by email stays off until Steve has had a disclosure conversation about his other job. It follows Canada's anti spam law (CASL).
- Shortlisting is the clinic's private working list: the candidate is not emailed, and sees "Viewed" until an interview, offer or no.
- No AI ranks applicants. "Recommended for you" for candidates uses plain rules.
- Quebec is closed for now (the site is English only). French and Quebec come later.
- Personal data stays in Canada where possible.

## What is built

Candidate and clinic accounts (Google or email sign in), clinic profiles, posting a job with an AI ad builder, a review step before a job goes live, search with filters and distance, job pages with Google job data, job alerts by email, Quick Apply with a CV and cover letter, an applicant board for clinics (shortlist, interview, a kind no, one at a time or in bulk), claim your listing, equipment and software tags, a pay benchmark from Government of Canada Job Bank data, a price comparison page, a blog (24 posts scheduled weekly into April 2027), a help centre with search (35 topics), one shared footer, and an admin area. A separate demo site with sample data shows the product.

## Not built yet

Stripe checkout and the passes (the main item on the critical path), an in account inbox for notifications (benched, one way first), SMS alerts, help videos, two guide hub pages for the blog (in progress), the clinic outreach emails (built but switched off), a directory of suppliers (planned), French.

## Where we are

Done: confirming what was built, quick wins, optometrist pay options, tags, the help centre, and a tidier footer and link style. Next: Stripe checkout, preparing launch supply (a list of clinics, claim emails), a final code audit about 3 weeks before launch. Waiting on Steve: his lawyer's review of the terms and policies, then his disclosure conversation, then roadmap dates.

## Questions I would like a second opinion on

1. Is mid January realistic if checkout is still to be built, or should the free launch go first and paid posts follow?
2. Which of the decisions above would a clinic owner or a new graduate push back on?
3. What would make a new job board in a small profession feel full on day one?
4. What is the biggest risk we have not named?

Please say plainly where you disagree and why, and flag anything you are unsure of.
