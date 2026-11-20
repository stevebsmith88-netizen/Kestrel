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

## What this means for Kestrel

- Neither site publishes dated pay data or licensing guides that an AI assistant can quote. That is the gap the pay summary, the pay table and the licensing guides (8th December, 15th December, 19th January) are built to fill.
- Kestrel already has an `/llms.txt`, open AI crawlers and a sitemap that grows with the blog. Jobs Optometry matches on `/llms.txt`.
- Jobs4ECPs's size is the real hurdle. Aim at what it does not publish (pay by province, hiring rules, licensing) instead of competing on job count.
- Jobs Optometry is optometry only. Role and province pages for opticians and assistants are where Kestrel can be the only specialist board.
- Ask a person to open both home pages in a browser and note title, H1 and whether job pages carry JobPosting data, then add it here.
