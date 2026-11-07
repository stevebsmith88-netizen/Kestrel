# Eye care industry directory: plan

Idea from Steve, 9th November 2026. A reference directory of suppliers and anything that touches the optical world in Canada, built from a document Steve parsed from **public sources only** (company websites, public directories and listings, with no Eye Recommend lists or internal material). Not built. It starts after launch and the Stripe work, and the first step is working through Steve's document together.

## Status: going ahead under a verification rule (9th November 2026)

Steve shared a spreadsheet of about 260 suppliers and optical businesses, in 3 versions (the same list each time, with notes edited and then descriptions reworded). The first version had 11 notes that referred to Eye Recommend ("on the Eye Recommend list", "check with the Eye Recommend rep", "members get a discount") and 6 that referred to "the supplier document". Those were removed in the later versions, but the list of companies is the same, so the original source was never answered. Steve then said, plainly, that the businesses are all legitimate and open to the public and that the list is fine to use.

Decision: use the list as **a list of candidate names only**, and publish nothing from it that has not been checked against a public page found independently. Every published row needs:

- a public source page (the company's own website, or a public directory), recorded as a source URL with the date checked;
- a description written fresh from that page, never carried over from the spreadsheet;
- no notes carried over, and nothing about Eye Recommend members, reps, discounts or lists;
- no commentary on a named company's finances, ownership guesses or analyst opinions, and no named individuals.

A row that cannot be verified is not published. The Eye Recommend row, and the "Eye Recommend private label lens programme" row (a programme, not a company), are left out until Steve says otherwise, and any buying group listing is treated exactly like the others.

**Spot check (9th November 2026):** the 10 rows the spreadsheet itself marked "not verified" or "purpose not known" were searched. 3 were found as Canadian businesses (one under a corrected name, Optik K&R Inc., Markham ON; one with an inconsistent address; one with no description of services), 1 was found only as a US company, and 6 could not be found. The search tool is not Google, and small businesses may have little online presence or a different trading name, so "not found" means "ask Steve for the website", not "does not exist".

Spreadsheet copies were deleted from the session at Steve's request. The file needs to be sent again to continue.

## Why it is worth doing

- A real reference page that people search for ("optical lab suppliers Canada", "frame distributors Canada"), and one that suppliers, associations and trade media have reasons to link to.
- It fits the product: Kestrel already supports supplier and field roles, so every listing is a possible supplier employer, and "claim your listing" works the same way it does for clinics.
- Possible revenue (see below), alongside job posts.

## How to keep it good for search

- **Original value on every entry:** a category, a one line description in Kestrel's own words (never copied from the company's site), the provinces served, and a "last checked" date. A bare list of names and links is thin content, and Bing's guidelines warn against it.
- **Not a page per company.** One page per category, each a full table with every row in the page itself (so crawlers and AI bots read it), with filters on top that only narrow what is already there. A few hundred thin pages would waste crawl budget and hurt the rest of the site.
- **Links:** normal links for the free editorial list. No link swaps and no "link back to us" requirement. A paid or sponsored link carries `rel="sponsored"`.
- **Every company treated the same way**, as with the buying group post: free basic listing for everyone, same fields, same order rules (alphabetical within a category).
- **Kept fresh:** recheck each entry on a schedule, drop closed businesses, show the date.
- **No personal contact details,** only business names, websites and general business information.

## Columns to get the document into shape

| Column | Notes |
| --- | --- |
| Name | The business name as it trades |
| Category and subcategory | From a fixed list (draft below), so filters work |
| What they do | 1 plain sentence in our own words |
| Provinces served | Canada wide, or the provinces |
| Head office city and province | If public |
| Website | Checked to load |
| Last checked | A real date |
| Source type | Company site, public directory, exhibitor list. Never an internal list |

## Draft categories (for Steve to change)

Frames and eyewear brands, lenses and lens labs, contact lenses and solutions, diagnostic and exam equipment, optical lab equipment and tools, practice software and billing, dispensary fixtures and displays, eye health products, marketing and web services for clinics, accounting, insurance and financing, education and training, associations and regulators (links only, as on the Resources page). Recruiters and staffing agencies are left out, since they cannot post on Kestrel.

## Checking an AI parsed list

A list built by parsing with AI needs checking before it goes public. Typical faults: websites that no longer exist, duplicates, merged or renamed companies, and descriptions that are plausible but wrong. Plan: remove duplicates, check every website loads, spot check about 1 entry in 10 by hand, and write the descriptions fresh.

## Sponsored listings as revenue

Steve's thinking, 9th November 2026: sponsors rotate automatically in 2 places, a logo strip on the home page and the top of the relevant category page (a local lab would sit at the top of the lens lab section, rotating with any other sponsors there). A minimum term of 6 months. Always labelled "Sponsored". Ads and traffic come first, then the offer to suppliers.

### Rules

- Free basic listing for everyone, so the directory stays useful and impartial.
- Paid placement adds presence only: a featured profile (logo, longer description, links to their open jobs) and the two placements above, plus the supplier job posts already planned.
- Everything paid says "Sponsored" in the page, and its link carries `rel="sponsored"`. Keep the sponsored block compact, so ads never push the content down.
- **Fair rotation:** the order is shuffled on each visit, so every sponsor gets the same exposure over time. No auto playing carousel (it is hard to use and fails accessibility needs). All sponsors are in the page for crawlers and screen readers.
- **Caps:** at most 6 on the home page and 3 per category, so a slot stays worth buying. The same idea as the sponsored job posts (`docs/sponsored-ads-plan.md`): build the rotation once and use it for both.
- **Province matching later:** a lab's slot can show first when a visitor filters to its province.
- **Reporting:** the same cookie free view and click counts as job posts, sent to each sponsor monthly. That report is what renews the sponsorship.
- Sponsors pay by prepaid term (6 or 12 months), not by cancellable monthly subscription, so the minimum term is simple to keep. Terms for the lawyer.
- Do not sell sponsored positions to suppliers before the disclosure conversation, because many suppliers are also vendors to buying groups. Steve should raise the directory and any sponsored listings in that conversation and with the lawyer.

### Pricing: starting hypotheses to test, not market data

No reliable published benchmark was found for Canadian optical trade sponsorship, so these are value based starting points to test with real suppliers. Prices before HST.

| Product | Monthly, on a 6 month term | 6 months |
| --- | --- | --- |
| Featured profile | $39 | $234 |
| Category sponsor (top of 1 category, shared with up to 2 others) | $99 | $594 |
| Home page logo strip (up to 6) | $149 | $894 |
| Bundle of all 3 | $199 | $1,194 |

A 12 month term at 10 months for the price of 12, as with the passes. A founding sponsor rate held for 12 months for the first 10 sponsors, as with founding clinics.

**What the slot design allows:** 6 home slots at $149 a month is about $10,700 a year if every slot is sold, and about 12 categories with 3 slots each at $99 a month is about $42,800. The most it could bring in is about $53,500 a year, and at 30% to 50% filled about $16,000 to $27,000. That is roughly 10% to 18% of the $150,000 target: worthwhile extra income, with job posts still the core.

**Finding the real price:** ask 3 to 5 suppliers what they spend a year on trade advertising, and ask the trade magazines and the CAO and OAC for their media kits (many publish rate cards). One new clinic is worth thousands of dollars a year to a lens lab, so a few hundred dollars for a year of visibility is easy to justify, if the audience is real.

**When to sell:** after launch, and once there are 2 to 3 months of visitor numbers (Vercel Web Analytics comes with Pro). Sell on audience quality: clinic owners and eye care staff in Canada, not raw visitor counts. Before then, only a free listing and a founding sponsor waiting list.

## Order of work

1. Steve shares the document. Claude checks its shape and proposes the final category list.
2. Clean and dedupe, check websites, write descriptions. Mark every row with its source type.
3. Build the category pages (tables in the page, filters on top), with a "last checked" date, after launch and Stripe.
4. Tell listed suppliers they are in it, after Gate A, with a way to claim and correct their entry.
5. Sponsored tiers, once there are views to price from.
