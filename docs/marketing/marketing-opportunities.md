# Marketing opportunities: draft one pager (14th November 2026)

Steve's idea: a single page of the ways businesses and clinics can pay to reach Kestrel's audience. This is the internal draft: what each option is, who buys it, and the rules that keep it useful to readers. No prices yet (Steve sets them), and nothing here is built.

**Gate:** anything sold to suppliers, labs or buying groups waits for Steve's disclosure conversation, like sponsored directory listings already do (CLAUDE.md). Many of the same companies work with Eye Recommend, so the separation rules apply in full: no Eye Recommend contacts, lists or introductions are used to sell any of this.

## For businesses (suppliers, labs, frame and lens companies, equipment, software, schools, continuing education providers)

| Option | What it is | Notes |
| --- | --- | --- |
| Sponsored article | A blog post written with a supplier, clearly labelled, under the rules below | **At most 4 a year, 1 a quarter** (Steve, 14th November 2026), priced per article |
| Site supporter | The company's logo in a "Supported by" strip on the home page and the blog | A small number of supporters at a time, so it stays meaningful |
| Featured directory listing | A highlighted entry in the industry directory on `/resources` | Already planned in `docs/marketing/directory-plan.md` |
| Presented by | A company's name on a useful resource, such as the yearly pay summary ("presented by ...") | The content stays Kestrel's and independent |
| Newsletter sponsor | 1 short, labelled message in a future monthly newsletter to people who ticked the news box | Never in job alerts, which are a service, not marketing |
| Social sponsor | A labelled Instagram or LinkedIn post, written to Kestrel's standards | Labelled as a paid partnership |
| Supplier hiring | Supplier and field based jobs posted like any other job | Already built; a pass suits suppliers hiring reps across provinces |
| Event and course listings | Continuing education courses and events, paid to be listed or highlighted | Useful to opticians who need credits |
| Affiliate links | A commission when a reader buys a course or book Kestrel recommends | Small income; only for things Kestrel would recommend anyway, always disclosed |

## For clinics

| Option | What it is | Notes |
| --- | --- | --- |
| Single posts and passes | Already priced in `lib/pricing.ts` | Free during launch |
| Featured job | The job shown at the top of search results for its role and province, marked "Featured" | On the launch features list as "later" |
| Urgent badge | A small "Urgent" label for 7 days (see below for how it looks) | Cheap add on. Not "Hiring now": every live job is hiring (Steve, 14th November 2026) |
| Social boost | The job shared on Kestrel's Instagram and LinkedIn | Comes in with paid ads, after launch (Steve, 14th November 2026). Labelled, with the clinic's agreement on the wording |
| Job alert spotlight | The job placed first in alert emails for its role and province | Comes in with paid ads. Job alerts are used to seed the board first (Steve, 14th November 2026). Still a real, matching job, so it stays a service |
| Clinic spotlight | A short profile article ("Meet a clinic"), already planned as opt in | Can be free for founding clinics, paid later |
| Clinic page | A public page for each clinic that candidates can find (see below) | Not built yet. The featured profile in the passes becomes the richer version of it |
| Group bundle | Pricing for corporate groups hiring across several locations | Fits the pass structure |

Never sold: candidates' details, resumes or data of any kind; a place in Kestrel's own pay figures; a better spot in "Recommended for you", which stays rules based (`lib/recommend.ts`).

## Several locations and corporate groups (decided 14th November 2026)

Steve's rule: **each location signs up on its own, or the group takes a Group pass.** This protects the per post and per pass prices, so a large group cannot run many locations from 1 small pass.

- A single post, Clinic pass or Clinic pass Plus covers **1 location**: the clinic page it was bought for. Posts are for that location only.
- A **Group pass** covers 3 or more named locations under 1 owner or company, on 1 invoice, with a group page linking them. It is priced **per location**, a little below buying each location's pass separately, so it never undercuts the core prices (see the pricing section).
- An owner with 2 locations buys for each location. A Group pass starts at 3.
- A job posted for a location not on the pass is refused at posting, and the admin review queue checks the address.
- This applies the same to independents with several clinics and to corporate groups. Big box groups may also post location by location if they prefer.

Needs the account to hold several locations (`docs/plans/clinic-and-supplier-pages.md`). Add to `docs/pass-procedures.md` when checkout is built.

## How the "Urgent" badge would look

A small capsule beside the job title, in the job list and on the job page: the word "Urgent" in Deep Chestnut on a pale chestnut background, the same shape as the status badges already on the site. It is a capsule because it is information, not a button (the shapes rule in CLAUDE.md). It lasts 7 days, and a clinic can only add it to a live job that is genuinely open.

## A public clinic page (not built yet)

Today a clinic edits its profile privately, but candidates cannot see a page for the clinic. A public page at an address such as `/clinics/<clinic-name>` would show the clinic's name, town, practice type, a short description in its own words, benefits, photos (with a pass), and **its open jobs with the count ("3 open jobs")**. It helps candidates decide, and it helps search: pages about real local employers are what people and AI assistants look for. Rules to keep: only claimed clinics, no logo until claimed, nothing private, and it drops out of search when the clinic has no jobs and has not filled in its page. Worth building before launch if time allows.

## Suppliers

Suppliers can already make an employer account and post field based jobs. To add (plan in `docs/plans/clinic-and-supplier-pages.md`): a supplier company page, a **premium supplier page** that can show labelled promotions, and claiming a supplier page by **work email domain** (an @supplier.com address matching the company's website).

## Pricing guidance (revised 14th November 2026, before HST)

No one in this niche publishes a media kit, which is normal for a new board. Clinic prices start from the post prices already set ($59, $79, $99). **Sponsor prices are set as packages, not as single small items**, because a supplier's marketing budget is measured in thousands, and a price that looks too low signals low value. Promise **what they get, never how many people see it**, until there are numbers to show.

### Clinics

| Option | Suggested price | Reasoning |
| --- | --- | --- |
| Featured job | $29 for the 30 days of a post | About a third of a post price: easy yes |
| Urgent badge | $15 for 7 days | Impulse add on |
| Social boost, job alert spotlight | $25 each | With paid ads, after launch |
| Group pass | Per location a month: $179 (Clinic pass level) or $315 (Plus level), 3 locations minimum, 5 live posts a location | 10% below buying each pass separately |

### Businesses (after the disclosure conversation)

| Package | Suggested price | What it includes |
| --- | --- | --- |
| Directory feature | $500 a year | A highlighted directory entry with logo and 1 line |
| Sponsored article | $1,500 each, at most 4 a year | The article, a permanent page, a labelled LinkedIn and Instagram post, and a mention in the monthly newsletter |
| Supporter | $4,000 a year, at most 6 | Logo in the "Supported by" strip on the home page and blog, a directory feature, and 2 labelled social posts |
| Presenting partner | $8,000 a year, 1 only | "Presented by" on the yearly pay summary, supporter strip, 1 sponsored article, and first offer to renew |
| Premium supplier page | $99 a month or $990 a year | Company page with labelled promotions |

**If every sponsor slot sold:** 6 supporters ($24,000), 1 presenting partner ($8,000), 3 more sponsored articles ($4,500, since the partner has 1 of the 4) and 15 directory features ($7,500) come to **about $44,000 a year**, before premium supplier pages and supplier job posts. **Realistic for year 1:** 1 presenting partner or 2 supporters, 2 articles and a handful of directory features, about **$12,000 to $18,000**. Sponsors pay first for association and goodwill; renewals at higher prices come once there are traffic and application numbers to show.

Review every price after the first 3 months of real numbers.

## Founding supporters (revised 14th November 2026)

**Individuals:** an optional "Support Kestrel" payment, any amount from $10, with no physical rewards (no stickers: Steve, 14th November 2026). They get their name on the Founding supporters page if they opt in, and a thank you email. Call it a **contribution**, not a donation: Kestrel is a business, so it cannot give charitable receipts, and "donation" would suggest otherwise. Posting stays free for the first 30 to 60 days for everyone.

**Founding clinics: the first 50.** Any of the first 50 clinic locations to post during the free launch becomes a Founding clinic, free: a permanent "Founding clinic" mark on its clinic page, and the founding pass price locked for 12 months if it takes a pass (already the rule). Scarcity ("1 of the first 50") is the reason to act early. Optional: a $199 founding credit pack (4 post credits for 12 months after paid posting starts, a $316 value) for clinics that want to back Kestrel with money.

**Founding sponsor: at most 3, $10,000 for the first 18 months.** Everything in Presenting partner or Supporter, plus: named on the Founding supporters page for good, a launch week LinkedIn and Instagram thank you post, 2 sponsored articles, and first offer at the regular price when it ends. Only after the disclosure conversation.

How to take the money before checkout exists: a Stripe Payment Link (a page Stripe hosts, no code on Kestrel's side), or an invoice for clinics and sponsors.

Cautions:
- **It is a purchase, not an investment.** Never promise a share, a return or a say in the business; that would bring in securities rules. Word it as "support Kestrel and get ..." and list exactly what they get.
- **Deliver what is promised,** with a date.
- **Tax: register for HST now.** A business can only charge HST once registered. Below $30,000 a year registration is voluntary, and registering also lets Kestrel claim back the HST it pays on its own costs. Show prices "plus HST" and put the HST number on every invoice. Tracking for CRA: see `docs/plans/clinic-and-supplier-pages.md`, section 5.
- **A refund policy** in plain words, before the first sale: draft in `docs/legal/refund-policy-draft.md`.
- **Consent:** supporters' names shown only with their permission, and updates only to those who ticked the news box (CASL).

## Rules for sponsored articles

1. **Labelled everywhere.** "Sponsored by [company]" above the title, in the blog list, on social posts that share it, and in the page's data for search engines. The Competition Act and Ad Standards both expect paid content to be obvious.
2. **Useful first.** It must answer a question an optician, assistant, optometrist or clinic owner actually has, such as how a new lens design is fitted or how to train staff on new equipment. If it reads like an advert, it goes back.
3. **Kestrel edits.** Same house style as every post (numerals, no dashes, no banned words), and Kestrel has the final say on the wording. The supplier checks facts about its own products.
4. **Facts with sources.** Claims about a product need the supplier's evidence. No claims about competitors, and no comparisons that name them.
5. **No pay or job claims.** Sponsored articles never state pay figures, promise jobs or recommend employers.
6. **Links marked as paid.** Links to the sponsor carry `rel="sponsored"`, as Google requires for paid links. This protects Kestrel's own search ranking.
7. **Fair to everyone.** Open to any supplier on the same terms; no exclusives by category in the first year, so no one is locked out.
8. **Limited.** At most 4 a year, 1 a quarter, priced per article, so the blog stays independent advice (Steve, 14th November 2026).
9. **Kept on record.** Each sponsored article, its sponsor and the date it ran, kept for at least 3 years.
10. **Never about Eye Recommend**, and no sponsor introduced through Eye Recommend.

## To decide with Steve

- Prices for each option, and which to offer first (suggest: featured job and site supporter, as the simplest to build).
- Whether the one pager becomes a public "Advertise with Kestrel" page after launch, or a PDF sent on request.
- A short rate card for founding sponsors, timed with the disclosure conversation.
