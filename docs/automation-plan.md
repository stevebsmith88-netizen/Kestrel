# Automation plan: phases, sizes and gates

Written 5th November 2026, for discussion with Steve. Nothing here is started. It turns the 4 automation steps in `docs/audit/STEVE-NEXT-STEPS.md` into phases. It sits inside the audit phases in `docs/audit/NEXT-STEPS-PHASES.md` and does not replace them.

## Principles

- Build in house on Resend, Supabase and Vercel. No Apollo, Instantly or HighLevel. Implied consent under CASL depends on each address being published on the clinic's own page, and we record that page and date for every address (`docs/casl-outreach.md`).
- Semi automatic first. Claude drafts and queues, Steve approves in batches. Hands off only when the numbers in Phase E say it is safe.
- Everything that contacts a clinic or publishes a clinic's details is off until Steve confirms the disclosure conversation (Gate A step 5). Eye Recommend's agreement is separate from CASL, and the lawyer's review of the outreach wording still applies.
- Seeded listings keep their rules: labelled "Found on the clinic's website, not yet claimed", our own words, a link to the clinic's application page, no clinic logo until claimed, 21 days. Anything the page does not state is shown as "not stated by the clinic", never guessed.
- Takedown on request, at once, with the address added to the do not email list.
- Sizes are Claude's working time, not calendar time: S under a day, M 1 to 3 days, L more than 3.

## What already exists

- Daily job (`/api/cron/daily`): expires jobs, emails "closing soon" 3 days before, reminds clinics about unopened applications, closes out waiting applications, sends job alert digests, with a daily email budget (`lib/send-budget.ts`, default 50 a day).
- Outreach email wording (`lib/outreach.ts`) with tests, the do not email list (migration 0011, `lib/suppression.ts`), signed unsubscribe links.
- Claim your listing: `/claim`, `/admin/claims`, `lib/claims.ts` (migration 0012).
- Found listings tool (merged to `main` in pull requests 16, 17 and 19, after this plan was first written): `/admin/found`, `docs/found-listings.md`, migration 0023. It finds a clinic's careers page, reads 1 page with Claude, refuses job boards, colleges and anything mentioning Eye Recommend, obeys robots.txt, keeps a record of each page read, and saves drafts for an admin to check. Publishing is off until `ENABLE_SEEDING` is set.
- Ad builder for clinics writing their own post.
- Job alerts for candidates who opt in.

## Phases

### Phase A: the "read this page" step (BUILT, see `docs/found-listings.md`)

Original plan, kept for reference. Still to do: reuse the same reader for the ad builder's "paste your job link" box (size S to M).

One step, shared by the ad builder and the seeding tool. Given a careers page address, fetch the page politely (check the page's own terms and robots rules first), have Claude pull out the role facts, and return them with a source address and the date read. Missing facts come back as "not stated". Fully testable with saved sample pages. Nothing is published and nobody is contacted. This is audit items R16 and R19.

### Phase B: found listing admin tool (BUILT, publishing switched off)

Original plan, kept for reference. Publishing needs `ENABLE_SEEDING` set to `yes` in Vercel, which waits for the disclosure conversation. Not yet rechecked each day: live found listings come down after 21 days or by "Take it down".

Admin pastes a clinic's careers page address, sees Claude's draft in our own words next to the source, edits, and approves. Approved listings are published as seeded, with the 21 day expiry. Stores the source page and date. Built rule: a job whose page gives no pay is left out, and the two required questions show "Not stated by the clinic" unless the page says.

Gate: do not publish until Gate A is close. Build it behind a switch, off by default.

### Phase C: clinic claim email send queue (size M to L)

- A table recording each address, the page it came from, the date found, and every send (the CASL proof).
- A review screen where Steve approves a batch (suggest 10 at a time to start).
- A send queue that respects the do not email list, the daily email budget, a ramp up schedule for the mail subdomain, and bounce and complaint handling (a bounce or complaint adds the address to the list).
- Rule: 1 email plus 1 follow up at most, then stop unless they reply.
- Fix the claim loop (audit R40) first, so the button in the email lands on a working claim.

Gates, all of them: Steve confirms the disclosure conversation, the lawyer has reviewed the outreach wording, Resend is on a paid plan (the free plan stops at 100 emails a day, shared with every other email), and the disclosure conversation has happened.

### Phase D: renewal and repost nudges (size S to M)

Needs Stripe, which is Phase 4 of the audit plan. Closing soon already exists. Add:
- A nudge after a job expires without a repost, once, with a "Post again" link (Post again already exists).
- A reminder before a monthly pass renews, and a gentle note if it ends.
- Billing and account messages are not marketing. A reminder that sells something carries the unsubscribe link and the mailing address.

### Phase E: measure, then loosen (size S)

Track for 4 weeks of batches: share of Claude's drafts edited by the admin, share rejected, bounces, complaints, unsubscribes and claims. Suggested bar to move to hands off for a type of task: under 10% of drafts needing a substantive edit, no inaccurate facts found in the last 20 approved, 0 complaints. Anything below the bar stays on batch approval. Steve sets the final numbers.

### Candidates (no phase, no cold email)

Individuals are never cold emailed. Reach them through job alerts (built), the waitlist, the blog and the pathways guide, small paid ads after launch, and, as an idea to test, letting a clinic invite its own applicants to create a profile. Anything that emails an individual needs their consent first.

## Decisions for Steve

1. DECIDED (5th November): Eye Recommend member clinics are treated like any other clinic once outreach is allowed. There is no member list in the project, so clinics are only ever found from their own public pages.
2. Batch size for approvals (suggest 10 to start).
3. DECIDED in the build: jobs with no pay on the page are left out of found listings.
4. The Phase E bar for hands off.

## Risks to watch

- A wrong fact about a real clinic. Mitigation: human approval, source link shown, "not stated" instead of guesses.
- A clinic's site forbidding automated reading. Mitigation: check each site's terms and robots rules, and read one page at a time.
- A damaged sending domain. Mitigation: ramp up slowly, small batches, stop on any spike in bounces or complaints.
- Eye Recommend relationship. Mitigation: the member clinic hold, and no member data anywhere in the project.
