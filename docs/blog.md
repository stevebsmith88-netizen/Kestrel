# The blog

Why: helpful articles bring in people who search for things like "optician cover letter" or "how to post an eye care job", and they link to the job board. It is also where we explain the pay range, AI and vacancy rules, which helps clinics post correctly.

How it works: the posts are written in `content/posts.ts`. Each post has a `topic` (careers, applying, pay or clinics, listed in `BLOG_TOPICS` in `lib/blog.ts`), which groups it on the blog page: the newest 3 published posts first, then a tile for each topic that jumps to its list (Steve, 14th November 2026). Grouped by topic, not by month, because people search by subject; a post's address never changes. There is no editor and no database. To add a post, copy one of the blocks in that file, change the text, and run `npm test`, which checks the title and description length, the writing style and that there is no dash used as punctuation. Claude writes and adds posts; Steve reads the preview and approves.

What each page gets for search engines: its own title, description and address, an article structured data block, and an entry in the sitemap. The blog index is `/blog`, and posts are at `/blog/<slug>`.

Writing text: a blank line between paragraphs, `## ` for a heading, `- ` for a bullet list, `**bold**`, and `[text](/jobs)` for links (an address on the site, or one starting with https://).

Since 13th November 2026 (Steve asked for posts that look less plain), 3 more blocks, each with a blank line before and after:

- **Pull quote:** lines starting `> `. It shows in large chestnut serif type between big Wing Buff quote marks. Use a short, strong line from the post itself (screen readers skip it, since it repeats the text). To quote someone else, end with a line `> source: Their name`, and it is read out with the name. **Every post needs at least 1** (the tests check), placed mid post, not next to the line it repeats.
- **Table:** lines starting `|`, with the header row first and a `| --- | --- |` divider second. Use one when the reader would compare across rows: pay by province, roles side by side, a short checklist. Keep cells short so it reads on a phone.
- **Image:** a line `![Alt text](/images/blog/name.png)`, optionally followed by a caption line. The file goes in `public/images/blog` and must be listed in `lib/blog-images.ts` with its size. **Alt text is required** and says what is on the image, words included (the tests check). An image after the first paragraph sits beside the text on a computer and above it on a phone. The first image is also given to search engines as the post's picture. Use real photos (Steve, 13th November 2026), never the Instagram cards, and record where each came from and its licence beside it in `lib/blog-images.ts`.


## The home page section

The "From the blog" section on the home page (one feature and two links) is built but switched **off**. To show it, set `ENABLE_HOME_BLOG` to `yes` in the Vercel project (live, demo or both) and redeploy. The blog itself at `/blog`, its posts and the sitemap are not affected either way.

## Scheduling

A post is shown from the start of its `date` (Toronto time). Give a new post a future date and it waits: it is not on the blog, the home page or the sitemap, and its own address is a 404, until that day. The home page is rebuilt at least hourly, so it picks the post up soon after midnight Eastern.

On previews, scheduled posts are visible and marked "Scheduled for ...", so Steve can read and approve a post before it goes out. On the live site (Vercel's Production environment) they stay hidden.

Posts are now spaced about 1 a week, on Fridays (Steve asked for a faster pace to build search traffic before launch). Since 13th November 2026 there is also a Tuesday slot for search focused posts (Steve: "happy to saturate over the coming weeks"). On 13th November 2026 the AI chatbots post took 24th November and the rest of the Tuesday plan moved back 1 week. The test needs at least 3 days between posts. Never link to a post that is dated later than the one doing the linking (the tests check this). Do not change the date of a post that is already out.

Schedule so far (revised 13th November 2026 to match Instagram, Steve): 3 posts published on 30th October 2026, 1 on 6th November (choosing a buying group), 2 on 13th November (optometric assistant jobs, and how people fall into optics, brought forward because Instagram post 02 links to it), then weekly on Fridays: 20th November (the roles in eye care), 27th November (optician interview questions), 4th December (STAR questions), 11th December (writing an assistant job ad), 18th December (starting a career in optics). A "new year, new job" run in January: 8th January 2027 (writing a resume), 15th January (hire for attitude), 22nd January (attracting the right candidates). Then every 2 weeks: 5th February (phone screenings), 19th February (standing out in an interview), 5th March (independent or corporate), 19th March (moving to Canada), 2nd April (asking for a raise), 16th April (optical lab technician), 30th April (why people leave), 14th May (onboarding), 28th May (reference checks), 11th June (hiring seasonal workers). A post never links to one that is not out yet on its date. No posts on 25th December or 1st January. The 13th November post has no pay figures until the Job Bank wage reports can be checked. None of the posts uses a personal story or an unchecked statistic.

## Cadence (Steve, 14th November 2026; launch planned for Monday 25th January 2027)

2 posts a week (Tuesday and Friday) to the end of December, 1 a week (Tuesday) in January until launch, then 1 every 2 weeks after launch, then monthly with new posts. Dates: "Independent or corporate" 22nd December, "Moving to Canada" 29th December, supplier roles 5th January, who works in eye care 12th January, becoming an optometrist 19th January, empty chair 26th January (launch week), then every 2 weeks from 9th February: resume, hire for attitude, attract, phone screenings, stand out, ask for a raise, lab technician, why people leave, onboarding, reference checks, seasonal workers on 29th June. If launch moves, only the post launch dates shift. The tables below show the original plan; `content/posts.ts` holds the dates that count.

## Tuesday search posts (from 17th November 2026)

Aimed at the searches that bring people who have never heard of Kestrel: pay by role and province, and how to get into each role. Facts from public sources only (Job Bank, the provincial colleges, the schools), each checked at the time of writing and dated in the post. Steve reads each one on the preview before it goes out. Proposed order, which Steve can change:

| Date | Post | Status and what it needs |
| --- | --- | --- |
| Tue 17th November 2026 | Optician pay in Canada: what opticians earn in each province (`optician-pay-canada`) | Written. Job Bank figures revised 18th November 2026 (`lib/pay-benchmark-data.ts`, updated 18th November 2026), no Quebec |
| Tue 24th November | We asked the AI chatbots where to find eye care jobs in Canada (`ai-job-search-eye-care-canada`) | Written 13th November 2026. Light hearted, from Steve's AI visibility log (`docs/marketing/ai-visibility-log.md`). Harris Poll figures checked by Steve on 14th November 2026, with the resume figures (41% of men, 27% of women) added |
| Tue 1st December | Optometrist pay in Canada: salary, day rates and percentage deals (`optometrist-pay-canada`) | Written 14th November 2026. How pay is built, a worked sum with made up figures, questions to ask, and how Kestrel shows optometrist pay. **No Job Bank optometrist figures**, in line with Steve's 6th November decision to keep them off the public pay table; add a caveated paragraph only if Steve asks. Day rate range ($500 to $800, higher in rural areas) and the daily minimum advice are Steve's general industry view (14th November 2026), written neutrally: day rates and percentages presented as models that suit different practices, with nothing that singles out large groups, which are clients too. Photo: Canva page 11 |
| Tue 8th December | How to become an optician in Canada, province by province (`how-to-become-an-optician-canada`) | Written 14th November 2026 from the regulators' own sites and documents (`docs/blog-drafts/licensing-research-opticians.md`). Photo: Canva page 29 |
| Tue 15th December | Optometric assistant courses and certification in Canada (`optometric-assistant-certification-canada`) | Written 14th November 2026 from the CAO's CCOA pages; SAIT named without length or price (its site could not be read). Photo: Canva page 30 |
| (22nd and 29th December) | No posts over the holidays | |
| Tue 5th January 2027 | From the clinic to the road: moving into a supplier role (`clinic-to-lens-rep-supplier-role`) | Written 14th November 2026; moved up from 12th January when the locum post was parked. Builds on the field based jobs post without repeating it. Photo: Canva page 33 (a field, keeping the joke from the field based post) |
| Tue 12th January | Open | Free slot. **Locum optometrist work** is parked until Steve has found out more (14th November 2026); it can take this slot or a later one |
| Tue 19th January | How to become an optometrist in Canada (`how-to-become-an-optometrist-canada`) | Written 14th November 2026 from Waterloo, OEBC, the CAO 2025 report and the regulators. Mentions OEBC registration closing 29th January 2027: check the date before it goes out. Photo: Canva page 31 |
| Tue 26th January | What an empty optician chair costs a clinic (`empty-optician-chair-cost`), idea 14 below | Written 14th November 2026 from Steve's inputs and public sources (`docs/blog-drafts/why-pay-for-a-job-ad.md`). The sums are written out in the post (Steve decided against a calculator, 14th November 2026). Photo: Canva page 28 |
| Tue 24th November 2026 | Working in eye care in 2026: pay, hours and what to watch in 2027 (`working-in-eye-care-2026`), alongside the AI chatbots post | Added 20th November 2026 from `docs/blog-drafts/working-in-eye-care-2026.md` (2025 against 2026 Job Bank figures plus the 460 optometrist survey). Steve (20th November 2026) wanted it out sooner for search and to point Reddit at it, so it shares a day with the chatbots post (the tests allow 2 posts on 1 date). Photo: Canva page 34 (a close up eye). The report is named without a link (Steve: leave it). Ontario rules checked against O. Reg. 476/24 on 20th November 2026. Links to posts dated later than 24th November (optometrist pay, independent or corporate, who works in eye care, how to become an optometrist, empty chair) were taken out, so add them back once those are out |

Friday 29th January 2027: "Who works in eye care in Canada? What the census shows" (`who-works-in-eye-care-canada`), written 14th November 2026, photo: Canva page 32 (Steve, 14th November 2026; research in `docs/blog-drafts/women-in-eye-care-research.md`). The Fridays left open by the fortnightly run ( 12th and 26th February, 12th and 26th March, 9th and 23rd April, 7th and 21st May, 4th June) are free for more.

## What to write next (about 1 post a fortnight)

Good topics, each aimed at a real search:

1. How to become an optician in Canada, by province (check each college's current rules before publishing)
2. ~~Optometric assistant jobs in Canada: what the work is and what it pays~~ (published 31st October 2026)
3. ~~Questions to ask in an optician job interview~~ (published 31st October 2026)
4. A guide to pay ranges and pay transparency for clinics, province by province
5. Locum optometrist work in Canada: how it works
6. What an optical lab technician does
7. How to write an optometric assistant job ad
8. Working at an independent practice or a corporate group: what is different
9. How to onboard a new optician in the first 30 days
10. Moving from clinic work to a supplier or lens rep role
11. Remote and hybrid roles in eye care
12. Quebec: hiring in French in an eye care practice (when French is built)
13. ~~How to choose an optical buying group~~ (published 6th November 2026, slug `choosing-an-optical-buying-group`; research and sources kept in `docs/blog-drafts/buying-groups.md`): what to ask, why it matters to an independent practice, and a short neutral summary of the main groups in Canada, Eye Recommend included (added 6th November 2026). Public information only, every group treated the same way, every group listed alphabetically, and no line about Steve's job (his decision, 6th November 2026, so no group is favoured or put off). Check each group's current facts on its own website and name nobody's pricing or member numbers without a source.
14. **Why should I pay for a job advert?** (idea from Steve, 10th November 2026, to pick up on Wednesday 11th November 2026, not started). Aimed at the clinic owner who asks why pay when free listings exist. The post answers it honestly, in Steve's voice, and ends at the clinic page.
    - **Angle:** what a free listing really costs (time sorting through unsuitable applicants, a post that is buried, no pay range so the right people scroll past, nobody reading it before it goes live) against what a vacancy costs while it stays empty (chair time, overtime for the team, patients waiting, locum fees). Say what a paid post on Kestrel gets: pay shown on every job, a person reads the post before it goes live, candidates pick a role and province before they see it, agencies cannot post, and no charge by the click. Admit when a free listing is enough, such as a quick internal or part time role. That honesty is what makes the rest believable.
    - **Needs from Steve (do not invent):** what an empty optician or assistant position costs a clinic in a month, 1 real story of a free post that dragged on or a hire that took too long (no clinic named without asking), and what a clinic owner has told him they dislike about paying per click. All from his own experience, with no Eye Recommend material.
    - **Careful with:** any figure about what other boards charge. Use only `docs/competitor-pricing.md`, name the date it was checked, and keep the comparison on `/compare` as the place for it. Do not promise applicant numbers or time to hire. During the free launch the honest line is "free while we launch, then from $59 a post", so check `lib/pricing.ts` and the comparison page wording at the time of writing, and do not publish before pricing is switched on if the post would read as a sales page for a price that is not live yet.
    - **Search and links:** aimed at searches such as "is it worth paying for a job ad" and "cost to post an optician job in Canada". Link to `/clinics` and `/compare` near the end, and to the post "What every eye care job ad should include".
    - **Style:** paragraphs, few headings, no run of bold bullets, no "not just X, but Y" lines (see CLAUDE.md).

15. **Is optometry a good career in Canada? How an eye clinic actually makes money** (idea from Steve, 17th November 2026. **Drafted 17th November 2026 as `is-optometry-a-good-career-canada`, dated Fri 12th February 2027 (hidden on the live site until then, visible on previews), built from Steve's own Reddit answer: 2 kinds of patient, a large market, busy clinics, routes beyond ownership (associate, contact lens companies, research, dry eye), demand across the country depending on distance from cities and willingness to relocate, and exploring both independent and corporate. Steve's "15 to 20 patients a day, booked out 6 to 8 months" is softened in the post to "somewhere around 15 to 20" and "months ahead"; change it back if he wants the exact figures. No Ontario exam figures are quoted, only that coverage differs by province. Waiting for Steve to read it on the preview.** Original note: Steve sees the question regularly on Reddit, for example a 2nd year undergraduate weighing Waterloo who asks how clinics earn, whether people care about eye health, and why anyone buys glasses from an optometrist when Costco and online are cheaper). Aimed at searches such as "is optometry a good career", "how do optometry clinics make money" and "is optometry school worth it".
    - **Angle:** an honest answer to the worry. A clinic earns from exams, glasses and contact lenses, and ongoing care that brings people back more than once a year: contact lens wearers, children monitored for myopia, dry eye, and glaucoma or diabetes checks. Why people still buy from a clinic (fit, adjustments, progressives, warranty, the person who tested the eyes). That you do not have to own a clinic: associates, group employment and locum work, with a link to the pay models in the optometrist pay post. Demand outside the biggest cities. What to do before committing: shadow independent and corporate clinics. Balanced and neutral between independent and corporate, like the existing posts.
    - **The questions behind the idea (paraphrased from a Reddit thread Steve answered on 17th November 2026; do not quote the poster):** how can a clinic make money if people visit about once a year; why would anyone buy glasses from an optometrist when online and Costco are cheaper; do people care about eye health at all; is optometry a good career; do you have to own a clinic. Possible headings: how an eye clinic earns, and why patients come back more than once a year; why people still buy glasses from a clinic; why eye care is more than glasses; is optometry a good career in Canada; you do not have to own a clinic.
    - **Needs from Steve (do not invent):** what he would tell a student asking this, 1 or 2 real stories with no clinic named, and how a typical busy week looks from his side. All from his own experience, with no Eye Recommend material.
    - **Check at the source before it goes out:** which Ontario eye exams are covered by OHIP (my understanding: some age groups and medical conditions, not most adults in between) from the Ontario government's own page, and what the College of Optometrists of Ontario says about selling products such as supplements. Use figures from the Canadian Association of Optometrists report only if they were checked in the other optometrist posts. No promise of income or of a job, and no "you will earn" claims.
    - **Slot and links:** after the 19th January 2027 guide, in a free Friday in February, so it can link back to "How to become an optometrist in Canada", "Optometrist pay in Canada" and "Independent practice or corporate group" without linking forward (the tests check that). Link to `/jobs` near the end. Also a good source of Reddit discussion (a question to the community at the end).
    - **Style:** paragraphs, few headings, no run of bold bullets, no "not just X, but Y" lines (see CLAUDE.md).

16. **Buying Canadian in eye care: what the numbers say, and what to look for** (idea from Steve, 17th November 2026, not started; the Canadian mindset, supporting Canadian businesses, and why Kestrel is a Canadian job board for eye care). Aimed at searches about buying Canadian and Canadian eyewear, and at saying plainly that Kestrel is Canadian. **Not drafted: every figure below came from search summaries on 17th November 2026, the original pages could not be opened, and each must be read at its source before it goes in a post.**
    - **What the general surveys say (all taken in 2025 and 2026, mostly in the weeks of the tariff dispute, so they are stated intentions and likely overstate what people actually buy):** Leger, about 64% plan to look more actively for products made in Canada, with price the first deciding factor (67%) ahead of quality (56%). Interac, 8 in 10 likely to choose Canadian made over imported (February 2025). Narrative Research and Logit, 63% actively seeking Canadian products (February 2025), and once the labels were explained 66% preferred "Product of Canada". KPMG (February 2025, 1,934 adults), about three quarters would buy Canadian at a higher price, with 24% willing to pay 2 to 5% more and 25% saying they cannot afford any increase. Lightspeed, 71% willing to pay more, and Dalhousie's Agri-Food Analytics Lab (food only), 60.8% open to paying 5 to 10% more. BDC (April 2026), nearly 6 in 10 willing to pay more for Canadian made but only about 4 in 10 find it easy to identify what is Canadian made.
    - **What was not found:** no survey about eyewear or eye care specifically. Say so in the post. The honest line is that the general numbers show a strong preference, that people find it hard to tell what is Canadian, and that eye care offers real Canadian choices.
    - **Where eye care offers a Canadian choice (each to be verified):** Canadian owned independent clinics and optical shops; a few small Canadian frame makers (search results named makers on Prince Edward Island, in Calgary, Vancouver, Montreal and Quebec, some of them wood or handmade; two of the sources were from 2018 and 2020 and self-submitted directories are promotional, so confirm each still makes its frames in Canada before naming any); labs in Canada (a Canadian optical retailer's own lab was named; confirm); and Kestrel, a Canadian job board for Canadian eye care. Do not name a brand as Canadian made without a current source, and do not run down any other business.
    - **To check at the Competition Bureau before writing about labels:** the difference between "Product of Canada" and "Made in Canada". My understanding is that "Product of Canada" needs at least 98% of the direct costs of making the good to be Canadian, and "Made in Canada" needs at least 51% with a qualifying statement, but confirm both from the Bureau itself.
    - **Needs from Steve:** how he wants to word what "Canadian" means for Kestrel (Canadian owned and run, Canadian clinics, and personal data kept in Canada where possible, which is already a stated rule), and a real story, with no clinic named, of a Canadian clinic or maker he thinks deserves attention.
    - **Care points:** neutral and factual. Keep politics and the trade dispute out of it and do not name any country or company as a target. No claim that Kestrel is "the only" anything. No Eye Recommend material.
    - **Slot and links:** a free Friday after the optometry career post, or sooner if Steve wants it out near the Canadian shopping seasons. Links back to "Independent practice or corporate group", and to `/jobs`. Also a discussion question for r/EyeCareJobsCanada.

Rules for every post: only say what is true and current, name no real clinic without asking, include no Eye Recommend material (the one exception is post 13 above), and link to the job board or the clinic page near the end.

## Review of the 5 posts (5th November 2026): what only Steve can supply

Read for generic advice, claims nobody has checked, and the style rules in CLAUDE.md. Nothing has been rewritten yet. The 2 scheduled posts (13th and 27th November) are rewritten once Steve's notes arrive. Posts already published (30th October) keep their dates. Edits to them are a separate decision.

**Across all 5 posts**
- Most advice is smooth and general, which is the habit the style guide warns about. Each post would change most with one real story, one number, or one thing only a clinic owner would say.
- Several posts use a run of bullets that each start with a bold phrase (the interview post in every section, the optometric assistant post in "What the work involves" and "Where it can lead", the cover letter post in "A shape you can borrow"). The guide asks for paragraphs. `npm test` does not catch this one.
- Many lists have exactly 3 items. Vary them.

**Optician interview questions (scheduled 27th November)**
- Needs from Steve: a real, anonymised moment when an answer in an interview told someone a lot about a clinic (good or bad), and what the best candidates ask that others do not.
- Unchecked claims: "Opticians have more choice than most people think", "A team that stays is usually a good sign", "Many provinces require opticians to keep learning". Back each with a fact or soften it.

**Optometric assistant jobs and pay (scheduled 13th November)**
- Needs from Steve: which pre-tests an assistant really starts on, a typical first week, an assistant who moved up (anonymised), and what clinics actually pay against the Job Bank medians.
- Unchecked figures: about $23 an hour nationally, most between $18 and $30, and the provincial medians (Ontario $22, Alberta $22.50, British Columbia $25). These came from search summaries and must be checked on Job Bank before the post goes out. `jobbank.gc.ca` is blocked from this session today (see Steve's next steps, item 5).

**What every eye care job ad should include (published 30th October)**
- Needs from Steve: one weak ad line and what it cost the clinic, and what a clinic got back after rewriting it.
- Legal wording (BC pay range rule, Ontario rules from 1st January 2026) matches CLAUDE.md but has not been through the lawyer. Add it to the lawyer pack if it is not already there.

**Cover letter (published 30th October)**
- Needs from Steve: what a hiring owner actually notices in a letter, and one line that made a difference.
- Unchecked claims: "Clinics can tell when a letter was sent to 20 places", "it often makes the difference when 2 candidates look alike on paper", "100 to 200 words is plenty". Present as opinion from Steve's experience, or remove.

**Field based eye care jobs (published 30th October)**
- Needs from Steve: what a lens or frame rep's week looks like in practice, typical territory and travel, and what clinics value in a rep.
- The role descriptions are general knowledge, not checked against real job ads.

**Before any rewrite**
- Ask Steve for specifics, do not invent them. No real clinic named without asking. No Eye Recommend material.
