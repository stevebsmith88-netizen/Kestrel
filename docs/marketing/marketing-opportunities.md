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
| Urgent hiring badge | A small "Hiring now" label for 7 days (see below for how it looks) | Cheap add on |
| Social boost | The job shared on Kestrel's Instagram and LinkedIn | Later: worth little until the accounts have followers (Steve, 14th November 2026). Labelled, with the clinic's agreement on the wording |
| Job alert spotlight | The job placed first in alert emails for its role and province | Later. Job alerts are used to seed the board first (Steve, 14th November 2026). Still a real, matching job, so it stays a service |
| Clinic spotlight | A short profile article ("Meet a clinic"), already planned as opt in | Can be free for founding clinics, paid later |
| Clinic page | A public page for each clinic that candidates can find (see below) | Not built yet. The featured profile in the passes becomes the richer version of it |
| Group bundle | Pricing for corporate groups hiring across several locations | Fits the pass structure |

Never sold: candidates' details, resumes or data of any kind; a place in Kestrel's own pay figures; a better spot in "Recommended for you", which stays rules based (`lib/recommend.ts`).

## How the "Hiring now" badge would look

A small capsule beside the job title, in the job list and on the job page: the words "Hiring now" in Deep Chestnut on a pale chestnut background, the same shape as the status badges already on the site. It is a capsule because it is information, not a button (the shapes rule in CLAUDE.md). It lasts 7 days, and a clinic can only add it to a live job that is genuinely open.

## A public clinic page (not built yet)

Today a clinic edits its profile privately, but candidates cannot see a page for the clinic. A public page at an address such as `/clinics/<clinic-name>` would show the clinic's name, town, practice type, a short description in its own words, benefits, photos (with a pass), and **its open jobs with the count ("3 open jobs")**. It helps candidates decide, and it helps search: pages about real local employers are what people and AI assistants look for. Rules to keep: only claimed clinics, no logo until claimed, nothing private, and it drops out of search when the clinic has no jobs and has not filled in its page. Worth building before launch if time allows.

## Founding supporters (before Stripe is built)

Steve's idea (14th November 2026): early backers who pay to support Kestrel and get something back.

| Tier | Who | What they get |
| --- | --- | --- |
| Founding supporter | Anyone in eye care who wants Kestrel to exist | Name on a "Founding supporters" page (only if they opt in), a sticker pack or mug from the existing merch designs, and launch news first |
| Founding clinic | Clinics | The founding pass price locked for 12 months (already the rule), a "Founding clinic" mark on their clinic page, and a set of free post credits once paid posting starts |
| Founding sponsor | Suppliers, after the disclosure conversation | Their logo on the supporters page and the "Supported by" strip for a year |

How to take the money before checkout exists: a Stripe Payment Link is a single page Stripe hosts, with no code on Kestrel's side, so it does not need the full checkout build. An invoice works for clinics and sponsors.

Cautions:
- **It is a purchase, not an investment.** Never promise a share, a return or a say in the business; that would bring in securities rules. Word it as "support Kestrel and get ..." and list exactly what they get.
- **Deliver what is promised,** with a date. Merch needs ordering and posting.
- **Tax:** HST registration becomes compulsory once taxable sales pass $30,000 over 4 quarters; check with an accountant before selling much, and keep receipts.
- **A refund policy** in plain words, before the first sale.
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
