# Lens 6: SEO and public performance
Reach: rendered every public page from the local production build (fake database with 3 sample jobs) and read the code behind them; measured page weight, LCP and CLS with Playwright on a throttled phone profile. Could not check the live site, Google's own tools (Rich Results Test, Search Console) or Vercel's edge caching, and could not render an expired or closed job (the fake database ignores those filters), so expiry was proven from code.

## Findings

### 6.1 Every shared link says "Coming soon, join the waitlist"
- Severity: High  | Confidence: Confirmed
- For Steve: when a clinic or candidate shares a job link on LinkedIn, Facebook, WhatsApp, Slack or by text, the preview card says "Kestrel Eye Care Jobs | Coming soon" and "Join the waitlist to hear first when we launch", not the job title and pay. Clinics sharing their own posts is free reach, and this preview wastes it.
- Evidence: app/layout.tsx:17-23 sets openGraph title "Kestrel Eye Care Jobs | Coming soon" for the whole site. Only blog posts override it (app/blog/[slug]/page.tsx:26). curl of /jobs/11111111-... shows `<title>Optician at Harbourside Optical, Victoria, British Columbia | ...` but `og:title "Kestrel Eye Care Jobs | Coming soon"`, `og:description "... Join the waitlist ..."`, and the same twitter:title. Same on /jobs, /clinics, /blog, /privacy, /terms, /posting-policy, /contact. Blog posts set their own openGraph but, because that replaces the parent's, they lose the image: `twitter:card "summary"` and no og:image.
- Detail: Next.js merges metadata by key, so a page that sets only title and description keeps the layout's openGraph block. No page sets og:url either, except blog posts.
- Proposed fix: in the job page's generateMetadata return `openGraph: { title, description, url, type: "website" }` matching the page title and pay line; give /jobs, /clinics and /blog their own openGraph; add `images: ["/brand/kestrel-lockup-full.png"]` to the blog openGraph; change the layout default to a neutral "Canada-wide eye care job board" line at launch. | Effort: 1 to 2 hours | Who: Claude

### 6.2 robots.txt blocks the public "For clinics" page
- Severity: Medium  | Confidence: Confirmed
- For Steve: the page that sells Kestrel to clinics (/clinics) is hidden from Google by mistake, because the rule meant for the private clinic area also catches it. Clinics searching for a place to post an eye care job will not find that page.
- Evidence: app/robots.ts:7 `disallow: [... "/clinic", ...]`; served robots.txt has `Disallow: /clinic`. robots.txt rules match by prefix, so `/clinic` also matches `/clinics`. app/sitemap.ts:16 lists `/clinics`, so Search Console will report "Submitted URL blocked by robots.txt".
- Detail: the same prefix logic is why `/claim` is fine (the public claim page lives at /jobs/<id>/claim). Every other disallowed path checked has no public neighbour.
- Proposed fix: change the entry to `"/clinic/"` (with the trailing slash) and keep `/clinic` noindexed through its own pages, or rename the rule list to exact folders with trailing slashes. | Effort: minutes | Who: Claude

### 6.3 Job search filter pages can flood Google with near duplicates
- Severity: Medium  | Confidence: Confirmed
- For Steve: every combination of search words, province, role, practice type and page number is a separate address with the same title and description. Google may waste its visits on hundreds of near identical search pages instead of the job pages that matter, and show them as duplicates.
- Evidence: curl of `/jobs`, `/jobs?province=Ontario` and `/jobs?q=optician&page=2` all return 200 with title "Find eye care jobs | Kestrel Eye Care Jobs", the same description, no `<link rel="canonical">` and no robots meta (app/jobs/page.tsx:9-12 sets title and description only). The blog links straight to a filtered address (content/posts.ts:145 `/jobs?arrangement=field`).
- Detail: there is no canonical anywhere except job pages, blog pages and the quiz.
- Proposed fix: on /jobs, set `alternates.canonical: "/jobs"` and, when `q` or `page` is present, `robots: { index: false, follow: true }`. Later, if search traffic matters, build a small set of real landing pages (for example /jobs/ontario or /jobs/optician) with their own titles. | Effort: 1 hour (canonical and noindex), days (landing pages) | Who: Claude

### 6.4 The path from Google for Jobs to an application leaks new candidates
- Severity: Medium  | Confidence: Confirmed (sign up), Possible (directApply)
- For Steve: most people who arrive from Google for Jobs will be new to Kestrel. When they click Apply, then "Create a free account", the site forgets which job they wanted, so after confirming their email they land on their dashboard and must find the job again. Some will not bother.
- Evidence: app/jobs/[id]/apply/page.tsx:36 `Sign in` carries `?next=/jobs/<id>/apply`, but line 37 links to plain `/sign-up`; components/AuthForms.tsx only SignInForm (lines 64-70) accepts `next`. Separately, lib/jobs.ts:317 marks every Kestrel apply job `directApply: true`, while applying needs an account, email confirmation and a saved CV first.
- Detail: Google describes "direct apply" as starting the application on the page without extra hurdles; an account wall may not qualify, and a mismatch can count against the listing. I could not check Google's current wording from here.
- Proposed fix: pass `next` through sign up, the confirmation email link and /welcome, so a new candidate returns to the apply page; set `directApply` to false until there is a guest apply path, or confirm Google's current definition first. | Effort: 2 to 3 hours | Who: Claude

### 6.5 Seeded listings get full Google job markup with nothing to catch stale jobs
- Severity: Medium  | Confidence: Possible (policy risk; the markup itself is Confirmed)
- For Steve: Google punishes job sites that keep jobs marked up after they have closed, and the penalty can hit all of a site's jobs, not just one. A seeded job copied from a clinic's careers page can be filled and removed by the clinic tomorrow, but Kestrel will keep telling Google it is open for 21 days.
- Evidence: app/jobs/[id]/page.tsx:32 adds the JSON-LD for every live job with a clinic, with no check of `is_seeded`; the seeded sample (22222222) gets the same full JobPosting block as a paid post (only `directApply: false` differs, which is correct). Nothing in the daily job rechecks `source_url`.
- Detail: the seeded page also duplicates the clinic's own posting, which Google tends to prefer; the markup has no way to say "copied from", and that is fine. The seeding tool is not built yet, so this is a decision to make before it is.
- Proposed fix: Steve decides one of: (a) no JSON-LD on unclaimed seeded listings (safest; they still appear on Kestrel and in its search), or (b) keep it, and have the daily job check each seeded `source_url` still answers and still names the role, expiring it if not. | Effort: 30 minutes for (a), half a day for (b) | Who: Steve decides, Claude builds

### 6.6 Public pages that could be cached are rebuilt on every visit
- Severity: Low  | Confidence: Confirmed
- For Steve: the blog, terms, posting policy, contact, job search and job pages are built fresh for every visitor and every Google visit, only so the menu can say "My dashboard" to people who are signed in. That makes them a little slower to start loading on Vercel and uses server time the site does not need to spend.
- Evidence: .next/prerender-manifest.json lists only /, /clinics, /privacy, /forgot-password, /goodbye, robots and sitemap as static. curl -I shows `Cache-Control: private, no-cache, no-store` on /jobs, /jobs/<id>, /blog, /blog/<slug>, /terms, /posting-policy and /contact. Cause: `getSession()` reads cookies (for example app/blog/[slug]/page.tsx:49, which also makes its generateStaticParams pointless). Each job page view also runs the same database query twice: the fake database log shows 2 identical `GET /rest/v1/jobs?select=id,employer_id,...` per view, from generateMetadata (app/jobs/[id]/page.tsx:16) and the page (line 28); getLiveJob is not wrapped in React `cache()` and its `new Date()` filter makes the two URLs differ, so Next cannot merge them.
- Detail: locally the effect is tiny (time to first byte 5 to 27 ms), so this is about cold starts and Supabase round trips on Vercel, and about Google crawling job pages often. Job pages being live is defensible (expiry must be instant), so the cheap wins are the content pages.
- Proposed fix: drop `session` from the header on blog, terms, posting policy and contact (or show the signed in menu from a small client component), wrap getLiveJob in `cache()` with the time rounded to the minute. | Effort: 1 to 2 hours | Who: Claude

### 6.7 The sitemap silently drops every job if the database call fails, and keeps that for an hour
- Severity: Low  | Confidence: Confirmed
- For Steve: if Supabase is slow or unreachable at the moment the sitemap is rebuilt, Google is handed a sitemap with no jobs in it, and it stays that way for up to an hour. It happened in this test: the sitemap was built before the stand in database was running, and it lists 11 pages and 0 jobs.
- Evidence: lib/public-jobs.ts:96-100 `const { data } = await db.from("jobs")...; return data ?? [];` ignores the error. app/sitemap.ts:6 `revalidate = 3600`. Local /sitemap.xml: 11 `<url>` entries, none under /jobs/, header `x-nextjs-cache: HIT`.
- Detail: on Vercel the first sitemap is made during each deploy, then refreshed at most hourly, so a new job reaches the sitemap within 1 to 2 hours, which is fine. `lastModified` uses `posted_at` (sitemap.ts:23), so approved edits to a live job are never signalled; jobs already has `updated_at` (migration 0005). Static pages have no lastmod.
- Proposed fix: in the sitemap, throw when the query errors so Next keeps the last good copy; use `updated_at` for lastmod. | Effort: 30 minutes | Who: Claude

### 6.8 Small structured data and metadata slips (7 items)
- Severity: Low  | Confidence: Confirmed
- For Steve: none of these stops a job appearing on Google; together they make the job data a little cleaner and closer to the "matches the page exactly" rule.
- Evidence and fixes:
  1. lib/jobs.ts:303 turns newlines into `<br>` but does not escape `&`, `<` and `>` first, so a post that says "<2 years experience" would be read by Google as a broken HTML tag. Escape first, then add `<br>`.
  2. Field roles: the area covered ("Southern Ontario and Ottawa") and "Also part of the pay" (commission, company vehicle) show on the page but not in the markup (lib/jobs.ts:298-320). Append them to the markup description, as they are already visible.
  3. lib/jobs.ts:307 sends the clinic website as `sameAs`, but the website is not shown on the job page. Show it on the page, or drop it from the markup.
  4. lib/jobs.ts:287 maps Locum only to `TEMPORARY`; Google accepts a list, so `["TEMPORARY", "CONTRACTOR"]` (or `PER_DIEM` for day rate locums) describes locum work better.
  5. A closed or unknown job returns a proper 404 with noindex, but its title is "Kestrel Eye Care Jobs | Coming soon" (the job page's own "Job not found" title is replaced by the root one). Harmless while noindexed; fix with the layout default in 6.1.
  6. The share image is a 3108 x 1618 PNG of 175 KB (public/brand/kestrel-lockup-full.png); social sites expect about 1200 x 630.
  7. Blog Article markup (app/blog/[slug]/page.tsx:34-45) has no `image`, which Google recommends for article results.
- Proposed fix: as listed. | Effort: 1 to 2 hours in all | Who: Claude

### 6.9 Field based job search loses its filter on page 2 and shows the wrong empty message
- Severity: Low  | Confidence: Confirmed (from code)
- For Steve: someone searching only for field based jobs sees every kind of job from page 2 onwards, and if no field jobs exist they are told "Job search opens soon, join the waitlist". The blog links straight to this search.
- Evidence: app/jobs/page.tsx:18 builds the Next and Previous links from `["q", "province", "role", "type", "practice"]`, leaving out `arrangement`; line 27 `filtered` also ignores `arrangement`. content/posts.ts:145 links to `/jobs?arrangement=field`.
- Detail: only shows once there are more than 20 jobs (PAGE_SIZE, lib/public-jobs.ts:5), or when the field filter returns nothing.
- Proposed fix: add `"arrangement"` to both lists. | Effort: minutes | Who: Claude

### 6.10 Editing a live job takes it off Google until it is re-approved
- Severity: Low  | Confidence: Confirmed (from code and docs)
- For Steve: when a clinic fixes a typo in a live job, the job page disappears (page not found) until you approve the change. If Google visits in that gap it drops the job from Google for Jobs, and it can take days to come back.
- Evidence: supabase/migrations/0014_live_edits_and_waitlist_confirmation.sql allows `live` to `in_review`; lib/public-jobs.ts:89 only shows `status = 'live'`; docs/clinics-and-jobs.md:71 says "the job is offline until an admin approves them". (The same doc says at lines 13 and 59 that live jobs cannot be edited, which is out of date.)
- Detail: a deliberate safety choice, but it costs search visibility, and the comment at the top of migration 0014 ("nothing changes on the public site") is not quite true.
- Proposed fix: keep the approved version live while the edit waits (store the edit as a pending copy), or accept the trade off and make sure edits are reviewed the same day. Fix the docs either way. | Effort: 1 day (pending copy), minutes (docs) | Who: Steve decides, Claude builds

### 6.11 Search Console and Analytics are not set up in the code
- Severity: Low  | Confidence: Confirmed (code), Possible (live)
- For Steve: the plan's Phase 1 checklist says to connect Google Search Console and Google Analytics, and Phase 2 says to submit the sitemap. There is no verification tag and no analytics in the site, so unless you verified the domain another way, Google is not yet reporting how the job pages are doing.
- Evidence: grep for google-site-verification, gtag, googletagmanager, @vercel/analytics and plausible across app, components, lib, public and package.json: no matches. business-plan-v7 Phase 1 "Connect Google Search Console and Google Analytics"; Phase 2 "Submit the sitemap in Search Console". app/privacy/page.tsx:75 says the site uses no tracking tools.
- Detail: Search Console is best verified as a Domain property with a DNS TXT record at Namecheap, which needs no code. Analytics is a choice: a cookie free tool (Vercel Web Analytics or Plausible) avoids a consent banner; Google Analytics needs the privacy policy updated and probably consent (lens 4).
- Proposed fix: Steve adds the Search Console DNS record and submits /sitemap.xml; pick an analytics tool, then Claude adds it and updates the privacy policy. | Effort: 30 minutes (Steve), 1 hour (Claude) | Who: Steve, then Claude

### 6.12 Idea: tell Google the moment a job goes live or closes
- Severity: Idea  | Confidence: Likely
- For Steve: Google offers a special fast lane (the Indexing API) only for job pages. Using it would get new jobs into Google for Jobs within hours instead of waiting for Google to reread the sitemap, and remove closed ones just as quickly. That matters when posts only live for 21 to 30 days.
- Evidence: today the only signals are the hourly sitemap (app/sitemap.ts) and Google's own crawl; nothing is sent on approval (lib/admin-actions.ts) or expiry (app/api/cron/daily/route.ts).
- Detail: needs a Google Cloud service account added as an owner in Search Console, one server side call on approve, close and expire, and a new secret listed in docs/security.md.
- Proposed fix: add after Search Console is verified. | Effort: half a day | Who: Steve (Google account), Claude (code)

## Good things worth keeping (short bullets, with evidence)
- Expiry is instant and clean: getLiveJob only returns jobs with `status = 'live'` and `expires_at` in the future, checked at the moment of the request (lib/public-jobs.ts:89-90), so a job disappears when it expires even if the daily job has not run. The page then returns a real 404 with `noindex` and no JSON-LD (app/jobs/[id]/page.tsx:17, 29, 32). Tested: unknown and malformed job ids and unknown blog slugs return status 404, not a soft 404. The not found page says "the job may have closed" and links to all jobs (app/not-found.tsx).
- JobPosting markup on all 3 sample jobs has every field Google requires and most it recommends: title, description, datePosted, validThrough, employmentType in Google's values, hiringOrganization, jobLocation with addressRegion as a code (BC, ON) and addressCountry CA, baseSalary in CAD with HOUR or YEAR, identifier, url, and directApply false for the seeded external job. Title, pay, type, location, posted and closing dates all agree with the visible page. The JSON is escaped against script injection (page.tsx:37). The field role uses its base city, which is sensible.
- Private pages are kept out of Google: account areas are disallowed in robots.txt, and apply, report, claim, sign in, sign up, reset, goodbye and waitlist confirm all send `noindex`.
- Each job page has its own title ("Optician at Harbourside Optical, Victoria, British Columbia"), a description with the pay, and a canonical address. Blog posts have titles, descriptions, canonicals, Article markup, dates, a clear h2 structure and links to /jobs and /clinics. Every page has `lang="en-CA"` and 1 h1.
- Light and fast on a phone: on a throttled phone profile (4x slower CPU, 1.6 Mbps, 150 ms latency) pages weigh 231 to 330 KB in all, Largest Contentful Paint is 0.5 to 0.8 seconds and layout shift is under 0.04 (good is under 0.1). The skyline goes through next/image and reaches a phone as a 60 KB WebP at 1200 px instead of the 426 KB PNG. Fonts are self hosted with `font-display: swap`, and only the Latin files are downloaded (3 to 6 files of 8 to 25 KB). Static files are cached for a year.
- No horizontal scrolling at 390 px on the home page, job search, all 3 job pages, a blog post or the 404 page (screenshots in $S/lens-6/m-*.png).

## Steve's checks (things only he can verify on the live system: exact page or setting, click path, what he should see)
1. Open https://eyecarejobs.ca/robots.txt and check the line `Disallow: /clinic`. Then in Search Console (if set up), URL inspection on https://eyecarejobs.ca/clinics should say "Blocked by robots.txt". That confirms 6.2.
2. Paste a live job link into a LinkedIn post draft or a WhatsApp chat to yourself (do not send). The preview should show the job title; today it will say "Coming soon". That confirms 6.1.
3. Search Console: are you verified for eyecarejobs.ca? If not, Search Console, Add property, Domain, copy the TXT record into Namecheap's Advanced DNS, then submit https://eyecarejobs.ca/sitemap.xml under Sitemaps.
4. Once a real job is live, run its address through Google's Rich Results Test (search "Rich Results Test"); it should find 1 valid "Job posting" item with no errors.
5. Open https://eyecarejobs.ca/sitemap.xml and check the addresses start with https://eyecarejobs.ca (this depends on NEXT_PUBLIC_SITE_URL in Vercel) and that live jobs are listed.
6. Check that www.eyecarejobs.ca redirects to eyecarejobs.ca (or the other way round) in one step, so Google sees one version of each page (Vercel, Project, Settings, Domains).

## Not audited, and why
- Google's own validators (Rich Results Test, Search Console coverage) and the live site: no access to Google or eyecarejobs.ca from here.
- An expired or closed job rendered for real: the fake database ignores the status and date filters and is baked into the build at port 54399, so a different fake would not be used. The behaviour was proven from the query code instead (it is the same code path as an unknown id, which was tested).
- Vercel edge caching, cold start times and real Core Web Vitals: only measurable on Vercel; local numbers above are from `next start` on the same machine, so time to first byte is unrealistically low.
- Signed in pages: no real sessions here; they are noindexed or disallowed, so out of scope for SEO.
- Lighthouse scores: Lighthouse is not installed and installing it was not needed for the findings above.
