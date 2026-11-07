# Role and province landing pages

Built 6th November 2026 (marketing audit item 10). No database change and no new setting.

## What exists

| Address | What it shows |
| --- | --- |
| `/eye-care-jobs` | A hub: every province and every role, with the number of live jobs where there are some |
| `/eye-care-jobs/ontario` | Live jobs in one province, typical pay for each role there, and links to the roles that are hiring |
| `/eye-care-jobs/ontario/optician` | Live jobs for one role in one province, typical pay for that role, and links to nearby pages |

There are 12 provinces and territories (no Quebec, because Kestrel is in English for now and does not take Quebec jobs) and 10 roles, so 120 role pages, 12 province pages and the hub.

## The rule that keeps them honest

A page asks Google to index it only when it has at least 1 live job. With no jobs it says "No jobs here yet", asks the visitor to join the waitlist, and tells Google not to list it (it can still be visited and its links followed). The sitemap lists only pages with jobs. So before launch no landing page is offered to Google, and each one becomes indexable on its own the hour after its first job goes live (pages refresh hourly). Nothing is switched on by hand.

The same rule is in `lib/landing.ts` (`landingIndexable`) and is tested in `lib/landing.test.ts`.

## Where the unique content comes from

Each page shows typical pay from the same Job Bank figures as the Resources page, with the Open Government Licence line and the wording "typical" and "median". Optometrist pay is left off, as decided on 6th November 2026, so an optometrist page shows jobs and no pay table. Each page also links to one published blog post (a post scheduled for later is never linked), and to the nearest other pages that have jobs.

## What was changed elsewhere

- The job search page and the landing pages share one job card (`components/JobCard.tsx`).
- Footer link "Jobs by province" on the home page and every page with the standard footer, and a link under the job list on `/jobs`.
- `/jobs` search results stay noindex when filtered, as before.

## Limits and next steps

- A page with 1 or 2 jobs is thin. It is still better than none for a real search such as "optician jobs Ontario", but expect the first pages to rank slowly. The seeded and claimed jobs (Gate A) are what fills them.
- City pages (Toronto, Calgary) are not built. Add the biggest cities once 5 or more have live jobs.
- Search Console will show which of these pages get impressions. Check on the 1st of each month.
- Files: `lib/landing.ts`, `lib/landing-pages.ts`, `components/LandingView.tsx`, `app/eye-care-jobs/`.
