# Marketing operating rhythm: owners, budget, tests and the monthly competitor check

Marketing audit item 9. Proposed by Claude on 6th November 2026 from what is in the repository. Numbers marked "proposed" are Steve's to change. The backup person's name is deliberately not in this file (CLAUDE.md), so "backup" means the person Steve holds offline (see `docs/breach-plan.md`).

## 1. Who owns each channel

Steve owns every decision and approves anything that goes live or costs money. Claude builds, drafts and maintains. A "gate" means the channel is off until Steve confirms the disclosure conversation (Gate A), or until Stripe and the company are set up.

| Channel | Owner | Built or drafted by | Rhythm | Gate |
| --- | --- | --- | --- | --- |
| Website and home page copy | Steve | Claude | Review after each preview | None |
| Blog and resources | Steve | Claude (drafts from public sources) | 1 post a week, scheduled to April 2027 | None |
| Search (Search Console, Bing Webmaster, sitemap) | Steve | Claude for fixes | Weekly 10 minute check (`weekly-search-check.md`), AI assistants on the first Friday of the month | None |
| Waitlist email (confirmation, launch news) | Steve | Claude | Before each send | Launch news waits for launch |
| Social pages (LinkedIn, Facebook) | Steve | Claude drafts a queue | Approve a batch weekly, once there is a queue | Pages first, posting later |
| Outbound to clinics (CASL sequence) | Steve | Claude | Batches of 20, reviewed before each | Gate A and lawyer wording check |
| Associations, schools, press | Steve | Claude drafts pitches | One request at a time | Gate A |
| Paid search or social | Steve | Claude (pages and tracking) | Test only, see budget | Stripe live, funnel measured |
| Analytics and numbers | Steve | Claude | Monthly summary | Visitor counts arrive with Vercel Pro |
| Competitor check | Steve | Claude updates the page | 1st of the month, see section 4 | None |

## 2. Launch quarter budget (proposed)

Known running costs from `docs/PLAN.md`: about CA$65 a month once Vercel Pro and Supabase Pro are on (US$20 and US$25, plus email and the Claude API). Stripe takes 2.9% plus $0.30 a payment, so it costs nothing until money moves.

| Line | Proposed monthly | Notes |
| --- | --- | --- |
| Hosting, database, email, Claude API | about $65 | Fixed, from the plan |
| Analytics | $0 | Vercel Web Analytics is part of Pro for now |
| Paid advertising | $0 until Stripe is live, then at most $500 for one test | Decide the test in the test log first, with a stated result that would make it worth repeating |
| Print (flyer) | $0 until Gate A | Draft is in `docs/marketing/launch-flyer.html` |
| Domains | the yearly Namecheap renewal | eyecarejobs.ca renews on 29th October 2027 and is set to renew by itself (Steve, 6th November 2026). Keep a card on file that does not expire before then |

**Review:** the first Monday of each month, 30 minutes. Compare spend to sign ups and first posts. Nothing is spent on a channel that has no way of being measured.

Steve's own time is a cost too. From launch, note roughly how many hours a month go to each channel, so the true cost of a clinic is visible later (audit item 19).

## 3. Test log

One line per test. A test has 1 change, a result that would count as a win, and an end date. Do not run 2 tests on the same page at once.

| # | Started | What is changed | Why we think it helps | Measure and win line | Ends | Result and learning |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 6th November 2026 (live) | Home page lede states the difference and "built by someone with over 20 years in the industry" | Visitors see a reason to join within the first screen | Waitlist sign ups a week, and the share confirmed. Needs visitor counts to be a fair comparison, so compare sign ups only until Vercel Pro is on. Win: more than the previous 4 weeks | 4 weeks after Pro starts | |
| 2 | Not started | Show the pricing ladder to clinics and record which option each picks and why | The ladder was set on 5th November 2026 and no buyer has seen it | Count of clinics who pick single post, Clinic pass or Plus. Win: most clinics with 3 or more roles pick a pass | After the first 20 clinics | Gated: needs clinic conversations |
| 3 | Not started | Founding offer wording on `/clinics` (see `docs/marketing/founding-clinics-draft.md`) | Saying the lower response out loud builds trust | Clinics who join the waitlist after reading it, and any who cancel in month 2. Win: no month 2 cancellations that cite surprise at low response | After the first 10 founding clinics | Gated: needs Gate A and launch |

Add a new row before starting any change. Record the result even when it fails.

## 4. Monthly competitor check

Every 1st of the month, 20 minutes. Read each public page by hand. Do not scrape Indeed, LinkedIn or Jobs4ECPs, and nothing is copied from behind a login.

| Competitor | Page to read | Last prices in `lib/compare-prices.ts` | Checked on | What changed |
| --- | --- | --- | --- | --- |
| Eluta | eluta.ca/postjobs | $199 for 30 days, $375 for 60, $550 for 90 | 6th November 2026 | None, first capture |
| OJobs | ojobs.ca/pricing | $249 a slot for 1, down to $150 each for 5 | 6th November 2026 | None. Also note any activity (news, social posts) |
| Jobs4ECPs | jobs4ecps.ca/products | $100 for 1 job, 30 days | 6th November 2026 | None. Ownership still unconfirmed |
| Indeed | Employer sponsor budget screen | $38 and $63 a day on average | 6th November 2026 | None. Budget based, not comparable |
| LinkedIn | LinkedIn's own pricing page | Free basic post, promoted per click | 6th November 2026 | None |
| ZipRecruiter | Its employer checkout page | US$24 a day per active job | 6th November 2026 | None |
| CAO job board (opto.ca/job-board, also the CCOA career centre) | The board's public posting information | Not captured. Reported free to post, not confirmed | | Run by the Canadian Association of Optometrists on jobs.opto.ca. Named by Copilot in every eye care answer. Both a competitor for optometrist and assistant ads and the most useful association to approach after Gate A |
| OPClassifieds (opclassifieds.ca) | The site's public posting page | Not captured | 7th November 2026 | Steve looked on 7th November 2026: about 1,200 optician ads in one search, no filters, newest first, and ads still showing from 2024 after a long scroll. Probably cross posts from other boards, so it is not a source of leads and not worth a monthly read. Named by Gemini in 2 answers (prompts 6 and 10), not by ChatGPT. Only check it again if an assistant keeps naming it. Not on the compare page without a published price |
| OAC job list (Opticians Association of Canada) | The association's public job list page | Not yet captured | | Named by Gemini for optician jobs, 7th November 2026. Check whether it is free or members only |

Next check: 1st December 2026. If a price changed, send the new figure and the date to Claude, who updates `lib/compare-prices.ts` and the date shown on `/compare`. Also note any new eye care board, and any change in what a competitor says about itself (audience size claims are quoted as "X says", never as fact).

Also check on the same day: is each competitor's page still saying what the comparison says, and has the lawyer cleared the compare page yet.
