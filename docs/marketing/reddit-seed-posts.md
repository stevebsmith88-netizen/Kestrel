# r/EyeCareJobsCanada: setup checklist and the first 5 posts

Written 15th November 2026 for Steve to run with. The community is at https://www.reddit.com/r/EyeCareJobsCanada/ (Restricted, posts need approval). The plan and decisions are in item 22 of `CLAUDE.md`. Post from the Kestrel account only, never a personal one. Every fact below is from Job Bank or from Kestrel's own blog posts, so nothing needs checking again except the dates.

## Status (16th November 2026)

Done by Steve on 15th and 16th November 2026:

- **Post flairs:** Discussion, Resource, Job brief (mods only), Question and Pay talk, in the brand colours (Navy, Mist, Chestnut, Wing Buff and Line), ordered with Job brief last.
- **Member flairs:** the 9 roles, all Mist with dark text, and **Kestrel team** (Deep Chestnut, mods only) on the Kestrel account. Text and editing are off, so nobody can type a claim such as a registration number.
- **Widgets:** community details (nicknames and description), the "Kestrel Job Board" button widget (Job Board, Pay Guide, Blog, each tagged) and the "Start here" text widget. The wording of "Start here" was changed from "Every job posted here shows its pay", because there are no jobs yet. The post flair widget is left off until there are a few posts.
- **Posts:** the welcome post is up and pinned in Community highlights (16th November), "What would make you apply" is up with a Kestrel comment under it (16th November), and the optician pay post is scheduled for the morning of 17th November, after its blog post is live, so it can carry the blog link itself (comment 2 is then not needed). Wednesday 18th November is free.
- **AutoModerator:** a rule comments on any post that looks like a job ("hiring", "job opening" and similar) and points clinics to the sign up page, with moderators exempt. It was saved on 16th November. Still to do: make sure the first line `---` has no spaces before it, then test it once by setting `moderators_exempt` to `false`, posting "We are hiring an optician", checking the comment, deleting the test and setting it back to `true`. It rarely fires while the community is Restricted.
- **Welcome message:** limit is 200 characters. Wording chosen: "Welcome to r/EyeCareJobsCanada, a home for people in eye care across Canada. Read the welcome post and say hello: what is your role, and what do you wish you had known when you started?" (185 characters).

Still to do:

- **Rules:** the community still shows only 2 rules (respect, no spam). Add "Every job post shows its pay", "No agencies or recruiters" and "No personal details", so they match the welcome post.
- **Profile:** replace the Kestrel account's bio with: "Eye care jobs across Canada, with pay shown on every post. Opening in early 2027. Run by Kestrel Eye Care Jobs, eyecarejobs.ca. Come and say hello in r/EyeCareJobsCanada." (170 of 200 characters), and add the website as a profile link.
- **Reddit's "Get ready for visitors" checklist** on the community page.
- **Posts 4 and 5** (20th and 24th November) go on Reddit's own scheduler, as post 2 did.
- **Job Bank:** Job Bank publishes its next wage file on 18th November 2026. Refresh the pay table (`docs/pay-benchmark.md`) before post 4 goes out, and note the change in a follow up post.

Decisions of 16th November 2026:

- **Reddit API:** not used. Reddit's own scheduler covers the need, and the terms for commercial use were not clear from what could be found (third party sources only: written approval for new API access, commercial use under a separate agreement, no published commercial price). Read Reddit's own terms before any automation. A middle step is possible later: the site prepares the post text and link for each new blog post and sends it to Slack, and a person adds the question and posts it.
- **Reddit Pro (beta):** useful for ideas. Search it for eye care keywords (optician, optometrist, optometric assistant, contact lens, dispensing, optical) rather than "Jobs Canada". Paraphrase themes, never quote a commenter without asking. Themes that fit Kestrel: take it or leave it offers, ghosting, crowded applicant pools, and healthcare as a steadier field.
- **Reddit ads:** not yet. No jobs to show, a small audience, and posting opens in early 2027. Revisit after launch with a small test (for example $150 to $300 over 2 weeks, Canada only, tagged links). Third party sources put the minimum at about $5 a day and clicks at roughly $0.59 to $1.47. A spending decision for Steve.

## Setup first (about 10 minutes)

1. **Community details widget.** Weekly visitors' nickname: `Visitors` (or `Readers`). Weekly contributions nickname: `Contributions` (not `Online`, which would read as "5 Online"). In the description, change "Weekly job briefs by province" to "Weekly job briefs by province are coming" and add "Run by Kestrel Eye Care Jobs, eyecarejobs.ca." at the end (it is 364 of 500 characters now).
2. **Link back.** Add a link widget to https://eyecarejobs.ca (Mod Tools, then Widgets or Menu), and put the website in the Kestrel account's profile bio.
3. **Flairs:** Discussion, Resource, Job brief, and 1 per province later. Rules already include respect, pay shown on every job, no agencies or recruiters, and no personal data.
4. **Pin the welcome post** once it is up.

## Flairs and widgets (decided with Steve, 15th November 2026)

**Post flairs** (the tag on a post; a post carries only 1): Discussion, Resource, Job brief, Question, Pay talk. No flair per province for now, because a post can only carry 1. A weekly brief uses Job brief with the province in the title ("Ontario: eye care jobs this week"). Split out province flairs later if the briefs grow.

**Member flairs** (the tag beside a username; people choose their own, optional): Optometrist, Optician, Optometric assistant, Technician, Practice manager, Clinic owner, Supplier, Student, Other. Give the Kestrel account the mod set flair **Kestrel team**. Roles only: no province, employer, registration number or proof, so nobody is shown to be verified and nobody is pushed to share who they are.

**Widgets** (Mod Tools, Widgets). Keep to 3 plus the ones Reddit adds itself (community details, rules, moderators):
1. **Button widget**, named "Kestrel Job Board", with the description "Eye care jobs across Canada, with pay shown on every post. Run by Kestrel Eye Care Jobs." Use text buttons, not image buttons, for now (an image button would need an upload; if one is added later it must be the existing Kestrel logo file, never redrawn). Each button has its text and a link. Tag every link as in `docs/utm-guide.md`, with source `reddit`, medium `social` and campaign `2026-11-reddit-community`:
   - Kestrel job board: `https://eyecarejobs.ca/?utm_source=reddit&utm_medium=social&utm_campaign=2026-11-reddit-community`
   - Pay guide: `https://eyecarejobs.ca/resources?utm_source=reddit&utm_medium=social&utm_campaign=2026-11-reddit-community#pay`
   - Blog: `https://eyecarejobs.ca/blog?utm_source=reddit&utm_medium=social&utm_campaign=2026-11-reddit-community`
   Drag the widget to sit just under the community details (Edit Widgets).
2. **Text widget** "Start here": "New here? Read the pinned welcome post. Every job posted here shows its pay."
3. **Post flair widget**, switched on once there are a few posts.

Skip the calendar, image, community list and related communities widgets for now: they make an empty community look busier than it is.

## The order to post

| When | Post | Flair | Notes |
| --- | --- | --- | --- |
| Tue 17th November | 1. Welcome | Discussion, pinned | **Posted.** Post first, so the community has a front door |
| Wed 18th November | 2. Optician pay by province | Pay talk | **Posted** (flair Pay talk). The blog post is live from 17th November |
| Fri 20th November | 4. Who does what in a clinic | Resource | The blog post goes live that day. The page now has 3 posts |
| Fri 27th November | 5. We asked the AI chatbots | Discussion | The blog post is live from 24th November |
| Done | 3. What would make you apply | Discussion | **Posted** early, with 1 comment so far |

The dated plan after this, with LinkedIn and Facebook, is `reddit-and-linkedin-calendar.md`. Reddit runs about 1 post a week from here (revised 17th November 2026).

After that: about 1 post a week, tied to a recent blog post, always with a question at the end. Reply to every comment within a day, as the Kestrel account. Keep a note of which posts get replies, since the replies are the ideas for later blog posts. Never use another account or ask people to upvote.

## 1. Welcome (pin it)

**Title:** Welcome to r/EyeCareJobsCanada

> This is a home for the people who work in eye care across Canada: optometrists, opticians, assistants, technicians, practice managers and the clinics that hire them. We will share jobs that show their pay, plus honest conversation about hiring, working and moving in this profession.
>
> A few ground rules: every job post shows its pay, no agencies or recruiters, no personal details, and be kind. Posts need approval for now, to keep spam out.
>
> To get us started: what made you choose eye care, and what do you wish you had known when you began?
>
> Kestrel Eye Care Jobs runs this community. Our job board and guides are at [eyecarejobs.ca](https://eyecarejobs.ca/?utm_source=reddit&utm_medium=social&utm_campaign=2026-11-reddit-community).

### Welcome post edit: where else to find us (Steve's idea, 17th November 2026)

Edit the welcome post (the 3 dots, then Edit post) and add this paragraph before the last line. Add the Facebook line once the Page has its first post (Tue 24th November in the calendar). Editing keeps the pin and any comments.

> You can also find Kestrel here: [Instagram](https://www.instagram.com/kestreleye26/) for guides and things we hear in clinics, [LinkedIn](https://www.linkedin.com/company/kestrel-eye-care-jobs/) for pay and hiring posts, and [eyecarejobs.ca](https://eyecarejobs.ca/?utm_source=reddit&utm_medium=social&utm_campaign=2026-11-reddit-community) for the blog, the pay guide and the job board when it opens.

## 2. Typical optician pay by province (on or after 17th November)

**Title:** Typical optician pay by province, from Job Bank

> We pulled together what Job Bank, the Government of Canada's labour market service, publishes for opticians. These figures come from its wage data revised 19th November 2025, covering surveys from 2023 and 2024.
>
> The median is the middle figure: half of opticians surveyed earned more, half earned less. The middle half is the range between the low and high figures, where Job Bank gives them.
>
> | Province | Median an hour | Middle half |
> | --- | --- | --- |
> | British Columbia | $30.82 | $23 to $32 |
> | Saskatchewan | $30.10 | Not published |
> | Manitoba | $29.69 | Not published |
> | Newfoundland and Labrador | $29.59 | Not published |
> | New Brunswick | $28.50 | Not published |
> | Nova Scotia | $28.07 | Not published |
> | Alberta | $28.00 | $25 to $39.40 |
> | Ontario | $24.04 | $23 to $33.65 |
>
> A few notes. Job Bank does not publish a figure for Prince Edward Island or the territories. British Columbia's figure may cover a wider mix of dispensing staff, because glasses there can be sold without a registered optician. Ontario's median is the lowest, but the top of its range is well above it, so treat any median as a starting point for a conversation and not a ceiling.
>
> The full write-up, with what moves pay up or down, is here: https://eyecarejobs.ca/blog/optician-pay-canada
>
> Does this match what you see where you work or hire? And what is missing from these numbers?

## 3. What would make you apply

**Title:** What would make you apply for a job in eye care?

> Whether you are an optician, an optometric assistant, a technician or an optometrist, you have read plenty of job ads. Some make you want to call the clinic that afternoon. Others make you close the tab.
>
> What is the one thing an ad could say, or show, that would make you apply? Pay, hours, the team, training, the kind of patients, a mentor, something else?
>
> And if you are on the hiring side: what do you wish candidates understood about your clinic before they applied?
>
> No right answers. Short replies are welcome, and so are long ones. If you are curious how Kestrel shows pay on every job, our [pay guide](https://eyecarejobs.ca/resources?utm_source=reddit&utm_medium=social&utm_campaign=2026-11-reddit-community#pay) has typical pay by role and province.

## 4. Who does what in an eye care clinic (on or after 20th November)

**Title:** Who does what in an eye care clinic? A plain guide to the roles

> If you have only been on the patient side of an eye exam, a clinic can look like a few jobs. There are more, and many of them need no university degree. A short map:
>
> | Role | What they do | Provincial registration |
> | --- | --- | --- |
> | Optometrist | Examines eyes, diagnoses and prescribes | Required |
> | Optician | Fits glasses and, in some provinces, contact lenses | Required |
> | Optometric assistant or technician | Runs the first tests and keeps the day moving | Not usually |
> | Reception and patient care | Books, greets and handles insurance | Not usually |
> | Practice or clinic manager | Staff, schedules, ordering and finances | Not usually |
> | Supplier roles | Sales, training and equipment service | Not usually |
>
> Behind the dispensary there is also the lab, where lenses are cut to fit the frame. And around clinics, lens labs, frame companies, contact lens makers and software companies all hire people who know clinics.
>
> People move between these roles more than you might expect. An assistant may study to become an optician. A receptionist may become a clinic manager. An optician may move to the supplier side to train other clinics.
>
> The full guide is here: https://eyecarejobs.ca/blog/working-in-eye-care
>
> Which role did you start in, and where are you now? If you are hiring, which role is hardest to fill?

## 5. We asked the AI chatbots (on or after 24th November)

**Title:** We asked ChatGPT, Gemini and Copilot where to find eye care jobs in Canada. Here is what they said

> More people now start a job search by typing a question into an AI assistant. So in early November 2026 we put a fixed set of questions to ChatGPT, Gemini and Copilot, like "Is there a job board just for eye care jobs in Canada?" and "Where should an independent optometry clinic post a job ad?"
>
> What they got right: asked what an optician earns in Alberta, ChatGPT and Copilot both quoted the same Job Bank median, $28.00 an hour. They also described Ontario's new job ad rules correctly, and pointed to the national and provincial optometry associations and the college programs.
>
> What they got wrong or could not know: each gave a different list of job boards, one answer about Ontario slipped in an Alberta example, and none of them can tell you whether a job is still open today or what it really pays. A chatbot summarises what it has read. It cannot ring the clinic.
>
> Our write-up, with tips for using AI in a job search without being burned by it, is here: https://eyecarejobs.ca/blog/ai-job-search-eye-care-canada
>
> Have you used an AI assistant to look for work, or to write a job ad? What did it get right, and what did it get wrong?
