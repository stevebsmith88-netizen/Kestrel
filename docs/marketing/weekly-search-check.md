# Weekly search check

Written 13th November 2026 for Steve. 10 minutes, once a week, on the same day (suggested: Friday). The aim is a trend over weeks, not a verdict on any 1 week. Short version: note 3 numbers from Google, glance at Bing, and once a month ask 3 AI assistants 3 questions.

If logging in or reading a screen gets in the way, send Claude a screenshot instead and Claude fills in the log at the bottom.

## 1. Google Search Console (5 minutes)

Go to search.google.com/search-console, signed in as kestrel@eyecarejobs.ca, property **eyecarejobs.ca**.

1. **Performance**, choose **7 days**. Note **Total clicks** and **Total impressions**.
2. Scroll down to the **Queries** tab. Note anything new that is not the name Kestrel (for example "optician jobs ontario"). "No data" is normal while numbers are small: Google hides rare searches.
3. **Pages** (under Indexing). Note the number of **Indexed** pages. If a page you care about is under "Not indexed", note its reason.

## 2. Bing Webmaster Tools (2 minutes)

1. **URL Inspection**, enter `https://eyecarejobs.ca`. Note whether it says indexed. (On 13th November 2026 the Live URL test passed and indexing was allowed, but the stored record still said it could not be crawled. That record catches up when Bing next visits.)
2. **IndexNow**: check that pages are being received. Kestrel's daily job sends new and changed pages.
3. If the home page is still not indexed 2 weeks after 13th November 2026 while the live test passes, use Bing's Help button and say exactly that.

## 3. Once a month: AI assistants (5 minutes, first Friday)

Only the 3 that work without signing in: **ChatGPT**, **Gemini** and **Copilot** (Copilot uses Bing). Skip Perplexity and Claude, which ask for a sign in. Ask each the same 3 questions, word for word:

1. Where can I find optician jobs in Canada?
2. Is there an eye care only job board in Canada?
3. Where should an independent optometry clinic in Ontario post a job?

Note whether Kestrel is named (yes or no) and anything surprising. The fuller 10 question list and the 7th November baseline (0 of 21 answers) are in `ai-visibility-baseline.md` and `ai-visibility-log.md`; this shorter set is the monthly habit.

## What good looks like

| When | Google | Bing | AI assistants |
| --- | --- | --- | --- |
| Now (before launch) | A handful of clicks, mostly people searching the name. Average position near the top (it was 2.1 on 13th November 2026) | Home page indexed | Not named, which is expected |
| 1 to 3 months | Impressions from searches that are not the name, landing on blog posts and pay guides. Average position drops to 10 to 30 for a while, which is a good sign: Google is trying Kestrel on wider searches | Most public pages indexed | Possibly named for "eye care job board Canada" |
| 3 to 6 months, after launch | Job pages appearing in Google's job results. Clicks rising week on week | Steady | Named for some questions |

**When to tell Claude:** a fall in indexed pages, a page "Not indexed" with a reason other than "Discovered, currently not indexed", or a security or manual action message in Search Console. Anything else is normal noise.

## Log

| Week ending | Google clicks (7 days) | Google impressions (7 days) | Indexed pages | Bing home page indexed | New queries worth noting | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 13th November 2026 | 3 (28 days) | 30 (28 days) | Not checked yet | No (live test passes) | Mostly the name | Starting point. CTR 10%, average position 2.1 |
