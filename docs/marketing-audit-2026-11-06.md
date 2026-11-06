# Marketing audit: Kestrel Eye Care Jobs

Run on 6th November 2026 against the 21 section framework Steve supplied. Evidence comes only from this repository (code, docs, migrations, content). Nothing from Eye Recommend was used. Where an answer lives outside the repo (Search Console data, social accounts, Steve's own notes), it is marked "Steve to confirm" instead of guessed.

## How to read the ratings

The framework was written for established software companies. Kestrel is a two sided job board that has not launched, so many questions cannot be answered with data yet. Ratings follow one rule:

- **Green**: in place and working, or deliberately decided and built.
- **Amber**: partly in place, or planned with a document but not built or tested.
- **Red**: absent. A Red marked "(stage)" is absent because launch has not happened, not because of a mistake. Those are the first things to switch on at launch. A Red without that mark is a real gap today.

The table has 3 columns beyond the question: rating, evidence, and a **next move** (the framework asked for rating and evidence, so the third column is an addition for you to keep or delete).

## Scoreboard

| Section | Green | Amber | Red |
| --- | --- | --- | --- |
| 1. Value proposition and positioning | 0 | 3 | 0 |
| 2. Target audience and minimum viable segment | 1 | 3 | 0 |
| 3. Product market fit validation | 0 | 1 | 3 (2 stage) |
| 4. Competitive and market intelligence | 0 | 1 | 2 (1 stage) |
| 5. The marketing mix | 0 | 4 | 0 |
| 6. Pricing and packaging | 1 | 1 | 2 (1 stage) |
| 7. Branding and visual identity | 3 | 0 | 0 |
| 8. The marketing funnel and website | 0 | 3 | 0 |
| 9. Content and inbound (SEO) | 1 | 1 | 2 |
| 10. Paid acquisition | 0 | 1 | 2 (2 stage) |
| 11. Social media and community | 0 | 0 | 2 (1 stage) |
| 12. Direct mail and outbound | 0 | 1 | 1 |
| 13. Partnerships, integrations and third party proof | 0 | 0 | 3 |
| 14. Sales and marketing alignment | 0 | 1 | 2 |
| 15. Activation and onboarding | 0 | 1 | 2 (1 stage) |
| 16. Lifecycle and email marketing | 0 | 2 | 1 |
| 17. Retention, expansion and customer success | 0 | 1 | 2 (1 stage) |
| 18. Analytics and attribution | 0 | 1 | 2 |
| 19. Unit economics | 0 | 2 | 2 (2 stage) |
| 20. Compliance and trust | 0 | 2 | 0 |
| 21. Team, budget and process | 1 | 1 | 2 |
| **Total (67 questions)** | **7** | **30** | **30** |

## The 6 findings that matter most

1. **There is no way to measure the funnel.** No web analytics, no campaign tagging, no record of where a waitlist sign up came from (the waitlist `source` column is a fixed label). Cookie free job views and apply clicks exist (migration 0030), and Search Console was set up on 31st October, but nothing connects a visit to a sign up to a paid post. Fix before the free launch starts, because the free to paid conversion data (Gate C) depends on it.
2. **Two thirds of the "promotion" mix is switched off by design.** Outbound, partnerships and PR all wait for the Eye Recommend disclosure conversation (Gate A). Until then the whole acquisition plan is the blog, the resources page and Google. That is a sound, safe choice, but it means search is carrying everything, so the next 2 findings matter more.
3. **Search has no landing pages for the queries that pay.** Filtered job searches are set to noindex (`app/jobs/page.tsx`), so there is no indexable page for "optician jobs in Ontario" or "optometrist jobs in Alberta". The blog covers advice searches well (24 posts), but the high intent job queries have nowhere to land. This is the biggest gap against the goal of being first on Google for eye care jobs in Canada.
4. **The pricing page has no recommended tier and no testing plan.** Prices were set on 5th November 2026 from competitor research and reasoning. That is a good start, but they are 1 day old and untested with a clinic. The founding offer is well thought out (`docs/marketing/founding-clinics-draft.md`); the pass choice on the page is not guided.
5. **No proof yet.** No testimonial, case study, clinic spotlight or number a visitor can check. The honest stance in the founding draft ("fewer applications at first") is a strength, but a new board needs at least 3 named clinics before the spotlight and PR plans have anything to show.
6. **Activation is undefined.** Nobody has written down what a successful clinic or candidate looks like in week 1. Suggested definitions are in section 15. They take an hour to agree and everything in sections 3, 15, 16 and 17 depends on them.

## Strategy and foundation

### 1. Value proposition and positioning

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| Can a first time visitor understand what it does within 5 seconds? | Amber | Home page names it plainly ("Canada-wide eye care job board", "A job board for eye care in Canada"). But the strongest differences (pay on every job, a person reads every post, no agencies) sit below the first screen, and the hero pill says "Waitlist now open" with no reason to join. | Put one line of the difference under the hero lede. Test with 5 people, 5 seconds each. |
| Does the messaging show how it beats the alternatives (general boards, spreadsheets, word of mouth)? | Amber | `/compare` is dated, sourced and fair, and the clinic card explains the "sinks among thousands" problem. The home page does not link to it, and the candidate side has no equivalent comparison. "Built by people who know it" is a claim with no named person or number behind it. | Link `/compare` from the clinic card. Replace "built by people who know it" with a specific only Steve can give. |
| Is the core message consistent across website, social and ad copy? | Amber | One surface exists, and it is consistent (name, line, palette, voice in CLAUDE.md). No social profiles or ads exist yet, so consistency is untested. | Reuse the exact name, line and description when social pages are created. |

### 2. Target audience and minimum viable segment

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| Is the Ideal Customer Profile documented? | Amber | `docs/market-sizing.md` sizes the core customer (independent practices, about 2,000 to 4,000) and `docs/first-region-ontario.md` picks the region. No single page states the decision maker (owner optometrist or practice manager), the pain points in their words, or the trigger event (a resignation, a new location). | Write a half page ICP: who posts, who pays, what just happened. Steve's weekly counts and his own contacts supply the specifics. |
| Are efforts contained to the minimum viable segment? | Amber | Ontario first, then Alberta and British Columbia, but Steve decided on 6th November 2026 to cover all roles from the start, and the product also serves supplier and field roles, candidates and locums later. Two sided boards usually win by filling one side first. | Treat clinics in Toronto and the Greater Toronto Area hiring opticians and assistants as the first measured segment, even if the site stays wide. |
| Do materials speak to the segment's acute problems? | Green | Clinic card names the real pain. Ontario's January 2026 pay range, vacancy and AI screening rules are built into the post form and explained in `/posting-policy` and a blog post. Pay table on `/resources` answers a question clinics have to answer anyway. | Replace "clinics often say" with a counted example once Steve has one. |
| Does the messaging also address the wider buying group? | Amber | Independents are served (owner buys and uses). Corporate groups are welcomed in copy but there is no invoice, purchase order, multi location or approval step, and no answer for a head office asking where data is stored. | Add a short "for groups" section on `/clinics` stating Canadian data region and invoicing, once checkout exists. |

### 3. Product market fit validation

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| Are active usage and engagement metrics tracked before ad spend scales? | Amber | Job views and apply clicks per job are built (migration 0030, no cookies, bots and the clinic excluded). Admin weekly counts exist (`lib/admin-stats.ts`). No returning visitor, session or funnel measure. No ad spend planned, so the order is right. | Add the funnel events in section 18 before the free launch. |
| Has a quantified test been run (Sean Ellis question)? | Red (stage) | Nothing in the repo. It needs about 40 active users to mean anything. | Add the question to the clinic and candidate home pages after the first 30 days of real use. Candidates and clinics get separate scores. |
| Are surveys and interviews gathering early adopter feedback? | Red | The founding draft leaves a placeholder for Steve's real example. No interview guide, notes or log. Found listings feedback is informal. | Run 5 clinic conversations before launch with the same 4 questions (how do you hire now, what does it cost, what went wrong last time, what would make you try a new board). Log them in `docs/`. |
| Are early cohorts returning? | Red (stage) | No users yet. Return hooks exist (job alerts, Recommended for you, closing soon emails), so there is something to measure. | Track weekly return for candidates and repeat posting within 60 days for clinics. |

### 4. Competitive and market intelligence

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| Is there a living competitor tracker? | Amber | `docs/competitor-pricing.md` records prices with capture dates and says to re-check monthly. Positioning, audience claims and recent changes are not tracked, and nobody is named to do the monthly check. | Add a dated "what changed" line per competitor, and put the monthly check in Steve's calendar. |
| Are win/loss interviews happening? | Red (stage) | No customers or lost deals yet. | Ask every clinic that signs up or declines at launch one question: what did you use before, and why? |
| Are review and directory profiles claimed and current? | Red | G2 and Capterra do not apply to a job board. The equivalents are Google Business Profile, Bing Webmaster Tools, LinkedIn and Facebook pages, and the association directories. Search Console is done (31st October 2026). The repo shows none of the others created. | Create the Bing and Google Business profiles and the 2 social pages from the discoverability plan, using the exact brand name and description. Steve to confirm what exists. |

### 5. The marketing mix

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| Product: packaged for easy adoption? | Amber | Self serve is strong where built: ad builder, job templates, pay benchmark, Find your fit quiz, claim your listing. Checkout is not built (Stripe in test mode is still on the list), so a clinic cannot yet go from sign up to a paid live post alone. | Finish Stripe with `payment_method_collection: if_required` so free launch posts never ask for a card. |
| Price: matches the audience's budget and perceived value? | Amber | Role bands ($59, $79, $99) sit near Jobs4ECPs ($100 for any role) and under Eluta ($199) and OJobs ($150 to $249 a slot). Free options exist (Indeed's free tier, CAO board, Job Bank), so value rests on the pay range rules, fit and applicant tools. Untested with a buyer. | See section 6. |
| Place: distribution channels optimised? | Amber | Sitemap, robots rules and JobPosting data on every live job are in place, which is the route into Google for Jobs. No presence on association directories, no feed to other boards (and none planned, by the no scraping rule). | Ask 3 associations to list the resources page after Gate A. |
| Promotion: balanced inbound, outbound and product led? | Amber | Inbound is built (24 posts through April 2027, resources, compare). Outbound is built and switched off pending Gate A. Product led loops exist in pieces (claim your listing, share links, "tell a clinic you know") but none is measured. Paid is not planned until Stripe. | Accept search led until Gate A, then switch on outbound in small batches with the CASL sequence. |

### 6. Pricing and packaging

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| Is the pricing page clear, with a recommended tier? | Amber | `/clinics` explains the founding offer and `lib/pricing.ts` is the single source for prices. No tier is marked as recommended, and two passes plus three single post bands is a lot to compare. | Mark the Clinic pass as the pick for clinics posting 3 or more roles a year, with a one line cost per post comparison. |
| Has pricing been tested, or set once and left? | Red | Set on 5th November 2026 from competitor research and a revenue model (`docs/PLAN.md`). No buyer has seen it. The model's mix (40/35/25) is marked as an assumption. | Show the ladder to the 5 clinics from section 3 and record which tier each picks and why. Review after the first 20 paid posts. |
| How do competitor models change how buyers see yours? | Green | `/compare` states each competitor's model fairly (sponsored slot, niche board, budget based) with sources and dates, and the rules in `docs/competitor-pricing.md` keep it honest. Still needs the lawyer's check on comparative advertising. | Keep the lawyer pack item open until cleared. |
| Is the free model converting, or collecting unused accounts? | Red (stage) | Free launch runs 30 to 60 days with no card. Free to paid recording is a Gate C item but not built. The risk is a free post that expires and a clinic that never returns. | Record first free post date, second post, and first paid post per clinic from day 1. |

### 7. Branding and visual identity

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| Does the branding convey trust, security and modern usability? | Green | Consistent palette and type, self hosted fonts, an accessibility pass (no axe violations on public pages), security and breach plans. The "Draft for review" banner on the legal pages undercuts trust until the lawyer finishes. | Remove the banner once the lawyer signs off. |
| Are logo, colours and typography consistent across app, site and external assets? | Green | Tokens in `app/globals.css`, one logo set in `public/brand`, rules against redrawing it. The launch flyer and email templates follow the same set. External assets (social, directories) do not exist yet. | Use `public/brand` files only for social avatars and covers. |
| Is the brand voice documented and applied? | Green | Writing rules in CLAUDE.md and enforced by `npm test` (banned words, no em dashes). | Keep. |

## Acquisition

### 8. The marketing funnel and website

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| Awareness: clear pathways for new traffic? | Amber | Blog, resources and pay table, compare page, sitemap and Search Console. No evidence yet of indexed pages or traffic (Steve to confirm from Search Console). All paths depend on search. | Check how many pages are indexed and which queries show impressions. |
| Consideration: demos, comparison pages, case studies? | Amber | Comparison page and Find your fit quiz are live. A private demo site exists (demo.eyecarejobs.ca) but clinics are not shown it. No case studies or testimonials. | Record a 2 minute screen walk through of posting a job and put it on `/clinics`. |
| Conversion: landing pages optimised, clear calls to action? | Amber | One clear call to action (join the waitlist) with consent wording and a confirmation email. No variant tests, and the form is not tied to where the visitor came from. | Add a source field (section 18) before testing anything. |

### 9. Content and inbound (SEO)

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| Is content educational and about the segment's problems? | Green | 24 posts scheduled weekly to 9th April 2027 on job ads, hiring, interviews, onboarding, retention and rules, written from public facts. Balance leans to candidate advice (CVs, interviews, raises); clinic hiring posts are the ones that bring buyers. | Weight the next 10 posts toward the clinic side (cost of a vacancy, notice periods, pay for each role). |
| Is technical SEO sound? | Amber | Sitemap, robots, canonical base URL, article and JobPosting structured data matched to the visible page, mobile and accessibility checks. No Organization or WebSite structured data on the home page, no speed measurement recorded. | Add Organization data and record Core Web Vitals from Search Console. |
| Is content mapped to high intent queries? | Red | Filtered job searches are noindex, so no page targets "optician jobs Ontario" or "optometric assistant jobs Toronto". The blog is mostly informational. No keyword list in `docs/`. | Create indexable landing pages for role plus province (for example 6 roles by 3 provinces) that load only when real jobs exist. Keep the noindex on arbitrary filter combinations. |
| Does the brand appear when people ask AI assistants? | Red | A plan exists (`docs/discoverability-plan.md`) with quotable, dated assets (pay table). No record of testing any prompt, no `llms.txt`, and no jobs yet to cite. | Run 10 fixed prompts monthly ("where do I find optician jobs in Canada") and log whether Kestrel is named. Start now to get a baseline. |

### 10. Paid acquisition

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| Search campaigns capturing active demand? | Red (stage) | None, correctly. Prices are not switched on and outreach is gated. | Plan a small test (under $500) for "post an optician job" after Stripe is live. |
| Awareness ads reaching decision makers? | Red (stage) | None. | Hold until the funnel is measurable. |
| Landing page alignment? | Amber | Dedicated pages exist (`/clinics`, `/resources`, `/compare`, `/find-your-fit`), so a campaign would not have to use the home page. | Build one page per paid message when a test is planned. |

### 11. Social media and community

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| Active only where target decision makers spend time? | Red | Social is planned as "small and later" with an approval queue. No profiles confirmed. Never Steve's personal profiles, never Eye Recommend accounts. | Create the LinkedIn company page and Facebook page (clinic owners and opticians use both). Skip the rest until the queue works. |
| Testimonials and early wins amplified? | Red (stage) | None exist. The member spotlight plan waits for 3 opted in clinics. | Ask each founding clinic for one sentence and a first applicant count at day 30. |

### 12. Direct mail and outbound

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| Is direct mail used for high value decision makers? | Red | Not planned or built. Postal mail is outside CASL, but any outreach to clinics stays off until Steve confirms the disclosure conversation. | Decide after Gate A whether a mailed one page pay guide to independent practices is worth testing in Toronto. |
| Are outbound campaigns tailored to niches? | Amber | The CASL outreach sequence, claim your listing and province search for leads are built and tested; published business emails only; off pending Gate A (`docs/casl-outreach.md`, `docs/automation-plan.md`). | Ready the first batch of 20 Toronto leads as a draft. |

### 13. Partnerships, integrations and third party proof

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| Do integrations, marketplaces or referral partners drive acquisition? | Red | Google for Jobs via structured data is the only distribution channel built. No association, school or supplier partnerships. | List the optometry associations and optician programs (Ontario first) and prepare a single request. |
| Are analyst mentions, awards, PR, podcasts or webinars pursued? | Red | Trade press is "later, after the disclosure conversation". The resources page is designed to earn links. | Draft one pitch: a yearly Canadian eye care hiring summary from Job Bank data. |
| Is there a referral or affiliate programme? | Red | None. The "tell a clinic you know" link on empty searches is a seed. | Offer one free post to a clinic that refers a clinic that posts. |

## Conversion and handoff

### 14. Sales and marketing alignment

Kestrel is self serve and run by one person, so a sales and marketing split does not exist. The questions still help because Steve is the handoff.

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| Are MQL, SQL and "qualified" defined in writing? | Red | Not defined. The admin claims queue and waitlist are the only lists. | Write 3 definitions: waitlist (interested), claimed clinic (qualified), first live post (customer). |
| How fast does a lead get a response? | Amber | Automatic reply for hello@ is built (`docs/email-templates/auto-reply`). No target for a human reply. Demo to close does not apply. | Set a target (for example 1 business day) for clinic questions. |
| Is there a feedback loop on lead quality, loss reasons and objections? | Red | None. | Keep a simple log of every clinic question or objection during the first 20 conversations. |

## Activation and retention

### 15. Activation and onboarding

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| What is the aha moment, what share reach it, how fast? | Red | Not defined. Proposed: clinic = first live post that receives an application; candidate = first application sent, or first alert opened. | Agree the definitions, then log the date of each step per account. |
| Where do users drop off in the first 7 days? | Red (stage) | No event data. Steps exist to measure: sign up, profile, first post draft, review, live. | Count each step in the admin numbers. |
| Is in app guidance in place? | Amber | Welcome page, templates, ad builder, pay benchmark, application drafts and cover letter drafts, clinic dashboard views. No checklist or progress marker. | Add a 4 step checklist to the clinic and candidate home pages. |

### 16. Lifecycle and email marketing

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| Onboarding drips guiding users to the aha moment? | Amber | Waitlist confirmation and sign up emails go through Resend with the Kestrel layout. The daily job sends closing soon, unopened application reminders and alert digests. No timed first week sequence. | Write a 3 email first week sequence for each side (day 1, 3, 7). |
| Milestone emails showing value delivered? | Red | A monthly note with views and apply clicks is planned for founding clinics, not built. Counts exist in the dashboard. | Build the monthly clinic note once views have a few weeks of data. |
| Churn prevention for inactive users? | Amber | Closing soon emails prompt a repost. No inactive clinic or candidate sequence. | Add one "no post in 45 days" email for clinics and one "no activity in 30 days" email for candidates, within CASL rules. |

### 17. Retention, expansion and customer success

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| Are retention and churn reasons logged? | Red (stage) | No paid customers. Passes renew automatically and cancel at any time (Terms), so cancellation reasons will need a prompt. | Add a one question exit prompt on pass cancel. |
| Is there an upsell path with an owner? | Amber | Single post, then Clinic pass, then Plus (optometrists), and boosted posts later (`docs/sponsored-ads-plan.md`). Upgrade rules are internal (`docs/pass-procedures.md`). Steve is the owner by default. | State the trigger: the third single post in 90 days gets a pass offer. |
| Are NPS or CSAT, health scores and advocacy in place? | Red | None. | Ask the Sean Ellis question and one satisfaction question at day 30. Skip health scores until there are 50 paying clinics. |

## Measurement and economics

### 18. Analytics and attribution

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| Do analytics, CRM and ad platforms track the same conversions with consistent UTM naming? | Red | No GA4, no tag manager, no CRM and no UTM handling in the code. Cookie free job counts are a deliberate privacy choice. | Choose a privacy first analytics tool, write a one page UTM naming guide, and capture `utm_source` and `utm_medium` on the waitlist and sign up forms. |
| Can a closed deal be traced to its first touch? | Red | The waitlist source is a fixed label. No first touch stored on accounts or posts. | Store first touch at sign up and carry it to the first paid post. |
| Is there one dashboard the team trusts? | Amber | The admin overview has weekly counts and a market count sheet; the Gate C tile is still to build (R41). | Build the Gate C tile, then add funnel steps from section 15. |

### 19. Unit economics

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| CAC: all costs tracked and attributed? | Red (stage) | Running cost is known (about CA$65 a month at launch, `docs/PLAN.md`). Steve's time is not counted and no channel spend exists. | Log hours spent by channel from launch. |
| LTV: projected lifetime revenue modelled? | Amber | The revenue model assumes 47 passes and 550 single posts a year but no churn, no renewal rate and no average months retained. | Add three scenarios for pass retention (3, 6 and 12 months). |
| Ratio health: LTV:CAC toward 3:1? | Red (stage) | No data. With almost no paid acquisition, the ratio will look high at first for a misleading reason (free search traffic). | Report it with and without Steve's time. |
| CAC payback and gross margin? | Amber | Margin should be high (Stripe at 2.9% plus $0.30, fixed hosting, a few dollars of email and AI use). Payback is undefined until CAC exists. | Compute margin per post once Stripe fees and Claude usage are live. |

## Risk and operations

### 20. Compliance and trust

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| Are privacy, cookies and CASL handled correctly? | Amber | Privacy policy live, consent wording saved with each sign up, signed unsubscribe links, do not email list, mailing address in email footers, Turnstile on sign up, cookie free counts, Canadian database region, and a lawyer pack. The lawyer's review is outstanding and legal pages still say "Draft for review". | Close the lawyer review, then remove the banners. |
| Is there a visible security page and relevant certifications? | Amber | `docs/security.md` and `docs/breach-plan.md` are thorough but internal. No public page tells a clinic where data lives or how CVs are protected. SOC 2 does not apply at this size; Canadian data residency matters more to this audience. | Publish a short "How we protect your data" page: Canada region, CV handling, sign in protection. |

### 21. Team, budget and process

| Question | Rating | Evidence | Next move |
| --- | --- | --- | --- |
| Does every channel have a named owner? | Amber | Steve owns every decision and Claude builds. Channels are not listed with an owner, and the backup person is deliberately kept out of the repo. | Add a channel table to `docs/` with an owner and a backup for each. |
| Is the budget split deliberate and reviewed? | Red | Running costs are known. No marketing budget is set, and no review date. | Set a launch quarter budget (even $0 for ads) and a monthly review. |
| Is there an experimentation cadence? | Red | Plans and decisions are well recorded, but no test log (hypothesis, result, learning). | Start a one page test log with the first 3 tests: hero line, pricing ladder, founding offer wording. |
| Is the martech stack documented, with overlap flagged? | Green | The stack table in CLAUDE.md and `docs/security.md` list each service. No overlap found. The gap is analytics, not too many tools. | Add the chosen analytics tool to both when picked. |
