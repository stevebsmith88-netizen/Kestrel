import type { Post } from "../lib/blog.ts";

// Blog posts, newest first. A post is shown from its date (see isPublished in lib/blog.ts), so a future date schedules it. To add one, copy a block below and change it, then check with `npm test`.
// Write the way the rest of the site reads: warm and plain, numerals, British spelling, and no dashes as punctuation.
export const POSTS: Post[] = [
  {
    slug: "ai-job-search-eye-care-canada",
    title: "We asked the AI chatbots where to find eye care jobs in Canada",
    description: "ChatGPT, Gemini, Copilot and friends are now part of the job hunt. What they told us about eye care jobs, and how to use them well.",
    date: "2026-11-24",
    body: `There was a time when looking for a new job meant the Saturday paper and a red pen. Then it meant job boards, then job alerts, then scrolling through jobs on your phone at a red light (please do not). Now a growing number of people start somewhere else entirely: they open ChatGPT, Gemini, Copilot, Claude, Perplexity or Grok and type "where can I find optician jobs near me?"

It is happening in Canada too. In a 2025 [Harris Poll for Express Employment Professionals](https://www.expresspros.ca/newsroom/news-releases/news-releases/2025/04/canadian-job-seekers-want-to-interact-with-humans-during-hiring-process-not-ai), 51% of women and 40% of men looking for work in Canada said they had never used AI in their job search. Turn that round, and about half of the women and 6 in 10 of the men had tried it. Most of them, we suspect, asked it to fix a resume. A growing share are asking it where the jobs are.

So we did what any self respecting new job board would do. We asked the chatbots about ourselves.

## The experiment

In early November 2026, we put a fixed set of questions, up to 10 each, to ChatGPT, Gemini and Copilot, each in a fresh chat, signed out wherever we could. Questions like "Is there a job board just for eye care jobs in Canada?" and "Where should an independent optometry clinic post a job ad?" Perplexity let us ask 2 before it wanted us to sign in, and Claude wanted a sign in from the start, so they sat this round out.

Kestrel was named in 0 of 21 answers. That was the expected result for a site that had not opened yet, and we are choosing to call it a baseline.

| Assistant | Questions asked | Times Kestrel was named |
| --- | --- | --- |
| ChatGPT | 10 | 0 |
| Copilot | 7 | 0 |
| Gemini | 4 | 0 |
| Perplexity and Claude | Wanted a sign in, so not counted | Not counted |

The best moment came from Copilot. Asked whether any new eye care job boards had appeared in Canada, it said there was a gap in the market for one board covering the whole eye care team, and that there was "not yet a Canadian equivalent of a comprehensive EyeCareJobs.ca". It used our own web address as its example of a thing that did not exist. We have taken it as encouragement.

## What they got right

Quite a lot, to be fair. Asked what an optician earns in Alberta, ChatGPT and Copilot both quoted the same Job Bank median, $28.00 an hour, which matches the figure in our own [pay guide](/resources#pay). Asked about Ontario's new job ad rules, they correctly said the rules apply to employers with 25 or more employees, and listed the pay range, the existing vacancy question, AI screening and the ban on asking for Canadian experience. Copilot showed its sources, and they were the right ones: the Ontario government's own guide and a few law firm explainers.

They also knew the eye care world better than we expected. The national and provincial optometry associations came up again and again, along with the opticianry programs at the colleges, the optometry schools and the regulators. A couple of answers suggested Facebook groups, which is honest, if not a hiring strategy we would build a clinic around.

## What they got wrong, or could not know

Each assistant gave a different list of job boards, because each one reads different parts of the web. Ask 3 of them the same question and you get 3 answers, all delivered with the same calm confidence.

One answer about Ontario's rules slipped in an Alberta example. Several pointed to general job boards and classified lists, where old ads can linger long after the job has gone. And none of them can tell you the thing you most want to know: is this job still open, today, and what does it actually pay? A chatbot summarises what it has read. It cannot ring the clinic.

> A chatbot summarises what it has read. It cannot ring the clinic.

## How to use AI in an eye care job search

AI is genuinely useful for the slow parts of a job hunt, as long as you check its homework. A few things we would suggest:

- Tell it your role, your province and whether you are licensed there. "Licensed optician in Halifax looking for full time work" gets a far better answer than "eye care jobs".
- Ask for its sources, then open them. If an answer points to a job, find the same job on the clinic's own website or on a board that shows when it was posted.
- Check pay against something solid. Job Bank publishes typical pay for opticians, optometric assistants and other roles by province, and our [optician pay guide](/blog/optician-pay-canada) explains what the figures mean.
- Use it to practise. Paste in a job ad and ask it for the interview questions you are likely to get. Ask it to play a tough practice manager. It will not mind.
- Let it tidy your writing, then put yourself back in. A cover letter that reads like everyone else's does you no favours, and clinics notice. Our [cover letter guide](/blog/cover-letter-optical-job) has what to keep in your own words.
- Watch for anything too good to be true. A job that asks for money, banking details or a chat on a messaging app before an interview is a warning sign, whoever found it for you. Our [fake jobs policy](/fake-jobs) explains how to report one on Kestrel.

## Where Kestrel fits

We built Kestrel so that the answer to "where are the eye care jobs in Canada?" is easy to find and easy to trust, for people and for the chatbots reading on their behalf. Every job shows its pay, says whether it is a real vacancy and whether AI screens the applicants, and comes down after 30 days. Each one has its own page that search engines and assistants can read.

We will ask the same 10 questions again every month and keep a note of who gets named. If the chatbots start mentioning us, we will let you know. If they keep mixing up Alberta and Ontario, we will let you know that too.

[See eye care jobs across Canada](/jobs)`,
  },
  {
    slug: "optician-pay-canada",
    title: "Optician pay in Canada: what opticians earn in each province",
    description: "Typical hourly pay for opticians in each province from Job Bank, what it comes to over a year, and what moves an offer up or down.",
    date: "2026-11-17",
    body: `If you are weighing up an optician job, or deciding what to offer one, the first question is what is normal where you are. The most reliable public answer comes from Job Bank, the Government of Canada's labour market service, which publishes typical hourly pay for opticians in most provinces. The figures below are from its wage dataset revised on 19th November 2025, covering surveys from 2023 and 2024.

A median is the middle figure: half of the opticians surveyed earned more, half earned less. Where Job Bank also gives a low and a high figure, those mark the middle half of pay, so about a quarter earned less than the low figure and a quarter more than the high one.

## Pay by province

| Province | Median an hour | Middle half | Over a year, at 37.5 hours a week |
| --- | --- | --- | --- |
| British Columbia | $30.82 | $23 to $32 | About $60,100 |
| Saskatchewan | $30.10 | Not published | About $58,700 |
| Manitoba | $29.69 | Not published | About $57,900 |
| Newfoundland and Labrador | $29.59 | Not published | About $57,700 |
| New Brunswick | $28.50 | Not published | About $55,600 |
| Nova Scotia | $28.07 | Not published | About $54,700 |
| Alberta | $28.00 | $25 to $39.40 | About $54,600 |
| Ontario | $24.04 | $23 to $33.65 | About $46,900 |

**British Columbia** has the highest median, and 6 provinces sit within about $2 of each other. **Alberta** has the widest spread of the 3 provinces where Job Bank gives one, with the middle half running from $25 to $39.40.

**Ontario** stands out at the other end, with a median of $24.04 and a middle half from $23 to $33.65. Job Bank does not say why Ontario is lower, and the top of its range is well above the median, so treat the median as a starting point for a conversation, not a ceiling.

Job Bank does not publish a figure for Prince Edward Island or the territories, and for the smaller provinces it gives a median only, with no low or high. It does not say how many people each figure is based on, so read the smaller provinces' numbers as a rough guide.

British Columbia needs a note of its own. Glasses there can be sold without a registered optician, though the title optician is still protected and fitting contact lenses still needs a regulated professional. Job Bank groups people by the work they do, not by whether they are registered, so the British Columbia figure may cover a wider mix of dispensing staff than in provinces where dispensing is restricted.

## What that comes to over a year

The last column of the table works each median out at 37.5 hours a week, every week of the year. These are our own sums from the hourly figures, before tax and without benefits or bonuses, and real hours vary a great deal: many opticians work 4 longer days, or part time.

> Treat the median as a starting point for a conversation, not a ceiling.

## What moves pay up or down

The province matters less than the role in front of you. Contact lens fitting, edging and lab work, frame buying, managing the dispensary and training newer staff all tend to push pay up, as does a clinic in a place where opticians are hard to find. A first job after licensing, a short week or a role that is mostly sales usually sits lower. Commission, an eyewear allowance, paid continuing education and health benefits all count too, so compare the whole offer, not only the hourly rate.

## Using these figures

If you are an optician, these numbers tell you whether an offer is in the usual range for your province, and give you something solid to point to if it is not. If you are hiring, they tell you where your range sits before you post, and what candidates will compare it with.

Several provinces now require pay to be shown on a job ad, and our [job ad checklist](/blog/eye-care-job-ad-checklist) explains what to include. You can compare all the eye care roles, province by province, in our [pay guide](/resources#pay), which uses the same Job Bank figures.

Every job on Kestrel shows its pay range, so you can see what clinics near you are offering right now.

[See optician jobs across Canada](/jobs)`,
  },
  {
    slug: "hiring-seasonal-workers",
    title: "Hiring seasonal workers: the pros and cons for an eye care clinic",
    description: "Seasonal and short term staff can cover busy weeks and holidays. Here is when it works, what it costs and how to make a short stay run smoothly.",
    date: "2027-06-11",
    body: `Eye care clinics have busy stretches. Many people use up their benefits near the end of the year. Back to school brings children in for exams. Summer means holidays and staff who are away. Some clinics hire seasonal or short term workers to get through those weeks. It can work well, and it can also cost more than it saves. Here is how to decide.

## What you gain

The most obvious benefit is cover. A short term person at the front desk or doing pre-testing means your permanent team is not stretched thin, and patients wait less. A seasonal hire is also a low risk way to see someone at work. If they are reliable, warm with patients and quick to learn, you may want to offer them a permanent or part time role, or ask them to come back next season. And it can be the right answer to a one off peak, such as a new location opening or a colleague on leave, where a permanent hire makes no sense.

> A seasonal hire is a low risk way to see someone at work.

## What it costs

Training takes time, and the shorter the stay, the larger that cost looks. If it takes 3 weeks for someone to run the pre-test equipment confidently, a 6 week contract gives you very little payoff. Patients also notice changes: a regular who sees a new face every few months may feel less looked after. And a short term hire has less reason to care about the clinic's long term standards, unless you give them one.

Some roles cannot be filled this way. Optometrists and opticians must be registered with the provincial regulator to use the title and practise, so a seasonal opening in those roles means finding someone already registered, such as a locum.

## Getting it right

Decide what the person will do, and keep it narrow: reception, booking, tidying the dispensary, or supervised pre-testing. Write a short checklist for each task so they do not have to ask about the same thing every day. Put the start date, the end date and the pay in writing before they begin. Seasonal staff are still employees and employment standards apply to them, including pay and time off. If you use a staffing agency, ask whether it is licensed where you operate.

Show the pay range in the posting, as you would for any job. Say plainly that the role is seasonal and when it ends, so the people who apply are the people who want it. Our guide to the [job ad checklist](/blog/eye-care-job-ad-checklist) lists what a post must include.

## Make the short stay count

A good first week matters even more for a short contract. Use a simple plan like the one in our post on [onboarding in the first 30 days](/blog/onboarding-first-30-days), and give the person a buddy. At the end, say thank you, ask what they noticed that your team may have missed, and tell them whether you would like them back. If the role would suit someone with no eye care background, our post on [hiring for attitude and training for skills](/blog/hire-for-attitude-train-for-skills) explains how to choose.

[See how posting works](/clinics)`,
  },
  {
    slug: "ask-for-a-raise",
    title: "How to ask for a raise in an eye care job",
    description: "Asking for more pay is easier with a plan. Here is how to prepare, when to ask, what to say and what to do if the answer is not yet.",
    date: "2027-04-02",
    body: `Asking for a raise is uncomfortable for most people. It helps to treat it as a business conversation with a plan, not a confrontation. Clinics generally expect that good staff will ask at some point, and a well prepared request is easier to say yes to.

## Know where you stand

Look at what similar roles pay. Many job ads now show a pay range, and the federal government's [Job Bank](https://www.jobbank.gc.ca/) publishes wage reports by occupation and province. Compare like with like: your role, your experience, your province and the size of the clinic. If you have gained skills since you started, such as new equipment, contact lens teaching or training others, note the date you did.

> A well prepared request is easier to say yes to.

## List what you have added

Write down what has changed since your last pay review. Examples: tasks you took on, patients or colleagues who mentioned you, problems you solved, the time you covered for someone. Keep it factual and short, a page at most.

## Choose the moment

The best time is after a good result, at a regular review, or before the clinic sets its budget. A busy Monday morning or the middle of a staffing crisis is a poor time. Ask for a short meeting and say what it is about, so the person is not caught by surprise.

## Say it clearly

Open with what you enjoy about the work, then make the request: "Based on what I have taken on and what similar roles pay, I would like to talk about moving to X." Give a number or a range, and the reasons. Then stop and let them respond.

## If the answer is not yet

Ask what would need to happen for a raise, and when you can revisit it. Get that in writing, if you can. You can also ask for things that are not pay: more hours, a course paid for, a title change or a clearer path. If the answer is a firm no and the reasons do not change, you can then decide whether it is time to look elsewhere. Our guide to [standing out in an interview](/blog/stand-out-in-interview) helps if you do.

## If the answer is yes

Thank them, confirm the date it starts and the new amount in writing, and keep delivering.

[See eye care jobs across Canada](/jobs)`,
  },
  {
    slug: "eye-care-resume",
    title: "How to write a resume for an eye care job",
    description: "A clear 1 or 2 page resume is enough for most eye care jobs. Here is what to put in it, what to leave out and how to adapt it to each application.",
    date: "2027-01-08",
    body: `A resume for an eye care job does not need to be fancy. The person reading it is often a busy owner or practice manager with a pile to get through. A clean, honest one or two pages that shows what you have done gets read.

## What to put at the top

Your name, a phone number and an email address that sounds professional, and the city and province where you live. If the job requires registration, add the regulator and your registration status, such as "Registered Optician, Ontario" or "registration in progress". You do not need a photo, your date of birth or your home address. In Canada, those are not expected, and leaving them out helps keep the process fair.

## A short summary

Two or three lines at the top that say who you are and what you offer. For example: "Optometric assistant with 3 years in a busy independent clinic, trained on imaging equipment and contact lens teaching." If you are new to eye care, say what you bring from elsewhere: customer service, retail, health care or reception.

> You do not need a photo, your date of birth or your home address.

## Your experience

List your most recent job first. For each, give the clinic or company, your title, the dates and 3 or 4 lines of what you did. Be specific: the tests you performed, the types of lens you fitted, the systems you used, how many patients a day you saw. If you have an achievement, such as training new staff or reducing waits, include it. Our post on [STAR stories](/blog/star-interview-method) can help you find the right examples.

## Skills, equipment and software

Name the instruments and the software you can use, and your languages. Be accurate: it is easy to check, and honest answers are better than long lists. If you have courses or certificates, add them with the year.

## Keep it tidy

Use a plain font, clear headings and consistent dates. Save it as a PDF and name the file with your name. Ask someone to read it for mistakes. Change the summary and the first few lines of experience for each job, so that they match the ad.

## Pair it with a cover letter

A short letter says why you want this clinic, which a resume cannot do. Our guide to [writing a cover letter](/blog/cover-letter-optical-job) shows a simple shape.

[Browse eye care jobs across Canada](/jobs)`,
  },
  {
    slug: "reference-checks-eye-care",
    title: "Reference checks: what to ask and why they matter",
    description: "A short reference call can save months of trouble. Here is who to call, what to ask and what to do with the answers.",
    date: "2027-05-28",
    body: `When a candidate has done well in 2 interviews, it is tempting to skip the reference check. It only takes 15 minutes, and it is often the most honest part of the process. Here is how to do it well.

## Ask the candidate first

Always get the candidate's permission before you contact anyone, and ask whom they would like you to call. Ask for at least 2 references, ideally a recent manager and a colleague. If the person is still at their current job and does not want to alert their employer yet, wait until you are ready to offer, and make the offer conditional on the references.

## What to ask

Start with the basics: how do you know the person, for how long and in what role? Then ask things that give you a picture of how they work:

- What were they best at?
- How did they handle a busy day or a difficult patient?
- How did they respond to feedback?
- Was their attendance reliable?
- Would you hire them again?

The last question is the most useful. A pause before the answer, or a very careful reply, tells you something. Listen for specifics. "She was wonderful" is warm, but "she took over the contact lens teaching and the patients asked for her" is evidence.

> "She was wonderful" is warm, but "she took over the contact lens teaching and the patients asked for her" is evidence.

## For regulated roles

If the role is an optician or optometrist, also confirm the person's registration with the provincial regulator. Regulators keep a public register where you can check the name, status and whether any conditions apply. Do it yourself, and note the date you checked. It is a separate step from the reference call, and it protects the clinic and the patients.

## What to do with the answers

Compare what you hear with what you saw at the interview. One lukewarm reference is worth a follow up question, not an automatic no. A pattern across 2 or 3 people deserves attention. Keep short notes and store them securely, only as long as you need them. People's personal information should be handled with care.

## Be fair

Ask the same questions about every candidate you take to this stage, and stick to what relates to the job. Do not ask about age, family plans, religion or anything else covered by human rights rules. Our [job ad checklist](/blog/eye-care-job-ad-checklist) covers the same wording rules for ads.

[See how posting works](/clinics)`,
  },
  {
    slug: "onboarding-first-30-days",
    title: "Onboarding a new optician or assistant: the first 30 days",
    description: "A simple plan for a new hire's first month in an eye care clinic: before day one, the first week and how to check in at 30 days.",
    date: "2027-05-14",
    body: `The first month decides a lot. A new person who feels welcome, knows what to do and is making progress by the end of week 4 is much more likely to stay. You do not need a big programme. You need a simple plan that you actually follow.

## Before day one

Confirm the start date, time, where to park and what to wear. If the role is regulated, check the person's registration with the provincial regulator and note it on file. Set up any logins, tell the team who is joining and assign someone to look after them, a buddy who is not the manager. Have a short plan for the first week written down.

> You do not need a big programme. You need a simple plan that you actually follow.

## The first week

Spend the first morning on the basics: a tour, introductions, the schedule and where things are kept. Explain how a patient moves through the clinic, from booking to exam room to dispensary. Let the new person shadow a colleague for most of the first days, and give them one small task they can finish, so they feel useful on day one. End each day with 5 minutes: what went well, what was confusing.

## Weeks 2 to 3

Move from watching to doing, with support. Add one or two new skills each week and write down what they have been signed off on: pre-test equipment, frame adjustments, booking, insurance steps. Keep the checklists short. Introduce them to the rest of the team, including anyone who works different days.

## Week 4 and the 30 day conversation

Sit down for 20 minutes. Ask what they enjoy, what is hard and what they need. Say what you have noticed, both good and not yet there, and agree the next 30 days. This is also the moment to correct the gap if the job is different from what the ad described, and to ask what else they would tell the next new hire. Our post on [why people leave](/blog/why-people-leave-jobs) explains why this conversation matters.

## Keep it light

A one page checklist, a buddy and 3 short check ins will do more than a long manual. If you are hiring from outside the industry, a clear plan also supports the approach we describe in [hiring for attitude and training for skills](/blog/hire-for-attitude-train-for-skills).

[See how posting works](/clinics)`,
  },
  {
    slug: "hire-for-attitude-train-for-skills",
    title: "Hire for attitude, train for skills: hiring from outside eye care",
    description: "Many good eye care staff arrive from retail, hospitality and other health jobs. Here is when hiring for attitude works, and how to train well.",
    date: "2027-01-15",
    body: `A clinic can teach someone to run a pre-test. It is much harder to teach someone to be patient with a nervous patient, to turn up on time or to care about getting a fit right. That is the thinking behind hiring for attitude and training for skills. It does not suit every role, but it suits more of them than many clinics assume.

## Where it works well

Reception and patient care, optometric assistant and technician roles, optical sales support and many lab tasks can all be learned on the job. Retail, hospitality, health care and customer service experience carry over well: people who have managed a busy shift, calmed an upset customer or kept records straight already have much of what you need. Our post on [how people fall into optics](/blog/how-people-fall-into-optics) describes how many of your current team probably started.

> A clinic can teach someone to run a pre-test. It is much harder to teach someone to be patient with a nervous patient.

## Where it does not

Optometrists and opticians must be registered with the provincial regulator before they use the title and practise, so you cannot train around that. Hire for attitude within the limits of what the role legally requires, and check registration before the first day.

## What to look for

Reliability, warmth, curiosity and the ability to take feedback matter most. Ask questions that show how someone behaves: how they handled a difficult customer, what they did when they made a mistake, what they have learned in the last year. Our guide to [STAR questions](/blog/star-interview-method) explains the format candidates may use in reply. Notice how they treat the person at the front desk.

## How to train well

A plan matters more than good intentions. Write down the first 3 months: what the person will learn each week, who teaches them, and how you will know they have it. Pair them with a patient colleague, give them short checklists for repeated tasks and review progress every couple of weeks. Make clear what you expect from them, and what they can expect from you.

## Be honest in the ad

Say you will train, and say who and how. Many strong candidates, including people moving from other careers, read "no experience necessary" as a sign the clinic has not thought about it. A clear training promise tells them you have. The [job ad checklist](/blog/eye-care-job-ad-checklist) and our post on [writing an assistant ad](/blog/optometric-assistant-job-ad) show how.

[See how posting works](/clinics)`,
  },
  {
    slug: "why-people-leave-jobs",
    title: "Why people leave eye care jobs, and what clinics can do about it",
    description: "Staff turnover costs clinics time and patients' trust. These are the common reasons people leave and practical ways to keep good people.",
    date: "2027-04-30",
    body: `Every clinic loses people. Some of it is unavoidable: people move, study or change direction. A lot of it is not. When a good optician or assistant leaves after a few months, there is usually a reason that could have been spotted earlier. Here are the ones clinics most often hear.

## The job was not what the ad said

If the ad promised one thing and the first month delivered another, trust goes quickly. That might be hours, duties, pay, or how much training was offered. The fix starts before hiring: write the ad as the job really is, and say it again at the interview. Our [job ad checklist](/blog/eye-care-job-ad-checklist) lists what to include.

## Unclear expectations and little feedback

People stay where they know what good looks like and hear how they are doing. A new hire who is left to guess, or who only hears when something goes wrong, will start looking. A weekly 10 minute check in for the first 2 months costs very little.

> When a good optician or assistant leaves after a few months, there is usually a reason that could have been spotted earlier.

## Hours and scheduling

Last minute changes, long stretches without a day off, and unpredictable evenings wear people down. Where you can, publish the schedule early, share the awkward shifts fairly and say yes to reasonable swaps.

## Pay that falls behind

People compare. If someone learns that a similar role pays more down the road, they may not say anything. They will just apply. Review pay at set times and tell people when it will happen.

## No sense of progress

Even small clinics can offer a path: more tests, a lead role, help with a course, a chance to train others. A clear answer to "where can this lead?" keeps people who want to grow.

## Not feeling heard

Staff often see problems first: a booking system that slows the day, a piece of equipment that needs attention. A clinic that listens, and acts on some of it, keeps the people who notice things.

## Ask before they go

Short "stay conversations" help: what do you enjoy, what would you change, what would make you leave? Then, when someone does leave, ask for an honest exit conversation and write down what you hear. Patterns show up quickly.

[See how posting works](/clinics)`,
  },
  {
    slug: "attract-right-candidates",
    title: "How to attract the right candidates to your clinic",
    description: "Good candidates choose clinics as much as clinics choose them. Here is what makes the right people apply, and what makes them look elsewhere.",
    date: "2027-01-22",
    body: `Most clinics hire in a hurry, when someone leaves or the schedule is stretched. That is when the ad is written fastest and the right candidate is easiest to miss. A small amount of care at the start brings better applicants and fewer weeks with an empty chair.

## Say what the job really is

Applicants decide quickly. An ad that describes the week, the tests the person will do, the team and the hours gets read. One that says "fast paced, friendly team" gets scrolled past. Our post on [writing an optometric assistant ad](/blog/optometric-assistant-job-ad) has a before and after, and the [job ad checklist](/blog/eye-care-job-ad-checklist) lists what every post should include, including the pay range.

## Show the pay and the hours

Candidates trust a clinic that is open about what the job pays, and in several provinces you have to be. Put the range in, along with the hours, any evenings or Saturdays, and when benefits start. Do it even if it feels uncomfortable. The people it puts off are the ones who would have left later.

> The people it puts off are the ones who would have left later.

## Make it easy to apply

If it takes 20 minutes to apply, the best people will not finish. Keep the form short, accept a resume and a short cover letter, and say what happens next and when. Reply to everyone, including the people you will not interview, and do it quickly. A candidate who hears back in 2 days feels very different from one who hears nothing.

## Talk about training and the team

Many good candidates are not looking for a perfect match on paper. They want to know who will teach them, what the first 3 months look like and whether the team is steady. If you have people who have stayed for years, say so.

## Use the people you already have

Staff know others in the industry. A simple referral thank you, and a short note about the job that your team can share, often brings more of the right people than any ad.

## Post where eye care people look

A general job site brings volume. A board built for eye care brings people who already work, or want to work, in it. You can post on Kestrel, and our ad builder will turn a few lines into a draft that you edit.

[See how posting works](/clinics)`,
  },
  {
    slug: "stand-out-in-interview",
    title: "How to stand out in an interview for an eye care job",
    description: "Clinics see many good candidates. These are the small things that make one memorable: preparation, curiosity, care for patients and a clear follow up.",
    date: "2027-02-19",
    body: `When a clinic interviews 4 or 5 people for one job, most of them are qualified. The person who gets the offer is often the one who made the clinic feel sure about them. You do not need to be flashy to do that. Here are the things that help.

## Know the clinic

Read the clinic's website before you arrive. Know what services it offers, whether it is independent or part of a group, and a little about the team. Mention something you noticed: the contact lens work they do, a myopia management programme, a focus on children's eye care. It shows that you chose them, and you did not send the same application everywhere.

> It shows that you chose them, and you did not send the same application everywhere.

## Show how you treat people

In eye care, patients notice how they are spoken to. Be warm and clear with the person at reception as well as with the interviewer, because they may be asked what they thought. Give examples of real situations: a nervous patient, a child who would not sit still, a patient who was not happy with their glasses. Our guide to [STAR questions](/blog/star-interview-method) shows how to turn them into short stories.

## Be specific about what you can do

Generic answers blur together. "I enjoy working with people" tells the interviewer very little. "I have fitted progressive lenses for 3 years and I like explaining to first time wearers how to adapt" tells them what you do and what you care about. If you are new to the field, say which tests or tasks you have learned, or are keen to learn.

## Ask questions that show you are thinking

Ask what a good first 3 months would look like, who you would learn from and what the clinic finds hardest about the role. More ideas are in our list of [questions for an optician interview](/blog/optician-interview-questions). Asking about pay, hours and training is normal, and it tells them you take the job seriously.

## The small things

Arrive 10 minutes early, dress as you would for work in a clinical setting, bring a copy of your resume, and switch your phone off. Afterwards, send a short thank you the same day. Clinics remember the person who followed up well.

[Browse eye care jobs across Canada](/jobs)`,
  },
  {
    slug: "phone-screening-tips",
    title: "Phone screenings: how to do well in the first call",
    description: "A short phone screen often decides whether you get an interview. Here is how to prepare, what you will be asked and how to follow up.",
    date: "2027-02-05",
    body: `The phone screen is the first conversation with a clinic, and it is usually short, around 15 to 20 minutes. It is mainly to check the basics: whether you are registered if the role needs it, whether the hours work, whether the pay is in range and whether you come across as someone patients and colleagues would like. Here is how to do well.

## Before the call

Find a quiet place and use headphones if the signal is poor. Have your resume and the job ad in front of you, with the pay range and the hours circled. Write down a 30 second introduction: who you are, what you do now and why this role. Keep a short list of your own questions as well. If the call comes when you are at work, it is fine to ask to book a time instead.

## What you will probably be asked

Why are you interested in this job, and this clinic? Tell me about your current role. Are you registered, and in which province? What hours can you work, including evenings and Saturdays? When could you start? What are you looking for in pay? Having your answers ready means you sound calm. If you are asked for a pay number, you can give a range based on the ad and what the work involves. Our guide to [job ads](/blog/eye-care-job-ad-checklist) explains why many ads now show the pay.

## During the call

Smile as you talk, because it changes your voice. Answer the question you were asked, in about 30 seconds, and pause when you need to think instead of filling the silence. If you do not understand, ask them to repeat it. Take notes on names and next steps. Ask 2 or 3 of your own questions, such as who you would work with and what the next step is.

> Smile as you talk, because it changes your voice.

## After the call

Send a short thank you email the same day. Say you enjoyed the conversation, mention one thing you learned and confirm your availability. If you are asked to an interview, our posts on [STAR questions](/blog/star-interview-method) and [interview questions for opticians](/blog/optician-interview-questions) will help you prepare.

[See eye care jobs across Canada](/jobs)`,
  },
  {
    slug: "star-interview-method",
    title: "Star questions: how to answer interview questions with a story",
    description: "The STAR method turns a vague answer into a clear one. Here is how it works, with examples from an eye care clinic.",
    date: "2026-12-04",
    body: `Interviewers like to ask "tell me about a time when..." questions. They are not trying to catch you out. They want evidence of how you behave, and a good story gives it. The STAR method is a simple way to build one.

## What STAR stands for

Situation: set the scene in a sentence or two. Task: say what you needed to do. Action: describe what you did, using "I". Result: say what happened, and what you learned. Keep the whole thing to about 2 minutes. Most people spend too long on the situation and too little on the result.

| Letter | Stands for | What to say |
| --- | --- | --- |
| S | Situation | Set the scene in a sentence or two |
| T | Task | What you needed to do |
| A | Action | What you did, using "I" |
| R | Result | What happened, and what you learned |

## An example from the dispensary

"A patient came back 3 days after picking up progressive lenses and said she could not use them. She was upset, and the clinic was busy. My task was to understand what was wrong without making her feel brushed off. I sat her down, checked how the glasses sat on her face and asked how she used them each day. The frame had slipped, so the lenses were not where her eyes were. I adjusted the fit, showed her where to look, and booked a short follow up. She stayed with the clinic, and I now check the fit before every progressive handover."

## An example from the exam room

"One morning 2 colleagues were off sick and the schedule was full. I needed to keep the optometrist on time. I suggested that I take the pre-testing for the first hour and moved the paperwork to the afternoon. We finished within 10 minutes of schedule, and the optometrist asked me to write down the order I used."

## Build your own set

Choose 4 or 5 stories before the interview. Aim for a different skill in each: a difficult patient, a busy day, learning something new, a mistake and how you fixed it, and working with a colleague you found hard. You can then bend each story to fit the question. Practise saying them out loud.

> Real, small stories land better than dramatic ones.

## Things to avoid

Do not blame colleagues, and do not make up a result. Real, small stories land better than dramatic ones, and a mistake you fixed is a good story. For the questions you should ask them back, see our guide to [interview questions for opticians](/blog/optician-interview-questions).

[Browse eye care jobs across Canada](/jobs)`,
  },
  {
    slug: "optical-lab-technician",
    title: "What an optical lab technician does, and how to get started",
    description: "Optical lab technicians turn prescriptions into finished glasses. Here is what the work involves, where it happens and how people start in it.",
    date: "2027-04-16",
    body: `When a patient picks out frames and an optician takes the measurements, someone still has to turn the prescription into a finished pair of glasses. That person is the optical lab technician. It is hands-on work for people who like precision, machines and seeing a job through from start to finish.

## The work

Details differ between labs, but the steps are familiar. Lenses start as blanks or semi-finished lenses and are shaped to the prescription. They are then cut to fit the chosen frame, a step called edging. Coatings or tints may be added, the lenses are fitted into the frame, and the finished glasses are checked with a lensometer to confirm they match the prescription before they go out. Technicians also repair frames, replace lenses and adjust how a pair sits, which is a big part of the job in a clinic.

## Where it happens

Some clinics and optical stores have a small lab on site, so edging and repairs happen the same day. Others send work to a central or wholesale lab, which handles larger volumes and the heavier lens work. Lab technicians work in both, and some move between them. Smaller clinics often ask an optician to do the lab work as well.

## How people start

Many learn on the job, starting with simple tasks such as finishing and assembly and moving on to edging and quality checks. Some opticianry programmes include lab work, and being comfortable with fine, careful work is worth more than a particular certificate. Ask the lab or clinic what training they give and who you would learn from.

> Being comfortable with fine, careful work is worth more than a particular certificate.

## What makes a good technician

Accuracy comes first, because a lens cut a fraction of a millimetre off or set at the wrong angle will not give the patient the vision the prescription promised. Patience helps, as does being comfortable with machines that grind, cut and polish. The work involves standing for long stretches, handling lenses and chemicals carefully, and wearing eye and ear protection in the lab. In a clinic lab you will also talk to opticians and sometimes to patients, so being able to explain why a pair needs another day is a useful skill.

## Questions to ask before you accept

Ask which machines you would work on and whether you would be trained on each one. Ask how much of the work is edging, how much is repairs and how much is quality checking. Ask whether the lab is on site or central, how many people work in it, and who covers when someone is away. And, as with any job, ask for the pay range and how it is reviewed.

## Where it can lead

People move from the bench into lead technician or lab manager roles, into dispensing as opticians, or into the supplier side as field service technicians who install and repair lab equipment. Our guide to [field based eye care jobs](/blog/field-based-eye-care-jobs) describes those roles.

[See eye care jobs across Canada](/jobs)`,
  },
  {
    slug: "eye-care-moving-to-canada",
    title: "Moving to Canada from another country? Working in eye care",
    description: "What to know if you trained or worked in eye care abroad: which roles need registration, where to start and how to work while you sort it out.",
    date: "2027-03-19",
    body: `If you trained or worked in eye care in another country, your skills are in demand here. The way in depends on the role, and the first step is almost always the same: ask the regulator. This post is a general guide, not legal or immigration advice, and rules change, so check each regulator's own website.

## Regulated roles: start with the regulator

Optometrists and opticians are regulated professions in Canada, and each province has its own regulator. You need to be registered in the province where you will work before you can use the title or practise. Because the rules and the process differ between provinces, contact the regulator for the province you plan to live in first, and ask what they require from someone trained outside Canada. As we understand it, the route for internationally trained professionals usually involves having your education assessed and passing national or provincial exams. For opticians, a national group of regulators (NACOR) is involved in assessing prior learning. For optometrists, national assessment and the national optometry exam are part of the process. Check the details with the regulator, because they update them.

Useful questions to ask:

- What documents do you need, and do they need to be translated or sent directly from the school?
- What exams are required, and how often are they held?
- How long does the process usually take, and what does it cost?
- Can you work in a related role while it is under way?

> You do not need to apologise for training abroad.

## Roles that do not need registration

Many clinic jobs are not regulated in the same way, including optometric assistant, reception and patient care, clinic management support and many lab and supplier roles. These can be a good way to work in a Canadian clinic, learn the systems and meet the team while you complete registration for a regulated role. Our guide to [optometric assistant jobs](/blog/optometric-assistant-jobs-canada) explains what the work involves.

## Applying

You do not need to apologise for training abroad. Describe your skills, your registration status and the languages you work in. In Ontario, employers cannot ask for "Canadian experience" in a job posting, and many clinics never wanted it. A short [cover letter](/blog/cover-letter-optical-job) that says where you are in the registration process helps a clinic understand when you could start.

[See eye care jobs across Canada](/jobs)`,
  },
  {
    slug: "independent-or-corporate-eye-care",
    title: "Independent practice or corporate group: what is different for staff",
    description: "How working in an independent eye care practice compares with a corporate group, and the questions that help you decide which one suits you.",
    date: "2027-03-05",
    body: `Eye care in Canada is a mix of independent practices, owned by an optometrist or optician, and larger groups that run many locations under one name. Both hire all the time, and neither is better. They feel different to work in, and what suits you depends on what you want from the next few years.

Practices vary a lot inside each group, so treat what follows as tendencies, not rules.

## What tends to be different in an independent practice

Decisions are usually made close by, often by the person who owns the clinic. That can mean more say over the frame collection, the suppliers and how the day runs, and a team that knows each other well. Teams are often smaller, so you may do a wider range of tasks: pre-testing one hour, dispensing the next, ordering stock after that. Pay, benefits and training are set by the owner, so they vary more from one clinic to the next, and it is worth asking about them directly.

## What tends to be different in a corporate group

Systems and training are more likely to be set out in writing: how new staff are onboarded, how patients are booked, how the dispensary is run. There may be defined steps to move up, openings at other locations, and a larger team to learn from. In return you may have less say over products and suppliers, and targets or policies that come from outside the clinic.

| | Independent practice | Corporate group |
| --- | --- | --- |
| Who decides | Usually the owner, close by | Often set centrally, with local managers |
| Range of tasks | Often wider, in a smaller team | More often defined roles |
| Training | Set by the owner, so it varies | More likely to be written down |
| Moving up | Fewer set steps | Defined steps, and other locations |
| Say over products | More | Less |

These are tendencies. Ask about the clinic in front of you.

> Both hire all the time, and neither is better.

## How to find out which one you are looking at

Ask the same questions in both. Who makes decisions about the frame collection and the schedule? What does training look like in the first 3 months? What does a typical week look like, and who covers when someone is away? How long has the team been together? Our guide to [questions to ask in an optician interview](/blog/optician-interview-questions) has more.

Kestrel lists independent and corporate practices side by side, and you can filter your search by practice type.

[Browse eye care jobs across Canada](/jobs)`,
  },
  {
    slug: "start-a-career-in-optics",
    title: "Thinking of starting a career in optics? Where to begin",
    description: "A practical first step guide for anyone curious about working in eye care in Canada: the roles, the entry points and the questions worth asking early.",
    date: "2026-12-18",
    body: `Eye care has a clear ladder in some places and a lot of side doors in others. If you are wondering whether it is for you, you do not need to decide everything today. Here is a sensible way to start.

## Find out what the jobs are

Start by learning what each role does. Our guide to [the roles in eye care](/blog/working-in-eye-care) covers optometrists, opticians, assistants, managers, lab technicians and supplier roles. Read a few job ads, too. The better ones describe the week in plain terms, and they show the pay.

## Try an entry role

The quickest way to find out if you like it is to work in it. Optometric assistant, reception and patient care, and optical retail jobs are common ways in, and many clinics will train a keen, reliable person. Ask which tests you would be trained to do, who trains you and whether there is help with courses. Our post on [optometric assistant jobs](/blog/optometric-assistant-jobs-canada) lists useful questions.

> The quickest way to find out if you like it is to work in it.

## Choose a direction

After a few months you will probably have a sense of what draws you. A few common directions:

- Becoming an optician, which is a regulated profession. You study, pass the exams and register with your province's regulator. Programmes and rules differ between provinces, so check with the regulator or a college.
- Becoming an optometrist, which means a doctor of optometry degree. Canada has two schools of optometry, one in Waterloo and one in Montréal, and entry is competitive.
- Moving into clinic management, where reliability and a head for people and systems matter most.
- Joining a supplier or lab, where your clinic knowledge is a real advantage.

None of these is a wrong turn. Many people try one and move to another.

## Give yourself a first year

A reasonable aim is to spend your first year learning the work, the patients and the team, then decide what to study or aim for next. Prepare for interviews with our questions for [optician interviews](/blog/optician-interview-questions), and send a short, honest [cover letter](/blog/cover-letter-optical-job).

[See eye care jobs across Canada](/jobs)`,
  },
  {
    slug: "optometric-assistant-job-ad",
    title: "How to write an optometric assistant job ad that works",
    description: "Most assistant ads say 'friendly, fast paced team player'. Here is how to write one that tells candidates what the job is and gets better applicants.",
    date: "2026-12-11",
    body: `Most optometric assistant ads say the same things: friendly, fast paced, a team player. They tell a candidate almost nothing, and they attract people who apply to 20 places a day. A better ad has fewer adjectives and more facts, and it is easier to write than it sounds.

## Start with the week, not the person

Say what the person will actually do. Which pre-tests will they run, and which will the optometrist keep? Is there contact lens teaching? How much of the day is at the front desk? How many optometrists work in the clinic, and which days does this role cover? A candidate who reads "pre-testing with our imaging equipment, 4 days a week alongside 2 optometrists" can picture the job. A candidate who reads "assist in a busy eye care environment" cannot.

## Put the pay and the hours where people look

In several provinces the pay has to be in the ad. On Kestrel every post also needs a yes or no on whether the vacancy is real, and a yes or no on whether you use AI to screen applicants. Beyond the rules, candidates trust an ad that gives the hours, any evenings or Saturdays, and the pay up front. Our [checklist for job ads](/blog/eye-care-job-ad-checklist) goes through each requirement.

> A better ad has fewer adjectives and more facts.

## Say how you will train

Many good assistants arrive with no eye care background, so the promise of training matters more than a long list of requirements. Who will train them, for how long, and on which equipment? If you do not ask for a certificate, say so. If you do, say which ones you accept.

## A before and after

Here is the difference on a made up clinic. The first version could be anyone: "Busy optometry clinic seeks friendly, hard working assistant to join our dynamic team. Must be a team player."

The second tells you something: "A 3 optometrist clinic in a mid sized Ontario city needs an optometric assistant, Tuesday to Saturday, with one late evening. You will run pre-testing, prepare exam rooms and teach contact lens handling, with paid training on our imaging equipment in your first month. The pay range and the benefits, and when they start, are listed below."

Keep the wording about the work and the skills, not the person. Words like "young" or "energetic" can point to age, and "Canadian experience" is not allowed in a posting in Ontario.

## Ready to post?

Kestrel's ad builder turns a few lines about the role into a draft. You edit every word, and a person reads every post before it goes live.

[See how posting works](/clinics)`,
  },
  {
    slug: "how-people-fall-into-optics",
    title: "How most people fall into optics as a career",
    description: "Few people plan a career in eye care. Here are the common ways people start, what they find when they arrive and why many of them stay.",
    date: "2026-11-13",
    body: `Ask a group of opticians, assistants and clinic managers how they got started, and the answer is rarely "I always wanted to work in eye care." It is more often "I needed a job and a friend knew a clinic," or "I was at the front desk and got curious." Eye care is a career many people fall into, and then find they like.

## The usual doors

A common start is the front desk or a part time job in an optical store, often while studying or between other plans. Some people grow up around a clinic because a parent or relative owns one. Others arrive from retail, hospitality or another part of health care, looking for work that has more purpose than the one they left. A few start as students taking a summer job and never leave.

## What they find

The work has a rhythm that suits some people very well. You meet patients, many of them regulars, you learn how the instruments work, and you can see the result of a good fitting when someone walks out seeing clearly or loving their frames. The teams are often small, so you get to know colleagues and learn from them directly. The learning does not stop: new lens designs, new equipment, new ways of managing myopia and dry eye.

> Eye care is a career many people fall into, and then find they like.

## Why it matters to the person hiring

If you hire for an entry role, you are often hiring someone who will learn the rest on the job. That means attitude, reliability and how someone treats patients are worth as much as a resume.

## If you are thinking about it

You do not need a plan to start. A clear, warm [cover letter](/blog/cover-letter-optical-job) that says why you want to try eye care is a good first step, and many clinics will train the right person. Look at the entry roles, ask what training is offered, and see how it feels after a few months. If you like it, there are routes into regulated roles such as optician, and into management and supplier roles.

[Browse eye care jobs across Canada](/jobs)`,
  },
  {
    slug: "optician-interview-questions",
    title: "Questions to ask in an optician job interview",
    description: "Practical questions for opticians to ask before accepting a job: the patients, the lab, the hours, the pay, the training and the team.",
    date: "2026-11-27",
    body: `An interview works both ways. The clinic is deciding whether you are right for the job, and you are deciding whether you want to spend your days there. A few good questions tell you more than the job ad ever will.

## About the clinic and the day

Start with the basics. Is it an independent clinic or part of a group? Neither is better, but they feel different, and the answer affects who makes decisions, how much say you have over frames and suppliers, and how you can move up. Ask who the patients are: families, older patients, children, lots of contact lens wearers, a busy specialty practice. You will do your best work if the mix suits you. Ask who chooses the frame collection and how much say the opticians have, and how many opticians and optometrists work there, because that tells you how busy you will be and who you can learn from.

Then ask what a normal week looks like, including evenings, Saturdays and holiday cover. Ask how patients move from the exam room to the dispensary, since a clinic that has thought about this usually runs more smoothly. If lab work is done on site, ask who does the edging and repairs and whether you would be trained. It is fair to ask about the equipment too, and whether you will get training on anything that is new to you.

## About pay and growth

- What is the pay range? In several provinces a job ad must show it, so it should not come as a surprise.
- If there is commission or a bonus, how exactly is it worked out, and what does a typical month look like?
- Which benefits are included, and when do they start?
- Is there help with continuing education and registration fees? Many provinces expect opticians to keep learning, and the cost adds up.
- Who would I learn from, and where could this job lead in 2 or 3 years?

> A few good questions tell you more than the job ad ever will.

## About the team, and what to watch for

Ask who you would report to and what they are like to work for. Ask why the position is open: a new role, a retirement and a replacement for someone who left are very different stories. Ask how long the team has been together.

A few things are worth a second look. No pay range anywhere. An ad that says "fast paced" without saying what that means. A role that has been open for months. Answers that change when you ask the same question twice.

## Be ready for their questions too

Have 3 short stories ready: a time you helped a difficult fit, a time you worked well with an optometrist, and a time you learned something new. A clear, warm [cover letter](/blog/cover-letter-optical-job) gives you a good start before you sit down.

[Browse eye care jobs across Canada](/jobs)`,
  },
  {
    slug: "working-in-eye-care",
    title: "Working in the eye care industry: the roles and who does what",
    description: "A plain guide to the jobs inside an eye care clinic and around it, from optometrists and opticians to managers, lab technicians and supplier teams.",
    date: "2026-11-20",
    body: `If you have only ever been on the patient side of an eye exam, the clinic can look like a small number of jobs. There are more than most people expect, and many of them need no university degree. Here is who does what.

## The clinical side

Optometrists examine eyes, test vision, diagnose and manage many eye conditions and prescribe glasses and contact lenses. They are regulated health professionals, so they must be registered in the province where they practise. Around them, optometric assistants and technicians do the first tests before the exam, prepare the room and keep the day moving. Some assistants and technicians work in specialist clinics alongside ophthalmologists, who are medical doctors and surgeons for the eye. Our guide to [optometric assistant jobs](/blog/optometric-assistant-jobs-canada) describes that work in more detail.

## The optical side

Opticians fit and adjust glasses and, depending on the province, contact lenses. They help patients choose frames and lenses that suit their prescription and their daily life. Opticians are also regulated by the province, and the rules differ from one province to the next. Behind the dispensary is the lab, where lenses are cut to fit the frame and finished. In some clinics that happens on site, and in others it goes to a central lab.

## Running the clinic

Reception and patient care teams book appointments, greet patients, handle insurance and explain what to expect. Practice and clinic managers look after staff, schedules, ordering, finances and the standards the clinic sets for itself. In a small independent practice one person may cover several of these jobs. In a larger group they are usually separate.

> People move between these roles more than you might think.

## Beyond the clinic

Lens labs, frame companies, contact lens makers, equipment suppliers and software companies all hire people who know clinics. Roles include sales and territory representatives, trainers, equipment technicians and account managers. Our guide to [field based eye care jobs](/blog/field-based-eye-care-jobs) covers them.

| Role | What they do | Provincial registration |
| --- | --- | --- |
| Optometrist | Examines eyes, diagnoses and prescribes | Required |
| Optician | Fits glasses and, in some provinces, contact lenses | Required |
| Optometric assistant or technician | Runs the first tests and keeps the day moving | Not usually |
| Reception and patient care | Books, greets and handles insurance | Not usually |
| Practice or clinic manager | Staff, schedules, ordering and finances | Not usually |
| Supplier roles | Sales, training and equipment service | Not usually |

## Where people go from here

People move between these roles more than you might think. An assistant may study to become an optician. A receptionist may become a clinic manager. An optician may move to the supplier side to train other clinics. If you are starting out, the useful question is not which job to choose forever, but which one lets you learn the most in the next 2 years.

[See eye care jobs across Canada](/jobs)`,
  },
  {
    slug: "optometric-assistant-jobs-canada",
    title: "Optometric assistant jobs in Canada: the work and the pay",
    description: "What an optometric assistant does day to day, how pay varies across Canada, and how to start or move up in an eye care clinic.",
    date: "2026-11-13",
    body: `An optometric assistant is the person who keeps an eye exam running smoothly. You are the first friendly face a patient meets after reception, and the person who gets them ready for the optometrist. It is one of the most common ways into eye care, and a good fit for someone who likes people, routine and working out how instruments behave.

## What the work involves

The details change from clinic to clinic and from province to province. Most days mix pre-testing, looking after the exam room, helping patients and some work at the front of the clinic.

Pre-testing means the first tests before the exam: taking the patient's history, measuring eye pressure, checking how the eyes work together and taking images of the eye. Which of these you do depends on the equipment in the clinic and on what the optometrist you work with is happy to hand over. Around that, you prepare and put away instruments, keep the schedule moving, explain to patients what is about to happen and, in some clinics, teach a new contact lens wearer how to put their lenses in and take them out. In a smaller clinic the job also covers booking, check in and some billing.

What an assistant may do is set by the optometrist and by the rules in your province. If a job ad is vague, ask which tests you would be trained to do, and who trains you.

## What it pays

Pay for optometric assistants varies by province, by how much experience you bring, by the equipment you are trained on, by your hours and by the size of the practice. We have not put a figure in this post, because wage numbers move and one that was right last year can mislead you in a negotiation. The federal government's [Job Bank](https://www.jobbank.gc.ca/) publishes wage reports by occupation and province, and it is the best place to see the current range for your area.

In several provinces a job ad now has to show the pay, so you should not have to guess. Our [checklist for job ads](/blog/eye-care-job-ad-checklist) explains what clinics must include, and every job on Kestrel shows a pay range.

> Do not be put off if you have no eye care experience yet.

## Getting started, and where it leads

Many clinics are happy to train a keen, reliable person on the job, and some prefer it. Others ask for a course or certificate in optometric assistant work. Ask the clinics you apply to what they prefer, and do not be put off if you have no eye care experience yet: customer service, retail, health care and reception work all count. A short [cover letter](/blog/cover-letter-optical-job) that says why you want to work in eye care often matters as much as a long resume.

From there, some assistants become lead assistants or clinic managers, and many study to become opticians. Others join a supplier as a trainer or account manager, which our guide to [field based eye care jobs](/blog/field-based-eye-care-jobs) describes.

## Questions to ask before you accept

- Which tests would I be trained to do, and who trains me?
- What are the hours, including evenings and Saturdays?
- How many assistants and optometrists work here, and how long have they been here?
- Is there help with courses or certification?
- What is the pay range, and how often is it reviewed?

[See eye care jobs across Canada](/jobs)`,
  },
  {
    slug: "choosing-an-optical-buying-group",
    title: "How to choose an optical buying group",
    description: "What a buying group does for an independent eye care practice, the questions to ask before you join, and a short look at 3 groups in Canada.",
    date: "2026-11-06",
    body: `A buying group lets independent practices buy together. One practice ordering frames and lenses has little weight with a supplier, and a few hundred practices ordering together have more. What you get beyond a discount varies a lot from group to group, and so does what you give up.

Start with what you actually buy. If most of your spend is with 3 or 4 suppliers, check that those suppliers are in the group, and ask for the discount on your real orders, not the price list. Ask whether you can still buy from a supplier outside the group, and whether any rebate depends on how much you buy from the group's preferred names.

Then look at the rest of the package. Some groups offer consolidated billing, so 1 invoice replaces a dozen. Some add practice software, staff training, marketing, patient financing or help with recruiting. Each is worth something only if you would otherwise pay for it or go without it. Add up the ones you would use and compare that with the fee, if there is one.

Ownership matters more than most practices expect. Ask who controls the group: its members, a company, or a larger retail business. Ask what happens to your terms if ownership changes, how long the agreement runs, and how you leave, including any notice period or fee. Then ask 2 or 3 current members, not the ones the group suggests, what they would change.

> Ownership matters more than most practices expect.

It is also worth asking who the group was built for. Some were started by optometrists, some serve opticians and optical shops, and a few run a separate group for each.

## A short look at 3 groups

Each of these describes itself on its own site, and details change, so check them with the group. What follows is what they say about themselves, read on 6th November 2026.

Eye Recommend is a co-operative of independent optometrists. It says members get buying power, consolidated billing, education and business support, and it runs a second group, Eye Care Collective, for optical professionals.

OSI Group (Optometric Services Inc.) says it offers discounts with more than 130 suppliers, private label products, practice software, staff training and recruiting support, and that members choose their own suppliers.

The Optical Group says it was founded in 1988 to support independent eye care professionals, and it lists group purchasing, consolidated billing, digital marketing, education and private labels.

[Post an eye care job on Kestrel](/clinics)`,
  },
  {
    slug: "eye-care-job-ad-checklist",
    title: "What every eye care job ad in Canada should include",
    description: "A plain checklist for clinics: the pay range, vacancy and AI questions, fair wording and the details that help the right person say yes.",
    date: "2026-10-30",
    updated: "2026-11-12",
    body: `A good job ad does 2 things. It helps the right person decide to apply, and it keeps you on the right side of the hiring rules that now apply in several provinces. This is the checklist we use at Kestrel. It is practical guidance, not legal advice, so check which rules apply to your employer.

## 1. Show a real pay range

Candidates trust an ad more when it says what the job pays, and some provinces now expect it. British Columbia has a pay range rule for postings, and Ontario's rules for postings changed on 1st January 2026. Whether a rule applies to you can depend on the size of your business, so it is worth checking. If you hire in Ontario, our page on [Ontario job ad rules for eye care clinics](/resources/ontario-job-ads) sets out who those rules cover and what a covered ad must include.

On Kestrel, every post needs a pay range. It can be up to $50,000 wide a year, unless the top of the range is over $200,000. Put your base pay in the range. If there is commission, a car allowance or a bonus on top, say so in a separate line.

## 2. Say whether it is a real vacancy

Applying takes time, and candidates are tired of jobs that were never going anywhere. Ontario's rules from 1st January 2026 ask employers to say whether the posting is for an existing vacancy. If you are building a pool of people for the future, that is fine. Just say so.

## 3. Say whether you use AI to screen applications

The same Ontario rules ask employers to say if they use artificial intelligence to screen, assess or select candidates. Kestrel asks a plain yes or no on every post. If your practice management software or an email tool sorts applications for you, find out how it works before you answer.

## 4. Leave out "Canadian experience"

Ontario now bans asking for Canadian experience in job postings, and it was never a good filter. It shuts out internationally trained opticians, optometric assistants and managers who may be exactly who you need. Ask for what the job really needs instead: the registration with the provincial college, the skills, the languages and the shifts you cover.

## 5. Describe the actual week

"Fast paced environment" tells a candidate nothing. These things do:

- How many optometrists and dispensers work in the clinic, and which days the role covers.
- The mix of the work: eye exams, dispensing, contact lens fits, frame styling, insurance and billing.
- The systems you use, and how new people are trained.
- What you offer beyond pay, such as benefits, continuing education or a 4 day week.

> "Fast paced environment" tells a candidate nothing.

## 6. Keep the wording fair

Words like "young", "energetic" or "digital native" can point to age. Wording about accent, family plans or religion can break human rights rules, even when it was meant kindly. Describe the work and the skills, not the person. Our review team reads every post on Kestrel for this, and the ad builder is told to avoid it.

## 7. Say what happens next

People want to know when they will hear back. A line such as "We reply to everyone within 2 weeks" is enough. On Kestrel, candidates can see whether you have opened their application and what stage it has reached, so nobody is left guessing.

## Ready to post?

Post your job on Kestrel and our ad builder will help you turn a few lines into a clear draft. You stay in control of every word, and every post is read by a person before it goes live.

[See how posting works](/clinics)`,
  },
  {
    slug: "cover-letter-optical-job",
    title: "How to write a cover letter for an optical or optometry job",
    description: "A short, honest way to write a cover letter for an optician, optometric assistant or optometry role, with what to say in each part.",
    date: "2026-10-30",
    body: `Your resume says what you have done. Your cover letter says who you are. For most eye care jobs a short, honest letter helps more than a perfect one, because the person reading it is usually a busy owner or practice manager who wants to know if you would fit in their team.

Here is a simple way to write one in about 10 minutes.

## Start with the clinic, not with you

One sentence on why you are applying to this clinic in particular. Maybe you like that it is independent, or that it fits contact lenses, or that it is near home and the hours suit you. Anything real works better than "I am writing to apply for the position".

## Say what you would bring

Pick 2 or 3 things that matter for this job, and give each a short example.

- An optician might mention frame styling, progressive fittings or how they handle a frustrated patient.
- An optometric assistant might mention pre-testing, patient flow or experience with your kind of equipment.
- A practice manager might mention scheduling, insurance billing or training new staff.

Skip the long list of skills. One true example is stronger than 5 adjectives.

> One true example is stronger than 5 adjectives.

## Be clear about the practical things

Say if you are registered with the provincial college, and which one. Say which languages you speak with patients, when you could start, and which days or hours you can work. It saves everyone a phone call.

If you trained outside Canada, you do not need to apologise for it or explain it. Clinics can no longer ask for Canadian experience in a job ad in Ontario, and many were never asking for it in the first place. Describe your skills and your registration.

## Keep it short

Between 100 and 200 words is plenty. Use plain words, and write it fresh for each job. Clinics can tell when a letter was sent to 20 places.

## Close warmly

End with something simple, such as "I would be glad to come in for a chat." Then sign off with your name.

## A shape you can borrow

| Part | How long |
| --- | --- |
| Why this clinic | 1 or 2 sentences |
| What you would bring | 2 or 3 short examples |
| When you could start | 1 sentence, with the days you can work |

## On Kestrel

When you apply through Kestrel, you can attach a cover letter to each application, and you can follow what happens next. The clinic can see whether your letter was written for them, and it often makes the difference when 2 candidates look alike on paper.

[Find eye care jobs](/jobs)`,
  },
  {
    slug: "field-based-eye-care-jobs",
    title: "Field based eye care jobs: lens reps, trainers and technicians",
    description: "What sales reps, clinical trainers, field technicians and account managers do in eye care, and how to write or find these roles.",
    date: "2026-10-30",
    body: `Not every eye care job is inside a clinic. Lens labs, frame companies, contact lens makers, equipment suppliers and software companies all hire people who spend their week travelling to practices. Kestrel lists these roles alongside clinic jobs, so a clinic hiring an optician and a supplier hiring a territory representative can both be found in one place.

## The common field based roles

**Sales or territory representative.** Visits optical practices and optometry clinics in an area, shows products such as lenses, frames, contact lenses or diagnostic equipment, and looks after the accounts. Territory size and how much of the day is travel vary a lot between companies.

**Trainer or clinical educator.** Teaches clinic teams how to use a product, a lens design or a piece of equipment, in the clinic or online. Trainers are often opticians or optometric assistants who enjoy teaching, and clinical knowledge matters here.

**Field service or equipment technician.** Installs, calibrates and repairs equipment such as lensometers, autorefractors, phoropters, edgers and imaging systems. Often travels between clinics and labs and needs to keep clear records.

**Account or practice development manager.** Works with larger or corporate accounts and helps practices grow, for example by planning a product launch or improving how they use a supplier's program.

## If you are hiring for a field role

A field role needs a few things that a clinic job does not. On Kestrel you can say them in the post:

- **The area covered.** For example Southern Ontario and Ottawa, or British Columbia and Alberta. Candidates need to know where they would be driving.
- **The city the person is based in.** That is what appears in search.
- **The pay.** You still show a base pay range, as with every post. If there is commission, a car allowance or a company vehicle, add that in the extra pay line.
- **The travel.** Describe it in plain words in the ad, such as how many nights away to expect.

## If you are looking for a field role

Questions worth asking before you apply:

- How big is the territory, and how many accounts come with it?
- What part of the pay is base, and what part depends on sales?
- Is a vehicle provided, and who pays for fuel and travel?
- How is a new person trained, and who do they call when they are stuck?
- How much is working from home, and how much is on the road?

Your clinic background is a real advantage. Opticians, optometric assistants and practice managers who move to the supplier side already speak the language of their customers.

> Your clinic background is a real advantage.

## Find or post a field based role

Employers choose **Field based** when they post a job, and candidates can filter the job search to field based roles only.

[See field based jobs](/jobs?arrangement=field)`,
  },
];
