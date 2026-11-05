# Business setup notes: structure, funding, LinkedIn, SEO, app, automation

Written 5th November 2026 from Steve's questions. These are working notes, not legal, tax or financial advice. Web research is from search summaries and third party sites, so each point is to be confirmed with the lawyer, the accountant or the program itself. Fees and rules change.

## 1. Incorporating: Ontario or federal

The sources agree on the main trade off.

- A federal (CBCA) corporation has its name protected across Canada. An Ontario corporation's name is protected in Ontario only.
- Provincial incorporation is usually cheaper and simpler. Both routes need a NUANS name search.
- A federal corporation must also register in each province where it does business, including Ontario. An Ontario corporation needs extra provincial registration only when it operates in other provinces. What counts as "carrying on business" varies by province, so ask the lawyer.

Working lean for Kestrel: a bootstrapped online board run from Ontario can start as an Ontario corporation, and the lawyer can say whether national name protection justifies the federal route. Gate A step 6 covers this. Decisions the lawyer will want: the name, directors, share structure (including room for friends and family later), registered office, year end, and the HST decision with the accountant.

## 2. Parent company and several industries

Steve's idea is Kestrel as the parent, Eye Care Jobs as the first brand, and possibly Dental Jobs, Medical Jobs and others later.

- Start with one corporation. A second brand can run under the same company as an operating (business) name. A subsidiary per industry only becomes worth its cost when a second industry has its own revenue, staff or risk.
- Do not put "Recruitment" in the company name. The terms and posting policy say Kestrel is not a recruiter or agency, and the name should not suggest otherwise. If an agency ever happens, the research suggests a separate company (see `docs/agency-pathway.md`).
- Pick a company name that is not tied to eye care, so other industries fit later, and assign the domain, logo and code to the company at the same time (Gate A step 10).

## 3. Money: grants, loans and a friends round

Kestrel's running costs are planned at well under $10,000 a year, so the need is small. Most grants reimburse approved costs after they are spent. They do not pay a subscription up front, and eligible costs differ by program.

**Programs worth checking (all unverified, check each program's own page):**

- **Starter Company Plus (Ontario).** Delivered through local Small Business Enterprise Centres. Training and mentorship, with grants of up to $5,000, and some centres require matching funds. Most 2026 intakes have closed, so the next intake for Steve's local centre is the first thing to find out. Likely stage: after the business plan is written, before large spending.
- **Futurpreneur.** A loan (not a grant) and up to 2 years of mentoring, for people aged 18 to 39. The loan figure varies by source (a recent figure is up to $75,000). It mentions a full time commitment, but also a route for people who keep a full time job, which fits Steve. Likely stage: after incorporating.
- **SR&ED tax credits.** Federal credits for eligible software development, claimed through the corporation's tax return. They need records of the development work, so start keeping them from incorporation. Ask the accountant.
- **IRAP (National Research Council).** For innovative research and development firms. Probably too early for Kestrel. Ask the accountant.

**A small friends and family round:**

- Ontario has a prospectus exemption for family, close friends and close business associates (the "FFBA" exemption). The company cannot advertise for investors under it. A securities lawyer should paper any round, including the risk acknowledgement and any filing.
- In Canada, SAFEs are used (a Y Combinator Canada version and one from the National Angel Capital Organization are commonly cited). A SAFE is not a share sale today. It gives the investor shares later, at a discount or a valuation cap, at the next priced round or a sale. Shares or a convertible note are alternatives, and a documented loan is simpler still.
- The arithmetic: if a person puts in $10,000 for 1%, that implies a company worth $1,000,000 after the investment. Pick a valuation for a pre revenue board with the accountant and lawyer before anyone is told a percentage.
- Perks such as "free posts for life" should be separate from the investment, written down, and limited (for example a number of posts a year for a set number of years). "For life" is hard to honour if the company changes. Ask the lawyer.
- Steve works at Eye Recommend. Anyone who invests and is also connected to Eye Recommend or its member clinics belongs in the disclosure conversation.
- What $10,000 would cover, to help decide an amount: the lawyer and incorporation, the paid plans (Vercel, Supabase, Resend), Stripe set up, a small first ad budget and a cushion.

## 4. LinkedIn company page plan

Set up the page as Kestrel Eye Care Jobs (not Steve's personal profile). Until the disclosure conversation has happened, do not invite Eye Recommend staff, clinics or contacts to follow it, and do not use their data.

- **Tuesday:** a short post about that week's blog article, with one question at the end.
- **Thursday:** one practical tip taken from a blog post (a phone screen tip, a job ad line, a reference check question).
- **Friday:** after launch, a roundup of new roles with links back. Only roles that are live on Kestrel, and clinics' own listings only once publishing is on.
- Occasionally: a short note on what is being built, and a thank you when a clinic posts.
- Do not send cold messages. Share, comment and reply instead.

Measure followers, link clicks (Search Console and the admin numbers will show visits) and which topics get comments.

## 5. More SEO beyond the blog

- Keep indexing each new post in Search Console, and keep the sitemap current.
- Make sure every job page carries the structured data that matches the visible page (built), so jobs can appear in Google's job results.
- Add landing pages for "role in city" searches (for example optician jobs in Toronto) once there are real jobs. Until then an honest empty state and a "know a clinic?" invitation.
- Links from relevant places: eye care associations' resource lists, college and school pages, clinic owners' own sites after they post, local business directories. Write to a few; do not buy links.
- A LinkedIn company page, a Google Business profile for the mailing address if it suits, and a short "about" and "contact" page that match the privacy policy.
- Page speed and mobile layout are already part of the build. Recheck before launch.
- Namecheap's RelateSEO add on is a plan with keyword and competitor tracking and step by step guides. Namecheap's pages show about $9.88 a month on a promotion and about $28.88 as the standard price, with a 4 week free trial. It may help someone who needs guidance, but Search Console is free, Claude can do the on page work and the keyword plan, and a paid tracker adds little before launch. If Steve wants a tracker later, a free trial first is low risk. A free alternative is the keyword and cluster work in the blog plan.

## 6. App wrapping

A job site can be added to a phone's home screen as an installable web app (a PWA) with little work, and can send notifications. That is a small build, and a good first step. Wrapping it for the app stores can wait until there is traction. It adds yearly store fees and review rules, and most candidates will arrive through search and job alert emails, not through an app. Revisit after launch with real numbers.

## 7. Is the automation plan plausible

Yes for most of it, with the right expectation: self sufficient means a few hours a week, not none.

- Fully automatic and already built or simple: expiry, "closing soon", reminders, alerts, billing receipts, health checks and admin alerts.
- Automatic with a quick human check (the plan in `docs/automation-plan.md`): finding listings from clinics' own pages, drafting ads, and claim emails in small batches.
- Needs a person: reading every post before it goes live (an accuracy and fairness check), replies to clinics and candidates, disputes and takedowns, anything legal.

Steve's time will go to approving batches, answering real questions and reading the admin alerts. The measure in Phase E of the plan sets when approvals can loosen.

## 8. Roles and the profession list

Steve's correction (5th November): Contact Lens Fitter is not really a profession in Canada. Optometrists handle contact lens fitting, sometimes delegating to opticians (in Ontario, many opticians are dual licensed), and in British Columbia it is deregulated. COA is rarely recruited for. Vision Therapist is a better addition. So the widening is: add Vision Therapist, and consider an optical lab technician, and drop Contact Lens Fitter and COA.

Filters should show only roles that have live jobs, so the board does not look empty at launch. When there are no jobs for someone's search, show a friendly page that says the board is still being built, and asks them to tell a clinic they know that Kestrel exists.

## 9. Pay benchmark

Use official data first: the federal Job Bank wages dataset on open.canada.ca (Wages, with a CSV per year). Its files are stored on `opencanada.blob.core.windows.net`, which must be allowed in the cloud environment. As a stopgap where official data is missing, an AI sweep per province can give a rough starting range, labelled "starting point, from public data" and replaced by Kestrel's own posted pay as ads arrive. AI figures must never be shown as fact without that label.

## 10. Follow ups, 5th November evening

**Friends and family money, clarified.** Steve's idea: 10 doctors or silent investors at $1,000 each, each getting 1%, for $10,000 in total.

- 1% for $1,000 means the company is valued at $100,000 after the money goes in. That is a plausible number for a pre revenue business, but if Kestrel reaches its $150,000 a year revenue target it would be cheap equity. Giving 10% of the business away for $10,000 is a real decision: decide it with the accountant.
- Ten small shareholders also bring paperwork: a shareholder agreement, notices, tax slips and a vote on some decisions. A SAFE or a convertible note with a valuation cap delays the valuation question and the shareholder admin until a later round. The lawyer decides the structure, and the exemptions that let each person invest (for example the family, friends and close business associates exemption, or an investor qualifying as an accredited investor).
- **A Kickstarter style alternative that needs no equity:** founding clinic credit packs. A clinic pays up front for a pack of posts at a discount (for example $1,000 for a pack of 20 posts, which would be $1,520 at the $76 average single post price on the 5th November ladder) that it can use over 12 to 24 months. Ten packs raises $10,000, avoids dilution and shows real demand. Rules: write the terms down, limit the number of packs, give a refund policy, and ask the accountant about HST and how prepaid income is recorded. It is a customer prepayment, not an investment, so do not call it one. The company, bank account and Stripe (Gate A) must exist first.
- "Free posts" for an investor should be a nominal number of posts over 1 or 2 years, written down, and kept apart from the share terms.
- Steve works at Eye Recommend, so any investor tied to it goes into the disclosure conversation.

**LinkedIn and SEO.** A company page rarely lifts Google rankings directly. What it does is build brand searches ("Kestrel Eye Care Jobs"), give people somewhere to find and share the blog, and bring links when others share a post. It is worth doing for those reasons.

**Reddit.** Findings from search (verify on Reddit itself):

- r/optometry is the main eye care subreddit (about 52,000 members), and many Canadian opticians and optometrists use it. Its rules limit posting to eye care professionals, and posts from others are removed. People without flair may have posts removed.
- A dedicated Canadian eye care subreddit and r/optician could not be confirmed. Search Reddit for "Canada optician" and check each subreddit's rules.
- OptiBoard has a Canadian Discussion Forum, which is a forum, not Reddit.

How to approach it: read each community's rules first. Message the moderators before posting anything that mentions Kestrel, say who you are and what you want to share, and ask what is allowed. Spend most of your time answering questions and adding useful comments, with no links. Share a blog post only when it answers someone's actual question, and say it is yours. Never post jobs unless the rules allow it, never use fake accounts, and use your own account. Because Steve works at Eye Recommend, hold promotional posts until after the disclosure conversation, and never use Eye Recommend's name or material.

## 11. Pass tiers and the Jobs4ECPs comparison, 5th November 2026

Steve's notes of 5th November 2026. **Decided later the same day: option 1, two named tiers (Clinic pass $199, Clinic pass Plus $349).** Built in `lib/pricing.ts`, the /clinics page, the outreach emails and the flyer draft. Plus has no yearly option, and founding clinics keep the price of whichever pass they take. Both are Claude's defaults for Steve to confirm. Terms and the lawyer pack should say which roles each pass covers.

**Jobs4ECPs prices (Steve's screenshot, 5th November 2026, page www.jobs4ecps.ca/products).** Basic Single Job Posting: $100.00 for 1 job, 30 days, the same price for every role. Profile Access: $0.00, 30 days, lets an employer view current job seeker profiles. No multi post or pass option shown on that page. The site is run by Eye Care Edge Ltd. Check the page again when not signed in before quoting it anywhere. The screenshot itself is not kept in the repository because the browser frame shows work bookmarks and tabs.

**Kestrel against $100 a post.** Support and patient care $59 (41% lower), opticians and practice leads $79 (21% lower), optometrists $99 (about the same). The plan mix averages $76 (24% lower). Five posts on the $199 pass against $500 for 5 posts at Jobs4ECPs saves $301.

**The problem with one pass.** The $199 pass for 5 live posts is priced against the average mix. If all 5 posts are optometrists, the singles total is $495, so the discount is 60% (about $296 given up). The clinics most likely to buy a pass are groups and corporates with several vacancies, and optometrists are often what they hire for. The cost to Kestrel of an extra post is only a few cents, so this is forgone revenue, not a loss, but it is the largest hole in the pass.

| 5 posts at singles pricing | Singles total | Pass at $199 | Discount |
| --- | --- | --- | --- |
| All support and patient care ($59) | $295 | $199 | 33% |
| All opticians and leads ($79) | $395 | $199 | 50% |
| Plan mix (average $76) | $380 | $199 | 48% |
| All optometrists ($99) | $495 | $199 | 60% |

**Options.**

1. Two named tiers. Pass at $199: up to 5 live posts for support, patient care, optician and practice lead roles. Pass Plus at about $349: up to 5 live posts including optometrists. That is about $70 a post, 29% below $99, and about $150 under 5 optometrist posts at Jobs4ECPs ($500). Steve's suggestion; Claude's lean, because it follows the 3 role bands already in the pricing.
2. One pass, where an optometrist post counts as 2 of the 5 slots. Easy to build, harder to explain.
3. Pass at $199 includes 1 optometrist post, and Plus removes the cap.

**Decide before any clinic hears the founding offer.** Founding clinics are promised $199 a month for 12 months. If that is promised before the tiers exist, it may lock in unlimited optometrist posts at $199. Settle what the founding offer covers first, then update the launch flyer, the For clinics page (audit R42) and the Terms to match. The credit pack example in section 10 above has been recalculated from the 5th November ladder. The launch flyer draft (`docs/marketing/launch-flyer.html`) still shows the older introductory prices ($39, $49, $59) and a $79 standard post, and needs the same update.

**Profile Access gap.** Jobs4ECPs gives employers free access to candidate profiles. Kestrel has saved CVs for applying but no way for clinics to browse candidates. Parked: it needs a decision on candidate consent, and a question for the lawyer, before it is considered.

**Jobs-optometry.** Steve's understanding is that its job board only lets OSI members post. Not checked by Claude. If it is right, that board is closed to corporate chains, opticians, assistants and any non member, and Kestrel being open to everyone belongs on the For clinics page. Add it to the hand review of competitors (`NEXT-STEPS-PHASES.md` and the planning item in `STEVE-NEXT-STEPS.md`), by reading public pages only, with no scraping.
