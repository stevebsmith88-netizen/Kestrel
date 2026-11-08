# Gemini documents: phased plan (8th November 2026)

Status: agreed with Steve on 8th November 2026. Nothing in this file is built. Each phase below is one chat. Steve pastes the prompt for that phase into a new chat, and attaches or supplies the items under "Steve provides".

## Where this came from

5 PDFs made in Gemini: an agency blueprint, a growth playbook, an SEO content calendar of 20 topics, a SWOT and platform audit, and a project summary. They are AI output and none of their figures are sourced. Treat every number in them as unverified. Do not commit the PDFs to the repository. Each prompt below carries the useful extract, so a new chat never needs the PDFs.

## Decisions on record (Steve, 8th November 2026)

1. **Indeed.** The ban on Indeed as a lead source is lifted, for manual use only. Steve (or later a VA) reads Indeed by hand to find which clinics are hiring, then reaches out to the clinic with a "claim your listing" offer. No automated scraper is built, ever. Listing text comes from the clinic's own careers page where one exists, in Kestrel's own words. CLAUDE.md must be updated to say this (Phase 0).
2. **Applications stay with the clinic.** On listings the clinic has not claimed, candidates are sent to the clinic's own website to apply. Kestrel does not hold applications for clinics that have not joined. A claim email may say "N people clicked apply on your listing" only when that number is real, from the job stats already counted (migration 0030). Never invent or round up a number.
3. **Pay stays public on every post.** Optometrist pay gets extra pay basis options (see Phase 2), and the range is still required. No pay hidden behind a login. Optometrist wages stay off the public pay table (decision of 6th November 2026).
4. **Employee count.** Ask a clinic how many employees it has when it creates an account. Store it, and do not use it to switch off the pay range rule yet. Ontario's pay range rule is understood to apply to employers with 25 or more employees, but that is unverified and the self declared number cannot be checked. Revisit after the lawyer answers.
5. **Blog.** Stays human, fortnightly, ranked by SEO benefit. The two pillar pages (hub guides) are kept.
6. **SMS alerts.** Wanted, but after the pay phase and after launch data exists. Email alerts are the channel at launch. SMS needs its own express consent under CASL and a per message cost.
7. **App.** Later. Wrap the website (an installable web app first) rather than build native.
8. **Parked, for information only.** The agency blueprint (`docs/agency-pathway.md`), sister companies, funding (a $50,000 SAFE note, raising from founding doctors) and a native app. The funding idea raises securities law and conflict questions, and the Eye Recommend question, so it goes to the lawyer when Steve chooses.
9. **Lawyer addendum.** Not now. Wait for the first document back from the lawyer.
10. **Timing.** Steve is waiting on the lawyer's documents. The disclosure conversation (Gate A) happens after that. Goal: launch in mid January 2027, whether the conversation lands a few days or a month later.

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
| 4 | Launch liquidity: leads, claim outreach, pre load, schools, guide | M | Gate A for anything sent | Maybe |
| 5 | After launch: SMS, alert reach, pass value, supply features | L | Real launch data | Yes |

Run 0, then 1. Phase 3 can start any time after Phase 0 because it needs no code. Phase 2 can run beside Phase 3. Phase 4 drafts can be prepared now but nothing is sent until Gate A. Phase 5 waits for launch.

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

**Done when.** Steve posts a test optometrist job with a percentage basis, tags show on the card and filter, and the employee count appears in Admin.

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
| SMS alerts | After Phase 2. Needs express consent, a provider with Canadian numbers, a cost per message, and a quiet hours rule. Email stays the default. |
| Alert reach in notifications | "N candidates have alerts matching your role", from real data. The word "verified" only after verification exists. |
| Pass value in the quiet months | An always interested clinic profile, locum cover posts, a quarterly pay update. Decide after seeing pass retention. |
| Confidential inquiry | A candidate asks a clinic a question before applying, without giving a name. Needs a privacy and abuse design. |
| Corporate bulk import or feed | Only if a corporate group asks, since their systems push to Indeed. |
| Locum board | Already a later feature in CLAUDE.md. |
| Installable web app | Wrap the website first. Native app is a later decision. |
| Supplier rep networks | Needs Gate A and the lawyer. Take care with Steve's employer's supplier relationships. |
| "Verified Kestrel partner clinic" | Define what is verified before using the words. |

## Parked: for information only

- **The agency pathway.** Kept in `docs/agency-pathway.md`. The Gemini blueprint adds nothing that file does not already hold, and its Ontario licensing and Quebec figures are unverified. Stage 0 stays "build nothing".
- **Funding.** A $50,000 SAFE note, or raising from founding doctors who post jobs. Securities law, customer conflict and the Eye Recommend question all apply. A lawyer conversation, when Steve chooses.
- **Native app.** After the web app wrapper has proved demand.

## Questions held for the lawyer (not sent yet)

For when Steve is ready, after the first document comes back: whether manual use of Indeed to find leads is acceptable; whether the "N people clicked apply" claim needs any wording; pay basis options for optometrists (percentage of production) under Ontario and BC pay range rules; whether an employee count can switch off the pay range requirement in Ontario; funding from customers and founding doctors.
