# Marketing audit: what to do first

6th November 2026. Ranks every next move from `docs/marketing-audit-2026-11-06.md` by how much it matters to launch and to the Google and AI search goal, and by how easy it is to fix.

**Ease key:** S under a day. M 1 to 3 days. L more than 3 days. "Steve" means only Steve can do it. "Claude" means Claude builds it and Steve approves. Impact is High, Medium or Low for launch and the search goal.

**One correction to the audit.** It suggests clinic conversations, testimonials, referral offers, association requests, press and direct mail. Under CLAUDE.md and `docs/first-region-ontario.md`, anything that contacts clinics or associations stays off until Steve confirms the disclosure conversation (Gate A). Those items are in group D, not in the work list.

## A. Do now: high impact, easy (about 2 weeks, no gate)

| # | Move | Audit section | Impact | Ease | Who |
| --- | --- | --- | --- | --- | --- |
| 1 | Write 3 definitions: waitlist member, qualified clinic (claimed profile), customer (first live post). Agree what a good first week is: clinic = first live post that gets an application; candidate = first application or opened alert. | 3, 14, 15 | High | S, about 1 hour | Steve decides, Claude drafts |
| 2 | Save where each waitlist and sign up came from (`utm_source`, `utm_medium`, referrer), and write a one page naming guide for links. | 18 | High | S | Claude |
| 3 | Choose a privacy first analytics tool (Search Console is already done) and add the funnel steps: visit, waitlist, sign up, profile, first post, first application. | 18, 3, 15 | High | M | Steve picks, Claude installs |
| 4 | Home page: one line under the hero stating the difference (pay on every job, a person reads every post, no agencies). Link `/compare` from the clinic card. Swap "built by people who know it" for a specific only Steve can give. | 1, 8 | High | S | Claude, Steve supplies the specific |
| 5 | Mark the Clinic pass as the pick on `/clinics`, with a cost per post line. | 6, 5 | Medium | S | Claude |
| 6 | Add Organization structured data to the home page. | 9 | Medium | S | Claude |
| 7 | Baseline for AI assistants: ask 10 fixed prompts (for example "where do I find optician jobs in Canada") and log whether Kestrel is named. Repeat monthly. | 9 | Medium | S, 30 minutes | Steve |
| 8 | Create the Bing Webmaster, Google Business, LinkedIn and Facebook pages with the exact brand name, line and description. Kestrel's own accounts only. | 4, 11 | Medium | S, about 2 hours | Steve |
| 9 | Write the small process docs: a channel owner table, a launch quarter budget (even $0 for ads), a test log with the first 3 tests, and a monthly competitor check in the calendar. | 4, 21 | Medium | S, about 2 hours | Steve, Claude drafts |

## B. Next: high impact, more work (December, no gate)

| # | Move | Audit section | Impact | Ease | Who |
| --- | --- | --- | --- | --- | --- |
| 10 | Indexable landing pages for role plus province (for example "optician jobs in Ontario"), shown only when real jobs exist. Keep noindex on random filter combinations. | 9 | High | M | Claude |
| 11 | Stripe checkout in test mode with the free launch coupon, `payment_method_collection: if_required`. Already on the build list. | 5, 6 | High | L | Claude, Steve gives test keys |
| 12 | Admin Gate C tile and the funnel numbers (free to paid, first post date, second post). | 18, 6, 19 | High | M | Claude |
| 13 | A short public page: "How we protect your data" (Canadian region, CV handling, sign in protection). | 20 | Medium | S to M | Claude from `docs/security.md`, lawyer glance |
| 14 | A 3 email first week sequence for clinics and one for candidates. | 16, 15 | Medium | M | Claude drafts, Steve edits |
| 15 | A 4 step checklist on the clinic and candidate home pages. | 15 | Medium | M | Claude |
| 16 | Weight the next 10 blog posts toward clinic hiring topics (cost of a vacancy, pay by role, notice periods). | 9 | Medium | S per post | Claude drafts |
| 17 | A 2 minute screen walk through of posting a job for `/clinics`. | 8 | Medium | S, about 2 hours | Steve |
| 18 | A short "for groups" block on `/clinics` (invoicing, data region), after checkout exists. | 2 | Low | S | Claude |
| 19 | Half page ICP: who posts, who pays, what just happened (a resignation, a new location). From Steve's weekly counts and his own knowledge. | 2 | Medium | S | Steve |

## C. After launch data exists (wait for real numbers)

| # | Move | Audit section | Ease |
| --- | --- | --- | --- |
| 20 | Sean Ellis question and one satisfaction question at day 30 | 3, 17 | S |
| 21 | Weekly return rate and repeat posting within 60 days | 3, 17 | S once 12 is built |
| 22 | Show the pricing ladder to real buyers and review prices after the first 20 paid posts | 6 | S |
| 23 | One question exit prompt when a pass is cancelled | 17 | S |
| 24 | Inactive clinic (45 days) and inactive candidate (30 days) emails | 16 | M |
| 25 | Monthly note to founding clinics with views and apply clicks | 16 | M |
| 26 | LTV scenarios for 3, 6 and 12 month pass retention, and an hours by channel log for CAC | 19 | S |
| 27 | Small paid search test (under $500) for "post an optician job", on a dedicated page | 10 | M |
| 28 | Social posting queue Steve approves; automatic only after a month of clean posts | 11 | M |
| 29 | Upsell trigger: third single post in 90 days gets a pass offer | 17 | S |

## D. Waiting on Gate A (disclosure conversation) or the lawyer

| Move | Audit section | Waiting on |
| --- | --- | --- |
| Clinic conversations (5 with the same 4 questions), win and loss log, objection log | 3, 4, 14 | Disclosure conversation |
| First batch of 20 Toronto outreach leads, sent through the CASL sequence | 12 | Disclosure, lawyer check of wording |
| Association and school requests, trade press pitch (yearly hiring summary) | 13 | Disclosure |
| Testimonials, clinic spotlight (3 opted in clinics), referral offer | 11, 13 | Disclosure and real clinics |
| Direct mail test to independent practices | 12 | Disclosure |
| Remove "Draft for review" banners | 7, 20 | Lawyer review |
| Clear `/compare` for comparative advertising | 6 | Lawyer pack |

Group D items that cost nothing can be prepared as drafts now (the Toronto lead list, the pitch, the interview questions), the same way the flyer is, so they are ready the day Gate A clears.

## If you only have time for 3 things

1. Items 1, 2 and 3: definitions and measurement. Everything else in the audit depends on being able to count.
2. Item 10: role and province landing pages. This is the largest search gap.
3. Item 11: Stripe checkout. Nothing can be bought until it exists.
