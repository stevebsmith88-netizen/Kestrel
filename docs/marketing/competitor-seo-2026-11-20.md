# Competitor SEO read: Jobs4ECPs and Jobs Optometry (20th November 2026)

A one off look at public, site level signals only (robots.txt, sitemap, page tags, structured data). No job listings or employer details were copied, in line with the rule on Jobs4ECPs in `CLAUDE.md`. Re-read once a quarter.

## Jobs4ECPs (www.jobs4ecps.ca)

Read: robots.txt and the sitemap index. Not read: the home page and inner pages, because Cloudflare answers automated requests with a challenge (HTTP 403). That block was left alone. Page titles, headings, structured data and pay display are therefore unknown, and a person has to look in a browser (view source, search for "JobPosting").

- Sitemap is an index that points to a jobs sitemap and a pages sitemap, both refreshed on 20th November 2026. Job pages are kept in the sitemap automatically.
- robots.txt closes employer, applicant, message and filter pages and the sort, city and location query strings, which keeps duplicate pages out of Google. It blocks several scrapers and CCBot (Common Crawl, a data source for many AI models). The rest of the AI crawler list was not checked.
- Sitting behind Cloudflare means some AI crawlers may be challenged as well. Kestrel names and allows the main ones in `lib/crawlers.ts`, which is a point in its favour.
- Strength: the longest established name, which is why it leads the AI Overview and the side panel for "eye care jobs in Canada".

## Jobs Optometry (www.jobs-optometry.com)

- Title: "Jobs Optometry | Optometry Job Opportunities In Canada". 1 H1 ("Find your next exciting job!"), several H2 sections. The H1 does not say optometry, so the keyword sits in the title and H2s only.
- Open Graph tags present. Structured data present on the home page as a graph. Whether its job pages carry JobPosting data was not confirmed.
- Sitemap is small: about 53 employer pages and 27 job pages in English, plus 7 information pages, and a French copy of each. Roughly 27 live jobs, optometry only.
- robots.txt allows GPTBot and Google-Extended, closes employer detail pages, filter pages, apply pages and, notably, the blog. It publishes an `/llms.txt` in English and French.
- Strength: an exact match name for optometry searches, bilingual, and a visible employer directory. Weakness: little content, and the blog is closed to search engines, so it has no pay or career articles to be cited.

## Jobs4ECPs seen in a browser (Steve's screenshots, 20th November 2026, 12:06 to 12:07)

What Steve saw as a visitor, added the same day. Counts are from the site's own filter panel.

- **32 live jobs**: 30 full time and 2 part time, all on site. By province: Ontario 20, Alberta 9, British Columbia 2, Saskatchewan 1. Nothing from Manitoba or the Maritimes. The newest were posted 20th November 2026 and several sit at 26th to 28th October, so some are over 3 weeks old.
- **Pay is rare.** The Compensation filter counts 3 jobs at every step from $20,000+ to $100,000+, so at most 3 of 32 jobs (about 9%) show a pay figure. Where pay appears, it is sometimes inside the job title ("$160,000 Full-Time Minimum | $700/Day Part-Time Minimum"), which also makes the title long. Kestrel shows pay on every job, and keeps it out of the title.
- **Titles are plain** ("Optometrist", "Associate Optometrist") with the town in a separate field, and several titles run on with extra wording or capitals. Kestrel's locked titles are cleaner for Google.
- **Many jobs show a grey placeholder** in place of a clinic logo, and the "Urgent!" ribbon is on about 1 job in 4.
- **Browse Profiles lists 859 profiles, and many are not eye care**: the first ones on the page are a pest control firm, a visa service, a machinery maker and a taxi service in New Zealand. Employers and the Browse Profiles pages are a trust weakness for it. Kestrel's review queue and the `/fake-jobs` policy are the contrast, and worth saying plainly in clinic facing pages.
- The top menu has All Jobs, Post a Job, Employers, Browse Profiles, About, Contact and Blog. It has a blog, so the Jobs4ECPs blog is worth reading for topics.
- Still unknown: its title tag, structured data and employer pricing (see above).

## Jobs4ECPs: employers, about, blog, price and source (Steve, 20th November 2026, 12:45 to 12:50)

- **Home page source:** a search for "JobPosting" finds only the words "Job Posting" in its $100 30 Day Job Posting button, so the home page carries no JobPosting structured data (job pages were not checked). It loads a "Jobs from our partners" block by script, so some jobs shown there come from other sources. Its copy uses "leverage" and claims a large social following, with no numbers shown.
- **Employers page:** 1,783 employers (Ontario 343, Alberta 159, British Columbia 130, Manitoba 24, Saskatchewan 18), but the list is not all eye care: a driving school sits among the first results. Only 5 jobs in 32 are by logo employers shown above, and many employers have a grey placeholder. Kestrel's public clinic pages are only for clinics with an approved job.
- **About:** "a niche jobsite for eye care professionals in Canada. Started in 2011", operated by Eye Care Edge Ltd. (see `docs/competitor-pricing.md` on ownership). Its history since 2011 is its main strength, and the page says nothing about pay, review or candidate protections.
- **Blog:** 5 posts are visible, aimed at employers: "5 Things Every Job Posting Needs", "Making Your Optometry Practice Less Stressful For Staff", "10 Ways To Advertise Your Eye Care Job Posting", "Have Your Eye Care Job Posting Show Up On Google Jobs With Jobs4ecps" and "Top Tips For Eye Care Employers Posting A Job". Dates show a month and day with no year. Nothing for candidates, no pay data, no licensing guides. Posting is infrequent, so it is not a content threat.
- **Price:** $100 for a 30 day job posting (page source), the same as in `docs/competitor-pricing.md`.
- **Privacy policy:** wording from a UK publisher (names The Tab and babe, the EEA and ad networks), last updated July 2023, covering advertising cookies, Flash and CAN-SPAM. Ideas for Kestrel's own policy are in `docs/legal/privacy-policy-ideas-from-competitors.md`. Its wording is not to be copied.

## What this means for Kestrel

- Neither site publishes dated pay data or licensing guides that an AI assistant can quote. That is the gap the pay summary, the pay table and the licensing guides (8th December, 15th December, 19th January) are built to fill.
- Kestrel already has an `/llms.txt`, open AI crawlers and a sitemap that grows with the blog. Jobs Optometry matches on `/llms.txt`.
- Jobs4ECPs's size is the real hurdle. Aim at what it does not publish (pay by province, hiring rules, licensing) instead of competing on job count.
- Jobs Optometry is optometry only. Role and province pages for opticians and assistants are where Kestrel can be the only specialist board.
- Ask a person to open both home pages in a browser and note title, H1 and whether job pages carry JobPosting data, then add it here.
