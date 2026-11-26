# Quebec plan

Written 26th November 2026 after a strategy question from Steve. Nothing here is built. It is a plan to decide on, not a commitment.

## Where things stand today

Quebec jobs are refused on purpose (decided 6th November 2026, because Kestrel is in English). The refusal lives in 5 places:

1. The clinic job form (`lib/jobs.ts`).
2. Admin posting for a clinic and found listings.
3. The province search for found listings.
4. Approve and extend re-checks (`lib/job-approval.ts`, `lib/clinic-actions.ts`).
5. The database rule `jobs_not_quebec_once_sent` (migration 0040), tested in `lib/database-rules.test.ts` and `lib/quebec.test.ts`.

Quebec stays a choice on the waitlist, profile and alert forms, so Quebec residents can sign up and apply to jobs in other provinces. A field based job based elsewhere may cover Quebec; only the province the job is based in is checked. There is no Quebec pay guidance and no Quebec content on Resources.

## The short answer

Switching Quebec on is about a day of work. Launching there properly is a second launch, and French is the bulk of it.

## What launching properly needs

**1. French (the main cost).** There is no translation system today. Needed:
- A way to hold English and French text (Next.js internationalised routing, or a simple dictionary per page), and a language switch.
- The whole interface: components, forms, errors, buttons.
- The help centre (35 topics, `content/help.ts`), the blog, Resources, the policy pages.
- Every email (`lib/*-message.ts`, onboarding, alerts, daily digest).
- Job page structured data and page titles in French, with `inLanguage` set.
- The brand voice and its tests, which are written for English (banned words, no spelled out numbers, `lib/resume-wording.test.ts`). French needs its own rules.
- The no AI resume reader, which uses English headings and rules.
- Clinics' job ads: Quebec jobs would need a French ad, so the ad builder, the review queue and the Slack review alert all need a French path.

**2. Language law.** The Charter of the French Language (strengthened by Bill 96) generally requires job postings in Quebec to be available in French, and a posting in another language to be available in French at the same time and as easily. Requirements for English in a job also need a justification. Whether and how this binds an online job board, as opposed to the clinics posting, is a question for counsel (see below).

**3. Privacy.** Quebec's Law 25 is stricter than the rest of Canada: French consent and policy wording, a named person in charge of privacy, impact assessments for some uses, and rules on moving data outside Quebec. Needs a review of the resume reader, registration numbers, saved jobs, follows and the data download.

**4. Regulators.** Quebec has its own orders for optometrists and opticians. The registration number feature (`lib/licence.ts`) needs their registers and wording. Quebec's optician rules differ from the other provinces, so check before adding it to the list of provinces that require a number to apply.

**5. Pay rules.** The pay range rules (`lib/job-pay.ts`) were built around Ontario and BC. Check what applies in Quebec before reusing them, and add Job Bank figures for Quebec to the pay table once French pages exist.

**6. Tax.** Selling to Quebec clinics may mean QST as well as HST. Add to the accountant's list with the HST registration (CLAUDE.md, item 17).

**7. Support.** Quebec clinics will expect French support, a French help centre and French replies from support@eyecarejobs.ca.

## Questions for Quebec counsel

Kestrel has no lawyer yet, so these go to a Quebec language and privacy lawyer, not the paralegal.

1. Must a job board that is based outside Quebec present Quebec postings in French, or does the duty sit only with the employer? What does the Office québécois de la langue française expect from a platform?
2. Can a posting be bilingual (French and English side by side), and what counts as equal prominence?
3. What must Kestrel's terms, privacy policy and checkout be in French, and from when?
4. Law 25: what is the minimum for a privacy officer, impact assessments, and consent wording for a board that stores resumes in Canada?
5. Are there rules on how pay, or a requirement of English, may be shown in a Quebec posting?
6. Do the Quebec orders restrict how a registration number is collected or shown?
7. Anything on the Quebec side of a free launch coupon or automatic renewing passes.

## Build order, if it goes ahead

**Phase 0 (free, now).** Measure demand. Quebec is already a choice on the waitlist and profile forms. Add a Quebec count to Admin Insights (`lib/insights.ts`) so the decision rests on real numbers, with the usual "fewer than 5" rule.

**Phase 1 (counsel).** Book a short consult with Quebec language counsel and get answers to the questions above, in writing.

**Phase 2 (French core).** Language switch and French for the paths that matter most: Find jobs, job page, apply, sign up, post a job (including a required French ad for Quebec jobs), and the emails those paths send. Lift the Quebec refusal for these only. Tests stay in place for the other provinces.

**Phase 3 (French everything else).** Help centre, blog, Resources, policy pages, pay table with Quebec figures, French support.

**Phase 4 (Quebec content and growth).** Quebec directory entries, Quebec licensing guide, French social posts.

## Decision trigger (proposed, Steve to confirm)

Start phase 1 when all of these are true:
- The English site has launched and has taken paid posts (a number Steve sets).
- Phase 0 shows real Quebec interest.
- A lawyer is in place for Kestrel generally.

Until then, Quebec stays refused, and the 5 checks above stay as they are.

## Not decided

- Whether French is worth building for Quebec alone, or whether other provinces would also use it.
- Whether to translate by hand, with a translator, or with Claude and a reviewer who is a native French speaker. Quebec French has its own conventions, so a Quebec reviewer is needed either way.
- Budget. Nothing here is costed. Get the counsel and translator quotes before choosing.
