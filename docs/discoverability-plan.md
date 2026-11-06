# Being found: Google, AI assistants and social (decisions of 6th November 2026)

Goal, in Steve's words: be the go to place for eye care jobs in Canada, rank first on Google, and be the source AI assistants name. Everything public should serve that. No result is promised.

## Resources page

Built 6th November 2026 on branch `claude/amazing-keller-c7k18u` (waiting for Steve's preview). Page: `app/resources/page.tsx`. Pay table: `lib/pay-guide.ts` and `components/PayGuide.tsx`, using the same Job Bank figures as the post a job form, so a yearly refresh (docs/pay-benchmark.md) updates both. Outside links: `lib/resources.ts`. A link shows only when it has a `checked` date, so unconfirmed ones wait there with `checked: null`. Footer link and sitemap entry added. No SQL, no new setting. Still to do: confirm the held back links, add the other provinces' regulators, and link to the page from the post a job form and blog posts.

- **Placement:** footer menu, plus links from the pages where each resource helps (post a job, the blog, the quiz). Not in the main menu, which stays for the main actions for candidates and clinics. A footer link appears on every page and Google follows it, so the page is not hidden.
- **Content, in order:**
  1. Pay guidance table: province drop down, then roles, using the Job Bank figures already built for the pay benchmark (docs/pay-benchmark.md), with a link to Job Bank for each. Wording "typical" and "median" only, with the Open Government Licence line.
  2. Regulator and licensing links by province (optometry colleges and optician regulators, NACOR). Links only. The provincial registers are never scraped.
  3. Canadian hiring rules: pay range, existing vacancy and AI screening disclosure (matches the posting policy page and CLAUDE.md).
  4. Association links: optometry associations (national and provincial) and the Opticians Association of Canada. "OAO" and "AAO" are the Ontario and Alberta Associations of Optometrists (confirmed 6th November 2026). Check every link before it goes live. No suppliers.
  5. The Find your fit quiz.
- **Link backs:** links out do not bring links in. Backlinks come when associations and trade publications choose to point at a useful page, so ask them after launch. Association outreach waits for Steve's disclosure conversation, like clinic outreach.

## Member spotlight ("Meet a clinic")

- Opt in only, with the date of consent saved. Claimed clinics only. The clinic's own words, plus a specific only they can give. No Eye Recommend material.
- Empty until clinics join, so do not show the section until at least 3 have opted in. The opt in box and the saved profile text can be built first (needs a migration, run on both databases).
- Fair rotation so every opted in clinic gets a turn.

## Social posting

- Worth doing, small and later. Use Kestrel's own pages (LinkedIn company page, Facebook page, Instagram). Never Steve's personal profiles and never any Eye Recommend account.
- Posts come from things Kestrel owns: new blog posts, the pay table, spotlights, hiring rules, and (with the clinic's agreement) claimed jobs. Unclaimed found listings are not posted.
- Start with a queue Steve approves. Move to automatic only after a month of clean posts. Tool not chosen. Stories are not supported equally by every tool and account type, so check before picking.
- Social links carry little direct ranking value. The gain is visits, brand searches and mentions.

## Other things that help with Google and AI assistants

- Set up Google Search Console and Bing Webmaster Tools, submit the sitemap. Bing matters because several AI assistants use its index.
- Keep JobPosting data exact, expire it on time, and keep a steady blog.
- Publish something quotable and dated that others can cite: the pay table and a yearly Canadian eye care hiring summary built from Job Bank data.
- Use the same name, description and logo everywhere (site, social pages, profiles).
- Later: ask trade publications to cover the launch, once the disclosure conversation has happened.

## Built since (6th November 2026)

- Resources page went live in pull request 46 (footer link). Added on the next branch, waiting for Steve's preview: a link from the pay guide on the post a job form ("Pay in other provinces") and one in the box at the end of every blog post.
- Price comparison page at `/compare`: `app/compare/page.tsx` and `lib/compare-prices.ts`. Off on the live site until `ENABLE_COMPARE=yes`, visible on previews. Compares Kestrel (prices from `lib/pricing.ts`), Eluta and OJobs only. Jobs4ECPs left off (see docs/competitor-pricing.md). Needs the lawyer and a fresh price check first.
- Buying groups blog post: draft in `docs/blog-drafts/buying-groups.md`, held back.
