# Gemini documents: phased plan (8th November 2026)

Status: agreed with Steve on 8th November 2026. Nothing in this file is built. Each phase below is one chat. Steve pastes the prompt for that phase into a new chat, and attaches or supplies the items under "Steve provides".

## Where this came from

5 PDFs made in Gemini: an agency blueprint, a growth playbook, an SEO content calendar of 20 topics, a SWOT and platform audit, and a project summary. They are AI output and none of their figures are sourced. Treat every number in them as unverified. Do not commit the PDFs to the repository. Each prompt below carries the useful extract, so a new chat never needs the PDFs.

## Decisions on record (Steve, 8th November 2026)

1. **Indeed.** The ban on Indeed as a lead source is lifted, for manual use only. Steve (or later a VA) reads Indeed by hand to find which clinics are hiring, then reaches out to the clinic with a "claim your listing" offer. No automated scraper is built, ever. Listing text comes from the clinic's own careers page where one exists, in Kestrel's own words. CLAUDE.md must be updated to say this (Phase 0).
2. **Applications stay with the clinic.** On listings the clinic has not claimed, candidates are sent to the clinic's own website to apply. Kestrel does not hold applications for clinics that have not joined. A claim email may say "N people clicked apply on your listing" only when that number is real, from the job stats already counted (migration 0030). Never invent or round up a number.
3. **Pay stays public on every post.** Optometrist pay gets extra pay basis options (see Phase 2), and the range is still required. Steve asked on 8th November 2026 whether optometrist pay could be visible only to optometrists. Advice given: a pay range shown only after sign in is very unlikely to count as "publicly advertised", it would be left out of Google's job markup, and a self selected "optometrist" profile is not verification. Not decided as a rule. Possible middle path for Steve to weigh: keep the required range public, and gate extra detail (exact production formula, equipment support) to signed in optometrists. Optometrist wages stay off the public pay table (decision of 6th November 2026). The lawyer is asked (see the end of this file).
4. **Employee count.** Ask a clinic how many employees it has when it creates an account. Store it. Steve has verified that Ontario's pay range rule applies to employers with 25 or more employees. The count is self declared and cannot be checked, and Kestrel's own rule (a range on every post) is stricter than the law, so do not switch the rule off for smaller Ontario clinics unless Steve decides to. BC has no such threshold as far as is known (unverified). The stored count is what lets that decision be made later.
5. **Blog.** Stays human, fortnightly, ranked by SEO benefit. The two pillar pages (hub guides) are kept.
6. **SMS alerts.** Wanted, but after the pay phase and after launch data exists. Email alerts are the channel at launch. SMS needs its own express consent under CASL and a per message cost.
7. **App.** Later. Wrap the website (an installable web app first) rather than build native.
8. **Parked, for information only.** The agency blueprint (`docs/agency-pathway.md`), sister companies, funding (a $50,000 SAFE note, raising from founding doctors) and a native app. The funding idea raises securities law and conflict questions, and the Eye Recommend question, so it goes to the lawyer when Steve chooses.
9. **Lawyer addendum.** Not now. Wait for the first document back from the lawyer.
10. **Timing.** Steve is waiting on the lawyer's documents. The disclosure conversation (Gate A) happens after that. Goal: launch in mid January 2027, whether the conversation lands a few days or a month later.

## Starting a chat

This file is on `main` (merged 8th November 2026), so every new chat can read it. Begin each prompt with: "Read `docs/gemini-intake-plan-2026-11-08.md`." If a chat cannot find it, run `git fetch origin main` first. Work for each phase goes on its own new branch.

## Audit track (existing, separate from the Gemini ideas)

The Gemini documents did not include the full code audit. That is the audit of 30th October 2026 (`docs/audit/AUDIT-REPORT-2026-10-30.md`, findings R1 to R60) and its phased plan (`docs/audit/NEXT-STEPS-PHASES.md`). Phases 0 and 1 of that plan are done. The later audit phases (legal and Gate B, free launch evidence, paid launch, tidy up) still run on their own timetable and are not replaced by anything here. The Project Summary mentions a "6 phase pre launch audit playbook" but the playbook itself was not in the 5 PDFs. If Steve has it, a chat should compare it to the October audit and add only what is new.

New code from Phases 1, 2 and 4 of this plan, and Stripe checkout, changes what the October audit looked at. The final pre launch audit is Phase 6 below. Steve supplied the playbook on 8th November 2026 (written in Gemini). It has been triaged and reworked into Phase 6, because several of its prompts assume decisions that were since changed.

## Corrected facts (stale figures in the Gemini documents)

| Gemini says | Truth in this repository |
| --- | --- |
| Single posts $39, $49, $79, or $249 to $299 | $59, $79, $99 a 30 day post (`lib/pricing.ts`) |
| $199 a month "unlimited" | Clinic pass $199 for up to 5 live posts. Plus $349 includes optometrists |
| 63 passes at $199 reaches $150,000 | The revenue model was restated net of fees and churn (audit R43). Do not quote the 63 |
| Wix CMS and Velo | Next.js, Supabase, Vercel, Stripe. The Wix page never went live |
| Do not link to the clinic, keep applicants on Kestrel | Link to the clinic's application page (decision 2 above) |
| 38 "verified" professionals alerted | Nobody is verified yet. Say "N candidates have alerts matching this role" |
| $100k native app, $50k SAFE | Parked. Running costs are planned well under $10,000 a year |
| Programmatic pages at `/optometrist-jobs-ontario` | Built at `/eye-care-jobs` (`docs/landing-pages.md`), indexable only with live jobs |
| Locum as a future toggle | Locum is already an employment type option. A locum board is later |
| Candidates "visible only when they apply" | True today. A clinic sees only what a candidate sent. Not yet said loudly on the site |

## Already built or decided, so do not rebuild

Fixed profession list. Pay range, existing vacancy and AI screening rules. Job and apply click counting. Job alerts by email. Found listings tool (off). Claim your listing. Outreach sequence (off). Role and province landing pages. Resources page and pay table. `/compare`. Pay benchmark while posting. 24 blog posts. Gate C target of 50 live roles across 5 provinces. Ontario first plan (`docs/first-region-ontario.md`). A city and radius search was agreed on 31st October; Phase 0 confirms whether it is finished.

## The phases

| Phase | Name | Ease | Gate | New migration |
| --- | --- | --- | --- | --- |
| 0 | Confirm what is built, fix the facts | S | None | No |
| 1 | Quick wins | S | None | No |
| 2 | Optometrist pay basis, tech tags, employee count | M | Lawyer glance on pay basis | Yes, both databases |
| 3 | Content: pillar hubs and the next posts | S per post, ongoing | None | No |
| 3C | Help centre at /help: General, Candidates, Clinics, all collapsible | M | None | No |
| 1D | Site polish: one tidy footer, and a clear system for links and buttons | M | None | No |
| 4 | Launch liquidity: leads, claim outreach, pre load, schools, guide | M | Gate A for anything sent | Maybe |
| 5 | After launch: SMS, alert reach, pass value, supply features | L | Real launch data | Yes |
| 6 | Final pre launch code audit (6 report only chats, then fixes, then Go or No Go) | L | After Phases 1, 2, 4 and Stripe checkout are built | Only for fixes |

Run 0, then 1. Phase 6 is the last thing before launch, and it is described in full after Phase 5. Phase 3 can start any time after Phase 0 because it needs no code. Phase 2 can run beside Phase 3. Phase 4 drafts can be prepared now but nothing is sent until Gate A. Phase 5 waits for launch.

## Rules every chat follows

- Read `CLAUDE.md` first, then `docs/audit/NEXT-STEPS-PHASES.md`.
- Work on a branch, run `npm run typecheck && npm test && npm run build`, push, and give Steve a preview link. Steve approves before anything merges. Do not open a pull request unless asked.
- Every SQL change is a numbered migration, added to the combined file, and run on both databases (live and demo). Every new setting goes in both Vercel projects. Tell Steve each time.
- Writing for the site follows the CLAUDE.md style rules: no em dashes, numerals, British spelling with Canadian conventions, ordinal dates, no banned words, no emoji.
- Clinic outreach and seeding stay off until Steve confirms the disclosure conversation has happened (Gate A).
- No Eye Recommend data, contacts, accounts or branding.
- Anything involving money, outreach or going live needs Steve's approval first.

---

## Phase 0: Confirm what is built, fix the facts

**Goal.** Make sure no later chat works from a stale fact, and settle what is already built.

**Steve provides.** Nothing. Optionally, names of 5 corporate eye care groups he wants checked for how they post pay.

**Claude reads first.** `CLAUDE.md`, `docs/audit/NEXT-STEPS-PHASES.md`, `docs/found-listings.md`, `docs/landing-pages.md`, `docs/first-region-ontario.md`, `lib/pricing.ts`, migration 0030.

**Prompt to paste.**

> Read CLAUDE.md and docs/gemini-intake-plan-2026-11-08.md. This is Phase 0. Do the following and report in plain English, with a short table at the end.
>
> 1. Confirm what is built and what is not, by reading the code and migrations: the city and radius search (and whether job alerts use it), employment type as tick boxes, job views and apply click counting and where the clinic sees it, whether any optometrist pay is hidden from logged out or non optometrist visitors, and whether JobPosting structured data is valid on a live job page. For anything unconfirmed, say what Steve would need to check.
> 2. Search the public careers pages of 5 corporate eye care groups in Canada (I will name them, or pick the largest 5) and report how they show pay on Ontario and BC postings: a range, a single figure, or nothing. Read only. Do not copy any ad text.
> 3. Draft the CLAUDE.md edit for the Indeed decision: Indeed may be read by hand to find clinics that are hiring, as a lead only. No automated collection of Indeed or any job board. Listing text comes from the clinic's own page or is entered as facts in Kestrel's own words. Show me the exact wording before you change the file.
> 4. Correct any other stale line in CLAUDE.md or docs/PLAN.md that disagrees with the "Corrected facts" table in the plan file. Show the change, do not guess.
> 5. Add what you found to the bottom of the plan file under "Phase 0 results".
>
> Do not build anything new in this chat.

**Done when.** The built or not built table exists, CLAUDE.md has the Indeed wording Steve approved, and the next phases have their facts checked.

---

## Phase 1: Quick wins

**Goal.** Cheap changes that help sign ups and trust, with no database change.

**What is in it.**
1. Say "private until you apply" where it is true: candidate sign up, profile, job pages and the FAQ. First check that it is still true everywhere, including recommendations and any admin view.
2. Naming check. The brand is Kestrel Eye Care Jobs at eyecarejobs.ca. Find places that read as 2 different names and make them consistent, without touching the logo, wordmark or skyline.
3. Home page proof. The new launch home page may already show product visuals. If a visitor still has to leave for demo.eyecarejobs.ca to see the product, add a clear "see the demo board" link, or 2 or 3 real screens. Brand assets are never redrawn.
4. Run Google's Rich Results Test on a live job page and fix anything it flags. JobPosting data must match the visible page exactly.
5. Zero result search pages: a friendly state that offers a job alert instead of an empty list.

**Steve provides.** One live (or preview) job page link for the Rich Results test. A yes or no on whether the demo link belongs on the public home page.

**Prompt to paste.**

> Read CLAUDE.md and docs/gemini-intake-plan-2026-11-08.md. This is Phase 1, quick wins, no migration. Work on a new branch. Do items 1 to 5 under Phase 1 in the plan file, in that order, and stop to show me a preview after items 1 to 3 before you continue. For item 1, first prove the claim is true by listing every place a candidate's details are visible and to whom. Keep every word of public copy inside the CLAUDE.md style rules. Report each change in plain English and run typecheck, tests and build before you push.

**Done when.** Steve has checked the preview on his phone and the Rich Results Test passes on a real job page.

---

## Phase 2: Optometrist pay basis, tech tags, employee count

**Goal.** Make posting natural for optometrist roles, and let clinics show their equipment and software, without hiding any pay.

**What is in it.**
1. **Pay basis for optometrist roles.** Options such as annual salary, hourly, daily rate, daily minimum guarantee, and a percentage of production or billings (for example 28% to 35%). A range is still required for every basis, and the existing width rule needs a sensible version for percentages. "Competitive, discussed at interview" is not accepted on its own. Check how JobPosting `baseSalary` should behave for a percentage basis (it cannot hold a percentage, so decide what the markup shows without breaking the rule that markup matches the visible page). The pay benchmark line applies only to bases it can compare.
2. **Clinic tech and specialty tags.** Fixed lists a clinic ticks on a job: EHR and practice software, diagnostic equipment, clinical specialties (dry eye and IPL, myopia control and ortho-k, vision therapy, on site edging lab). Show them on the job card and page, and as search filters.
3. **Candidate software skills.** A fixed multi select on the candidate profile, optional, with the same list. This also serves a later matching opt in (see `docs/agency-pathway.md` Stage 1). Not shared with clinics except as part of an application.
4. **Employee count.** A band chosen when a clinic creates its account or profile (for example 1 to 9, 10 to 24, 25 to 99, 100 or more). Stored for the admin numbers and for the lawyer's answer. It does not change any rule yet.

**Steve provides.** The lists, from his industry knowledge: which EHR and practice management systems matter in Canada (the Gemini documents name Visual Eyes, RevolutionEHR, Wink, Acuitas, Officemate and Telus Health eClaims), which diagnostic equipment, and which specialties. Which pay bases real optometrist ads use. The wording he wants for the pay basis labels. Confirmation that the lawyer should glance at the pay basis (it is not urgent).

**Prompt to paste.**

> Read CLAUDE.md, docs/gemini-intake-plan-2026-11-08.md (Phase 2) and docs/pay-benchmark.md. Propose before you build: a one page design covering the pay basis options for optometrist roles, how the pay range rule and the $50,000 width rule work for each basis, what JobPosting structured data shows for a percentage basis, and the data model (fixed lists in code, new columns in one migration). Show me the form wording and the list contents for approval. Only then build it on a branch, with the migration added to supabase/combined/run-everything.sql and tested twice on a scratch database. Pay stays public on every post. Do not gate any pay behind a login. Remind me to run the SQL on both databases and add any setting to both Vercel projects.

**Test cases to build against (from the audit playbook).** Each of these must save, show on the job card and the job page, and never render as `$0`, `$NaN`, `null` or `undefined`, or break the card:
a. a daily minimum guarantee range (for example $600 to $800 a day),
b. a percentage of production range (for example 16% to 20%),
c. a daily minimum and a percentage together,
d. hourly or salary plus a bonus or commission note (common for opticians and assistants),
e. a blank or "negotiable, discussed at interview" entry, which stays refused because a range is required.
Allow combination (c) and a short optional bonus or commission note in the design.

**Done when.** Steve posts a test optometrist job with a percentage basis, all 5 test cases above behave, tags show on the card and filter, and the employee count appears in Admin.

---

## Phase 3: Content, pillar hubs and the next posts

**Goal.** Build topical authority for search and for AI assistants, in a human voice, fortnightly.

**Key point.** Most of the cluster posts for both hubs already exist among the 24 published posts, so the 2 hubs can be written now rather than after 20 new posts.

**Hub 1, employers: "The clinic owner's guide to hiring and keeping optical staff".** Likely links down to: how to attract the right candidates, how to write an optometric assistant job ad, what every job ad should include, onboarding the first 30 days, hire for attitude and train for skills, why people leave and what clinics can do, reference checks, seasonal workers, independent or corporate, how to choose a buying group.

**Hub 2, job seekers: "Building a career in eye care in Canada".** Likely links down to: where to begin, how most people fall into optics, the roles and who does what, optometric assistant jobs and pay, what a lab technician does, moving to Canada, how to write a CV, cover letter, phone screening, interviews and star questions, questions to ask, how to ask for a raise.

**New posts, in priority order (search benefit and a job board link to point at):**
1. How to write an optometrist job description, with a template that matches the ad builder.
2. Pay transparency in eye care job ads: what Ontario and BC require and why it helps. Use Job Bank and the rules only, no invented statistics.
3. How to hire your first associate optometrist.
4. Optician or ophthalmic technician: the difference in duties, certification and pay (Job Bank figures only).
5. Interview questions for optical dispensers and assistants (the employer side. The candidate side exists).
6. Independent or corporate, from a clinic owner's side. The staff side exists.
7. Moving an optician's licence between provinces. High intent, but every step must be checked against each regulator's own page first, so it is slower.
8. Associate optometrist contracts for new graduates. Plain information, not legal advice, with a "get your own advice" line.

**Held until there is real data or a source:** a salary guide (conflicts with leaving optometrist wages off), staff turnover rate, best cities ranking, 5 year market outlook, "will AI replace jobs", tele optometry, scope of practice, dry eye staffing, myopia careers. Dry eye and myopia are good later topics once Steve can supply a clinic's real experience. "Best places to post" waits for the lawyer to clear `/compare`, since it is comparative.

**Steve provides.** For each post, 1 to 3 things only he or a real clinic can say: a number, a place, a story, a mistake he has seen. Claude asks for them before drafting. His review time for each draft.

**Prompt to paste.**

> Read CLAUDE.md (Writing style section), docs/blog.md, content/posts.ts and docs/gemini-intake-plan-2026-11-08.md (Phase 3). Step 1: check the 2 hub lists in the plan file against the 24 published posts and tell me which posts fit which hub and where there are gaps. Step 2: propose the URL and page design for 2 hub pages, how each post links up to its hub and the hub links down, and a "related guides" block on posts. Show me before building. Step 3: draft hub 1 first, in paragraphs with few headings, for a clinic owner, using only facts you can source. Before you draft any post, ask me for the specifics only I can give. No invented statistics, no optometrist wage figures, no recruiter clichés. Rewrite any LinkedIn hook so it follows the style rules. Run npm test, because it checks banned words and "not just X but Y" patterns.

**Done when.** Both hubs are live, linked both ways with the existing posts, and the first 2 new posts are published on a fortnightly rhythm.

---

## Phase 4: Launch liquidity

**Goal.** A board that is not empty on day one. Everything here is prepared as drafts and processes now. Nothing is sent or published until Gate A.

**What is in it.**
1. **Manual lead process.** A lead sheet (clinic name, website, careers page, a published hiring email, where it was found, date found, role, province) and a one page guide that Steve, and later a VA, follows: find the clinic on Indeed by hand, go to the clinic's own site, record the published hiring contact, never copy ad text. Also a short video script for a VA and a monthly volume and cost estimate.
2. **Creating the listing.** The found listings tool reads 1 page on the clinic's own site and refuses job boards. Where the ad exists only on Indeed, there is a gap: the tool cannot read it. This chat decides the smallest safe fix, probably entering the facts in Kestrel's own words through the existing admin post for a clinic, with the apply link set to the clinic's own website. Pay is required and the 21 day expiry applies.
3. **Claim email variants.** The offer is "we listed your role, claim it free". A line such as "N people clicked apply on your listing" is allowed only when the job stats show it. Include the honest alert count variant. All emails meet CASL (`docs/casl-outreach.md`).
4. **Mid December pre load.** Email waitlist clinics (who opted in): reply with a link to your ad or 3 bullet points and we post it for you. Draft it, with the fallback that if Gate A slips past mid December, the same offer runs in launch week.
5. **Schools and new graduates.** A short approach for student associations and programs (Waterloo, Seneca, Georgian, NAIT, Stenberg). Drafts only. School and association contact waits for Gate A.
6. **Pay guide lead magnet.** A downloadable guide for clinics built only from Job Bank figures for non optometrist roles, behind an email form with the same consent wording style as the waitlist. Optometrist wages are left out.

**Steve provides.** The Gate A date as soon as he knows it. His decision on a VA (hours a week, budget). A first batch of 20 clinics he has found by hand. A list of school and student contacts that does not come from Eye Recommend. The lawyer's feedback when it arrives.

**Prompt to paste.**

> Read CLAUDE.md, docs/casl-outreach.md, docs/found-listings.md, docs/first-region-ontario.md and docs/gemini-intake-plan-2026-11-08.md (Phase 4). Clinic outreach is off until I confirm Gate A, so prepare drafts and tooling only. Step 1: write the manual lead sheet template and the VA guide. Step 2: look at what the found listings tool and the admin post for a clinic can already do, tell me the gap for ads that exist only on Indeed, and propose the smallest safe change. Step 3: draft the claim email variants, with the click count line wired to the real job stats and impossible to show when the number is 0 or unknown. Step 4: draft the mid December pre load email and the launch week fallback. Show me each before building anything. Nothing is sent. Do not use any Eye Recommend contact or data.

**Done when.** The first 20 leads are processed to the point of being ready to send, the emails are checked against the CASL document, and the day Gate A clears, Steve can switch outreach on.

---

## Phase 5: After launch

Run these as separate chats, each started only when launch data supports it. Prompts are written when the time comes, from what has been learned.

| Item | Notes |
| --- | --- |
| No applicants nudge | Idea from Steve, 8th November 2026. When a live job has had views but no applications after 7 days, email the clinic account owner. First email: practical help, including a suggested rewrite of the ad if it was not made with the ad builder. In the paid phase, a second line can offer a sponsored post (`docs/sponsored-ads-plan.md`), only when real view numbers show the job is not being seen. During the free launch, rewrite help only, since sponsored posts launch with Stripe. Triggered by `job_daily_stats`, never by a guess. Fits the inactive and upsell emails in `docs/marketing-audit-priorities-2026-11-06.md` (items 24 and 29). |
| Help videos | Benched on 9th November 2026 until everything is built and ready to launch. 30 to 90 seconds each, recorded on the demo site only, with captions and a transcript on the page (WCAG 2.1 AA). Hosting and who is on camera are not decided. Each help topic can take a video slot that stays hidden until a video exists. |
| In account inbox | Benched. Steve's decisions of November 2026: **one way only for now** (a simple notification centre, no replies, no messaging between users), and **contact details are never shared through the messages**. The inbox holds every email Kestrel sends a signed in person about their own jobs, applications or account: for clinics, a new application, the waiting for a reply reminder, job approved or changes live, job sent back or taken down, job closing in 3 days, and claim approved or declined; for candidates, updates from the clinic with its message (interview invitation, offer, kind no, kept, role filled) and a job that closed without a decision. Two in account only items are added with no email: "Your job is with our team" (clinic) and "Your application is sent" (candidate). Shortlisting is never notified. Not in the inbox: job alerts, onboarding tips, outreach, waitlist emails, and sign in and security emails. One table written at the same moment each email is sent, own rows only, an unread count in the app bar, and a way to mark read. It also lets the demo site, which never sends email, show the whole flow. Still to decide when this is picked up: how the contact details rule works. Recommended: the Messages area never shows either side's email or phone and carries no such fields, with a reminder under the clinic's message box not to type personal numbers (the clinic keeps using the details on the application, as today). The alternative is to refuse a clinic message that contains an email address or phone number, which is stricter but catches innocent text and interview details such as a phone number. Two way replies inside an application stay benched until people ask, and would need a design for abuse and reporting, how long messages are kept (PIPEDA, the data download and deletion), and a question for the lawyer. |
| SMS alerts | After Phase 2. Needs express consent, a provider with Canadian numbers, a cost per message, and a quiet hours rule. Email stays the default. |
| Alert reach in notifications | "N candidates have alerts matching your role", from real data. The word "verified" only after verification exists. |
| Pass value in the quiet months | An always interested clinic profile, locum cover posts, a quarterly pay update. Decide after seeing pass retention. |
| Confidential inquiry | A candidate asks a clinic a question before applying, without giving a name. Needs a privacy and abuse design. |
| Corporate bulk import or feed | Only if a corporate group asks, since their systems push to Indeed. |
| Locum board | Already a later feature in CLAUDE.md. |
| Installable web app | Wrap the website first. Native app is a later decision. |
| Supplier rep networks | Needs Gate A and the lawyer. Take care with Steve's employer's supplier relationships. |
| "Verified Kestrel partner clinic" | Define what is verified before using the words. |

## Phase 6: Final pre launch code audit

**Goal.** One more careful pass over the code that has changed since the October audit, finishing with a Go or No Go. Delivered before launch, after the features it checks exist.

**When.** Start only after Phases 1, 2 and 4 are merged and Stripe checkout is built (checkout is item 17 on `docs/launch-checklist.md`, and there is no payment webhook in the code yet, so the billing audit cannot run earlier). Aim to start about 3 weeks before the launch date and finish fixes about 1 week before it, so there is time to fix and retest. The existing October audit phases (legal and Gate B, free launch evidence, paid launch) continue on their own timetable and are not replaced by this.

**How it runs (kept from the playbook).**
1. One sub chat at a time, so each file is read properly instead of skimmed.
2. Report only first. No code changes until the chat has listed findings with file names and line numbers, labelled [CRITICAL], [HIGH], [MEDIUM] or [LOW]. The October audit used the same style, see `docs/audit/REPORT-TEMPLATE.md`.
3. Then Steve replies: "Fix the CRITICAL and HIGH items from this report one by one. Show me the exact diff for each and check it does not break types before moving to the next." Fixes go on a branch with a preview, and every migration is run on both databases.
4. Before each sub chat, it reads the October report so it does not repeat settled findings: `docs/audit/AUDIT-REPORT-2026-10-30.md`.

**What changed from the original playbook.**

| In the playbook | Now |
| --- | --- |
| Check that optometrist wages are hidden from non optometrists, in the page, API and JSON-LD | Dropped. Pay is public on every post (decision 3). The check becomes: the pay shown on the page, in the data sent to the browser and in JobPosting markup all agree exactly |
| Role selection unlocks pay views, and a non optometrist cannot toggle their role to bypass | Dropped, because nothing is gated |
| Tiers: waitlist free, single post, $199 unlimited pass | Role band prices $59, $79, $99, Clinic pass $199 and Plus $349 (5 live posts each), the free launch coupon, and card details asked only when money is due (`payment_method_collection` set to `if_required`) |
| Magic link sign in | Not used. Sign in is email and password plus Google |
| Cutover from demo.eyecarejobs.ca to production | The demo is a separate site with its own database and Vercel project, and stays. The cutover is production switching from the waitlist look to the launch home (`docs/launch-home.md`) and turning on the right settings. The check is that demo and production cannot touch each other's data |
| "Automated inquiry responses, 3 business day SLA" and clinic email routing to a practice manager | Unconfirmed that either exists. The email chat checks and reports; it does not assume |
| Ontario AODA | The target stays WCAG 2.1 AA. Whether AODA's website rules legally apply to a business of Kestrel's size is unverified, and not needed to justify the target |
| N+1 queries and missing indexes | Kept. Matters more once the board has hundreds of jobs |

**Sub chats.** Each prompt below is pasted into its own chat. Start each with the "Starting a chat" line above.

### 6A: Security, access and data (report only)

> Read CLAUDE.md, docs/gemini-intake-plan-2026-11-08.md (Phase 6) and docs/audit/AUDIT-REPORT-2026-10-30.md. This is audit 6A. Do not change any code. Read every auth flow, database policy (row level security), API route, Server Action and data fetch, and report findings as [CRITICAL], [HIGH], [MEDIUM] or [LOW] with file names and line numbers. Cover: (1) a candidate's name, email, profile and CV are visible to a clinic only when that candidate has applied to that clinic's job, including anything sent to the browser such as page data and server component payloads; (2) CV files are in a private bucket and only reached through short lived signed links; (3) clinic isolation: clinic A cannot view, edit, pause, delete or see applicants of clinic B's jobs by changing an id in a link, form or request, across every dashboard route, Server Action and API route; (4) account deletion and the data download: do they remove or anonymise rows, sessions and CV files without failing on linked records; (5) every environment variable the code reads, with any `NEXT_PUBLIC_` one flagged to prove no secret reaches the browser (compare with docs/security.md); (6) anything new since the October audit. Confirm which October findings are fixed, and list what is still open. End with a one page summary.

### 6B: Job posting logic, pay formats and apply flow (report only)

> Read CLAUDE.md, docs/gemini-intake-plan-2026-11-08.md (Phase 6 and the Phase 2 test cases) and docs/pay-benchmark.md. This is audit 6B. Do not change any code. Report findings as [CRITICAL], [HIGH], [MEDIUM] or [LOW] with file names and line numbers. Cover: (1) the 5 optometrist pay test cases from Phase 2, traced through the form, database columns, job card, job page, emails and structured data, and what happens with blank, zero or very long values; (2) the pay range rules, the existing vacancy and AI screening answers, the Canadian experience text check and the Quebec refusal, and whether any of them can be bypassed by calling the server directly; (3) the apply flow end to end: file type and size checks on the CV, a candidate applying twice to the same job, rate limits against bots, and what happens if the email to the clinic fails (the application must still be saved and visible to the clinic); (4) job templates, drafts, expiry and reposting from the clinic dashboard; (5) the "N people clicked apply" count shows only real numbers. End with a one page summary.

### 6C: Billing and entitlements (report only, run only after Stripe checkout exists)

> Read CLAUDE.md, lib/pricing.ts, docs/pass-procedures.md and docs/gemini-intake-plan-2026-11-08.md (Phase 6). This is audit 6C. Do not change any code. Report findings as [CRITICAL], [HIGH], [MEDIUM] or [LOW] with file names and line numbers. Cover: (1) how the code decides whether a clinic may publish a job: free launch coupon, a single post for each role band, the Clinic pass and Clinic pass Plus (5 live posts), the founding clinic price lock, and whether an unpaid draft can be published by calling the server directly; (2) a free launch post asks for no card (payment method collected only if money is due); (3) the Stripe webhook handler: signature check, handling the same event twice, and what happens to live jobs when a pass is cancelled, a card fails or a payment is refunded; (4) HST through Stripe Tax and receipts; (5) the 30 day and 21 day expiry, expired jobs removed from search, the sitemap and structured data straight away, and a one click repost; (6) test mode versus live keys and where each is set. Use Stripe's test mode only. End with a one page summary.

### 6D: Email, CASL and the AI features (report only)

> Read CLAUDE.md, docs/casl-outreach.md, docs/email-addresses.md, docs/onboarding-emails.md and docs/gemini-intake-plan-2026-11-08.md (Phase 6). This is audit 6D. Do not change any code. Report findings as [CRITICAL], [HIGH], [MEDIUM] or [LOW] with file names and line numbers. Cover: (1) every email the site sends, what triggers it, and whether it can send twice or not at all; (2) CASL: sender name, mailing address, working unsubscribe, a `List-Unsubscribe` header on the right messages, the do not email list checked before every send, and outreach, onboarding and found listing emails staying off unless their setting is "yes"; (3) the daily send budget, bounce and complaint handling; (4) the AI ad builder, the found listings reader and the province search: prompt injection from a pasted page, timeouts, spend limits, rate limits per user and per address, and what the person sees when the AI is slow or down; (5) whether the "automated inquiry reply within 3 business days" and "route applications to a practice manager email" features exist, and if not say so. End with a one page summary.

### 6E: Phone, accessibility and empty states (report only)

> Read CLAUDE.md, docs/audit/ACCESSIBILITY-PASS-2026-11-06.md and docs/gemini-intake-plan-2026-11-08.md (Phase 6). This is audit 6E. Do not change any code. Use Playwright at 320, 390 and 430 pixel widths and at 200 percent text, and report findings as [CRITICAL], [HIGH], [MEDIUM] or [LOW] with file names and line numbers. Cover: (1) sideways scrolling, overlapping tags and breaks with very long clinic or city names, on the home page numbers box, pay guide, job cards, filters and forms; (2) search with filters that return nothing, and what the person is offered next; (3) forms, filters and dialogs for keyboard use, focus, labels, contrast and error messages, against WCAG 2.1 AA; (4) placeholder links, broken paths, and the error and not found pages matching the brand; (5) what a real screen reader test still needs from Steve, listed as steps. End with a one page summary.

### 6F: Search, structured data and launch switches (report only)

> Read CLAUDE.md, docs/discoverability-plan.md, docs/landing-pages.md, docs/launch-home.md, docs/demo-site.md and docs/gemini-intake-plan-2026-11-08.md (Phase 6). This is audit 6F. Do not change any code. Report findings as [CRITICAL], [HIGH], [MEDIUM] or [LOW] with file names and line numbers. Cover: (1) JobPosting data on live job pages: every required and recommended Google property, `validThrough`, `employmentType`, `hiringOrganization`, `jobLocation`, the pay shown matching the visible page exactly, and found listings that are unclaimed kept out of the markup; (2) canonical links, robots rules, `noindex` on filter pages and thin pages, the sitemap including only live jobs and indexable landing pages, and IndexNow; (3) demo and production separation: the demo is noindex, uses its own database and cannot reach live data; no seed data, test accounts, `console.log` or `TODO` left in production paths; (4) a list of every setting that must be set to its launch value on the day (the sign up gate, `PRELAUNCH_HOME`, `ENABLE_SEEDING`, `ENABLE_OUTREACH`, `ENABLE_ONBOARDING_EMAILS` and the rest), with where each lives and its current value, ready to tick off in order; (5) slow database queries and missing indexes on the search filters. End with a one page summary.

### 6G: Final check and Go or No Go

> Read CLAUDE.md and docs/gemini-intake-plan-2026-11-08.md (Phase 6). Audits 6A to 6F are done and their fixes merged. Run `npm run typecheck`, `npm test`, `npm run build` and the linter. Confirm no debug logging or bypass setting was left behind by the fixes. Confirm the October findings still open, and any open [CRITICAL] or [HIGH] items from 6A to 6F. Then write a plain English Go or No Go for the launch date, with a list of anything that is a No Go and what it needs. Also run the checklist in docs/launch-checklist.md section 4 and say which items Steve still has to do himself (a backup restore test, Vercel Pro and moving the repository into the Kestrel organisation, the switch from Stripe test keys to live keys).

**Steve provides.** The lawyer's outcome and Gate A status, the Stripe test keys, a few test accounts (`docs/test-accounts.md`), his phone for the screen reader step, and time to retest each fix on the preview.

**Done when.** All 6 reports exist, every CRITICAL and HIGH item is fixed or has a written reason it is accepted, and 6G gives a Go.

## Parked: for information only

- **The agency pathway.** Kept in `docs/agency-pathway.md`. The Gemini blueprint adds nothing that file does not already hold, and its Ontario licensing and Quebec figures are unverified. Stage 0 stays "build nothing".
- **Funding.** A $50,000 SAFE note, or raising from founding doctors who post jobs. Securities law, customer conflict and the Eye Recommend question all apply. A lawyer conversation, when Steve chooses.
- **Native app.** After the web app wrapper has proved demand.

## Questions held for the lawyer (not sent yet)

For when Steve is ready, after the first document comes back: whether manual use of Indeed to find leads is acceptable; whether the "N people clicked apply" claim needs any wording; pay basis options for optometrists (percentage of production) under Ontario and BC pay range rules; whether showing optometrist pay only to signed in optometrists would count as a publicly advertised range in Ontario and BC (and what verification, if any, it would need); whether Kestrel, as the platform, carries any duty when a clinic under 25 employees in Ontario posts without a range; funding from customers and founding doctors.

---

## Phase 0 results (8th November 2026)

Read from the code on branch `claude/gallant-mccarthy-9abc7o`, which matches `main` as of pull request 72. Nothing was changed except this section.

### What is built and what is not

| Item | Result |
| --- | --- |
| City and radius search | Built for job search (`app/jobs/page.tsx`, `lib/places.ts`, radius of 10, 25 or 50 km, with field based roles always shown). |
| Job alerts by distance | Not built. Alerts match on role, province and practice type only (`app/api/cron/daily/route.ts`). A "within 25 km of my postal code" alert, and any "N candidates near you" figure for clinics, needs new work. |
| Employment type | Tick boxes in search for Full time, Part time, Fixed term (stored as "Contract") and Locum. Each job has one employment type. |
| Job views and apply clicks | Counted (migration 0030) and shown to the clinic on its dashboard (`getMyJobNumbers`). The "N people clicked apply" line is possible. |
| Optometrist pay hidden by role | Not built anywhere. Pay is public on every job. Optometrist wages are left off the public pay table only. This matches decision 3. |
| Pay formats | Hour or year only, with a minimum and maximum, plus a free text "pay extras" note (`lib/jobs.ts`). No daily rate, no daily minimum, no percentage of production. This is the Phase 2 gap. Test case d (bonus or commission) is partly covered by the extras note. |
| JobPosting data | Present: title, description, datePosted, validThrough, employmentType, hiringOrganization (name only), jobLocation (city, region, country), baseSalary, directApply and an identifier. Not present: street address, postal code, organisation logo and website, because the clinic website is deliberately not shown. Unclaimed found listings get no markup. A percentage or daily pay basis cannot go into `baseSalary` as it stands. |
| Rich Results Test | Not run. Google's tool is a web page, so Steve (or a later chat with a live URL) has to run it on a real job. |

### How corporate groups show pay (read only, from web search results, not from the groups' own careers pages)

This is thin evidence. Results were mostly copies of postings on other sites, with unknown dates, and I did not open the groups' own pages. Treat it as a hint only.

- **FYidoctors:** one Job Bank posting for an Ontario optometrist stated a pay figure ($200 a day). Other listings mentioned compensation guarantees without figures. Ranges seen on aggregator sites were estimates.
- **IRIS:** Ontario optician postings seen had no pay. BC postings seen showed hourly ranges.
- **New Look:** Ontario optician postings seen had no pay (both marked no longer available).
- **Specsavers:** Ontario associate optometrist postings on aggregator sites showed yearly ranges (for example $80,000 to $120,000), and an optician posting showed an hourly figure.
- **Costco:** a Job Bank optician posting showed $28 to $38 an hour (province not shown). Others showed no pay.

What it suggests: groups of this size should already be posting a range in Ontario (the rule applies at 25 or more employees), yet several Ontario postings found had none. Check the groups' own careers pages in Phase 4 before relying on this. Corporate recruiters may paste ads without pay, so the pay field will need to be easy for them.

### CLAUDE.md edit for the Indeed decision (approved by Steve and applied on 8th November 2026)

Steve approved the wording as written. A second small change was made in the "Current state" paragraph, as described at the end of this section. The wording that was applied:

Replace this line in "Non negotiables":

> **No scraping of Indeed, LinkedIn, Jobs4ECPs or provincial college registers.** Seeding uses clinics' own careers pages only, links back to the clinic, and expires after 21 days.

with:

> **No automated collection from Indeed, LinkedIn, Jobs4ECPs or provincial college registers, and never any scraper.** Seeding uses clinics' own careers pages, or facts entered by hand in Kestrel's own words, links to the clinic's own application page, and expires after 21 days. One exception, agreed by Steve on 8th November 2026: Indeed may be read by hand, by Steve or a VA, only to find which clinics are hiring and who to contact. Nothing is copied from it, and no Indeed link or text appears on Kestrel.

And in "Current state", change "with the job boards other than Indeed, LinkedIn and Jobs4ECPs allowed as leads only" to say that Indeed is also allowed as a lead by hand, with LinkedIn and Jobs4ECPs still off.

### Other lines in CLAUDE.md and docs/PLAN.md that look stale (not changed)

- CLAUDE.md "Current state": "the candidate and clinic homes are still placeholders". They are built (checklists, dashboard numbers, recommended jobs).
- CLAUDE.md "Next tasks" lists 5 items that are almost all built.
- CLAUDE.md pay benchmark paragraph says it is awaiting preview on a branch. Check whether it is merged.
- docs/PLAN.md roadmap puts seeding and the free launch in February to March 2027 and the paid launch from April. Steve's goal is a mid January launch, so the roadmap dates need his decision.
- docs/PLAN.md prices are current.

### Checks that need Steve

1. Run Google's Rich Results Test on one live job page.
2. Approve (or edit) the CLAUDE.md wording above, then it can be applied.
3. Decide the roadmap dates in docs/PLAN.md.

---

## Phase 1 results (8th and 9th November 2026)

Merged to `main` in 2 parts: items 1 to 3 (pull request 74, 8th November) and items 4 and 5 (9th November). No database change and no new setting.

### Changed

1. **Private until you apply.** Checked first and true (see the table below). Short lines added to candidate sign up, the profile page and under Quick Apply on job pages that take applications on Kestrel. No line was added on jobs that apply on the clinic's own website, because Kestrel does not hold those applications. There is no candidate FAQ page.
2. **Naming.** The only clear mismatch was the hidden logo label on the coming soon page ("Kestrel"), now "Kestrel Eye Care Jobs".
3. **Home page proof.** The pre launch home (`components/PreLaunchHome.tsx`) now shows 2 cropped screens from the demo board under "What the board will look like", labelled as samples, in `public/home/`. No link to the demo site (Steve's decision, 8th November 2026). Steve chose this over a real pay excerpt, and it moves to real jobs at launch because the launch home takes over. A sponsored section is noted in `docs/launch-home.md` and not built.
4. **Searches that return nothing.** The page already said "No jobs match yet" and pointed to the waitlist, with no concrete next step. It now offers one click links built from the search itself (`lib/empty-search.ts`, tested): widen the distance, search the whole province or Canada, or drop the role, employer type, type of work, field based filter or search word. A signed in candidate gets a link to Job alerts, a signed out visitor gets "Create an account to set an alert" once sign up is open, and before launch the waitlist. The text says alerts match role, province and type of employer and do not use distance, which is true of the alert feature as built.
5. **Structured data.** Reviewed only, nothing changed (below).

### Where candidate details can be seen (item 1 evidence)

| Where | Who |
| --- | --- |
| Profile, CV, saved letters, drafts, alerts, "Not interested" choices, recommendations | The candidate only. Database rules give clinics and other candidates no access. |
| An application | The candidate, and the clinic that owns that job. The clinic sees a snapshot taken when the candidate applied, not the live profile. A withdrawn application stays visible to the clinic. |
| CV file | Private storage. A clinic gets a link that works for 1 minute, only for an application to its own job. |
| Search engines | Candidate, account, apply and clinic pages are blocked in `robots.txt` and marked noindex. |
| Emails | Clinic emails carry counts only. Candidate emails go to that candidate. |
| Job view and apply click counts | Counts only, nothing about the visitor. |
| Admin screens | Counts only. The database owner can read everything in Supabase, and an admin login can read profile names there, but no screen uses it. So the copy says "a clinic sees only what you send", never "nobody at Kestrel can see it". |
| Data download | The candidate's own data. |

### Found and left alone

- **Privacy policy wording.** It says "Candidates apply to a clinic through Kestrel", which is not true for jobs that apply on the clinic's own site. Legal text, so it goes to the lawyer pack.
- **Fallback page title.** The site wide default title is still "Kestrel Eye Care Jobs | Coming soon". Every public page sets its own, so nothing shows it today. Change it when launch is switched on.
- **Short "Kestrel".** Used in body text and email subjects as a short form, as the terms define it. Left as is. The `KestrelEyeCareJobs` label used when reading a clinic's page is a technical name and stays.

### Structured data review (item 5, report only)

`jobPostingJsonLd` in `lib/jobs.ts`. Steve had no live job to test, so the Rich Results Test is still to run once real ads are up.

Present and in line with Google's guidance: title, description, datePosted, validThrough, employmentType (locum is sent as temporary and contractor), hiringOrganization name, jobLocation with city, region and country, baseSalary with a range and a unit of hour or year, directApply, identifier. Only live jobs have a page and so markup, an ended job returns a not found page, and unclaimed found listings get none on purpose.

Recommended fields that are missing, and what to do:

| Field | Verdict |
| --- | --- |
| Street address and postal code | Leave out. Kestrel does not collect or show a clinic address, so adding it would break "the markup matches the page". Google needs only the country, and the city and region are given. Revisit only if a clinic address is ever shown on the page. |
| Organisation website (`sameAs`) | Leave out. The clinic website is deliberately not shown on the job page. |
| Organisation logo | Leave out. Kestrel does not store a clinic logo, and unclaimed listings never use one. |
| Experience and education requirements | Not captured by the post form, and not required. |
| Remote location fields | Not relevant, every job has a place. Field based jobs use their base city, with the area covered in the description. |

Things to watch rather than change: `directApply` is true for Quick Apply, but the candidate must have an account and a saved CV first, so Google could in theory read that as not direct. It is safe as it stands and worth confirming when the Rich Results Test is run. The extra `url` property is harmless.

### Belongs in a later phase

- A job alert that uses distance, and "N candidates near you" figures for clinics (Phase 5, needs new work and a migration).
- Running Google's Rich Results Test on a live job page, once there is one (Phase 4 or launch checks).
- Optometrist pay basis and the pay formats that markup cannot yet express (Phase 2, then update `baseSalary` to match).

---

## Phase 2 results (9th November 2026)

Design: `docs/phase-2-design-2026-11-09.md`. Built on branch `claude/serene-tesla-e4i39u`. **Needs migration 0034 on BOTH the live and the demo database** (it is in `supabase/combined/run-everything.sql`; run the whole file). No new Vercel setting.

### Built

- **Pay basis.** Salary and hourly as before. For the Optometrist role only: a daily rate, a percentage (of production, collections or billings), and a daily minimum guarantee with an optional percentage. A pay range is required for every basis, words like "negotiable" are refused. Width rules: salary and hourly unchanged, daily up to $200 a day wide, percentage up to 10 points wide. Largest values accepted: salary $1,000,000, hourly $500, daily $5,000, percentage 100. All pay wording comes from `lib/job-pay.ts` (`payText`, `payChips`), so no screen shows $0, $NaN, null or undefined. The bonus or commission note is the existing "pay extras" box, relabelled, for any role.
- **Google markup.** Daily rate and daily minimum go in `baseSalary` with unit DAY. A percentage is never put in `baseSalary`; percentage and combined jobs carry the same pay sentence in the markup description as on the page.
- **Pay benchmark and matching.** Quiet for the new bases (see `docs/pay-benchmark.md`).
- **Tags.** Practice software, equipment and specialties, fixed in `lib/job-tags.ts`, ticked on the post a job form, shown on the job card (up to 3 names then "and N more") and job page, and used as search filters (any item within a group, every ticked group must match). Carried by templates, reposts, the review queue, the "what changed" view, the data download and the copy kept when a live job is edited.
- **Candidate software skills.** Private to the candidate; used only to rank "Recommended for you" with a reason. Not sent to clinics or with applications.
- **Employee count.** A band chosen on the clinic profile (required for a new clinic, asked of existing clinics next time they save). Stored in the private clinic contact table, so a candidate cannot read it. Shown in Admin in the review queue and as a "Clinics by size" line in Admin numbers and its CSV. It changes no rule.
- **Fixed on the way.** Migration 0031 added the "Recommended for you" preference columns but gave candidates no permission to save them (confirmed on a scratch database). 0034 adds the permission. If saving those preferences failed on the live site, that was the cause.
- **Tests.** `lib/job-pay.test.ts` (the 5 cases, width rules, odd values, markup), `lib/job-tags.test.ts`, `lib/job-columns.test.ts` (every column the form writes is in the permission lists), plus additions to the recommendation, diff and empty search tests.

### Left alone

- **Found listings** and the province search stay hourly or yearly only.
- Nothing is hidden behind a login. Question I (extra detail for signed in optometrists) is **not built**, by Steve's decision. Recommendation: wait for the lawyer. Effort when wanted: about a day.
- Search by pay basis, and job alerts by tag, are not built.
- Officemate and Telus Health eClaims (named in the Gemini notes) are not on Steve's lists.

### For the lawyer's list

Percentage of production, collections or billings, and a daily minimum, under Ontario and BC pay range rules (does a percentage range count as a range of expected compensation); the 10 point and $200 a day width rules; any use of the self declared employee count; candidate software skills under privacy; product names shown as text only.

### Later

Distance and tag based job alerts; widening the pay bases to other roles if clinics ask; "N candidates use Wink" style figures for clinics (needs a decision on what candidates agree to).

### Phase 2, second round (9th November 2026, migration 0035)

Built after Steve tried the first version. **Needs migration 0035 on both databases** (run the whole combined file).

- **Pay is dollars, a percentage, or both; at least one must be filled in.** This replaces the separate "daily minimum" choice. The dollar part has a unit (a year, an hour, or a day for optometrists) and an optional "guaranteed minimum" tick. A percentage (optometrists only) can sit alongside any unit, and reads "$90,000 to $110,000 a year, plus 8% to 12% of billings", or, with the minimum ticked, "a guaranteed minimum of ..., or 28% to 35% of collections when that comes to more".
- **"Exam fees"** joins production, collections and billings as what a percentage is of.
- **Daily rate with the days a week** (optional) gives a yearly estimate: the daily amount x days x 48 working weeks, always labelled as an estimate, shown on the job page, used by the typical pay line and Recommended for you, and never given to Google as the salary. A guaranteed minimum, or any pay with a percentage, is not compared.
- **Re-running the combined file** on a database that already holds the newer pay shapes used to fail at an older step. Migrations 0023 and 0034 now add their older pay rules as "not valid" for existing rows, so the whole file is safe to run again.
- The grey example text in the percentage boxes shows 20 and 25. It is an example only and is not saved. Steve confirmed this on 10th November 2026.

### Phase 2 closed (10th November 2026)

Steve checked on the demo site that posting works with each pay type, the daily rate estimate is calculated, and the migrations (0034 and 0035) have been run on both the live and the demo databases. Phase 2 is complete.

Added by audit Phase B (12th November 2026): (1) the apply page now lists all 8 details a clinic receives (name, email, phone, role, where registered, years of experience, available from, resume), with "Not given" for empty ones, which is the screen where consent to share them is given, so the wording is worth a glance; (2) how long inbox messages are kept (PIPEDA, the data download and deletion). Nothing is deleted today. See "needs a decision" for P1-36 in `docs/audit/AUDIT-FIXES-LOG.md`.

Also changed after Steve tried it:

- **Ad builder and Canadian experience.** The ad builder now never mentions Canadian experience, even to say it is not needed, because the post checker refuses the phrase however it is used. The error message says so. Whether a clearly negative phrase ("Canadian experience is not required") should be allowed is a question for the lawyer's list.
- **Approval message.** A clinic's dashboard shows a message for 7 days after a job is approved, and while a job is sent back with a note (`lib/clinic-notices.ts`, no database change). The approval email already existed. The demo site never sends email, by design, so approval emails cannot be seen there.
- **Job page layout.** Job facts sit under "About the job" at the same width, with the pay line across the full width of the box. On a phone a small Apply button at the top jumps down to the full Apply box. Its clicks are not counted as apply clicks; only the full box's button is.
- **Order of changes.** A change that adds a database column must have its SQL run before the code is merged, because the public job pages read the new columns. Merging first blanks the job board until the SQL is run.


---

## Help centre and site polish (agreed 9th and 10th November 2026)

Decisions from Steve:
1. A help centre at `/help` with a footer link. 3 collapsible sections in this order: General, Candidates, Clinics. Every topic inside is collapsible too. Everything starts closed.
2. The starting topics are listed in the Phase 3C prompt. More will be added once the site is live, from the questions people really ask.
3. Videos are benched (see the Phase 5 table). Text comes first.
4. The footer should look cleaner, especially on a desktop. Today it is one long line of 9 links split by dots, and 3 pages carry their own copy (`components/AppFooter.tsx`, `app/page.tsx`, `app/privacy/page.tsx`, `components/AuthShell.tsx`).
5. Plain underlined links look rough. Turn them into buttons where that does not look messy, and set one clear system across the site. Inline links inside a sentence keep an underline or another cue besides colour, because removing it fails WCAG 1.4.1.

Order: build the help centre first (it adds 1 footer link), then the polish pass, so the footer is not linked to a page that does not exist. They touch different files apart from the footer, so they can also run side by side if the polish chat checks whether `/help` exists first.

### Phase 1D: footer and links

Prompt to paste:

```text
Read CLAUDE.md (Brand and Writing style), docs/gemini-intake-plan-2026-11-08.md (the "Help centre and site polish" section), docs/audit/ACCESSIBILITY-PASS-2026-11-06.md and app/globals.css. This is Phase 1D: a design polish of the footer and the link styles. No database change, no new setting. New branch from main. Do not open a pull request unless I ask. Brand assets (wordmark, tagline, skyline, logo) are never redrawn, and the palette and fonts in CLAUDE.md stay.

1. The footer. Today (components/AppFooter.tsx, plus separate footers in app/page.tsx, app/privacy/page.tsx and components/AuthShell.tsx) it is one long line of 9 links split by dots, which looks cluttered on a desktop. Make 1 shared footer used everywhere. Start from this proposal and change it if you have a better one: on desktop a navy footer with the wordmark and the line "Canada-wide eye care job board" on the left, then 3 short columns, For candidates (Find jobs, Jobs by province, Find your fit, Blog), For clinics (the For clinics page, Compare prices, Resources) and Company (Help, Contact, Security), then a quiet bottom row with Privacy, Terms, Posting policy and the copyright. On a phone the columns stack or sit 2 across, with 44px tap targets. The street address stays out of the website (CASL needs it in emails only). Help links to /help, which another chat is building. Check whether /help exists on main. If it does not yet, leave that link out and tell me. Keep every existing link working.

2. Links. The site has a lot of plain underlined links that look rough, beyond the inline ones in paragraphs. Review every page type (home, jobs, a job page, blog and posts, clinics, resources, compare, sign in and sign up, the clinic and candidate dashboards, applicants, applications, forms, admin) and propose one simple system:
   a. Primary and secondary buttons (.btn and .btn.ghost) for the main action on a page or card, such as "See your job", "Open it", "Back to your dashboard", "Post again", "Edit".
   b. A quiet small button style for the small actions currently drawn as underlined text (the .linkbtn ones such as Close, Delete, Dismiss, Take back to edit). Destructive ones stay quieter than the main action, with no extra clicks beyond today.
   c. Links inside a sentence KEEP an underline or another clear cue besides colour. Make it thinner and softer, with an offset, so it looks deliberate.
   d. Navigation links (menus, footer, breadcrumbs, back links) are plain, bold and not underlined, with a clear hover and focus state.
   e. Cards with a big title link keep the title link and do not get a second button repeating it.
Do not turn everything into a button. A page with 6 buttons looks worse than one with 6 links. Where a link reads fine as it is, leave it.

STEP 1 (no code yet). Use Playwright at 1280, 768 and 390 pixel widths to screenshot the footer and about 10 representative pages. Write me a short design note: what you found (counts of each link pattern), the footer layout, the link rules, and a before and after sketch of the footer and 3 other places (a simple mock page using the real stylesheet is fine). Stop and wait for my approval.

STEP 2 (after approval). Build it. Run npm run typecheck, npm test and npm run build before each push. Push, give me the preview link, and list what to check on my phone and on a desktop. Check keyboard focus is visible on every new button and link style, colour contrast meets WCAG 2.1 AA, and tap targets are 44px. Add a "Phase 1D results" section to docs/gemini-intake-plan-2026-11-08.md.

Rules: all public wording follows the CLAUDE.md writing style. No Eye Recommend material. I am not a developer, so explain every change in plain English.
```

### Phase 3C: help centre

Prompt to paste:

```text
Read CLAUDE.md (especially Writing style), docs/gemini-intake-plan-2026-11-08.md (the "Help centre and site polish" section), docs/definitions.md, docs/candidates-and-applications.md, docs/clinics-and-jobs.md and docs/pay-benchmark.md. This is Phase 3C: a help centre at /help. New branch from main. No database change, no new setting. Do not open a pull request unless I ask. Videos are NOT part of this phase. They are benched until the site is built and ready to launch.

What I want:
- One page, /help, with a footer link labelled "Help". It is for people already using Kestrel. (The SEO guides at /guides, built in another chat, are different.)
- Three collapsible sections, in this order: General, Candidates, Clinics. Each section is a collapsible header, and inside each one every topic is its own collapsible heading too. Use the browser's own details and summary so it works with a keyboard and a screen reader and without JavaScript. Everything starts closed. A link such as /help#post-a-job must open the right section and topic and scroll to it (that needs a small piece of script, because details does not do it by itself). Optional: Expand all and Collapse all buttons, if they look tidy.
- Content lives in a typed data file (content/help.ts, like content/posts.ts), so adding a topic is a copy and change. Each topic has a title, a short answer or numbered steps, and optional links to the real page where the thing is done.
- Each how to says what to click, in the order a person sees it. Check every step against the real code and pages. Never describe a feature that is not built. Do not give prices, because checkout is not built yet. Say the free launch needs no card (CLAUDE.md).

Starting topics (tell me if any is wrong or missing, and I will add more once we are live):
General: What is Kestrel Eye Care Jobs; Is it free; Why does every job show its pay; What "existing vacancy" means; What "uses AI to screen candidates" means (and that Kestrel does not rank applicants with AI); Where your data is kept; Who can see your details; Which provinces are open and why Quebec is not yet; What "Found on the clinic's website, not yet claimed" means; How to contact us; How to delete your account and download your data.
Candidates: Create an account; Build your profile and add a CV; Search and filter jobs, including distance; Apply on Kestrel or on the clinic's own site; Track your applications and what each status means; Job alerts; Recommended for you and Not interested; Keep my details for future roles; Withdraw an application; Private until you apply.
Clinics: Create your account and clinic profile; Post a job with the ad builder and what every post needs; Pay options for each role; What happens after you submit (review, usually 1 business day); Edit a live job; Read and manage applicants, including shortlist, interview and a kind no, one at a time or ticked in bulk (and that bulk shortlisting sends no email); Extend, close, mark filled and post again; Claim a listing we found; Job templates; What views and apply clicks mean on your dashboard.

STEP 1 (no code yet). Send me a one page design: the page layout, how the nested details look on desktop and phone, how the deep link works, the data file shape, the page title and description (title under about 60 characters plus the site name, description 70 to 160), how it goes in the sitemap, and the footer link (check whether another chat has changed the footer, and add one link only). Then list any topic where the code does not match what the topic assumes. Stop and wait for my approval.

STEP 2 (after approval). Build it. Write the General section first and show me a preview, then Candidates, then Clinics. Ask me for anything only I know. Add tests like the blog tests (title and description length, writing style, no dash used as punctuation, every deep link target exists). Run npm run typecheck, npm test and npm run build before each push, and push so Vercel makes a preview. Add a "Phase 3C results" section to the plan file.

Rules: writing style from CLAUDE.md: warm and plain, numerals, British spelling with Canadian conventions, no em dashes, no banned words, no emoji. No Eye Recommend material. I am not a developer, so explain every change in plain English.
```

### Phase 3C results (9th November 2026)

The help centre is built at `/help` (branch `claude/stoic-meitner-s4qzqp`). No database change and no new setting. Not merged until Steve approves the preview.

- **What it is.** One page with 3 closed sections (General 14 topics, Candidates 10, Clinics 11, so 35 in all). Sections and topics are the browser's own `details` boxes, so they work with a keyboard, a screen reader and without JavaScript. `components/HelpControls.tsx` is the only script: it opens the right section and topic for a link such as `/help#post-a-job` (on load and when the address changes), keeps the address in step with the topic a person opens, and shows Expand all and Collapse all (only once the script has run, and they act on every section and topic).
- **Where the words live.** `content/help.ts`, in the shape set by `lib/help.ts`. To add a topic, copy a block, change the `id`, title, `answer`, optional `steps` and `links`, then run `npm test`. Links to another topic are written `[text](/help#topic-id)`.
- **Tests** (`lib/help.test.ts`, and the existing style guard, which already reads `content/`): title and description length, section order, unique link safe ids, every topic has an answer, no dash used as punctuation, no curly quotes, no dollar amounts (checkout is not built), every `/help#id` link points at a real topic, and every link goes to a page that exists. `lib/page-dates.test.ts` checks the page's "Last updated" line against the sitemap date.
- **Sitemap and footer.** `/help` is in the sitemap (monthly, priority 0.4) with its date in `lib/page-dates.ts`. A single "Help" link was added to the footer in `components/AppFooter.tsx`, the home page, and the sign in and sign up pages (`components/AuthShell.tsx`). Phase 1D will fold these into its shared footer and put Help under "Company".
- **Notice.** While sign up is closed, `/help` shows "Kestrel is opening soon. These answers describe how it works once you have an account." It reads the existing sign up gate.
- **Changed in the code that the help depends on.** Only `components/BlogBody.tsx` (the shared text reader now also exports `Inline`).

**Things the help says that differ from older docs or on page wording** (so the next person is not surprised):

- The apply button reads **Quick Apply**, not "Apply with Kestrel" as `docs/candidates-and-applications.md` says.
- A clinic sees a candidate's name, email address and phone number (if given) with an application. The help says so.
- **A withdrawn application cannot be sent again** (the database allows 1 application per person per job). The Withdraw box used to say "You can apply again later if the job is still open." Steve decided on 10th November 2026 to keep the rule (no repeat applications to the same job, other jobs are fine), so the page now says "You cannot apply to this job a second time, but you can apply to other jobs, now or later."
- Shortlisting is silent everywhere, and a candidate is shown "Viewed" instead of "Shortlisted" (merged from the applicants chat, 10th November 2026). The help follows that. The candidate's progress bar still draws a "Shortlisted" label as 1 of its 5 steps, though a candidate's application never sits on it. The help does not name that step.
- The Contact page promises a reply within 2 business days, and `docs/definitions.md` says 1 business day for clinics. The help uses the Contact page.
- "Not interested" has no undo. The dashboard **Close** button does not message applicants, while **Filled it?** does.

**Decided by Steve (10th November 2026):** candidates never pay, and the costs are all on the clinic side (the "Is it free" topic says so). Clinics are encouraged to reply within 5 days, and the reminder email goes after 14 days unopened (not after a few days, as first thought). The Contact page's 2 business days stays. All 35 topics were approved.

### Phase 1D results (9th November 2026)

Footer and link styles are built (branch `claude/vigilant-planck-dqo6bd`). No database change and no new setting. Not merged until Steve approves the preview.

- **One footer.** `components/AppFooter.tsx` is the only footer. The copies in the home page, the privacy page and the sign in shell are gone, and a test fails if a page adds its own. Navy, with the existing reversed wordmark and the tagline on the left, then 3 columns: For candidates (Find jobs, Jobs by province, Find your fit, Blog), For clinics (Post a job, which goes to `/clinics`, Compare prices, Resources) and Company (Help, Contact, Security, Data sources). A quiet bottom row holds Privacy, Terms, Posting policy and the copyright. Find your fit shows only while `ENABLE_FIND_YOUR_FIT` is `yes`, and Compare prices only while `ENABLE_COMPARE` is not `no`, so neither can lead to a 404. The street address stays out. Every link row is 44px high (measured on 10 pages at 1280 and 390 wide), and on a phone the columns sit 2 across.
- **Link system** (`app/globals.css`). Links in a sentence keep an underline, 1px thick, 0.22em below the text, at 75% strength (about 3.2 to 1 against the background), and 2px and solid on hover. Navigation links (back links, footer) are bold with no underline, and hover adds one. Back links get a small arrow, drawn in CSS and hidden from screen readers. `.linkbtn` (Close, Delete, Dismiss, Filled it?, Save as template, Take back to edit and the admin ones) is now a quiet 44px button with no box until hover. Delete is dark red (`.linkbtn.warn`). Title links on cards were left alone.
- **Clinic dashboard.** Each job is a card with what it is on top and one action bar underneath: buttons on the left (Applicants, Extend 30 days, Edit, View, Post again), quiet actions on the right (Filled it?, Save as template, Close, Delete). When a job has applicants, Extend 30 days is a white button so only 1 button is chestnut. "See your job" and "Open it" in the notices are small buttons, with Dismiss beside them.
- **Icons.** `components/Icon.tsx` holds 9 small line icons (warning triangle, trash, pencil, eye, tick, cross, plus, copy, refresh), drawn in the colour of the text beside them and hidden from screen readers. They always sit next to words. Used on the clinic dashboard buttons, the Dismiss and Close buttons, Post a job, Not interested (candidate home) and the warning triangle on Report this job.
- **Data sources.** A new "Data sources" block at the bottom of the Resources page (`/resources#data-sources`) credits GeoNames (adapted, CC BY 4.0 linked) and Job Bank (Open Government Licence, Canada linked). The footer links to it from the Company column, the cleanest spot because that column was the shortest after Help, Contact and Security. The grey GeoNames line on the jobs page and its `.creditline` style are removed. The Job Bank credit was already beside the Resources pay table, the landing pages and the post a job form (`components/PayBenchmark.tsx`), and those lines stay.
- **Help centre.** The "See your job" topic now says button, not link.
- **Tests.** `lib/site-footer.test.ts` checks every footer link goes to a real page, the 2 switched links, no street address, no second footer, the Data sources credits and licence links, and the removed credit line.

**Checked.** `npm run typecheck`, `npm test` (361 passing) and `npm run build`. Colour contrast measured against WCAG 2.1 AA: white on navy 14.06 to 1, light text on navy 9.12, Wing Buff on navy 7.24, chestnut on cream 4.96, dark red on white 8.52. Keyboard focus: the footer links show a 3px white ring on navy, and every other new style uses the existing 3px focus ring.

**Not checked.** Signed in pages (the dashboard, candidate home) cannot be opened here without a database, so the new dashboard was checked on a mock page built from the same markup and the real stylesheet. Steve should open the dashboard on the preview, with a live job, a draft and an approval notice. The link counts in the design note came from a script that reads the code, so they are close, not exact.

**Follow ups after Steve looked at the preview (9th November 2026).** Footer links show a soft white box on hover (not a coloured underline), and the footer wordmark has no hover box, like the header one. The province and role lists on the home page, `/eye-care-jobs` and the landing pages are chips (`.landlinks`, 44px, with the count in a lighter weight) instead of underlined links. "All provinces and roles" is a small white button, and "Compare prices" in the navy clinics box is a white outline button.

**Release note (9th November 2026).** Phase 1D first reached `main` by pushing the branch's commit to both the branch and `main`. Vercel builds a commit once, as a preview for the first branch it sees, and did not make a production build for the same commit on `main`, so the live and demo sites stayed on the older version until a new commit reached `main`. To avoid it, push or merge to `main` before the work branch, or merge through a pull request, so `main` always gets a commit Vercel has not built yet. In Vercel, Production is shown on the deployment for the newest `main` commit.

### Help centre search (10th November 2026)

Added after the merge, at Steve's request. A search box above the sections (shown only once the page script has run, like Expand all, so the page is unchanged without JavaScript).

- **How it matches:** every word typed must be the start of a word in a topic's title, answer, steps or keywords. Capitals, accents, punctuation and plurals do not matter ("alerts" finds "alert", "CVs" finds "CV"). The rules are in `lib/help.ts` (`topicMatches`) and tested.
- **What it does:** shows only matching topics, opens the sections that have one, and opens the topics themselves when 5 or fewer match (`SEARCH_OPEN_LIMIT`). A line says how many were found, and "No topics match" links to Contact. Clear or Escape puts everything back to closed. A link such as `/help#job-templates` clears the search first, so a deep link always works.
- **Keywords:** each topic in `content/help.ts` has an optional `keywords` list of the words people use (resume, cancel, forgot, scam, renew). They are never shown, only searched. All 35 topics have them. When adding a topic, add the words people would type; the tests check that every topic is found by its own title and by each keyword.
- No database change and no new setting.

### Help centre: General opens by default (10th November 2026)

At Steve's request the General section starts open so the page does not look bare. Candidates and Clinics stay closed until clicked, and every topic inside General still starts closed. The list of sections that start open is `HELP_OPEN_BY_DEFAULT` in `lib/help.ts` (tested). It works without JavaScript. Clearing a search puts the page back as it first looked (General open, the rest closed), and Collapse all still closes everything. No database change and no new setting.


---

## Candidate experience review (raised by Steve while testing, November 2026, held for Wednesday)

Nothing here is built. Steve walked through the candidate side and listed 7 points. Each has what the code does today (checked), the proposal, and what needs his decision. Several cross over to the clinic side and say so.

### 1. The profile asks for provinces 3 times, and a lot of repeated questions

**Today** (`components/CandidateProfileForm.tsx`): "Licensed or registered in" (provinces), "Your town or city" with "Its province or territory", and "Also happy to work in" (more provinces). Then type of work, lowest pay, kind of practice, software, other roles. Recommendations use the extra provinces if given, and fall back to the licensed ones only when there is no home town or extras (`lib/recommend.ts`), which is why it is unclear whether provinces already given count.
**Proposal:** ask where they live once. Ask "Where are you registered to practise?" only for roles that need registration (optometrist, optician), and hide it for the rest. Make "Where would you work?" start with the home province ticked and the registered provinces ticked, so nobody re ticks what they already said. Split the form into short steps (the basics needed to apply, then what you are looking for, then extras), with Optional marked and a progress line. Say plainly on the form what each answer is used for.
**Decide:** which questions are truly needed to apply, and which can wait until after the first application.
**Clinic cross check:** see whether "post a job" repeats the clinic profile's province and city.

### 2. "Recommended for you" is not obvious while filling in the profile

**Today:** it appears on the candidate home once the profile is saved, and the getting started list points to it.
**Proposal:** show a live line on the profile ("With these answers, 12 jobs fit you now") and a link that opens the recommended list as soon as it is saved. Add "See your recommended jobs" as a getting started step.

### 3 and 4. The job list should default to the person's own role

**Today** (`app/jobs/page.tsx`): the list is the same for everyone, with the role filter on "Any role". A signed in optician sees optometrist and assistant jobs.
**Proposal:** for a signed in candidate with a profile, the list starts on "For me", their role plus the "other roles you would consider", and their province and distance, with a clear line "Showing jobs for Optician in Ontario. Show all jobs" so nothing is hidden. Visitors and search engines still see everything, so Google indexing is unaffected. The role filter is a single choice today, so showing the role and the other roles needs a "My roles" choice or a multi select.
**Decide:** "For me" as the default, or a switch the person turns on.

### 5. A candidate can apply for a role that is not theirs

**Today:** applying only checks that the profile has a role and a CV (`lib/candidate-actions.ts`). An optician can apply for an optometrist job.
**Proposal:** a candidate can apply when the job's role is their role or one of "other roles you would consider". Otherwise the Apply button is replaced by a message: "This role is for an optometrist. Your profile says optician. If that is not right, you can change your role in your profile to apply." with a button to the profile, and the server refuses a mismatched application too, not only the page. Offer "add this role to the ones you would consider" as a one click choice, so a genuine career move is easy.
**Clinic cross check:** fewer unqualified applicants is the clinics' main complaint about general boards.
**Decide:** is the rule strict (own role or listed roles only), and do any roles count as compatible by themselves (for example opticians and contact lens fitters)?

### 6. People who are not in the industry

**Today:** the role list is only eye care roles, so someone outside the industry has to pick the nearest one. There is no note on sign up.
**Proposal:** a short line at sign up ("Kestrel is for people working in, or moving into, eye care in Canada"), and a "where are you in eye care" choice on the profile: working in eye care, student or new graduate, new to eye care. Clinics see it as a small tag on the application. Blog posts already encourage hiring from outside the industry, so it should be possible to be new, but regulated roles (optometrist, optician) should need registration or student or new graduate status.
**Decide:** which roles a person new to eye care may apply for.

### 7. The profile menu only shows on the dashboard

**Today:** the initials badge with "Profile and CV" and the account links is in the app bar (`components/AppBar.tsx`), used on dashboard, profile and clinic pages. Public pages such as jobs, a job, the blog and help use the public header (`components/SiteHeader.tsx`), which shows "My dashboard" and "Sign out" but no profile menu.
**Proposal:** show the same initials badge menu in the public header when signed in, beside "My dashboard", on every page and on a phone. Same for clinics ("Clinic profile", "Post a job"). Small to medium build.

### Suggested order when this is picked up

1. The header menu (point 7): small and self contained.
2. The role rule on Apply, with the message (point 5): a correctness fix, and it needs the decision above.
3. The "For me" job list (points 3 and 4).
4. The profile redesign with the recommended preview (points 1 and 2), the largest.
5. The sign up note and "where are you in eye care" (point 6), after the role decision.

Update the help centre topics for the profile, applying and the job list in the same change as each step.

### Steve's decisions on the candidate review (November 2026)

1. **Roles that can apply for each other.** Optician and contact lens fitter are the one pair of regulated roles that overlap. The unregulated front of house roles are flexible with each other: patient care or reception (front desk, receptionist) and optometric assistant or technician (which includes pre test technician). Everyone can also add any other role through "other roles you would consider". The rule for Apply: the job's role is the candidate's role, or in the same group, or in their "other roles" list. Open point: the role list has no separate "contact lens fitter" (it sits inside Optician, and the price band names contact lens fitters with opticians), so either Optician covers both or a Contact lens fitter role is added (a migration, and a change to the role checks on jobs).
2. **"For me" is the default job list for signed in candidates**, with a "Show all jobs" choice. Visitors and search engines see the full list as today. It also gives sponsored posts a natural place later (a sponsored post can be matched to the people it is for).
3. **No role is closed to someone new to eye care.** A newly qualified optometrist who has never worked in a clinic is still a qualified person. "Where are you in eye care" is an information tag for the clinic, never a gate. Kestrel does not check registration, so "registered in" stays self declared.
4. **Profile length: Claude's guidance, approved in principle.** Aim for under 2 minutes to be able to apply. Needed to apply: role, CV, town and province (the distance search and recommendations need them). Everything else is optional and can wait until after the first application: other roles (offered from the group above, with one tick each), where else they would work, type of work, how far to travel (25 km unless changed), kind of practice. Tucked under "More options": lowest pay, software, phone, available from. The "registered in" question appears only for roles that need registration. Each section says what it is used for. Details to confirm on Wednesday.

### Idea: fill in the profile from the uploaded CV (Steve, November 2026)

Steve asked whether an uploaded CV could fill in the profile (experience, job titles, education) so people type less. Yes, it can be built, and it fits the profile redesign: upload the CV first, press "Fill in from my CV", review the answers, then save. The trigger in CLAUDE.md ("AI may later read CVs to fill in a profile, only with clear consent, and only if candidates find the profile hard to complete") has now been met by Steve's own testing.

**What it should fill (only what Kestrel uses):** role (from the latest job title, matched to the fixed list), years of experience (worked out from the dates, shown as a band), registered provinces if the CV says so, town and province, phone, and practice software (matched to the fixed software list). It should not copy the whole work history or education into the database: clinics read the CV itself when someone applies, and storing more would lengthen the form and add privacy risk.

**What needs deciding or care:**
- **Consent and privacy.** A separate, unticked consent box saying the CV text is read by an AI service to suggest profile answers, saved with its date and wording, like the other consents. The CV text goes to Anthropic's API, which may process it outside Canada, so the privacy policy and help centre must say so (CLAUDE.md: personal data stays in Canada "where possible"). Add it to the lawyer's list, and check the API's data retention terms.
- **The CV is not processed today.** `docs/cv-scanning.md` says CVs are never opened by Kestrel's servers, which is part of the safety story. Reading one changes that. The safe route: run the existing check for macros and scripts first, send a PDF straight to the AI service without opening it ourselves, and for Word files either extract the text with a well known library or ask for a PDF for this feature. One new dependency is possible. Decide on Wednesday.
- **Never trust the CV text.** A CV could contain hidden instructions to the AI. The answers must come back in a fixed shape, be checked against the fixed lists (roles, provinces, software), and be shown to the candidate to correct. Nothing saves by itself.
- **Cost and abuse.** About a few cents per CV. Limit it to a few tries a day per person, inside the existing spend limit on the Anthropic key.
- **Size.** About the same as the ad builder: one chat, plus a small migration for the consent record. Best built as part of the profile redesign, not before it.

### Follow up to Phase 1D: a proper sweep of the remaining hyperlink style links (Steve, November 2026, for Wednesday)

Steve is still finding underlined, hyperlink looking links around the site that Phase 1D did not reach. The candidate home is the clearest example (screenshot taken on the demo site):

- "My saved cover letters", "What you are looking for" and "See all" are plain underlined links where a quiet button would read better ("Edit what you are looking for", "See all applications").
- The card titles ("Optician in a boutique independent", "Associate Optometrist in Established LC") are chestnut and underlined, which reads as a hyperlink. The 1D rule kept title links on cards, but the underline makes them look rough. A navy title with no underline, and an underline only on hover and focus, would keep the link and lose the look. The card already has a View job button, so the title does not need to shout.

**Scope, counted on 9th November 2026 from the code:** 269 links in `app` and `components`, 187 of them with no class of their own. That number is an upper bound, because many of the 187 sit inside a menu, the footer or a styled container that already styles them. The files with the most plain links are `app/resources/page.tsx` (13), `components/AuthForms.tsx` (10), `components/SiteHeader.tsx` (10, mostly menu items), `app/compare/page.tsx` (6), `app/candidate/page.tsx` (6), `app/admin/found/page.tsx` (5), the policy pages (5 each), `components/LaunchHome.tsx` (5), `components/LandingView.tsx` (5) and `app/jobs/page.tsx` (4).

**How the sweep should run (same rules as Phase 1D, which stand):** links inside a sentence keep a thin underline, because colour alone fails WCAG 1.4.1. Everything else is a navigation link (bold, no underline, a clear hover) or a button. Start with a list of every page and every plain link on it, sorted into 3 piles (leave as is, make a button, make a navigation link), with a before and after sketch for Steve. Cover signed in pages (candidate, clinic, admin) and public pages, and check them on a phone as well. Add a test that fails when a new page adds a plain link outside a sentence, in the style of the footer test.

### Wording: "resume", not "CV" (Steve, November 2026, for Wednesday)

Steve wants the site to read as Canadian. "CV" is the British word, so everything people read says "resume" instead. Not changed yet.

**Scope, counted on 9th November 2026 from the code (words people read only):** about 115 mentions in 36 files. By area: pages 38 in 16 files (the most: `app/privacy/page.tsx` 8, `app/candidate/profile/page.tsx` 6, `app/security/page.tsx` 5, the apply page 3), components 17 in 10 files (`components/CvCard.tsx` 5), the help centre 25 in `content/help.ts`, the blog 10 in `content/posts.ts`, and the rules and emails 25 in 8 files (`lib/candidate-actions.ts` 14, `lib/onboarding-emails.ts` 4).

**Rules for the change:**
- Say "resume" (no accent), and "resumes" for the plural. Keep it in step in labels, buttons, errors, emails, the help centre and the blog.
- Only change words people read. Do not rename database columns (`cv_path`, `cv_filename`), file names or code names. They are invisible and renaming them would need a migration for no gain.
- Help centre keywords: keep "cv" in each topic's search keywords alongside "resume", because some people will still type it.
- The blog post "How to write a CV for an eye care job" (slug `eye-care-cv`) is scheduled for 26th March 2027 and is not published, so it can be retitled and given a new slug (`eye-care-resume`) with no redirect. Check the internal links to it first.
- The privacy, terms and security pages are with the lawyer. Change the wording in the same pass only once the lawyer's first review is back, or tell the lawyer.
- The Phase 3A hub pages and posts, and the CV import idea (call it "Fill in from my resume"), should use "resume" from the start. If Phase 3A has not merged, ask that chat to use it, or do this pass after it merges, to avoid conflicts.
- After the pass, add a test that fails if "CV" appears in public wording, with a short allowed list (the keywords above).

### Clinic dashboard tiles should be clickable (Steve, 10th November 2026, for Wednesday, not started)

Each tile at the top of the clinic dashboard (`app/clinic/page.tsx`, the `tiles stats` block) should open whatever the tile is counting, so the number is a way in, not just a figure.

Suggested destinations, to confirm on Wednesday:
- **Live:** the Your jobs list showing only live jobs.
- **New applicants:** the applicants page for the job with the most waiting, or a short list of the jobs that have applicants waiting if there is more than 1.
- **In review:** the Your jobs list showing only jobs with our team.
- **Drafts:** the Your jobs list showing only drafts and posts that need changes.
- **Views and Apply clicks:** the per job numbers (views and apply clicks for each job over the last 30 days), which is where the totals come from.

Notes for whoever builds it:
- The Your jobs list has no filter today. A simple `?show=live` style link that filters on the server, with a "Show all jobs" button to clear it, would do, and keeps it working without scripts.
- Make the whole tile the link (a real link, not a click handler), so it works with the keyboard and a screen reader, and give it the same box highlight on hover as the other links. A tile with a count of 0 can still link, to an empty state that says what to do next.
- Keep the wording in `content/help.ts` in step if a help topic describes the tiles.
- Use the quiet, no jump patterns already in place so filtering does not scroll the page.

**Done 12th November 2026:** every visible use of CV was changed to resume, including the privacy, terms and security pages (Steve confirmed the lawyer will not mind), emails, the help centre, the menu label (now "Profile and resume") and the blog post, which is now `eye-care-resume`. `lib/resume-wording.test.ts` guards it. The lawyer pack PDF (`docs/legal/Kestrel-lawyer-review-pack.pdf`) still says CV and should be regenerated before it is sent. The sample job image on the pre launch home page (`public/home/sample-job.png`) should be checked for the old wording.

## Triage of the Gemini "catch up" summary (Steve, 12th November 2026)

Steve wrote a summary in Gemini while his Claude usage was maxed. Most of it describes an older version of the plan. What was kept, what needs a decision, and what was dropped, so nobody repeats it.

**Already built, nothing to do:** the independent or corporate filter, pay in the shapes optometrists use (daily rate, percentage of billings and others), the ad builder, Google for Jobs structured data, the pillar and cluster blog plan (hub pages are in their own chat), CASL and private resumes, the demo site being kept out of search (`robots.ts` and `layout.tsx` already switch indexing off when `DEMO_MODE` is `yes`, so the staging to production check is covered), and an empty state on search with suggestions.

**Usable, for Steve to schedule (not started):**
- **Student associations as a way to reach candidates**, for example optometry and optician programs. Steve to pick which ones. Public contacts only, and nothing from Eye Recommend.
- **A salary guide as a sign up reason.** Build it on the pay guide that already uses Job Bank figures (`docs/pay-benchmark.md`), with source and date, never pay from Indeed, LinkedIn or Jobs4ECPs. Optional gate: an email address with a CASL consent line.
- **The 63 clinics check.** 63 recurring clinics at $199 a month is $150,444 a year before Stripe fees and HST. Our passes cover up to 5 live posts, not unlimited, so a mix of passes and single posts is the more honest target. Revisit with the roadmap dates.
- **Audit areas to carry into the final audit** (about 3 weeks before launch): the 6 areas listed in the summary map to `docs/audit/AUDIT-PLAN.md`. Add Stripe webhooks to it once checkout exists, and a check that every empty state says what to do next.

**The phase after launch: supply building with virtual assistants (Steve's clarification, 12th November 2026).** Shadow posting, cold outreach and a VA who finds hiring clinics and phones them were always meant for the phase after the free launch, not for launch. Parked, not dropped. The limits that already apply, so the plan is built inside them:
- **Finding clinics that are hiring.** A VA (or Steve) may read Indeed by hand to learn which clinics are hiring and who to contact (the 8th November 2026 exception). Nothing is copied from it and no Indeed link or text appears on Kestrel. No tool, scraper or script collects from Indeed, LinkedIn, Jobs4ECPs or the college registers, and a VA must not be given one.
- **Shadow posting, reworked.** The idea becomes: the VA notes the clinic, then the listing is made only from the clinic's own careers page (the found listings tool at `/admin/found`) or from facts entered by hand in Kestrel's own words, with a link to the clinic's own application page. It expires after 21 days, is labelled "not yet claimed", and the clinic gets a Claim your listing email. A listing copied or summarised from Indeed is not allowed.
- **Cold email.** Built (4 email sequence) and switched off. It stays off until Steve confirms his disclosure conversation, and it follows CASL: published business addresses only, about the recipient's role, with a working unsubscribe.
- **Cold phone calls.** Not covered by the current rules, so it needs its own written script and rules before a VA calls anyone: who may be called (published business numbers only), what is said, no call about anything but the clinic's hiring, a record of every do not call request, and no Eye Recommend clinics or contacts. Check Canada's telemarketing rules for business calls with the lawyer first.
- **What a VA can touch.** Give them the least access that does the job: a login with a role that can save leads and found listings, with no access to candidate data, applications or settings. This is part of Steve's open VA question. Keep their name out of the repository.
- **Order of work:** the disclosure conversation first, then the lawyer's check of the call and email scripts, then a small trial of 10 to 20 clinics, then widen.

**Needs Steve's decision:**
- **The funding pitch** (a $50k SAFE to optical industry veterans). Not a code task. It touches the separation from Eye Recommend (check who is on the list) and securities rules for raising money in Canada, so it wants the lawyer first.
- **The AI culture match score** stays later. Today's "Find your fit" quiz uses plain rules. If a match score is built, it must never rank applicants for clinics.

**Dropped, and why:**
- **Wix as the backend and the Wix CMS schemas.** The site is Next.js on Vercel with Supabase. Wix never went live.
- **Hiding optometrist wage data from everyone except verified optometrists.** Decided against: every post shows its pay publicly, and no pay sits behind a login.
- **Old prices ($39 to $79 posts, an unlimited pass at $149 to $199).** The ladder is $59, $79 and $99, with the Clinic pass at $199 and Plus at $349 for up to 5 live posts each (`lib/pricing.ts`).
- **"Free first posts for waitlist clinics only".** The plan is a free launch of 30 to 60 days for everyone, with no card needed.
- **Native app now.** Parked until the web platform pays for it.
- **The file "Kestrel Eye Care Jobs".** Not in the repository. The business plan is the "Kestrel Eye Care Jobs: Business Proposal and Launch Plan v7" document linked in `CLAUDE.md`.

**Built 12th November 2026 (profile redesign, piece 1):** "ready to apply" is now a role, a resume, and a town and province, decided in one place (`lib/profile-ready.ts`) and used by the profile page, the apply page and server check, the dashboard, the first week emails and the admin numbers. The profile page has a "To apply you need" list, a short form (role, town and province, "Registered in" for optometrists and opticians only), and 2 closed sections, "More about you" and "What you are looking for". Existing candidates with no town saved are not ready until they add one. Still to do: piece 2 (first step page and the "where are you in eye care" tag, with a migration), and the no AI resume reader, which Steve wants tried later with sample resumes in different styles.
**On the tag (Steve, 12th November 2026):** be careful it does not touch protected grounds. Answers such as "returning to eye care" or "new to eye care" can hint at age, family status, disability or sex, so keep the wording to facts about where someone is in their career, and decide with the lawyer whether a clinic may see it. Until then it is private: used only to tailor the candidate's own help and emails, never shown to a clinic and never used to rank or filter jobs.

### Profile redesign: Steve's answers (12th November 2026)

- **Piece 1, shorter profile:** go. "Ready to apply" needs 3 things: role, resume, and town and province (Steve confirmed town and province are required). Everything else sits under "More options", closed at first, each section saying what it is used for. The "Registered in" question shows only for optometrists and opticians. Today the rule in `lib/candidate.ts` (`profileReady`) is only role and resume, so town and province are a new requirement there and in the apply checks.
- **Piece 2, first step page and the "where are you in eye care" tag:** agreed, on a page straight after the first sign in with 3 optional questions and a skip button. One new column for the tag, so a migration to run on both databases. Steve is out and will run the SQL later.
- **Piece 3, "Fill in from my resume":** benched to a later phase, mainly on cost. If it comes back, the first version would use no AI (read the text on our own server and match it to our fixed lists), so nothing is sent to an outside service. An AI version kept in Canada would need a Canadian hosted option checked first.
- **The tag:** Steve asked what it is. It is the "where are you in eye care" answer from Piece 2 (for example working in a clinic, newly qualified or a student, returning, or new to eye care). Still to decide whether the clinic sees it with the application.

**Link sweep finished, 12th November 2026.** Re-scanned every page: 130 plain links remained, 33 of them on a line of their own. Those are all handled by a container style, not left bare: back links (`.back`), card, post and blog titles, the small links under forms (`.alt`), the report link, the blog strip, and lists of outside sources (inside a list, so they keep their underline). The first sweep had already turned the standalone ones into buttons and made card titles navy. This one made every remaining family highlight the same way on hover (a soft box with a thin ring, no underline): back links, the small links under forms, the report link, blog titles and the home page blog strip. The province and role pills keep their own pill hover. A test now fails if any style rule underlines a link only on hover. Wording: "Home" now says "dashboard" in the candidate page title and heading, the Back link on the account page, one help topic and one email. The remaining 110 links inside sentences keep their thin underline, as agreed.

### Parked for later (Steve, 12th November 2026)

- **Smaller inbox notices:** the waiting for a reply reminder, "job closing in 3 days" and claim approved or declined. The inbox itself is built and the SQL has been run (0037 to 0039, both databases). These three are small additions written where those emails are already sent.
- **Pay guide lead magnet:** draft the guide and its sign up form. It is part of Phase 4 (item 6): built only from Job Bank figures, non optometrist roles only, with the same consent wording style as the waitlist.
- **Audit part 1** is running in its own chat on Fable (prompt in `docs/audit/AUDIT-1-PROMPT.md`). Its report is written to `docs/audit/AUDIT-2026-11-PART1.md`. Avoid merging new features while it runs. Part 2, the deeper opportunities and performance audit, is planned for about 3 weeks before launch.
