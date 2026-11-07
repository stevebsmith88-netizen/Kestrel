# Eye care industry directory: plan

Idea from Steve, 9th November 2026. A reference directory of suppliers and anything that touches the optical world in Canada, built from a document Steve parsed from **public sources only** (company websites, public directories and listings, with no Eye Recommend lists or internal material). Not built. It starts after launch and the Stripe work, and the first step is working through Steve's document together.

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

Possible, with rules:
- Free basic listing for everyone, so the directory stays useful and impartial.
- Paid tiers add presence, not ranking tricks: a featured profile (logo, longer description, links to their open jobs), category sponsorship, and the supplier job post products already planned (pricing for field and supplier roles is still to decide with Stripe).
- Everything paid is labelled "Sponsored" on the page, and its link carries `rel="sponsored"`. Show the label in the table as well as the profile.
- Do not sell sponsored positions to suppliers before the disclosure conversation, because many suppliers are also vendors to buying groups. Steve should raise the directory and any sponsored listings in that conversation and with the lawyer, as with the agency pathway.
- Price after launch from real numbers (views and clicks), as with sponsored job posts (`docs/sponsored-ads-plan.md`).

## Order of work

1. Steve shares the document. Claude checks its shape and proposes the final category list.
2. Clean and dedupe, check websites, write descriptions. Mark every row with its source type.
3. Build the category pages (tables in the page, filters on top), with a "last checked" date, after launch and Stripe.
4. Tell listed suppliers they are in it, after Gate A, with a way to claim and correct their entry.
5. Sponsored tiers, once there are views to price from.
