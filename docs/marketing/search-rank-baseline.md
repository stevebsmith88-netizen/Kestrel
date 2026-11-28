# Search ranking baseline: Google and Bing by hand

Started 20th November 2026. Takes about 45 minutes once a month, on the first Monday, alongside the AI prompt check in `ai-visibility-baseline.md`. Done by hand (Steve or a virtual assistant). No scraping, and no rank checking tool that reads Google's results pages.

The numbers from Google Search Console (Performance, Queries) and Bing Webmaster Tools (Search Performance, Keywords) are the real record of average position. This sheet covers what those cannot show: what a person in Canada actually sees, including the AI Overview and sponsored results.

## How to run it

1. Private or incognito window. Signed out of Google.
2. Set the location to Canada (Google, Tools or "Choose area" under the search box) so results are Canadian.
3. Search the phrase exactly as written. Do not reword it.
4. Record the page (1 is the first page) and the position on it (count organic results only, not ads, maps or the AI Overview). If Kestrel is not on pages 1 to 3, write "not found".
5. Note separately: is Kestrel named in the AI Overview, and is it a link (L) or plain text (T)?
6. Note which sites are above Kestrel. The same few names will repeat. Those are the real competitors.
7. Repeat the first 8 on Bing (Copilot too if you wish).
8. Add a row to the log in `search-rank-baseline.csv` (open it in Excel or Sheets).

## The 30 searches

Brand (checks that the name is found)

1. Kestrel Eye Care Jobs
2. eyecarejobs.ca
3. Kestrel eye care jobs reviews

Broad (the 2 already checked on 20th November 2026: both on page 1, named in the AI Overview)

4. eye care jobs in Canada
5. eye care job boards in Canada
6. optometry jobs Canada
7. optician jobs Canada
8. optometric assistant jobs Canada

Role and province (what the `/eye-care-jobs` pages should win)

9. optician jobs Ontario
10. optician jobs British Columbia
11. optician jobs Alberta
12. optometrist jobs Ontario
13. optometrist jobs Alberta
14. optometrist jobs British Columbia
15. optometric assistant jobs Ontario
16. ophthalmic technician jobs Canada
17. patient care coordinator eye clinic jobs

Pay (what the pay table and pay summary should win)

18. optician salary Canada
19. optician salary Ontario
20. optometrist salary Canada
21. optometric assistant salary Ontario
22. eye care pay Canada 2026

Licensing and career (the 3 licensing guides and the career posts)

23. how to become a licensed optician in Ontario
24. how to become an optometric assistant in Canada
25. how to become an optometrist in Canada

Clinics hiring (the compare page, the For clinics page and the buying group post)

26. where to post optician job Canada
27. post an optometry job Canada
28. Jobs4ECPs alternative
29. Indeed alternative for hiring eye care staff
30. how to choose an optical buying group

## Reading the results

- Page 1 for a role and province search is a win. Page 2 or 3 means the page exists but needs links and content. "Not found" means check Search Console that the page is indexed.
- A result that appears in the AI Overview as plain text (T) when a competitor is a link (L) is still progress. Track how many of the 30 move from T to L over time.
- Do not chase 1 search. Look at the monthly count: how many of the 30 are on page 1, and how many AI Overviews name Kestrel.
- Do not use this sheet to decide on Google Ads until the sign up gate is open (see `discoverability-plan.md`).
