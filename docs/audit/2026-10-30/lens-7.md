# Lens 7: Product against the business plan
Reach: read the v7 plan (as text), docs/PLAN.md, CLAUDE.md, docs/handoff.md, docs/launch-checklist.md and the feature docs, then checked each promise against app/, lib/, components/ and supabase/migrations/ at commit 9543c20. I could not see the live site, Stripe, Google Search Console, Vercel or any company or bank records, so anything outside the code is marked Possible and put on Steve's list.

## Findings

### 7.1 The ad builder does not do what the plan sells: there is no "paste your job link"
- Severity: High  | Confidence: Confirmed
- For Steve: the plan's lead line to clinics is "paste your job link, get a polished ad in 5 seconds", but the builder only rewrites a few lines the clinic types. If the outreach emails or the For clinics page promise the link version, the first clinic that tries it will see the gap, and CASL also expects commercial email to be accurate.
- Evidence: lib/ad-builder.ts:37 to 43 (`buildAd` reads only the typed `brief` field, 20 to 1,500 characters, and refuses anything shorter); components/JobForm.tsx:127 to 131 (label "Tell us about the job in a few lines", button "Write my ad"); no URL input, fetch or page reader anywhere in lib/ or app/ (`grep -rn "fetch(" lib app components` finds only Resend, Turnstile and the waitlist form; the Anthropic and Supabase SDKs make the other calls). docs/handoff.md:30 lists "careers page reading with the Claude API" as not built. v7, Executive summary and Go to market: "a 5 second ad builder that turns a clinic's existing job page into a formatted listing".
- Detail: the same missing piece (read a public careers page, extract facts, write in our own words) is also what the seeding tool needs, so building it once serves both the sales hook and Gate C.
- Proposed fix: build one server side "read this page" step (fetch a single public URL the clinic or admin supplies, strip to text, pass to the existing prompt as the facts, never copy wording), use it in the ad builder ("Paste your job link" box above the brief) and in the admin seeding tool. Until then, word the pitch as "describe the job in a few lines and get a polished draft". | Effort: 1 to 2 days | Who: Claude

### 7.2 Candidates must create an account, upload a CV and confirm their email before they can apply
- Severity: High  | Confidence: Confirmed
- For Steve: v7 says candidate accounts are "optional, since anyone can browse and apply without one". In the build, browsing is open, but applying through Kestrel needs an account, a confirmed email, a role and a CV. The plan expects most candidates to arrive from Google for Jobs, many on a phone, and every extra step before Apply loses a share of them, while the plan's own risk table rates "too few candidates" as the highest risk.
- Evidence: app/jobs/[id]/apply/page.tsx:30 to 40 (signed out visitors see "Sign in to apply" and "Create a free account"), :52 to 59 (no CV and role, no apply). The "Create a free account" link at :37 goes to `/sign-up` with no return address, and app/sign-up/page.tsx:12 to 19 takes no `next`, while lib/auth-actions.ts:72 sends a new account to a "check your email" message, so after confirming, the candidate lands on their dashboard, not back on the job. Only jobs with `apply_method = 'external'` (mostly seeded ones) can be applied to without an account (app/jobs/[id]/page.tsx:70 to 74).
- Detail: the account model is a sound decision (clinic emails stay private, recruiters cannot harvest them, the tracker works). The cost is the funnel. The cheapest repair keeps the model and removes the dead end: carry `next` through sign up, email confirmation and Google sign in, so the candidate returns to the same job's apply page; then consider a "quick apply" (name, email, CV, letter) that creates the account in the background.
- Proposed fix: (1) pass `next` through sign up and the confirmation link now; (2) decide with Steve whether a guest apply is worth it before Phase 2; (3) record the drop off (apply page visits versus applications sent) so the decision is based on numbers. | Effort: hours for (1), 1 to 2 days for (2) | Who: Claude, Steve decides (2)

### 7.3 The clinic dashboard has no views or apply clicks, and nothing measures candidate traffic at all
- Severity: High  | Confidence: Confirmed
- For Steve: the plan promises clinics a dashboard with "live posts, views, apply clicks, renew", and the claim your listing pitch is "see how many candidates viewed it". Today the site records no page views, no apply clicks and no visitor numbers anywhere, so you cannot show a clinic its results, cannot prove candidate traffic to a paying clinic or an investor, and cannot tell whether Google for Jobs is working.
- Evidence: app/clinic/page.tsx:59 to 64 (tiles are Live, New applicants, In review, Drafts only); no views, clicks or analytics table in supabase/migrations (17 tables listed by `grep -n "create table" supabase/migrations/*.sql`, none for events); no analytics script or Search Console tag (`grep -rni "gtag\|analytics\|google-site-verification" app lib components package.json` returns nothing). External apply buttons are plain links (app/jobs/[id]/page.tsx:73), so a seeded or careers page job reports zero activity, which is exactly the listing the claim email is trying to convert.
- Detail: this is the biggest gap between the plan's business logic and the build. The 3 numbers that sell a renewal (views, apply clicks, applications) are 1 out of 3.
- Proposed fix: a small `job_events` table (job id, day, kind: view or apply_click, count) written from the job page and from a `/jobs/[id]/go` redirect for external apply, with bot filtering by user agent; show views and clicks per job on the dashboard and on the claim page; add a privacy friendly analytics tool (Vercel Web Analytics or Plausible, cookie free) and Search Console. Update the privacy policy line if a tool is added. | Effort: 1 day | Who: Claude, Steve sets up Search Console

### 7.4 Gate C (50 live roles across 5+ provinces) has no tool behind it, and the rules for a live job do not fit found listings
- Severity: High  | Confidence: Confirmed
- For Steve: the plan's free launch depends on seeding about 50 real roles from clinics' own careers pages. There is no admin screen to add them, so each would have to be typed into the database by hand. Worse, the database will only publish a job that has a pay range and a Yes or No for "existing vacancy" and "uses AI to screen", and careers pages often leave out pay (especially outside Ontario and BC) and rarely answer the other 2 questions, so Kestrel would have to leave the job out or state facts it does not know.
- Evidence: docs/handoff.md:30 and docs/launch-checklist.md:56 (seeding tool not built); the only way to create one today is SQL like docs/test-claim.sql. supabase/migrations/0005_clinics_and_jobs.sql:103 to 117 (`jobs_complete_unless_draft`: anything past draft needs pay_min, pay_max, is_existing_vacancy and uses_ai_screening). app/jobs/[id]/page.tsx:91 to 92 shows these as a flat "Yes" or "No" on every job, seeded or not. The 21 day seeded expiry exists only in docs/test-claim.sql (`now() + interval '21 days'`); lib/jobs.ts:35 has one lifetime (30 days) and lib/admin-actions.ts:25 always gives 30 days on approval.
- Detail: the claim page, the claim emails, the outreach email (lib/outreach.ts) and the "found on the clinic's website" labels are all built, but nothing feeds them. Gate C is the official go or no go for paid launch, so this is on the critical path once Gate A is passed.
- Proposed fix: build the admin "Add a found listing" form (clinic name, website, city, province, careers page URL, title, role, type, apply URL, our own summary; optional pay), which sets `is_seeded`, `claimed = false`, external apply and a 21 day expiry, and records where and when the listing was found (the CASL proof docs/casl-outreach.md:40 asks for). Let seeded jobs show "Not stated by the clinic" for vacancy, AI use and, if Steve and a lawyer agree, pay, instead of a guessed Yes or No. Reuse the page reader from 7.1 to prefill it. | Effort: 1 to 2 days | Who: Claude; Steve and Lawyer decide the pay question

### 7.5 The claim your listing loop leaks new clinics: creating a clinic profile first blocks the claim
- Severity: Medium  | Confidence: Confirmed
- For Steve: claim your listing is the plan's "main route from free to paid". A clinic that is new to Kestrel is sent to create an account, then lands on a dashboard whose first button is "Create my clinic profile". If they press it, they can no longer claim their listing and are told to email you. Each one becomes a manual job for you, at the exact moment you want the clinic's experience to be easy.
- Evidence: app/jobs/[id]/claim/page.tsx:93 (`/sign-up?type=clinic`, no return address) and :96 ("come back to this page and press I already have one"); app/clinic/page.tsx:50 to 56 (empty dashboard prompts "Create my clinic profile"); lib/claim-actions.ts:42 to 43 (an account that already has a profile cannot claim). Also lib/claim-actions.ts:143, the approval email, still says "A job that is already live cannot be edited, so ... close it and post it again", which stopped being true when editing a live job was added (docs/clinics-and-jobs.md:69 to 75, migration 0014).
- Detail: the claim approval also needs a clinic to have an account with no profile, but nothing tells a new clinic that.
- Proposed fix: carry `next` through sign up and email confirmation so the clinic returns to the claim page; on the clinic dashboard, if the account has an open claim, show "Finish your claim" instead of "Create my clinic profile"; correct the approval email wording. | Effort: hours | Who: Claude

### 7.6 3 of the plan's 5 transactional emails are missing, including the ones that drive renewals
- Severity: Medium  | Confidence: Confirmed
- For Steve: v7 lists 5 emails: welcome, post live, post expiring, receipt and alert. Only the job alert is built (plus a waitlist welcome). A clinic that submits a job is told "usually within 1 business day", then hears nothing when it goes live or is sent back, and gets no warning before its 30 days end. The "your post ends in 3 days, renew it" email is the cheapest renewal prompt a job board has.
- Evidence: every send in the code (`grep -rn "sendEmail(" lib app`): applicant status, new application, waitlist welcome and confirmation, claim emails, admin alerts, take down notice, cron close out, 14 day unopened reminder, job alerts. lib/admin-actions.ts:16 to 39 (`approveJob`) and :41 to 55 (`rejectJob`) send nothing to the clinic. app/api/cron/daily/route.ts:45 to 103 has 4 steps, none about posts about to expire. No account welcome after sign up (Supabase sends only the confirm email). Receipt waits on Stripe (Stripe can send its own).
- Proposed fix: add "Your job is live" (with the link and the closing date), "Your job needs a change" (with the note), and a cron step "Your job closes in 3 days" with a Post again button; switch on Stripe's receipt emails when Stripe is built. All are account emails, not marketing, so no unsubscribe is needed, but they should respect the clinic's alert address. | Effort: hours | Who: Claude

### 7.7 Pricing, the monthly pass and its "featured profile" have nothing to attach to yet
- Severity: Medium  | Confidence: Confirmed
- For Steve: none of the pricing ladder is built (expected, it waits on your Stripe account), but 3 product decisions should be settled before it is, because they change how it is built: what "featured profile" means when there is no public clinic page and no logo, whether a multi location group can have more than 1 login and more than 10 open jobs, and what field and supplier roles cost.
- Evidence: no Stripe, coupon, plan or entitlement code (`grep -rni "stripe\|coupon\|checkout\|FREELAUNCH" lib app components supabase` finds only the Terms text at app/terms/page.tsx:72 to 85). No public clinic profile route (app/clinics/page.tsx is a 29 line "Opening soon" page) and no logo field (`grep -rni logo supabase/migrations lib/clinic*.ts components/ClinicProfileForm.tsx` returns nothing). 1 clinic profile per account and 1 account per clinic: supabase/migrations/0005_clinics_and_jobs.sql:48 (`employers_owner_idx` unique on owner_id). 10 open jobs, drafts included: supabase/migrations/0009_alert_frequency_and_posting_safeguards.sql:22. Field and supplier pricing is open (docs/launch-checklist.md:58, docs/clinics-and-jobs.md:67).
- Detail: the 10 open jobs cap and the pass's 5 live posts are compatible (they count different things: the cap is an anti spam limit on drafts plus review plus live; the pass is a paid entitlement on live posts), but the cap will block the plan's best pass customer, a corporate or multi location group, from buying single posts beyond 10, and the single login means one person must manage every location's applicants.
- Proposed fix: decide (1) pass = up to 5 live posts, renewals free, and "featured" = a public clinic page with logo plus a "Featured clinic" badge and top placement in search; (2) raise the open jobs cap for pass holders or approved corporate groups; (3) field and supplier roles at the $79 standard price from paid launch, with no introductory tier (suppliers are bigger companies with bigger budgets). Then build Stripe in test mode around those answers. Team logins can wait until a group asks. | Effort: decisions 1 hour; build 2 to 4 days | Who: Steve decides, Claude builds

### 7.8 The admin numbers page cannot yet answer the 6 questions an investor or lender asks, and 1 number it shows is misleading
- Severity: Medium  | Confidence: Confirmed
- For Steve: the investor snapshot is a good start, but "applications per live job" divides every application ever received by the jobs live today, so it will look better every month whether or not anything improves. It also cannot show Gate C directly (provinces beyond the top 4 are lumped as "Other"), does not split found listings from clinic posts, and has no traffic, revenue, renewal or churn figures yet.
- Evidence: lib/admin-stats-data.ts:81 and lib/admin-stats.ts:75 (`ratio(applications.length, live.length)`: lifetime applications over current live jobs); lib/admin-stats-data.ts:86 (`topCounts(..., 4)` folds the 5th province onward into "Other"); :49 (`live` counts status "live" without checking `expires_at`, so it can be up to a day high until the daily job runs); :39 does not read `is_seeded`; job_alerts are not read at all, so alert subscribers are not counted; components/AdminNumbers.tsx:47 and :77 to 78 (revenue, MRR and conversion "Not on yet").
- Proposed fix: change the ratio to "applications in the first 14 days per job published in the period"; add a Gate C tile ("live roles: N, provinces with a live role: N, of which found listings: N"); add alert subscribers; when Stripe lands, add MRR, paying clinics, renewal rate, churn and average revenue per clinic from Stripe data. Traffic needs 7.3. See section D for the full metric list. | Effort: hours (now), 1 day (with Stripe) | Who: Claude

### 7.9 The board is open to the public before Gate A: anyone can create a clinic account and post, under draft terms with no company named
- Severity: High  | Confidence: Likely (Possible on the live site: depends on whether anyone has found it)
- For Steve: the plan says Gate A (disclosure acknowledged, company and bank set up) comes before the platform is used. The build is live at eyecarejobs.ca with open sign up, a public job search in the sitemap and a working post a job flow, while the Terms are marked draft and name no legal company, so any agreement today is with you personally. Your approval of every post is the only brake. Nothing is wrong with building ahead of the plan; the risk is operating ahead of it, in an industry where your employer's member clinics are the customers.
- Evidence: no switch on clinic sign up or posting (lib/features.ts has only the quiz and Google flags); app/sign-up/page.tsx:18 accepts `type=clinic`; app/jobs/[id]/claim/page.tsx:93 links to it; app/sitemap.ts:16 lists /jobs; app/terms/page.tsx:14 (`DRAFT = true`) and :26 to 29 (the party is "Kestrel Eye Care Jobs", no corporation); app/terms/page.tsx:127 (Ontario law). CLAUDE.md "Non negotiables" keeps outreach off until disclosure, but posting is not covered.
- Proposed fix: add an "invite only" switch (an environment variable) that hides clinic sign up and Post a job, except for accounts Steve has invited, until Gate A is passed; keep candidates' side open if Steve wants Google to start indexing. Update the Terms with the company name once incorporated. Steve should check the admin numbers for any clinic accounts that already exist. | Effort: hours | Who: Claude builds, Steve decides when to lift it

### 7.10 Free launch does not need Stripe, and real clinics should not go through a test mode checkout
- Severity: Medium  | Confidence: Likely
- For Steve: the recorded decision is "launch with Stripe in test mode and a free launch coupon, then switch prices on". Stripe keeps test mode and live mode completely separate: customers, cards, coupons and subscriptions made in test mode do not carry over, and test mode cannot take a real card. So every clinic would have to go through checkout again when prices start, and the free launch would wait on a Stripe build it does not use. Separating the 2 lets you free launch sooner and build Stripe properly for April.
- Evidence: CLAUDE.md "Current state" ("Stripe in test mode and a free launch coupon, then prices switched on later"); docs/handoff.md:29; docs/launch-checklist.md:46 and :68. No Stripe code exists yet (see 7.7), so nothing is lost by changing the plan now.
- Proposed fix: free launch with no checkout at all: a "free launch until [date]" setting that lets approved clinics post free. Build Stripe in test mode for Steve's own testing (Gate B's $1 payment and refund test happens in live mode once the company bank account exists), then go live with real keys at paid launch, keeping FREELAUNCH as a live coupon for late joiners. | Effort: decision now; saves about 1 day of throwaway work | Who: Steve decides, Claude builds

### 7.11 The For clinics page sells none of Kestrel's advantages
- Severity: Medium  | Confidence: Confirmed
- For Steve: when you invite waitlist clinics in Phase 2, the page they will look at says only "Hire people who know eye care" and "Join the waitlist". It does not mention the price, the free launch, the ad builder, contact privacy, the no recruiters rule, or that the form handles Ontario and BC's posting rules, which v7 calls "a genuine selling point over general boards".
- Evidence: app/clinics/page.tsx:17 to 23 (the whole page body); app/page.tsx:34 to 41 (home page clinic card: 3 bullets, no price or features). v7, Compliance point 5 ("That's a genuine selling point over general boards") and Competition table ("Mobile first, $39 to $79 posts, 5 second ad builder").
- Proposed fix: rewrite /clinics as a short sales page: free launch offer, then the price ladder (once decided), 4 or 5 plain benefits each backed by something built (pay range and AI questions built in, applicants without exposing your email, the tracker that helps with Ontario's 45 day follow up, no agencies, the ad builder), and a "Create a clinic account" button when Gate A is passed. | Effort: hours | Who: Claude writes, Steve approves

### 7.12 Skill tags and "welcomes internationally trained" tags, named in v7 as Kestrel's points of difference, are not built
- Severity: Low  | Confidence: Confirmed
- For Steve: v7's market section says tagging roles that welcome internationally trained candidates "gives Kestrel a clear point of difference" and that skill tags (dry eye, myopia control, OCT) "answer that directly". Neither exists, so candidates cannot search for them and the jobs carry nothing a general board lacks.
- Evidence: `grep -rni "skill\|internationally" lib app components supabase/migrations` finds only blog text (content/posts.ts:29, :81) and policy wording; no column, filter or form field.
- Proposed fix: add an optional set of skill tags (a fixed list of 8 to 12, chosen with Steve) and a "We welcome internationally trained candidates" tick box to the post form, show them as chips, add them as filters, and mention them in the JobPosting description. | Effort: 1 day | Who: Claude, Steve picks the tags

### 7.13 The revenue target is thinner than it looks once fees, HST, the annual discount, intro prices and churn are counted
- Severity: Medium  | Confidence: Likely (the arithmetic is confirmed; the fee rates and churn are assumptions to check)
- For Steve: docs/PLAN.md shows $150,839 a year after card fees from 47 passes and 550 posts, so the target is met with $839 to spare. Card fees are charged on the price plus HST, Stripe charges extra for subscriptions and for Stripe Tax, the $1,990 annual pass is 17% cheaper than 12 months, and the plan's own milestones use $79 posts from day 1 although introductory prices are $39 to $59. Most of these on its own takes the plan below $150,000, and together they take it well below. Monthly passes also cancel when the vacancy is filled, so 47 passes on the books needs a much larger number sold each year.
- Evidence: docs/PLAN.md:14 to 20 (47 x $199 x 12 = $112,236; 550 x $79 = $43,450; fees 2.9% plus $0.30 on the pre tax price); v7 "Milestones to track" ($3,965 at 6 months = 10 x $199 + 25 x $79, so standard prices from the start). Worked examples in section D.
- Proposed fix: set the target on net revenue after all payment costs, model 50 passes with an annual share, keep a churn line, and use the numbers page to track renewal and churn from the first paid month. Ask the accountant whether clinics can recover HST (eye exams are generally exempt, prescription eyewear is generally zero rated, so many clinics recover only part of it), because that decides whether "prices before HST" is felt as a 13% price rise in Ontario. | Effort: 1 hour with Claude, plus the accountant | Who: Steve, Accountant

### 7.14 The planning documents disagree with each other and with the build
- Severity: Low  | Confidence: Confirmed
- For Steve: a lender, advisor or a fresh Claude session reading these will get mixed messages: the plan says Wix, the docs say the homes are placeholders, and some setup steps name the wrong migrations. None of this breaks the site, but it will cost time and credibility. Full list in section B.
- Evidence: see section B (17 items, with file and line).
- Proposed fix: issue a v8 of the plan (stack, build status, revenue table, timeline), and a docs only branch that updates CLAUDE.md "Current state", "Data model (planned)" and "Next tasks", docs/launch-checklist.md:9, docs/automation-and-ai.md:38, docs/clinics-and-jobs.md:39 and :59, docs/casl-outreach.md:39, and lib/claim-actions.ts:143. | Effort: 2 hours | Who: Claude, Steve approves

## A. Gap table: every v7 promise against the build

Status key: Built, Partly built, Not built, Not needed (replaced by a different tool or no longer applies). "Not done" is used for non code items that appear not done and need Steve to confirm.

### A1. Product scope table (v7 "Product scope")
| Plan item (phase) | Status | Notes with evidence | What is missing for the phase gate |
| --- | --- | --- | --- |
| Clinic accounts, Google plus email and password (Launch) | Built | Migrations 0002 to 0004, 0017; lib/auth-actions.ts; Google behind `ENABLE_GOOGLE_SIGNIN` (lib/features.ts:5). Steve has tested both | Nothing |
| Candidate accounts, optional, "anyone can browse and apply without one" (Launch) | Partly built | Browse without an account: yes. Apply through Kestrel needs account, role and CV (app/jobs/[id]/apply/page.tsx:30 to 59); only external apply jobs need none. See 7.2 | Return path through sign up; decide on a guest apply |
| Clinic profile: name, logo, website, province, independent or corporate (Launch) | Partly built | Name, type (independent, corporate, supplier), city, province, website, about, alert email (components/ClinicProfileForm.tsx:17 to 45). No logo; no public clinic page (app/clinics/page.tsx is a placeholder) | Logo and a public clinic page are needed before the pass's "featured profile" means anything (7.7) |
| Post a job with pay range, vacancy and AI fields (Launch) | Built | components/JobForm.tsx:104 to 122; database rule 0005:103 to 117; Canadian experience refused (lib/jobs.ts:216). Steve has NOT tested posting | Steve's phone test (Gate B) |
| 5 second ad builder: paste a link, get a draft (Launch) | Partly built | Typed brief only, no link reading (lib/ad-builder.ts:37 to 43). 15 uses a day per clinic (:10). See 7.1 | Link reading, or change the pitch |
| Pay per post and monthly pass checkout (Launch) | Not built | No Stripe code (handoff.md:29) | Pricing decisions, Stripe account, build (7.7, 7.10) |
| Search with filters: role, province, city, practice type, full or part time (Launch) | Built | lib/public-jobs.ts:54 to 59: role, province, practice type, employment type, on site or field, and a text box that matches city. City is free text, not a list | Nothing for the gate |
| Job pages with Google for Jobs data (Launch) | Built | app/jobs/[id]/page.tsx:31 to 37; lib/jobs.ts `jobPostingJsonLd`; only while live | Rich Results Test on a live job (Steve); indexing (Gate C) |
| Automatic expiry: 30 days paid, 21 days seeded (Launch) | Partly built | 30 days: lib/jobs.ts:35, lib/admin-actions.ts:25, cron step 1 (app/api/cron/daily/route.ts:45). 21 days: nowhere in code, only docs/test-claim.sql | Seeding tool must set 21 days (7.4) |
| Email alerts by role and province, "also reaches waitlist candidates" (Launch) | Partly built | Alerts for candidate accounts, up to 5, daily, weekly or monthly (app/api/cron/daily/route.ts:103 onward; migration 0008, 0009). Waitlist candidates get nothing until they create an account | A "the board is open" email to the waitlist (no sender built, only a CSV: app/admin/waitlist/page.tsx:29) |
| Clinic dashboard: live posts, views, apply clicks, renew (Launch) | Partly built | Live, new applicants, in review, drafts (app/clinic/page.tsx:59 to 64); "Post again" for closed or expired jobs (:90 to 92). No views, no apply clicks, no renew before expiry. See 7.3 | Views and clicks, closing soon email (7.6) |
| Admin review queue for new clinics and flagged posts (Launch) | Built | Every post reviewed, with job and clinic flags (app/admin/review/page.tsx:60 to 81); reports (app/admin/reports); claims (app/admin/claims) | Steve has NOT tested approving a job |
| Locum board for short notice cover (Phase 2) | Partly built | "Locum" is already an employment type and a search filter (lib/jobs.ts:19). No dates, day rate or short notice view | Not needed for any gate |
| Supplier and rep roles (Phase 2) | Built | Migration 0013, `FIELD_ROLES`, field based jobs with territory (docs/clinics-and-jobs.md:61 to 67) | A price (7.7) |
| Featured listings and social boosts (Phase 2) | Not built | Nothing in code | Not needed for any gate |
| AI culture and work style match (Phase 3) | Not built | Correctly deferred. Note in section C on how it interacts with the "uses AI to screen" answer | Not needed |
| French language version (Phase 3) | Not built | English only; Quebec clinics can post English only ads today (Quebec is in the province list, lib/jobs.ts:284) | Before marketing in Quebec; lawyer on Quebec's French rules for job offers |

### A2. Pricing ladder
| Plan item | Status | Notes with evidence | What is missing |
| --- | --- | --- | --- |
| Free launch, $0 for 30 to 60 days, waitlist clinics first | Partly built | Posting is free only because nothing charges. Terms already describe a free launch period (app/terms/page.tsx:73 to 76). No start or end date, no "waitlist first" control | An invite only switch (7.9) and a free launch end date setting (7.10) |
| Introductory $39 support staff, $49 opticians, $59 optometrists per 30 day post | Not built | No prices anywhere. Role to price mapping would use `role_category` (0005:78 to 80); field roles have no tier | Decide the tier for practice managers and field roles |
| Standard $79 single post | Not built | | Stripe |
| $199 a month pass, up to 5 live posts, featured profile, renewals included | Not built | No pass, no entitlement, nothing to feature (7.7). The 10 open jobs cap (0009:22) is compatible but caps big groups | Decisions in 7.7, then Stripe |
| Annual pass $1,990 | Not built | Not in the revenue model either (7.13) | Decide whether to offer at paid launch |
| Prices before HST, HST via Stripe Tax | Not built | Terms promise tax at checkout (app/terms/page.tsx:78). HST cannot be charged until Kestrel is registered | Company, Business Number, HST registration decision (accountant) |
| Field and supplier role price | Not built | Open decision (docs/launch-checklist.md:58) | Decision (suggestion in 7.7) |

### A3. Phase 0 checklist (Foundations)
| Plan item | Status | Notes with evidence | What is missing for Gate A |
| --- | --- | --- | --- |
| Review the employment agreement with an employment lawyer | Not done (Possible) | Listed as open (docs/handoff.md:63) | Book it; bundle with the Terms and policies review to save a fee |
| Written disclosure to Eye Recommend, written acknowledgement | Not done (Possible) | docs/handoff.md:63; CLAUDE.md keeps outreach off until then | This is Gate A |
| Trademark search for "Kestrel" | Not done (Possible) | Not mentioned as done anywhere | 1 hour on the Canadian Trademarks Database |
| Incorporate, CRA Business Number | Not done (Possible) | Terms name no company (app/terms/page.tsx:26 to 29) | This is Gate A |
| Business bank account | Not done (Possible) | | This is Gate A; Stripe live needs it |
| eyecarejobs.ca registered in Steve's or the company's name | Partly built | Registered at Namecheap (CLAUDE.md "Current state"); registrant not recorded | Steve's check 3 |
| Connect eyecarejobs.ca | Built | Live on Vercel (CLAUDE.md "Current state") | |
| Google Workspace with hello@ and support@ | Partly built | Workspace in use; aliases are hello@ and privacy@, not support@ (docs/email-addresses.md:9 to 10), still to set up (docs/launch-checklist.md:26) | Set up the aliases and `EMAIL_REPLY_TO` |
| Virtual mailbox for the business address | Built (Possible) | 6013 Yonge Street, 3rd Floor, North York in every email footer and the privacy policy (app/privacy/page.tsx:33) | Steve to confirm it is a mailbox service |
| Privacy policy, linked from the waitlist form | Built | app/privacy; linked at app/page.tsx:63 to 66 | Lawyer review (launch-checklist:30) |
| Waitlist consent wording checked | Partly built | Widened to cover launch news, alerts, updates and offers (commit 2255534); no record of a lawyer check | Lawyer |
| Delete the Wix Forms test submission | Not needed | The Wix page never went live (CLAUDE.md) | |
| Decide HST timing with an accountant | Not done (Possible) | | Accountant (section D) |

### A4. Phase 1 checklist (Build)
| Plan item | Status | Notes with evidence | What is missing for Gate B |
| --- | --- | --- | --- |
| Wix Studio plan and Wix Payments | Not needed | Replaced by Vercel, Supabase and Stripe (CLAUDE.md "Stack"). The Stripe account itself is not opened (handoff.md:63) | Stripe account, test keys now, live after the bank account |
| Rebuild brand, header and skyline in Wix Studio | Not needed | Done in Next.js (app/page.tsx, public/skyline.png) | |
| Create the 4 CMS collections | Not needed | 17 tables with row level security (supabase/migrations) | |
| Members with Google sign in | Built | See A1 | |
| Clinic profile and post a job flow | Built | See A1 (no logo) | Steve's phone test |
| Ad builder with the Claude API | Partly built | 7.1 | Link reading or honest pitch |
| Pricing Plans: free launch, intro, single, pass | Not built | A2 | Stripe |
| Job search and job pages | Built | A1 | |
| JobPosting data checked with the Rich Results Test | Partly built | Data built; the test needs a live job (Steve) | Steve |
| Automatic expiry 30 and 21 days | Partly built | A1 | Seeding tool |
| Candidate alerts and clinic dashboard | Partly built | Alerts built; dashboard lacks views, clicks and renew (7.3) | 7.3 |
| Admin review queue | Built | A1 | Steve's test of Approve |
| Employer terms, candidate terms, refund policy, posting policy | Partly built | 1 combined Terms for clinics and candidates with the refund rules inside it (app/terms/page.tsx:72 to 85) and a Posting policy, both marked DRAFT (`DRAFT = true` at :14 of each) | Lawyer review, company name, remove the banner |
| Transactional emails: welcome, post live, post expiring, receipt, alert | Partly built | Alert only (and a waitlist welcome). 7.6 | 3 emails, receipts with Stripe |
| Test every flow on a phone, including a real $1 payment and refund | Partly built | Steve has tested accounts, Google, emails, clinic profile, applicants board, export, delete, admin numbers. Not tested: posting, ad builder, templates, editing a live job, candidate profile and CV, apply, tracker, alerts, approving, report, claim, the daily job (audit brief). $1 test impossible until Stripe and a bank account exist | The untested list, then the $1 test in live mode |
| Google Search Console and Google Analytics | Not built | No verification tag or analytics script in code (7.3). Search Console may be verified by DNS (Possible) | Steve's check 2; an analytics tool |

### A5. Phase 2 checklist (Seed and free launch)
| Plan item | Status | Notes with evidence | What is missing for Gate C |
| --- | --- | --- | --- |
| Seed 50+ roles from careers pages across 5+ provinces | Not built | No seeding tool (handoff.md:30); live job rules need facts careers pages lack (7.4) | The tool, the pay and "not stated" decision, then about 10 to 15 hours of Steve's time, and about 17 refreshes a week to hold 50 at 21 days each |
| "Claim your listing" emails, CASL compliant, small daily batches | Partly built | Template and tests (lib/outreach.ts, lib/outreach.test.ts), suppression list (migration 0011). Sending, the per address source record and batch approval are not built (docs/casl-outreach.md:37 to 41), deliberately off until disclosure | Disclosure, then the sender with a batch approval step |
| Claim your listing page and approval | Built | Migration 0012, app/jobs/[id]/claim, app/admin/claims; leak in 7.5. Steve has NOT tested it | Fix 7.5, then test |
| Invite waitlist clinics to post free | Partly built | Confirmed list and CSV (app/admin/waitlist); no sender, so sending from Gmail would skip the do not email list | A small "email the confirmed waitlist" admin tool that uses `sendEmail` with an unsubscribe link |
| Email waitlist candidates that the board is open | Partly built | Same as above | Same tool |
| Switch eyecarejobs.ca from coming soon to the full site | Partly built | Search, jobs and accounts are already reachable; the home page is still "launching soon" (app/page.tsx:23) | A new home page for launch day |
| Submit the sitemap, confirm job pages indexed | Partly built | app/sitemap.ts lists live jobs; robots allows them (app/robots.ts) | Steve's check 2 |
| Weekly LinkedIn and Instagram posts | Not done (Possible) | Outside the code; the blog has 3 posts to share (content/posts.ts) | Steve |
| Contact optician colleges and Waterloo Optometry career offices | Not done (Possible) | Outside the code | Steve |

### A6. Phase 3 checklist (Paid launch)
| Plan item | Status | Notes with evidence | What is missing |
| --- | --- | --- | --- |
| Turn on introductory pricing | Not built | A2 | Stripe |
| Offer the pass to the clinics posting most often | Partly built | "Posts per clinic" and "clinics that post again" exist as totals (lib/admin-stats.ts:66 to 77); no list of which clinics post most | A per clinic table on the admin page |
| Review the numbers monthly against the milestones | Partly built | Admin numbers and CSV built; no revenue, passes or milestone comparison (7.8) | Stripe data, milestone line |
| Plan Phase 2 features | Not needed yet | | |

### A7. Gates
| Gate | Status | Evidence | What is missing |
| --- | --- | --- | --- |
| Gate A: disclosure acknowledged; company and bank set up | Not met (Possible) | A3 | Lawyer, disclosure, incorporation, bank. Nothing in the code blocks this; it is all Steve's |
| Gate B: every flow tested on a phone; policies published | Not met | A4: 12 flows untested; Terms and Posting policy are DRAFT; no payments to test | Steve's test run, lawyer review, analytics; Stripe only if paid flows are in scope for the free launch (7.10 says they need not be) |
| Gate C: 50 live roles across 5+ provinces; job pages indexed | Not met | A5; the admin page cannot show "provinces with a live role" (7.8) | Seeding tool, disclosure, Search Console, the Gate C tile |

### A8. Other v7 promises
| Plan item | Status | Notes with evidence | What is missing |
| --- | --- | --- | --- |
| Seeding from clinics' own pages only, link back, 21 day expiry | Partly built | Rules in CLAUDE.md; labels and external apply built; no tool, no 21 day setting (7.4) | Tool |
| Expired post archive kept for each clinic | Partly built | Expired and closed jobs stay on the dashboard (lib/clinic.ts:59 to 64) and are in the JSON export with full text (app/account/export/route.ts:47). The clinic cannot open an expired job's text on screen (app/clinic/jobs/[id]/page.tsx:41 to 44 shows only "can't be edited here"), and deleting the account deletes the archive | A read only view of past posts; a note that Ontario employers must keep postings for 3 years |
| Skill tags, "welcomes internationally trained" tags | Not built | 7.12 | |
| Google Search Console and Analytics | Not built | 7.3 | |
| Real $1 payment and refund test | Not built | Needs Stripe live and a bank account | |
| Refund policy | Partly built | In the draft Terms (app/terms/page.tsx:81 to 82): no refund after a post goes live; refund or free repost if declined before | Lawyer; a pass cancellation and refund line is there (:80) |
| Employer and candidate terms | Partly built | 1 combined draft (app/terms/page.tsx) | Lawyer; company name |
| Trademark search | Not done (Possible) | | Steve |
| Ontario's 45 day "tell interviewed candidates" duty (v7 Compliance 5) | Partly built | The tracker, status messages and the 7 day close out (app/api/cron/daily/route.ts:50 to 70) help clinics, but nothing reminds a clinic at day 40 after an interview | A selling point worth adding to /clinics; optional reminder |

## B. Document disagreements that matter for decisions

| # | Where | What it says | What is true | Why it matters | Fix |
| --- | --- | --- | --- | --- | --- |
| 1 | v7 "Platform architecture", "CMS collections", Phase 1 checklist, budget, "Decisions for Steve" | Build in Wix Studio with Velo, Members, Pricing Plans, Wix Payments; budget line for a Wix plan | Next.js, Supabase (Canada), Vercel, Resend; Stripe planned (CLAUDE.md "Stack") | A lender or advisor reading v7 sees a different business: different costs, a different data location, and a "Platform" decision that is already made | v8 of the plan |
| 2 | v7 Compliance point 3 | "a note that data is stored with Wix outside Canada" | Main data is in Supabase's Canadian region; some processors are outside Canada (lens 4 checks the privacy policy wording) | Privacy wording must describe the real set up | v8, and lens 4's review of /privacy |
| 3 | v7 "Pricing and revenue" against docs/PLAN.md:14 to 20 | v7: 45 passes plus 540 posts = $150,120 gross, "about 70% recurring" | PLAN.md: 47 passes plus 550 posts = $155,686 gross, $150,839 after card fees (72% recurring). v7's mix is about $145,400 after the same fees | v7 misses the target once fees are counted; PLAN.md only just meets it (7.13) | Adopt PLAN.md's net basis in v8, with the section D adjustments |
| 4 | v7, inside "Pricing and revenue" | Ladder: introductory $39 to $59 first. Milestones: $3,965 a month at 6 months, which is 10 x $199 + 25 x $79 | The milestone uses standard prices from day 1 | The 6 month milestone is about 19% high if introductory prices run for those months ($3,215) | Restate milestones with the intro period |
| 5 | v7 "Where the build stands today" | Coming soon page on Wix on a temporary address; domain not connected; privacy policy not started; full platform not started | All of these are done or mostly done (A3, A4) | Out of date in a document meant for lenders and grant bodies | v8 |
| 6 | CLAUDE.md:39 ("Current state") | "the candidate and clinic homes are still placeholders" | Both are full dashboards (app/clinic/page.tsx, app/candidate/page.tsx) | Every new Claude session starts from this file | Update CLAUDE.md |
| 7 | CLAUDE.md "Next tasks" 1 to 5 | Lists clinic profile, posting, search, candidate profile, Easy Apply, email, claim, alerts, admin numbers, Google sign in, bot check, waitlist confirmation as next | All built except Stripe and careers page reading | A fresh session could rebuild or "fix" finished work | Replace with the section C build order |
| 8 | CLAUDE.md "Data model (planned)" | 5 tables: `candidates` with alert fields, `job_alerts` as a sent log, `employers.logo_url`, `owner_user_id` | 17 tables: `candidate_profiles`, `job_alerts` holds alert choices, no logo column, `owner_id`, plus `apply_method`, `work_arrangement`, `territory`, `pay_extras` | Misleads anyone writing a migration | Replace with a short list of the real tables, or point to supabase/verify.sql |
| 9 | CLAUDE.md:28 (Stack table) | "Email: Resend or Postmark (not chosen yet)" | Resend is chosen and live (CLAUDE.md "Current state"; lib/email.ts:23) | Internal contradiction in the main rule file | Update |
| 10 | CLAUDE.md Stack table | "Ad builder and careers page reading: Claude API" | Careers page reading is not built (7.1) | Reads as if the lead sales hook exists | Mark as not built |
| 11 | docs/launch-checklist.md:9 | "all migrations 0001 to 0016" | 0017 exists and the combined file says 0001 to 0017 (supabase/combined/run-everything.sql:1) | Steve follows this list literally | Change to 0017 |
| 12 | docs/automation-and-ai.md:38; docs/clinics-and-jobs.md:39 and :59; docs/casl-outreach.md:39 | "migrations 0005 to 0010"; "still to add: a bot check and a report this job link"; "not built: editing a live job"; "still to build: the claim your listing page" | All built (Turnstile, report, migration 0014, migration 0012) | Contradicts the same file a few lines later (clinics-and-jobs.md:69 to 75) | Docs only tidy up |
| 13 | lib/claim-actions.ts:143 (an email clinics receive) | "A job that is already live cannot be edited, so ... close it and post it again" | Live jobs can be edited (migration 0014) | Tells a newly claimed clinic to do something unnecessary | Change the sentence |
| 14 | Free launch length: v7 and CLAUDE.md:67 against docs/PLAN.md:11 | "30 to 60 days" against "free posts for 60 days" | Not decided in code | Clinics will be told a date | Decide one length before inviting the waitlist |
| 15 | docs/handoff.md:39 against CLAUDE.md:67 | "A clinic can have up to 10 open jobs. This is a core part of Kestrel's pitch" against "pass: up to 5 live posts" | Both can be true (7.7), but the pitch cannot lead with both numbers | Pricing page wording | Settle in the pass decision |
| 16 | v7 Phase 0 and Decisions against docs/email-addresses.md:9 to 10 | "hello@ and support@" | hello@ and privacy@ (no support@) | Small, but the Terms, privacy policy and v8 should name the same addresses | v8 |
| 17 | docs/PLAN.md:10 and CLAUDE.md launch features against v7 | "fit quiz" is a Phase 1 launch feature | Not in v7 at all; built and switched off (lib/features.ts:2) | Scope (section E) | Record it as optional in v8 |

## C. Timing and sequencing (as at 30th October 2026)

### Where things really stand
The plan puts Phase 0 (disclosure, company, bank) in November to December 2026 and the Phase 1 build in December 2026 to February 2027. The build is about 2 to 3 months ahead: most of Phase 1 and parts of Phase 2 (claim your listing, supplier roles) are done, and only payments, measurement, the link reading ad builder and the seeding tool remain. Gate A, which the plan says must come first, appears not started.

That is not a problem in itself. v7 says plainly that "Phase 1 building can still go ahead on personal time" while the disclosure is pending. It does change 3 things:
1. **The critical path is now entirely Steve's, not Claude's.** Nothing left in the code takes longer than about 2 weeks. The lawyer, the disclosure conversation, incorporation and the bank account are now what decides the launch date. The disclosure is the one step whose timing is in someone else's hands (Eye Recommend's), so it should start first.
2. **Building further ahead has falling returns.** Each extra feature built before real clinics and candidates use the site is a guess, and some (French, culture match, featured listings) are explicitly "after traction" in v7. The remaining build should be the items that unlock a gate or produce evidence, nothing else.
3. **The site is already reachable.** Because the platform is live on the real domain with open sign up (7.9), "operating before Gate A" is a live risk, not a future one. An invite only switch closes it cheaply.

### Critical path to free launch (Phase 2 start, needs Gates A and B)
| Step | Who | Depends on | Typical time | Can start |
| --- | --- | --- | --- | --- |
| Book 1 employment lawyer on a fixed fee for: employment agreement sections 7 and 9, the disclosure letter, Terms, Posting policy, Privacy policy and the outreach wording | Steve | Nothing | 1 to 3 weeks to a meeting | Now |
| Trademark search for "Kestrel" | Steve | Nothing | 1 hour | Now |
| Incorporate (federal or Ontario), Business Number, decide HST registration with an accountant | Steve, Accountant | Name search | Days | Now, in parallel with the lawyer |
| Business bank account, then open the Stripe account in the company's name (test keys work straight away) | Steve | Incorporation | 1 to 2 weeks | After incorporation |
| Disclosure to Eye Recommend and written acknowledgement | Steve | Lawyer's advice | Unknown, allow 2 to 6 weeks | After the lawyer meeting |
| Remaining "before free launch" build (list below) | Claude | Nothing (Steve's approval only) | About 5 to 7 working days | Now |
| Gate B: Steve tests the 12 untested flows on a phone; lawyer's edits go in; DRAFT banners come off | Steve, Claude | Lawyer, build | About 1 week | After both |
| Free launch: lift the invite only switch for waitlist clinics, email the confirmed waitlist | Steve | Gates A and B | 1 day | |

If the disclosure is acknowledged by mid December, a free launch in mid January 2027 is realistic, which is a month ahead of the plan. Avoid launching over the holidays: clinics are short staffed and email goes unread. If the disclosure takes longer, everything shifts right, and the right response is to wait, not to soft launch.

### Critical path to paid launch (Phase 3, needs Gate C)
| Step | Who | Depends on | Time |
| --- | --- | --- | --- |
| Seed listings with the admin tool, about 10 to 15 minutes each, until 50 are live across 5+ provinces | Steve | Disclosure, seeding tool | 10 to 15 hours, then about 17 refreshes a week to hold 50 live at 21 days each |
| Claim your listing outreach in small, approved daily batches | Steve | Disclosure, outreach sender, lawyer's view on the wording | 2 to 4 weeks |
| Search Console showing job pages indexed | Steve | Sitemap submitted | Days to weeks |
| Pricing decisions (7.7), then Stripe in live mode, $1 payment and refund test | Steve, Claude | Company bank account | 2 to 4 days of build, 1 hour of testing |
| At least 30 days of free launch data: applications per job, views, clinics that post again | Admin numbers | 7.3 and 7.8 | 30 to 60 days |
| Turn on introductory prices, with the notice the Terms promise | Steve | All of the above | |

April 2027 for paid launch still fits. Note that seeded listings are a treadmill: they expire after 21 days, so the share of live jobs that are seeded should fall steadily as clinics post and claim. Track it (7.8).

### Recommended build order for what remains, and why
| Order | Item | Why now | Effort |
| --- | --- | --- | --- |
| 1 | Invite only switch for clinic sign up and posting (7.9) | Closes the "operating before Gate A" risk | Hours |
| 2 | Return path through sign up and email confirmation; "Finish your claim" on the clinic dashboard; fix the claim approval email (7.2, 7.5) | Cheapest conversion gains; protects the plan's main free to paid route | Hours |
| 3 | Clinic emails: post live, needs a change, closes in 3 days (7.6) | Clinic experience during free launch; the renewal prompt | Hours |
| 4 | Views and apply clicks per job, a cookie free analytics tool, Search Console (7.3) | Free launch is where you collect the proof that sells paid; numbers not recorded then are lost for ever | 1 day |
| 5 | Admin numbers fixes and a Gate C tile (7.8) | Gate C cannot be read today | Hours |
| 6 | One "read this page" step, used by the seeding tool and by the ad builder's "paste your job link" (7.1, 7.4) | Unlocks Gate C and makes the lead pitch true; one piece of work serves both | 2 to 3 days |
| 7 | Waitlist invite sender that respects the do not email list | Phase 2's first step; sending from Gmail would bypass the suppression list | Hours |
| 8 | For clinics sales page (7.11) and skill and internationally trained tags (7.12) | What a waitlist clinic sees when invited; cheap differentiation | 1 day |
| 9 | Pricing decisions, then Stripe: single posts, intro tiers, pass, annual, receipts, Stripe Tax once registered, FREELAUNCH as a live coupon; public clinic page with logo for "featured" (7.7, 7.10) | Needed for paid launch, not free launch; building it after the decisions avoids rework | 3 to 5 days |
| 10 | Featured listings and social boosts (Phase 2) | Only sells once there is traffic to boost | After paid launch |
| 11 | Locum board: add dates needed, day rate and a short notice view to the existing "Locum" type | Small step from what exists; build when clinics ask | After paid launch |
| 12 | Guest apply, if the free launch funnel shows a big drop between apply page and application (7.2) | Decide on evidence | 1 to 2 days, when the data says so |
| 13 | French | Only before actively marketing to Quebec clinics, and a lawyer should first confirm what Quebec's French language rules require of job offers posted by Quebec employers; until then, consider a note on the form for Quebec posts | Days to weeks (every page, email and legal text) |
| 14 | AI culture match (Phase 3) | Needs candidate volume. Design point: if Kestrel ranks candidates for clinics with AI, a clinic using it should then answer "Yes" to "uses AI to screen", which undercuts a selling point. A candidate side "find your fit" style tool avoids that | Later |

Not on the list on purpose: more templates, more alert options, more quiz work, more blog features. They do not move a gate.

## D. Revenue model: assumptions to test

Arithmetic checked with /tmp/claude-0/-home-user-Kestrel/e69a2e4f-865a-5956-b853-61fced050f6c/scratchpad/lens-7/revenue.py (run with `python3 -I revenue.py`). Fee rates beyond 2.9% plus $0.30 are from memory and must be checked on Stripe's Canadian pricing page (Steve's check 7). Illustrations are labelled as such; they are not market evidence.

| Assumption | Plan's figure | Test or sensitivity | What it means |
| --- | --- | --- | --- |
| Market size | 5,000 to 6,000 optometrists, several thousand opticians, 5,000+ practices (v7 "Market and competition", carried over from v6) | Unsourced and undated in v7 ("should be rechecked"). The useful number is not practices but job ads a year. Steve's check 8 gives a first count in a week | Without the ads a year figure, nobody can say whether 550 single posts is 5% or 50% of the market |
| Implied penetration | 47 passes and 550 single posts a year | 47 passes is about 0.9% of 5,000 practices. If a single post clinic posts about 1.5 times a year (illustration), 550 posts is about 370 clinics, so roughly 420 paying clinics, about 8% of all practices, within 18 to 24 months | Ambitious but not absurd for a niche board; the pass number is the easy part, the single post volume is the stretch |
| Card fees | 2.9% plus $0.30 on the pre tax price (docs/PLAN.md:14) | Fees are charged on the total including HST. At 13% on every sale, fees rise from $4,849 to $5,436 and net falls to $150,250 | Small on its own |
| Subscription and tax fees | Not in the plan | If Stripe Billing is about 0.7% of subscription volume and Stripe Tax about 0.5% a transaction (to check), add about $888 and $880: net about $148,500 | Below target. Aim for net $150,000 after all payment costs, roughly 49 or 50 passes |
| Annual pass | $1,990, "roughly 2 months free", not in the revenue table | Each annual pass is $398 a year less than 12 monthly payments. 10 annual: minus $3,980; 16 (a third): minus $6,368; 24 (half): minus $9,552 | Good for cash and churn, but the table must count it |
| Introductory prices | $39, $49, $59 after the free launch | v7's 6 month milestone ($3,965 a month) uses $79 posts; at an average of $49 it is $3,215 | Restate the milestones, or set an end date for intro prices |
| Free to paid conversion | Not stated | The 6 month milestone needs 10 passes and 25 posts a month. If the free launch brings 100 clinics (illustration), that is 10% taking a pass and many of the rest posting again within months | Measure it from the first paid day: clinics that posted free, then paid within 60 days |
| Pass churn | Not stated | To hold 47 passes, monthly churn of 3%, 5%, 8% or 10% needs about 17, 28, 45 or 56 new passes a year just to stand still. Clinics on a monthly pass tend to cancel once the vacancy is filled | The biggest unmodelled risk. The annual option, included renewals and a clinic page they value are the defences |
| Seasonality | Not stated | Hiring is uneven through the year (new graduates in spring and summer, January planning). Single posts will be lumpy, passes smoother | Plan cash monthly, not as 1/12 of the year; time the paid launch before graduate season (April fits) |
| Competitor price response | Jobs4ECPs about $100 a post; risk "Medium" | Kestrel's $79 is 21% below; intro prices 41% to 61% below. A price cut by Jobs4ECPs removes the price argument, leaving traffic, the ad builder and compliance | Of those 3, only traffic is hard to copy, and it is not measured yet (7.3); the ad builder is not yet what is sold (7.1) |
| 10 open jobs cap against the 5 post pass | Cap is anti spam, pass is an entitlement | Compatible, but the cap and the single login per clinic limit the multi location groups v7 says the pass "would suit best" (7.7) | Raise the cap for pass holders or approved groups |
| HST threshold | Mandatory registration over $30,000 in 4 consecutive calendar quarters | On v7's milestones (straight line ramp to $3,965 a month at 6 months and $7,740 at 12), cumulative sales pass $30,000 in about month 10 after paid launch ($29,548 after month 9, $36,029 after month 10) | Registration will be needed in year 1 anyway. Registering at incorporation keeps prices stable (no mid year jump) and recovers HST on costs. Whether clinics can recover the HST they pay depends on their mix of exempt eye exams and zero rated eyewear: ask the accountant |
| Recurring share | "About 70%" (v7) | PLAN.md mix: 72% | Fine; but recurring only counts if churn is known |

### The 6 metrics an investor or lender will ask for, and whether the admin numbers page can produce them today
| Metric | Why they ask | Can components/AdminNumbers.tsx and lib/admin-stats*.ts show it today? |
| --- | --- | --- |
| 1. Revenue and monthly recurring revenue, with paying clinics and average revenue per clinic | Is there a business | No: "Not on yet" (components/AdminNumbers.tsx:47, :77). Needs Stripe |
| 2. Retention: pass churn, renewal rate, clinics that post again | Will revenue stick | Partly: "clinics that post again" as an all time percentage (lib/admin-stats.ts:71, :74). No churn or renewal until Stripe |
| 3. Marketplace liquidity: share of jobs with at least 1 (or 3) applications in 14 days, median applications per job | Does the board work for the clinic | Partly, and misleading: lifetime applications over current live jobs (7.8). External apply jobs show 0 because clicks are not recorded |
| 4. Candidate audience: monthly visitors, share from Google for Jobs, alert subscribers, candidate accounts | The plan's top risk | Mostly no: candidate accounts only. No traffic (7.3); alert subscribers not counted (lib/admin-stats-data.ts:35 to 45 reads no alerts) |
| 5. Supply: live roles, provinces covered, found versus clinic posted, active clinics | Gate C, and whether supply is real | Partly: live jobs and the top 4 provinces (lib/admin-stats-data.ts:86); no found versus posted split; live count can include jobs past their date until the daily job runs (:49) |
| 6. Acquisition: free to paid conversion, found listing to claimed to paid, cost to win a clinic | Can growth be bought | Partly: share of clinics claimed (:103) and the clinic funnel (:87 to 93). No conversion until Stripe; no record of marketing spend |

Bottom line: the page can show activity, not yet economics or audience. With 7.3, 7.8 and Stripe, all 6 become available from the first paid month.

## E. Built beyond what v7 asked for at launch, and whether each earns its keep

Pattern: the build has gone deep on the candidate and applicant workflow and on compliance polish, and light on the money and proof mechanics (link reading ad builder, views and clicks, seeding, pricing, renewal emails, the sales page). The extras are mostly well made; the issue is order, not quality.

| Feature | In v7? | Size (rough) | Earns its keep? |
| --- | --- | --- | --- |
| Easy Apply through Kestrel: candidate profile with CV storage, cover letters, application tracker, applicant board with statuses, notes, kind closing messages, 14 day unopened reminders, automatic close out (migration 0006, lib/candidate*, lib/applicant-actions.ts, lib/applications.ts, about 1,650 lines of the 9,200) | No. v7 implies apply on the clinic's page or by email, and promises only "apply clicks" | The largest single area | **Yes, with a caveat.** It is the real moat: clinic emails stay private, recruiters cannot harvest them, every application is counted, and the close out helps clinics with Ontario's 45 day follow up duty. The cost is the account wall (7.2), CV storage duties (scanning, breach exposure, lens 1 and 4) and support load. Keep, fix the funnel, and sell it on /clinics |
| Job templates, cover letter drafts and saved letters (migration 0015) | No | About 220 lines plus pages | **Marginal.** Templates help repeat posters, which supports the pass. Letter drafts are a nicety. Keep, do not extend |
| Find your fit quiz (lib/quiz.ts, switched off) | No (PLAN.md and CLAUDE.md only) | About 290 lines | **Not yet.** Harmless while off. Worth switching on only as shareable social and blog content once there is traffic |
| Blog with 3 posts (content/posts.ts) | No, though v7 relies on search traffic | About 335 lines | **Yes.** Cheap, supports Google traffic, and the posts sell the compliance story. Add posts rather than features |
| Field based and supplier roles (migration 0013) | Phase 2 | Small | **Probably.** v7 calls suppliers a "new paying segment", but it has no price and no landing page, so it earns nothing yet. Price it with Stripe (7.7) |
| Claim your listing (migration 0012) | Phase 2, the main free to paid route | About 680 lines | **Yes, but built before the seeding tool that feeds it**, so it is idle until 7.4 |
| Admin numbers with investor snapshot and CSV (lib/admin-stats.ts, lib/admin-stats-data.ts) | Phase 3 "review the numbers monthly" | Small | **Yes.** Fix 7.8 |
| Waitlist double opt in (migration 0014) | No (express consent was already held) | Small | **Yes.** Cleaner list and better email delivery; costs a few unconfirmed sign ups |
| Editing a live job, Post again | Partly (dashboard "renew") | Small | **Yes.** Supports renewals |
| Do not email list, signed unsubscribes (migration 0011) | Implied by CASL | Small | **Yes.** Required before any outreach |
| Report this job, data export, delete account, account settings, Turnstile | Implied (flagged posts, PIPEDA, spam) | Small | **Yes** |
| Alert frequency choices (daily, weekly, monthly) | No | Small | **Fine.** Keeps alert emails welcome |

What would cut cost or risk without losing value: nothing needs removing. The one deliberate trim is to stop adding candidate side features until the free launch shows how candidates behave.

## Good things worth keeping
- The posting rules live in the database, not only in the form: a job cannot leave draft without a pay range inside the $50,000 rule and both Yes or No answers (supabase/migrations/0005_clinics_and_jobs.sql:103 to 117). This is the plan's "compliance made automatic" promise, done properly.
- Every post is read by a person before it goes live, with automatic flags for Canadian experience, age and other human rights wording, agency wording, links and contact details (lib/jobs.ts:213 to 227, :245). Stronger than v7, which only asked for review of new clinics and flagged posts.
- Expired jobs vanish from search, the job page and the structured data the moment their date passes, not only when the daily job runs (lib/public-jobs.ts:53, :90; app/jobs/[id]/page.tsx:31 to 32).
- Seeded listing labels, "no logo until claimed", the claim flow and the CASL outreach template all match the plan's wording (app/jobs/[id]/page.tsx:50 to 52; lib/outreach.ts:26 to 42), and outreach is genuinely disconnected (lib/outreach.ts:9 to 10).
- A clinic's full job history, including expired posts with their text, pay and the 2 answers, is in "Download my information" (app/account/export/route.ts:47), which is most of the plan's "expired post archive".
- Templates never keep the vacancy and AI answers, so clinics answer them fresh each time (docs/templates-quiz-numbers.md:7).
- An investor snapshot and CSV export exist before there is anything to report (components/AdminNumbers.tsx:74 to 83). Good habit; see 7.8 for the fixes.

## Steve's checks
1. Admin, Overview on the live site: how many clinic accounts, clinic profiles and live jobs exist today. If any are real clinics you did not invite, tell Claude before anything else (7.9).
2. Google Search Console (search.google.com/search-console): is there a property for eyecarejobs.ca, is the sitemap (https://eyecarejobs.ca/sitemap.xml) submitted, and how many pages show as indexed. If there is no property, add a Domain property and verify it with the TXT record in Namecheap, Advanced DNS (7.3, Gate C).
3. Namecheap, Domain List, eyecarejobs.ca, Contacts: whose name is the registrant (v7 Phase 0 item). It should become the company's after incorporation.
4. On your phone, signed out: open /jobs, pick a job with "Apply with Kestrel", press Create a free account, sign up, confirm the email. Where do you land? Expected today: your dashboard, not the job (7.2).
5. With the clinic test account: open Post a job and look at the ad builder. Confirm it asks for a few typed lines, not a link, and make sure no email, flyer or page you have drafted promises "paste your job link" yet (7.1).
6. Write down, for the coordinator, where each Gate A item stands: employment lawyer booked, disclosure given, written acknowledgement received, company incorporated, Business Number, business bank account, Stripe account opened, trademark search done. (Searching the Canadian Trademarks Database is free; the agent or lawyer can confirm which classes to search, typically the advertising and recruitment class and the online platform class.)
7. Stripe's Canadian pricing page: note the current card fee, the Billing (subscriptions) fee and the Stripe Tax fee, so the revenue model in section D can use real numbers (7.13).
8. For 1 week, note by hand how many eye care jobs are advertised in Canada (the live count on Jobs4ECPs and the result counts on Indeed for "optician", "optometrist" and "optometric assistant", reading the numbers only, no copying). This is the market size check in section D.

## Not audited, and why
- Anything outside the code: whether the disclosure, lawyer review, incorporation, bank, Stripe account, trademark search or Search Console exist. This session cannot reach them; they are on Steve's list.
- Market size, competitor prices and grant programmes: no outside sources were contacted (hard rule 3), so the figures in section D are the plan's own, tested for internal consistency, plus clearly marked illustrations.
- Legal questions (pay range on found listings, Quebec French rules, HST recovery for clinics) are flagged for a lawyer or accountant, not answered. Lens 4 covers privacy and legal in depth; lens 8 covers running costs.
- Signed in pages were reviewed from code, not clicked, because the rig has no real sign in.
