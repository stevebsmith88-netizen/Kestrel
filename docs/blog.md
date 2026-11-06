# The blog

Why: helpful articles bring in people who search for things like "optician cover letter" or "how to post an eye care job", and they link to the job board. It is also where we explain the pay range, AI and vacancy rules, which helps clinics post correctly.

How it works: the posts are written in `content/posts.ts`. There is no editor and no database. To add a post, copy one of the blocks in that file, change the text, and run `npm test`, which checks the title and description length, the writing style and that there is no dash used as punctuation. Claude writes and adds posts; Steve reads the preview and approves.

What each page gets for search engines: its own title, description and address, an article structured data block, and an entry in the sitemap. The blog index is `/blog`, and posts are at `/blog/<slug>`.

Writing text: a blank line between paragraphs, `## ` for a heading, `- ` for a bullet list, `**bold**`, and `[text](/jobs)` for links (an address on the site, or one starting with https://).

## The home page section

The "From the blog" section on the home page (one feature and two links) is built but switched **off**. To show it, set `ENABLE_HOME_BLOG` to `yes` in the Vercel project (live, demo or both) and redeploy. The blog itself at `/blog`, its posts and the sitemap are not affected either way.

## Scheduling

A post is shown from the start of its `date` (Toronto time). Give a new post a future date and it waits: it is not on the blog, the home page or the sitemap, and its own address is a 404, until that day. The home page is rebuilt at least hourly, so it picks the post up soon after midnight Eastern.

On previews, scheduled posts are visible and marked "Scheduled for ...", so Steve can read and approve a post before it goes out. On the live site (Vercel's Production environment) they stay hidden.

Posts are now spaced about 1 a week, on Fridays (Steve asked for a faster pace to build search traffic before launch). The test needs at least 7 days between posts. Never link to a post that is dated later than the one doing the linking (the tests check this). Do not change the date of a post that is already out.

Schedule so far: 3 posts published on 30th October 2026, 1 on 6th November (choosing a buying group), then weekly on Fridays: 13th November (optometric assistant jobs), 20th November (the roles in eye care), 27th November (optician interview questions), 4th December (how people fall into optics), 11th December (writing an assistant job ad), 18th December (starting a career in optics), 8th January 2027 (independent or corporate), 15th January (moving to Canada), 22nd January (optical lab technician), 29th January (STAR questions), 5th February (phone screenings), 12th February (standing out in an interview), 19th February (attracting the right candidates), 26th February (why people leave), 5th March (hire for attitude), 12th March (onboarding), 19th March (reference checks), 26th March (writing a CV), 2nd April (asking for a raise), 9th April (hiring seasonal workers). No posts on 25th December or 1st January. The 13th November post has no pay figures until the Job Bank wage reports can be checked. None of the posts uses a personal story or an unchecked statistic.

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
13. ~~How to choose an optical buying group~~ (published 6th November 2026, slug `choosing-an-optical-buying-group`; research and sources kept in `docs/blog-drafts/buying-groups.md`): what to ask, why it matters to an independent practice, and a short neutral summary of the main groups in Canada, Eye Recommend included (added 6th November 2026). Public information only, every group treated the same way, a plain line saying Steve works at Eye Recommend, and no publishing until his disclosure conversation has happened. Check each group's current facts on its own website and name nobody's pricing or member numbers without a source.

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
