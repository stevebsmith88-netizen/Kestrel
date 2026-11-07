# Bing, IndexNow and the search engine guidelines

7th November 2026, from Bing's Webmaster Guidelines that Steve shared. Bing's status for the home page on 8th November 2026: "Discovered on 06 Nov 2026, not crawled yet". That is the queue state for a new site, not an error on a page, but the steps below shorten the wait.

## IndexNow (built, needs one setting)

IndexNow tells Bing the moment a page is added, changed or removed, instead of waiting for a crawl. Bing's guidelines recommend it.

1. **Set `INDEXNOW_KEY`** in the live Vercel project only (not the demo) and redeploy. The key is public by design, since Bing reads it from a file on the site. Use: `48ba0c3b847275dfb3d599dcddf308cd` (any 8 to 128 letters, numbers or hyphens works).
2. **Check the key file:** `https://eyecarejobs.ca/indexnow-key.txt` should show the key and nothing else.
3. **Admin overview, "Tell search engines about every page":** sends the whole sitemap once. Do it once after step 1, and again after big changes.
4. **After that it is automatic:** the daily job sends jobs that went live, changed or ended in the last day, and blog posts dated that day. Nothing is sent while the setting is empty or on the demo site.
5. **Check it worked:** Bing Webmaster Tools, IndexNow shows the submissions.

Also in Bing Webmaster Tools, URL Submission lets Steve submit up to the daily quota by hand. Good first picks: the home page, `/clinics`, `/resources`, `/compare`, `/blog`, `/security`.

## The guidelines against our site

| Guideline | Where we are |
| --- | --- |
| Discovery: IndexNow, sitemaps, crawlable links, external links | Sitemap accepted. IndexNow built, needs the setting. Footer, blog and landing page links are normal links. External links are few so far: the LinkedIn page. Association links wait for Gate A |
| Sitemaps list only canonical URLs, with freshness | Canonical only. Blog posts and jobs carry a last changed date. Static pages carry none, because a made up date would be a false signal |
| Consolidate duplicate URLs, canonical tags | Every public page sets its canonical address. Filtered searches and empty landing pages are noindex. To check: `www.eyecarejobs.ca` should redirect to `eyecarejobs.ca` (Steve to test in a browser, set in Vercel Domains) |
| Redirects | None needed so far. Landing page and blog addresses are stable |
| Allow crawling and rendering, no content hidden behind client side code | Pages render on the server. The numbers box shows the real figures to crawlers. robots.txt does not block Bingbot, and only private areas are disallowed |
| robots.txt and meta directives | No nosnippet, noarchive or nocache on public pages. Private pages are noindex |
| Clear, original, focused content, key facts early | Blog and pay table are written for clinics and candidates, from public facts. One topic per page. The home page opening says what Kestrel is |
| Titles and meta descriptions | Every page has its own. Fixed on 8th November 2026: the home page had the default "Coming soon" title, and now has its own title, description and canonical address |
| Structured data accurate | Organization on the home page, JobPosting on live jobs matching the visible page, articles on blog posts. Breadcrumbs on landing pages |
| Entities named consistently | "Kestrel Eye Care Jobs" everywhere, and the same tagline, logo and description on the site and on LinkedIn |
| Images and alt text | Logo has alt text. The skyline is decorative, so its alt text is empty on purpose |
| Keep content up to date | Pay table refreshed yearly (`docs/pay-benchmark.md`), compare page monthly (`docs/marketing/operating-rhythm.md`), expired jobs removed |
| Avoid crawl waste | Search filters and paged results are noindex. Landing pages with no jobs are noindex and out of the sitemap |

## What we cannot change quickly

A new domain with a handful of pages and almost no links pointing at it is crawled slowly. IndexNow, URL Submission, the LinkedIn link and steady new content (the weekly blog) help. Links from associations and trade sites help most, after Gate A. Expect weeks rather than days, and use the Bing page count in Site Explorer to see progress.
