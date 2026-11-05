# Steve's next steps

Updated 5th November 2026. Claude does the code. These are the things only Steve can do, in priority order. Dates are estimates, not promises, and anything with a lawyer or the bank depends on their timetable. The reference sections further down (sign in steps, Gate A, market counts) hold the detail behind each item.

## Priority order

Updated with Steve's notes of 5th November 2026 (second pass).

### Priority 1: this week, blocks launch or has a date

| # | What | Status |
| --- | --- | --- |
| 1 | **Lawyer.** The review pack and the employment agreement are with the lawyer. The backup person, the privacy policy wording (Privacy Officer title only) and help with incorporating all sit with the lawyer too. | Waiting for a response. |
| 2 | **Name searches.** Only a "Kestrel Ophthalmics" in the UK turned up, which does not operate in Canada. Trademarking is dropped for now. | DONE. |
| 3 | **The 2 scheduled blog posts (13th and 27th November).** Steve has not posted an ad, so he cannot supply the "real moment" notes. Claude writes them from public sources and plain, factual advice, with no invented stories, and drafts more simple posts for SEO in the meantime. Steve reads the previews. | Claude to do. |
| 4 | **Accounts and 2 step sign in.** GitHub, Namecheap and Supabase are on kestrel@ and 2 step sign in is on. Vercel is on kestrel@ too, but it is a trial, so ownership cannot move until Vercel Pro starts (about 2 weeks). The repo moves into the Kestrel organisation then. | DONE, except Vercel (about 2 weeks). |
| 5 | **Allowed hosts.** Steve added `download.geonames.org`, `open.canada.ca`, `jobbank.gc.ca`, `jobs4ecps.ca` and `jobs-optometry.com`. Tested from Claude's session on 5th November: GeoNames and open.canada.ca work, but `jobbank.gc.ca` only redirects to `www.jobbank.gc.ca`, which does not resolve, and open.canada.ca hands its data files to `opencanada.blob.core.windows.net`, which is refused. An allowed domain does not cover its subdomains, so add `www.jobbank.gc.ca` and `opencanada.blob.core.windows.net` (a new session may be needed to pick them up). The two job boards stay hand reading only (no scraping). | Needs 2 more hosts. |

### Priority 2: the next 2 weeks

| # | What | Status |
| --- | --- | --- |
| 6 | **City and radius search decisions.** Radius 10, 25 and 50 km. Remote and field roles always show. Towns of about 1,000 people or more. Fixed term end date note: Claude's default is no, because it makes posting longer. Steve can change this. | DECIDED. |
| 7 | **Eye Recommend member clinics.** No hold. Treated like any other clinic once outreach is allowed. Outreach stays off until the disclosure conversation. | DECIDED. |
| 8 | **First region.** Ontario, Alberta and British Columbia (the most populated), starting with Toronto and Ontario. A rough count of candidates by province is optional. | DECIDED. |
| 9 | **The demo site.** Running fine. | DONE. |
| 10 | **Tidy ups.** privacy@ sends and receives. The ad builder works on the demo (draft, in review, approved, live). It cannot be tested on the live site while the live site is locked down. The lawyer's name goes in `docs/breach-plan.md` when known. | Mostly done. |
| 11 | **Market counts.** Steve keeps his own 12 week artifact. He reports week 1 after Saturday's run, with an annual estimate, then the month 1 total with an annual estimate, then the quarter total with an annual estimate. | Starts after Saturday. |

### Priority 3: Gate A, in order (needs the lawyer)

Steve confirmed on 5th November that Gate A is not passed. Steps 4, 5 and 6 (meeting held, disclosure given and acknowledged, company incorporated) are not done. An earlier mix up between 2 versions of this file made them look done. Clinic outreach and publishing found listings stay off. Free launch waits for Gate A. Steve wants to be ready for launch, so launch materials (the flyer) are prepared as drafts and kept unpublished.

### Parked: no date, nothing waits on these

- DONE: pull request 18 (the agency notes and this file) is merged.
- Profession list: widen it. Steve's correction: Contact Lens Fitter is not really a profession in Canada, and COA is rarely recruited for. Add Vision Therapist, and consider optical lab technician. Filters should show only roles that have live jobs, with a friendly "still building, tell a clinic you know" page when a search is empty. See `docs/business-setup-notes.md`.
- Zest: closed. Steve is launching solo.
- The agency idea stays a long term option, in `docs/agency-pathway.md`.
- Fathom: dropped.
- Benched idea: Kestrel as a parent company with Eye Care Jobs as the first of several industry job boards. Raise when incorporating (see `docs/business-setup-notes.md`).

## Claude's list, in priority order

1. DONE and merged: the 2 rewritten posts, the 14 weekly posts (20th November 2026 to 2nd April 2027) and a post on hiring seasonal workers (9th April 2027). Add Job Bank figures to the optometric assistant post once they can be checked.
2. DONE: review of the published posts (end of `docs/blog.md`).
3. DONE and merged (pull request 33, 6th November): city and radius search (10, 25 and 50 km, field based jobs always show), filters that only offer roles and provinces with live jobs and show counts, friendlier empty states, and the Vision therapist role. Steve runs `run-everything.sql` on both databases for the Vision therapist rule (migration 0027).
4. Pay benchmark: official Job Bank wages data from open.canada.ca first (needs `opencanada.blob.core.windows.net` allowed), a labelled AI starting range per province where data is missing, and Kestrel's own posted pay as ads arrive. Separate from the automation plan.
5. First region plan: Toronto and Ontario first, then Alberta and British Columbia.
6. DONE: automation plan phases, in `docs/automation-plan.md`.
7. DONE and merged (5th November): audit items R22, R25 and R45. Steve has run `supabase/migrations/0024_sign_in_attempts.sql` on both databases, so the sign in guard is working.
8. LinkedIn counts: not automatic. The project rules and LinkedIn's terms forbid automated reading. Steve reads a number off a search page and types it in.
9. Found listings tool (`/admin/found`): built, with the careers page finder, the reader, a province search that saves clinics as leads (migrations 0023 and 0025, run on both databases) and a Setup check box with test buttons. Tested on the live site with a Nova Scotia search. Steve keeps trying real clinics and tells Claude what the reader gets wrong. Publishing stays off (`ENABLE_SEEDING`). See `docs/found-listings.md`, which ends with the decisions made and the open items.
10. DONE and merged (pull request 29, 6th November): admin posts a job for a clinic (Admin, Overview, Post for a clinic). Migration 0026 is in `run-everything.sql`. Steve tries it on the demo.
11. DONE in another chat (Steve, 5th November): ad builder improvements.
12. Empty state and "know a clinic?" landing page for searches with no jobs yet.
13. DONE and merged: new automatic reply for hello@ (`docs/email-templates/auto-reply.html` and `.txt`, branch `email/auto-reply`). Steve tests it. The old `email-auto-reply` branch can then be deleted.
14. Launch flyer: the first HTML draft was rejected. Outward facing designs are made in Canva (4 options generated on 5th November, Steve picks one and Claude adjusts it). Kept unpublished until Gate A is passed.
15. Plan with Steve, when he is ready: PWA (installable web app), the pathways roadmap, the figures check, a competitor and hiring review by hand, and trends content.
16. A shared mailbox for `ADMIN_BACKUP_EMAIL` (Steve sets up a Google group) and a labels plan for his email categories.
17. Found listings, for Steve: add to the lawyer pack (the database of clinics' published business emails, an outreach email for clinics found through a job board, and whether Steve's ad writing templates, written at work, may be used in Kestrel). Decide whether to add a separate headline field to jobs (the job title stays plain for Google's job results). Claude rebuilds the lawyer pack when he says.

### Anthropic key, quick walk through (for the ad builder and the found listings tool)

1. Sign in at console.anthropic.com with kestrel@eyecarejobs.ca and open API keys.
2. Create a key named `kestrel-website` (live) and a second named `kestrel-demo` for the demo project. Copy each once.
3. Set a monthly spend limit on the account so a mistake cannot run up a bill. Make each key inside the Kestrel workspace (a key made outside a workspace is refused with "not scoped to a workspace"), or set `ANTHROPIC_WORKSPACE_ID` in Vercel.
4. Switch on web search for the account in the console's settings (the province search needs it).
5. In Vercel, each project, Settings, Environment Variables: add `ANTHROPIC_API_KEY` (Production and Preview), mark it Sensitive, then redeploy.
6. Open Admin, Overview, Found listings, then the Setup check box, and press Test Claude (and Test web search). It says whether the key works on that site. Then try Write my ad on the demo.
The key is listed in `docs/security.md` with how to rotate it.

## Extra questions raised on 5th November (status)

1. RelateSEO (Namecheap add on, about $9.88 on promotion and about $28.88 standard, 4 week trial) is separate from the LLC partner. Not needed before launch. See `docs/business-setup-notes.md`.
2. Supabase upgrade: hold until launch, but before any invitations. Export the waitlist now and then.
3. Admin posting for a clinic: build it.
4. Ad builder: Steve sends 2 templates and rules. Walk through of the key above.
5. Fee breakdown and launch flyer: done as a draft (`docs/marketing/launch-flyer.html`). Savings shown use Kestrel's own prices only. A comparison with named platforms needs dated, written quotes first.
6. Incorporating: with the lawyer. Ontario is the simpler default for a bootstrapped board run from Ontario, the lawyer decides. See `docs/business-setup-notes.md`.
7. Funding: grants, a loan program and a small friends and family round, with the cautions, are in `docs/business-setup-notes.md`. The accountant and a securities lawyer decide.
8. LinkedIn company page and an SEO plan: in `docs/business-setup-notes.md`.
9. Parent company with subsidiaries: start with one corporation, add brands as operating names, no "Recruitment" in the name. See the notes.
10. App wrapping: a PWA first, native apps after launch numbers. See the notes.
11. Is the automation plan plausible: yes for most of it, with a few hours a week of Steve's time. See the notes.

## Planning items (decided direction, not started)

### Pass tiers and competitor pricing (added 5th November 2026, DECIDED: Clinic pass $199 and Clinic pass Plus $349)

Steve's idea: the $199 pass for 5 posts gives a 60% discount if all 5 are optometrist roles, so consider a premium pass for optometrist (associate) posts at about $349 to $350. Jobs4ECPs charges $100 a post for every role and has no pass option on its products page. Jobs-optometry reportedly lets only OSI members post (not checked). Full numbers, options and the founding offer risk are in `docs/business-setup-notes.md`, section 11. Steve chose the two named tiers. Built on a branch for preview: `lib/pricing.ts`, the /clinics page, the outreach emails and the flyer draft. Steve confirms 2 defaults: Plus at $349 with no yearly option, and founding clinics keeping the price of whichever pass they take. Still to do: say which roles each pass covers in the Terms (ask the lawyer) and recalculate the credit pack example in the notes, which still uses the old $79 standard price. Stripe is not built, so nothing is charged yet.

### Chicken or egg: which side first

Working view: start with jobs. A few current, clean roles bring candidates. A long candidate list with nothing to apply for loses them. Sources, in order: seeded listings from clinics' own careers pages (labelled, linked back, 21 days; the admin tool is not built and waits for Gate A to be closer), free launch posts, then claim your listing. Candidates come from the waitlist, search content (the pathways guide and the blog) and job alerts. Concentrate the first 50 roles on 2 or 3 provinces and 1 or 2 role types, so the board looks full where people look. Clinic outreach, including Eye Recommend member clinics, stays off until the disclosure conversation, and nothing is scraped.

### Automation plan (added 3rd November 2026)

Goal: automate the board as far as is safe. Build it in house on Resend, Supabase and Vercel, not with Apollo, Instantly or HighLevel. Implied consent under CASL depends on each address being published on the clinic's own page, and third party contact databases cannot show that. Outreach stays off until the disclosure conversation. Green light from Eye Recommend is separate from CASL, and the lawyer's review still applies.

1. Find and write ads: Claude reads a clinic's own careers page and drafts the listing, and a person approves it. Labelled, linked back, 21 days. BUILT at `/admin/found` (`docs/found-listings.md`, migration 0023, run on both databases). Publishing is off until `ENABLE_SEEDING` is set after the disclosure conversation. The ad builder's "paste your job link" box is not built.
2. Email clinics to claim: wording, unsubscribe and do not email list are built. To build: the record of where each address was found (page and date), a send queue, 1 email plus 1 follow up at most, a slow warm up of the mail subdomain.
3. Candidates: no cold email to individuals. Reach them through alerts (built), the waitlist, the pathways guide and blog, paid ads, and clinics inviting their own applicants.
4. Reminders: expiry, closing soon and unopened applications are built. To build: repost and renewal nudges once Stripe is on.

Rollout: semi automatic first (Claude drafts and queues, Steve approves in batches), then hands off once the error rate is low.

## Reference

### 1.1 Two step sign in, and moving accounts to kestrel@eyecarejobs.ca

Do one service at a time. For each, in this order, so you can never lock yourself out:

1. Sign in with the old login. Add kestrel@eyecarejobs.ca as a second owner or admin (or change the sign in email where the service only allows one).
2. Open the service as kestrel@. Turn on two step sign in with an authenticator app. Save the backup codes offline.
3. Check you can do everything you need as kestrel@. Only then remove the old login.
4. Set the recovery email or phone to something that is not @eyecarejobs.ca (if the Kestrel domain email ever breaks, you still need a way in).

| Service | Notes |
| --- | --- |
| GitHub | The repo lives in your personal account. It moves into the Kestrel organisation when you upgrade Vercel. Turn on Dependabot alerts. |
| Vercel | Move to Pro before launch (Hobby is non commercial and keeps logs for about 1 hour). Needs the repo in the organisation. |
| Supabase | The project is under the Gmail account. Add kestrel@ as owner. Upgrade to Pro before inviting anyone. |
| Namecheap | Turn on Auto Renew and Domain Lock. The registrant should become the company after incorporation. |
| Google Workspace and Google Cloud | Two step sign in for every user and for the Google Cloud project that holds the sign in credentials. |
| Resend, Anthropic, Cloudflare, UptimeRobot | Same method. Stripe later. |

### 1.2 Search Console and the sitemap (done 31st October 2026)

Domain verified (the TXT record in Namecheap is what keeps it verified, so never delete it), the sitemap was submitted and Google found 11 pages. Google sign in branding (name, logo, privacy and terms links) is also verified in Google Cloud, and a Google Cloud budget alert is the one thing to keep in place since the account was upgraded.

What is still worth doing here:

1. Open URL Inspection, paste your home page and each new blog post as you publish it, and press Request indexing.
2. Check back weekly: Performance shows impressions, clicks and the searches people used. Note the numbers once a month in a simple sheet. They are the evidence for the conversation at work.
3. Optional: Bing Webmaster Tools can import everything from Search Console in one click.

### 1.3 Blog routine (every 2 to 3 weeks)

Claude writes and publishes posts from `content/posts.ts` (see `docs/blog.md`). Each post now has its own share preview, so links look right on LinkedIn and WhatsApp. For search, each post should answer one real question a clinic or candidate would type into Google, link to 1 or 2 of your other posts and to /jobs or /clinics, and carry a unique title and description. Consistency matters more than volume.

### 1.4 Small tidy ups

- Test privacy@ again (the alias is now set up). Also create `support@` (done). `abuse@` and `postmaster@` are reserved by Google, so skip them.
- Fill in `docs/breach-plan.md`: the lawyer's name after the first meeting. The backup person stays out of the repository (see the backup person section).
- Ad builder: try it on the live site and tell Claude if a draft fails or is cut off (it now uses Sonnet 5.5).

### 1.5 The demo site

A separate, working copy of the site with sample data, to show people around before launch. Full steps in `docs/demo-site.md` (about 45 minutes once). It needs the pull request that adds demo mode merged first.

### The backup person and names

- A backup person can be your wife. Their job is to be able to help if you cannot be reached for a day: emergency access to your password manager, or a sealed copy of your recovery codes. They do not need admin rights on anything.
- **Keep the name out of the repository and the public site.** The breach plan now says only that the backup is held offline. Write the name in your password manager notes.
- **The privacy policy is public.** It should publish the privacy officer's title and an email address (for example "Steve Smith, Founder and Privacy Officer, privacy@eyecarejobs.ca" or just the title and email). It should not mention a backup person at all. Whether your name or only the title should appear is one of the questions in the lawyer pack (question 28).
- `ADMIN_BACKUP_EMAIL` (optional) sends every admin alert to a second address. Admin alerts name job titles and clinics. Only use a personal inbox for that if you are comfortable with it. A shared mailbox in Google Workspace, such as a Google group, is cleaner.

### Gate A, in order

Gate A means: the disclosure is given and acknowledged, the company and bank exist. Free launch waits for it. Steps overlap where noted.

| # | Step | Who | Depends on | Rough time |
| --- | --- | --- | --- | --- |
| 1 | DONE (4th November): read through `docs/legal/Kestrel-lawyer-review-pack.pdf`, correct anything wrong, and find your employment agreement. The pack states plainly that your employer offers a job board to the same clinics Kestrel targets | You | Nothing | 1 hour |
| 2 | DONE: free name searches. Only a "Kestrel Ophthalmics" in the UK turned up. A formal NUANS name report is done by the lawyer or an incorporator, and has a fee | You | Nothing | 1 to 2 hours |
| 3 | DONE (4th November): book the fixed fee lawyer meeting and send the pack beforehand. Paperwork is with the lawyer | You | 1 | Book this week |
| 4 | Meeting 1: employment agreement (sections 7 and 9), what the disclosure should say, how to handle the overlap with your employer's job board, incorporation and ownership of the brand and code. Ask the lawyer to draft or review the disclosure letter | You, lawyer | 3 | 2 hours plus follow up |
| 5 | Give the disclosure to your employer and get the acknowledgement in writing. Clinic outreach stays off until this is done | You | 4 | Aim for mid December |
| 6 | Incorporate, with the name from the formal search. The lawyer can do this in the same engagement | You, lawyer | 2, 4 | 1 to 2 weeks |
| 7 | Business Number, and the HST decision with your accountant (register at incorporation is simplest) | You, accountant | 6 | 1 week |
| 8 | Business bank account in the company's name | You | 6 | 1 to 2 weeks |
| 9 | Stripe account (needs the company and the bank). Note Stripe's current Canadian fees for cards, Billing and Tax from its pricing page | You | 8 | A few days |
| 10 | Assign the domain, logo, code and accounts to the company (the lawyer prepares the paperwork) | You, lawyer | 6 | With step 6 or soon after |
| 11 | Lawyer reviews the Terms, Posting policy and Privacy policy using the company name. Claude then updates them and removes the DRAFT banners (Gate B) | Lawyer, Claude | 6 | 1 to 2 weeks |
| 12 | Upgrade the services: Supabase Pro, Resend Pro, Vercel Pro (and move the repo into the Kestrel organisation), then raise the Supabase email and sign in limits | You, Claude | 6 | 1 day |
| 13 | Separate Supabase project for previews | You, Claude | Before anyone but you uses the site | 1 hour |
| 14 | Set `CLINIC_INVITE_CODE` for invited clinics. At free launch, set `CLINIC_SIGNUP` to `yes` | You | 5, 11 | Minutes |

**If the disclosure takes longer, wait. Do not soft launch.** A mid January free launch is realistic only if step 5 happens by mid December.

### Market counts (check 19)

Steve keeps a 12 week artifact. He reports week 1 after Saturday's run with an annual estimate, then the month 1 total with an annual estimate, then the quarter total with an annual estimate. `docs/market-count-sheet.xlsx` is the older version and can be ignored.

The project rules forbid scraping or automated reading of Indeed, LinkedIn, Jobs4ECPs and the college registers, and the sites' own terms forbid it too. A person reading a number off a search page and writing it down is fine. Counts only. Do not copy any ads.

On accuracy: these counts are a cross check on the top down estimate in `docs/market-sizing.md`, not an exact figure. Job sites repeat ads and count some roles twice, so the number to trust is the trend and the range, not any single week. Keep the same searches, the same day and the same method every week, write a note when something looks odd, and the annual estimate will settle as the weeks add up.

### What Claude does next (when you say so)

Phase 2 and 3 in `NEXT-STEPS-PHASES.md`, one item at a time, only on the items you choose. The likely order, because it unlocks the gates: retention and download completeness (after the lawyer), accessibility pass, the review queue measurement (job views and apply clicks), then the "read this page" step that serves the ad builder and the seeding tool. Holding back until Gate A is closer: publishing found listings, Stripe, and anything that contacts clinics. Ideas such as ad style templates are on the list for after launch.
