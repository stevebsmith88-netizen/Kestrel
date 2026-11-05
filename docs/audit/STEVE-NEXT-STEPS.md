# Steve's next steps

Updated 5th November 2026. Claude does the code. These are the things only Steve can do, in priority order. Dates are estimates, not promises, and anything with a lawyer or the bank depends on their timetable. The reference sections further down (sign in steps, Gate A, market counts) hold the detail behind each item.

## Priority order

### Priority 1: this week, blocks launch or has a date

| # | What | Status |
| --- | --- | --- |
| 1 | **Lawyer.** The lawyer review pack and the employment agreement are with the lawyer. Next: the first meeting, then anything they send back (also anything back from the paralegal friend). | Paperwork sent (4th November). Waiting on the meeting. |
| 2 | **Free name and trademark searches** (CIPO, Ontario and federal corporation name searches, a web search for "Kestrel" in eye care and job boards). Send Claude anything found, for example another "Kestrel" in eye care. | In progress (4th November). |
| 3 | **Notes for the 13th November blog post, by about the 8th.** A real anonymised moment, 1 or 2 specifics (a number, a type of town, a role that led somewhere), what a good ad tells you that a weak one hides, and one thing you would tell a new grad or assistant. Rough bullets are fine. Names stay out. | Open. Due in 3 days. |
| 4 | **Two step sign in, and moving accounts to kestrel@eyecarejobs.ca.** One service at a time, steps in section 1.1. | Starting 4th November. |
| 5 | **Allow 3 hosts in the cloud environment, or download the files yourself.** Cloud environment menu in the title bar, Edit, Network access, Allowed domains (leave Allow package managers ticked): `jobbank.gc.ca`, `open.canada.ca`, `download.geonames.org`. Steps: https://code.claude.com/docs/en/cloud-environments#network-access. Or download the Job Bank wage file and the GeoNames Canada places file and tell Claude where they are. This unlocks the city and radius search and the pay benchmark. | Open. |

### Priority 2: the next 2 weeks

| # | What | Status |
| --- | --- | --- |
| 6 | **Decisions for the city and radius search.** Radius options decided: 10, 25 and 50 km (50 km is the largest). Still open: do remote and field roles always show, how small a town the list includes (suggest about 1,000 people), and do Fixed term roles get a short optional end date note. | Partly decided. |
| 7 | **Decision: hold Eye Recommend member clinics out of automated outreach at first, or not.** Outreach itself stays off until the disclosure conversation. | Open. |
| 8 | **Name 2 or 3 provinces you know best and believe have the most hiring pressure.** The waitlist has candidates only so far (the clinic side has not been pushed out), so there is no clinic split to check. A rough count of candidates with their provinces and roles would help too, but skip it if it is a hassle. | Open. |
| 9 | **Check on the demo:** the Account page email options, the applicants page reply line and tick boxes, the quieter Delete my account link. | Open. |
| 10 | **Small tidy ups** (section 1.4): test privacy@, ad builder on the live site, the lawyer's name in `docs/breach-plan.md` after the meeting. | Open. |
| 11 | **Weekly market counts** in `docs/market-count-sheet.xlsx`. One week of data so far. Hiring trends become clear after about 12 weeks. | Ongoing. |

### Priority 3: Gate A, in order (needs the lawyer)

Steps 3 onwards in the Gate A table below: the disclosure, incorporation, bank, Stripe, assigning the brand to the company, the legal policy review, and upgrading the services. Free launch waits for it.

### Parked: no date, nothing waits on these

- Read `docs/agency-pathway.md` (on the `docs/agency-pathway` branch, not yet merged) and correct anything that is wrong. It records your answers and the questions for the lawyer about the long term agency option.
- Choose a phase for widening the profession list (decided yes, not scheduled).
- Zest, the agency idea and the Fathom trial. All wait for the disclosure and for your time. If Zest is revived, it goes through the disclosure conversation and the lawyer first.

## Claude's list, in priority order

1. Rewrite the 2 scheduled blog posts once Steve's notes arrive (item 3).
2. DONE (5th November): read the published blog posts for generic advice and list what only Steve can supply. See the review at the end of `docs/blog.md`.
3. City and radius search, with counts beside each option (radius 10, 25 and 50 km). SQL on both databases. Needs the places data (item 5) and the decisions in item 6.
4. Pay benchmark for clinics: Job Bank wage data first, Kestrel's own posted pay later. Check the licence and attribution, and add the benchmark question to the lawyer pack. Needs item 5.
5. Chicken or egg plan: propose the first region, the role mix and the seeding order, once Steve names the provinces (item 8).
6. DONE (5th November): automation plan turned into phases with sizes and gates, in `docs/automation-plan.md`, to discuss. It ends with 4 decisions for Steve.
7. Audit items R25, R22 and R45. Decide what to do with the old `email-auto-reply` branch.
8. Add LinkedIn as count rows to the market count sheet if Steve wants it, and move any numbers he has already typed into the new layout.
9. To plan with Steve, when he is ready: widen the profession list (what it touches, which phase); the pathways roadmap (check each step against the regulators' own pages, then decide between a blog post and a guide page); the figures check (confirm the market figures against primary sources and settle whether the VisionWatch data is from 2015 or 2019); a competitor and hiring review by hand from public pages, with no scraping; trends content (myopia, AMD, technology) that needs Steve's specifics.

## Planning items (decided direction, not started)

### Chicken or egg: which side first

Working view: start with jobs. A few current, clean roles bring candidates. A long candidate list with nothing to apply for loses them. Sources, in order: seeded listings from clinics' own careers pages (labelled, linked back, 21 days; the admin tool is not built and waits for Gate A to be closer), free launch posts, then claim your listing. Candidates come from the waitlist, search content (the pathways guide and the blog) and job alerts. Concentrate the first 50 roles on 2 or 3 provinces and 1 or 2 role types, so the board looks full where people look. Clinic outreach, including Eye Recommend member clinics, stays off until the disclosure conversation, and nothing is scraped.

### Automation plan (added 3rd November 2026)

Goal: automate the board as far as is safe. Build it in house on Resend, Supabase and Vercel, not with Apollo, Instantly or HighLevel. Implied consent under CASL depends on each address being published on the clinic's own page, and third party contact databases cannot show that. Outreach stays off until the disclosure conversation. Green light from Eye Recommend is separate from CASL, and the lawyer's review still applies.

1. Find and write ads: Claude reads a clinic's own careers page and drafts the listing, and a person approves it. Labelled, linked back, 21 days. Not built (admin tool 22a and the "read this page" step).
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
| 2 | IN PROGRESS: do the free first searches: CIPO trademark database, Ontario and federal corporation name searches, and a web search for "Kestrel" in eye care and job boards. A formal NUANS name report is done by the lawyer or an incorporator, and has a fee | You | Nothing | 1 to 2 hours |
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

#### Does the company need to be trademarked?

No. These are two different things:
- **A company** is incorporated, which registers its legal name. That does not by itself stop someone else using a similar name in the same field or in another province.
- **A trademark** protects a brand (a name, a logo) as a mark used in trade. It is optional. It is worth considering for "Kestrel" and your feather logo, but "Kestrel" is a common word, and "Eye Care Jobs" is descriptive, so the protectable part may be narrower than it looks.

A practical order: do the free searches now, let the lawyer advise on whether to apply, and decide before launch whether to file. Fees change, so check the Canadian Intellectual Property Office's current fee schedule. The lawyer pack includes this question (number 9).

### Market counts (check 19)

**Use `docs/market-count-sheet.xlsx`.** It has a weekly grid, the rules, and a Summary tab that turns your counts into a yearly estimate. The table below is the older paper version of the same idea. One week of data is in so far.

Claude cannot run these. The project rules forbid scraping or automated reading of Indeed, LinkedIn, Jobs4ECPs and the college registers, and the sites' own terms forbid it too. A person reading a number off a search page and writing it down is fine, and is what the audit asked for.

Do this once a week for 4 weeks, and keep going to about 12 weeks for a clear trend. Counts only. Do not copy any ads.

| Date | Site | Search | Province or all Canada | Number shown | Notes |
| --- | --- | --- | --- | --- | --- |
| | Jobs4ECPs | All jobs | Canada | | |
| | Indeed | optometrist | Canada | | |
| | Indeed | optician | Canada | | |
| | Indeed | optometric assistant | Canada | | |
| | Indeed | ophthalmic technician | Canada | | |
| | Indeed | eye care manager | Canada | | |

What you are working out: how many eye care job ads there are in Canada in a year (the useful number, rather than the number of practices). New ads a week, times 52, gives a first estimate. The top down estimate from public statistics is in `docs/market-sizing.md`, with sources and assumptions marked. Your weekly counts are the cross check on it.

### What Claude does next (when you say so)

Phase 2 and 3 in `NEXT-STEPS-PHASES.md`, one item at a time, only on the items you choose. The likely order, because it unlocks the gates: retention and download completeness (after the lawyer), accessibility pass, the review queue measurement (job views and apply clicks), then the "read this page" step that serves the ad builder and the seeding tool. Holding back until Gate A is closer: the seeding tool, Stripe, and anything that contacts clinics. Ideas such as ad style templates are on the list for after launch.
