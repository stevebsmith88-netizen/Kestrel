# Steve's next steps

Updated 31st October 2026, after Phase 1 was merged to `main`. Claude does the code. These are the things only Steve can do, in the order that makes sense. Dates are estimates, not promises, and anything with a lawyer or the bank depends on their timetable.

## 1. Do now (a few hours, spread over the next 2 weeks)

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

### 1.2 Search Console and the sitemap (about 30 minutes, free)

Your blog is the long game for ranking. Search Console is how you see whether Google has found it, and it starts building data from day 1.

1. Go to search.google.com/search-console and sign in as kestrel@eyecarejobs.ca.
2. Add property, choose **Domain**, and enter `eyecarejobs.ca`.
3. Google shows a TXT record. In Namecheap, open the domain, Advanced DNS, Add new record, type TXT, host `@`, paste the value, save. Wait a few minutes, then press Verify in Search Console.
4. Open Sitemaps in the left menu. Enter `sitemap.xml` and submit. The sitemap is at https://eyecarejobs.ca/sitemap.xml. It lists your public pages, live jobs and every blog post automatically.
5. Open URL Inspection, paste your home page and each new blog post as you publish it, and press Request indexing.
6. Check back weekly: Performance shows impressions, clicks and the searches people used. Note the numbers once a month in a simple sheet. They are the evidence for the conversation at work.
7. Optional: Bing Webmaster Tools can import everything from Search Console in one click.

### 1.3 Blog routine (every 2 to 3 weeks)

Claude writes and publishes posts from `content/posts.ts` (see `docs/blog.md`). Each post now has its own share preview, so links look right on LinkedIn and WhatsApp. For search, each post should answer one real question a clinic or candidate would type into Google, link to 1 or 2 of your other posts and to /jobs or /clinics, and carry a unique title and description. Consistency matters more than volume.

### 1.4 Small tidy ups

- Test privacy@ again (the alias is now set up). Also create `support@` (done). `abuse@` and `postmaster@` are reserved by Google, so skip them.
- Fill in `docs/breach-plan.md`: the lawyer's name after the first meeting. The backup person stays out of the repository (see 2).
- Ad builder: try it on the live site and tell Claude if a draft fails or is cut off (it now uses Sonnet 5.5).

## 2. The backup person and names

- A backup person can be your wife. Their job is to be able to help if you cannot be reached for a day: emergency access to your password manager, or a sealed copy of your recovery codes. They do not need admin rights on anything.
- **Keep the name out of the repository and the public site.** The breach plan now says only that the backup is held offline. Write the name in your password manager notes.
- **The privacy policy is public.** It should publish the privacy officer's title and an email address (for example "Steve Smith, Founder and Privacy Officer, privacy@eyecarejobs.ca" or just the title and email). It should not mention a backup person at all. Whether your name or only the title should appear is one of the questions in the lawyer pack (question 28).
- `ADMIN_BACKUP_EMAIL` (optional) sends every admin alert to a second address. Admin alerts name job titles and clinics. Only use a personal inbox for that if you are comfortable with it. A shared mailbox in Google Workspace, such as a Google group, is cleaner.

## 3. Gate A, in order

Gate A means: the disclosure is given and acknowledged, the company and bank exist. Free launch waits for it. Steps overlap where noted.

| # | Step | Who | Depends on | Rough time |
| --- | --- | --- | --- | --- |
| 1 | Read through `docs/legal/Kestrel-lawyer-review-pack.pdf` once, correct anything that is wrong, and find your employment agreement. The pack states plainly that your employer offers a job board to the same clinics Kestrel targets | You | Nothing | 1 hour |
| 2 | Do the free first searches: CIPO trademark database, Ontario and federal corporation name searches, and a web search for "Kestrel" in eye care and job boards. A formal NUANS name report is done by the lawyer or an incorporator, and has a fee | You | Nothing | 1 to 2 hours |
| 3 | Book the fixed fee lawyer meeting and send the pack beforehand | You | 1 | Book this week |
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

### Does the company need to be trademarked?

No. These are two different things:
- **A company** is incorporated, which registers its legal name. That does not by itself stop someone else using a similar name in the same field or in another province.
- **A trademark** protects a brand (a name, a logo) as a mark used in trade. It is optional. It is worth considering for "Kestrel" and your feather logo, but "Kestrel" is a common word, and "Eye Care Jobs" is descriptive, so the protectable part may be narrower than it looks.

A practical order: do the free searches now, let the lawyer advise on whether to apply, and decide before launch whether to file. Fees change, so check the Canadian Intellectual Property Office's current fee schedule. The lawyer pack includes this question (number 9).

## 4. Market counts (check 19)

**Use `docs/market-count-sheet.xlsx`.** It has a weekly grid, the rules, and a Summary tab that turns your counts into a yearly estimate. The table below is the older paper version of the same idea.

Claude cannot run these. The project rules forbid scraping or automated reading of Indeed, LinkedIn, Jobs4ECPs and the college registers, and the sites' own terms forbid it too. A person reading a number off a search page and writing it down is fine, and is what the audit asked for.

Do this once a week for 4 weeks. Counts only. Do not copy any ads.

| Date | Site | Search | Province or all Canada | Number shown | Notes |
| --- | --- | --- | --- | --- | --- |
| | Jobs4ECPs | All jobs | Canada | | |
| | Indeed | optometrist | Canada | | |
| | Indeed | optician | Canada | | |
| | Indeed | optometric assistant | Canada | | |
| | Indeed | ophthalmic technician | Canada | | |
| | Indeed | eye care manager | Canada | | |

What you are working out: how many eye care job ads there are in Canada in a year (the useful number, rather than the number of practices). New ads a week, times 52, gives a first estimate. The top down estimate from public statistics is in `docs/market-sizing.md`, with sources and assumptions marked. Your weekly counts are the cross check on it.

## 5. What Claude does next (when you say so)

Phase 2 and 3 in `NEXT-STEPS-PHASES.md`, one item at a time, only on the items you choose. The likely order, because it unlocks the gates: retention and download completeness (after the lawyer), accessibility pass, the review queue measurement (job views and apply clicks), then the "read this page" step that serves the ad builder and the seeding tool. Holding back until Gate A is closer: the seeding tool, Stripe, and anything that contacts clinics. Ideas such as ad style templates are on the list for after launch.
