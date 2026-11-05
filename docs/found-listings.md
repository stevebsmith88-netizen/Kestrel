# Found listings (the seeding tool)

Admin, Overview, then the **Found listings** link under the heading (`/admin/found`). It is kept off the top menu so the admin bar stays on 1 line. It lists real jobs from a clinic's own careers page, for clinics that are not on Kestrel yet, so candidates see a fuller board before launch (Gate C: 50 live roles across 5 or more provinces). Each listing links back to the clinic's own application page, and the clinic can claim it.

**Publishing is switched off.** You can read pages and save drafts, but nothing goes public until `ENABLE_SEEDING` is set to `yes` in Vercel. Leave it off until your disclosure conversation at work has happened (CLAUDE.md, Non negotiables). Clinic outreach is a separate step and is still not connected to anything.

## How to use it

0. Don't know the careers page? Type the clinic's website into **Find a clinic's careers page**. It looks for a careers or jobs link on the home page (and, failing that, at the usual addresses such as /careers), with the same rules as the reader. Press **Use this page** next to the right one. This step uses no Claude and costs nothing.
1. Or open the clinic's careers page in your browser and copy its address.
2. Paste it into "Read a careers page", tick that it is the clinic's own website, and press **Read this page**. It takes up to a minute.
3. The reader shows each open job it found, with every fact in a form: title, role, type, place, pay, the 2 questions, the apply link and a short summary in our own words.
4. Check each one against the page, change anything that is wrong, tick "I have checked every fact", then **Save as a draft** (or, once publishing is on, **Publish for 21 days**).
5. Drafts wait at the bottom of the page. Publish one within a week of reading the page, or read the page again.

A live found listing comes down by itself after 21 days, unless the clinic claims it first. **Take it down** removes one straight away, for example when a clinic asks.

## Searching a whole province for clinics that are hiring

At the top of the page, **Search a province for clinics that are hiring**. Choose a province, optionally a role and a city, and press Search. It takes up to 2 minutes.

- **How it works.** Claude searches the web for eye care employers in the province that appear to be hiring, then finds each one's own website. It uses Claude's built-in web search on the same Anthropic key as the reader, so there is no separate search service. Web search must be switched on for your Anthropic account (Anthropic console, settings). It costs about 1 cent a search, so a province search is a few cents to 10 cents.
- **What you get.** A card for each clinic: name, town, the job, **when it was posted and the pay, only if the page says so** (otherwise "Not stated on the page"), where it was seen, and the clinic's website. Nothing is filled in by guessing.
- **Job boards.** Boards other than Indeed, LinkedIn and Jobs4ECPs can show that a clinic is hiring. They are only used to learn the clinic and the role, and the card says "Seen on a job board". Their ads are never copied. Indeed, LinkedIn, Jobs4ECPs, the college registers, social networks and anything about Eye Recommend are never used, even as a lead: the search is told not to, and anything that comes back from them is dropped.
- **Next steps on a card.** **Read their careers page** sends the clinic's own careers page to the reader below (to make a listing). **Find their careers page** fills in the finder. **Find a contact email** looks on the clinic's own home and contact pages for an address the clinic publishes (hiring words first, then the clinic's own domain, then info@ and similar). It never guesses an address, and keeps each with the page it was published on. **Save lead** keeps the clinic in your leads.
- **Saved leads** are listed lower on the page, and **Download as a spreadsheet** gives you all of them, with where and when each email was found. A lead is a note, not a listing. Nothing is published from it, and **nobody is emailed from it**. Outreach stays off until your disclosure conversation has happened and the lawyer has seen the wording.
- **Limits.** 10 searches a day. Up to 20 clinics a search, so use a city or a role to dig into a big province.
- **Tell the lawyer.** Add to the pack: a database of clinics' published business emails, kept with the page and date they were found, and an outreach email for clinics found through a job board (the current draft, Appendix E2, says "we found the job on your own careers page", which would not be true for them).

## The rules it follows

- **Only the clinic's own website.** The reader never takes a listing from a job board. Indeed, LinkedIn and Jobs4ECPs are refused in every part of the tool. Other boards are refused as a source of listings (a clinic's own website is the source), but they can point to a clinic in the province search. Recruiters, social networks and the professional colleges and associations are refused by name. Claude also checks what kind of page it is, and refuses a job board or recruiter page it does not recognise. A careers page on a hiring system for one clinic (Workable, BambooHR, Lever and similar) is fine, but then you type in the clinic's own website.
- **Nothing connected with Eye Recommend.** A page that mentions Eye Recommend anywhere, in its words or its links, is refused.
- **robots.txt is obeyed.** If a site asks automated readers to stay away, the page is not read. The reader also names itself (`KestrelEyeCareJobs`) and reads 1 page each time you press the button. It never follows links on its own.
- **Not for clinics already on Kestrel.** If a clinic with the same website has its own account, the tool says so and stops.
- **Pay must be on the page.** Every live job on Kestrel shows a pay range, so a job whose page gives no pay is left out. A single figure is fine (enter it in both boxes).
- **The 2 questions are never guessed.** "Is this an existing vacancy?" and "Does it use AI to screen?" are Yes or No only when the page says so. Otherwise the job page shows **Not stated by the clinic**. Once the clinic claims the listing, they can answer.
- **Our own words.** Claude writes a fresh summary from the facts. Before saving, the tool checks the summary does not repeat any run of 8 words from the clinic's page, and asks you to reword it if it does. Facts are free to repeat; wording is not.
- **No logo, no contact details.** The clinic profile is marked "not yet claimed", has no logo, and the summary carries no emails, phone numbers or links. Applicants are sent to the clinic's own application page.
- **No Google job markup until claimed.** Unclaimed found listings appear on Kestrel and in its search, but are not sent to Google for Jobs, because the clinic's own page is the original and we cannot know the moment a job is filled. Once claimed, the markup is added. (This is option (a) from the 30th October audit, R19.)
- **A record of where and when.** Every page read is kept in a private table, `page_reads`: the address, when, who pressed the button, and what was found. The page's wording itself is not kept. Only a set of numbers used for the copy check is stored, and the daily job clears those after 30 days. This is also the record CASL needs before any outreach (docs/casl-outreach.md).
- **A daily limit** of 60 pages a day, so a mistake cannot run up the Anthropic bill.

## Setup check

At the top of the Found listings page, **Setup check** says what this copy of the site can see: whether it is the live site, the demo or a preview, whether `ANTHROPIC_API_KEY` is present and looks right (never the key itself), the workspace setting, the database, and whether publishing is on. It opens by itself when something needs attention. **Test Claude** and **Test web search** send 1 tiny request each (a fraction of a cent, and about 1 cent) and say plainly whether it worked, or what to fix. The ad builder, the reader and the province search all use the same key, so a pass here covers all 3.

## Setting it up

1. Run `supabase/migrations/0023_found_listings.sql` and `0025_clinic_leads.sql` in the Supabase SQL editor, **on both databases** (the live project and the demo project). Or run `supabase/combined/run-everything.sql`, which now includes it. Safe to run twice.
2. Nothing new is needed in Vercel to try it. It uses the same `ANTHROPIC_API_KEY` as the ad builder.
3. When you are ready to publish (after the disclosure conversation): add `ENABLE_SEEDING` = `yes` in Vercel for the live project, and redeploy. Only add it to the demo project if you want to try publishing there, and remember the demo site is public too.
4. On the demo site, run `supabase/demo/seed.sql` again after step 1 if you want its 2 sample found listings to show "Not stated by the clinic".

If the reader says the key is not scoped to a workspace, make the key inside the Kestrel workspace in the Anthropic console, or set `ANTHROPIC_WORKSPACE_ID` (the workspace's ID) in Vercel. The ad builder uses the same key and setting.

Optional: `PAGE_READER_MODEL` chooses the Claude model (Sonnet 5.5 by default, as for the ad builder). Each page read costs a few cents at most.

## What it cannot do yet

- Some careers pages load their jobs after the page opens (with JavaScript), so the reader sees an empty page. The tool says so. Paste the link to one job instead.
- It does not recheck a live found listing's page each day. The 21 day limit and the "Take it down" button cover that for now.
- The ad builder's "Paste your job link" box for clinics will use the same page reader. It is not built yet.
- The lawyer pack asks about this (questions 16 and 32). Question 32 lists "recheck the page" among the rules: the tool covers it with the 21 day limit, a fresh reading (under a week old) before anything is published, and the Take it down button, but it does not recheck live listings each day. The tool obeys robots.txt, but it cannot read each site's own terms of use, so skip any clinic whose site says not to copy its content.
