// LinkedIn, Facebook and Reddit for the social calendar (Steve, 22nd November 2026: "Reddit and LinkedIn have engagement too, linking to
// the blogs if nothing else"). The dates and the text up to 8th January come from docs/marketing/reddit-and-linkedin-calendar.md and
// docs/marketing/reddit-seed-posts.md on main (the plan of 17th November 2026): LinkedIn on Wednesday, the blog post from the day before;
// Facebook on Tuesday, the LinkedIn text from the week before without hashtags; Reddit on Friday, a discussion built on a blog post.
// All at 8 am Toronto. The January posts (L14 to L17, R11 to R13) are written here, for the 4 blog posts that go live in January.
// Nothing is posted by this file: it only feeds the calendar.

const LI = "LinkedIn: Kestrel Eye Care Jobs company page (post as the page, not your profile)";
const FB = "Facebook: the kestreleye26 Page (post as the Page, not your profile)";
const RD = "Reddit: r/EyeCareJobsCanada (post as the Kestrel account)";
const LI_NOTES = ["Check the blog link opens before posting.", "Reply to comments within 2 business days, as the Kestrel team."];
const FB_NOTES = ["Check the link opens before posting. Facebook makes the link pressable, so leave it in the text."];
const RD_NOTES = ["Reddit has its own scheduler, so you can set this up in advance for 8 am.", "Reply to every comment within a day. Never ask for upvotes.", "Check the blog link opens before posting."];

// Pulls the blockquoted text under a "## <id>." heading out of a plan document.
function section(md, id) {
  const start = md.search(new RegExp(`^## ${id.replace(".", "\\.")}[ .]`, "m"));
  if (start < 0) throw new Error(`Missing section ${id} in the plan`);
  const rest = md.slice(start);
  const end = rest.slice(3).search(/^## |^# |^---/m);
  return end < 0 ? rest : rest.slice(0, end + 3);
}
const quote = (block) => block.split("\n").filter((l) => l.startsWith(">")).map((l) => l.replace(/^> ?/, "")).join("\n").trim();
const titleOf = (block) => (block.match(/\*\*Title:\*\* (.+)/) || [])[1]?.trim();
const flairOf = (block) => (block.match(/^## R?\d+\.[^(]*\(([^)]+)\)/m) || [])[1];
// The Facebook version of a LinkedIn post: no hashtags, and the link tagged as Facebook.
const toFacebook = (text) => text.split("\n").filter((l) => !/^#\w/.test(l.trim())).join("\n").trim().replace(/utm_source=linkedin/g, "utm_source=facebook");

// January (written 22nd November 2026, from the blog posts themselves). Under 80 words each on LinkedIn, at most 2 hashtags.
const JAN = {
  L14: `Every week a rep walks into your clinic with a sample case. Many of them started exactly where you are.

Lens labs, frame companies and contact lens makers hire people who know clinics, because knowing why a remake hurts at 4 on a Saturday is hard to teach. What changes is the day: a territory, pay that is often a base plus a share of sales, and much more time on your own.

Our guide to making the move well:

https://eyecarejobs.ca/blog/clinic-to-lens-rep-supplier-role?utm_source=linkedin&utm_medium=social&utm_campaign=2027-01-supplier-role

#EyeCare #Careers`,
  L15: `Among optometrists in Canada aged 65 and over, about 1 in 7 is a woman. Among those aged 25 to 34, it is more than 2 in 3.

The 2021 census counted 6,765 optometrists, 59% of them women, and 9,775 opticians, 70% of them women. As the older group retires, the people running clinics will look different, which raises practical questions about leave, part time hours and the path to partner.

The numbers by age and province:

https://eyecarejobs.ca/blog/who-works-in-eye-care-canada?utm_source=linkedin&utm_medium=social&utm_campaign=2027-01-census

#EyeCare #Optometry`,
  L16: `Becoming an optometrist in Canada takes 3 things: a Doctor of Optometry degree, the national board exam and a licence from the province where you will practise.

There are 2 schools, Waterloo in English and Montréal in French. If you are in your final year, registration for the next OEBC exam sitting runs from 4th January to 29th January 2027.

Each step, and the routes for optometrists trained abroad:

https://eyecarejobs.ca/blog/how-to-become-an-optometrist-canada?utm_source=linkedin&utm_medium=social&utm_campaign=2027-01-become-optometrist

#Optometry #EyeCare`,
  L17: `A job ad is the cheap part of hiring. The empty chair is not.

In a worked example, a clinic doing about 230 exams a month that loses just 1 in 10 glasses sales while it is short an optician gives up about $4,700 a month. If the optometrist covers the dispensary for 1 hour a day, that is roughly $8,700 in exams not booked.

The sums, so you can work out your own:

https://eyecarejobs.ca/blog/empty-optician-chair-cost?utm_source=linkedin&utm_medium=social&utm_campaign=2027-01-empty-chair

#EyeCare #Hiring`,
};
const R_JAN = {
  R11: { flair: "Discussion", title: "Most optometrists in Canada under 35 are women, and most over 65 are men. Does that match your clinic?", body: `The 2021 census counted 6,765 optometrists in Canada, 59% of them women, and 9,775 opticians, 70% of them women. The change between generations is the striking part. Among optometrists aged 65 and over, about 1 in 7 is a woman. Among those aged 25 to 34, it is more than 2 in 3. Opticians show the same pattern, and it varies a lot by province: close to 9 in 10 opticians in Saskatchewan and Manitoba are women, and about 6 in 10 in Ontario.

We put the numbers by age and province, and what they might mean for clinics, here: [Who works in eye care in Canada? What the census shows](https://eyecarejobs.ca/blog/who-works-in-eye-care-canada?utm_source=reddit&utm_medium=social&utm_campaign=2027-01-reddit-community)

Does this match your team? And if you own or manage a clinic, has it changed how you think about part time hours, leave or the path to partner?` },
  R12: { flair: "Resource", title: "Becoming an optometrist in Canada: the degree, the board exam and the licence", body: `The steps are the same wherever you start:

- A Doctor of Optometry degree. Canada has 2 schools: Waterloo (in English) and the Université de Montréal (in French).
- The national exam from the Optometry Examining Board of Canada, a written part and a clinical OSCE. Most people sit them in their final year. Registration for the next sitting runs from 4th January to 29th January 2027.
- A licence from the regulator in the province where you will practise, each with its own requirements on top of the exam.

Our guide goes through each step, the routes for optometrists trained abroad, and how many optometrists each province has per 100,000 people. It was checked against the schools', the exam board's and the regulators' own information in November 2026, so confirm with them before you apply: [How to become an optometrist in Canada](https://eyecarejobs.ca/blog/how-to-become-an-optometrist-canada?utm_source=reddit&utm_medium=social&utm_campaign=2027-01-reddit-community)

ODs: what do you wish you had known in your final year? And if you trained abroad, which step took longest?` },
  R13: { flair: "Discussion", title: "Clinic owners and managers: what does a month without an optician actually cost you?", body: `A job ad is the cheap part of hiring. The empty chair is not, and it is easy to underestimate.

We tried a worked example. A clinic doing about 230 exams a month might write around 94 new glasses prescriptions. If just 1 in 10 of those sales walks out the door while you are short an optician, at $500 a pair, that is about $4,700 a month. If the optometrist covers the dispensary for an hour a day instead, that is roughly 43 exams a month not booked.

The sums, so you can try them with your own numbers: [What an empty optician chair costs a clinic](https://eyecarejobs.ca/blog/empty-optician-chair-cost?utm_source=reddit&utm_medium=social&utm_campaign=2027-01-reddit-community)

How long did your last optician hire take, and how did you cover the gap in the meantime?` },
};

export function otherChannels(plan, seed) {
  const L = (id) => (JAN[id] ?? quote(section(plan, id)));
  const li = (date, id, title, extra = []) => ({ date, time: "0800", platform: "LinkedIn", title: `${id}. ${title}`, type: "Company page post, text with the link (LinkedIn shows a link preview)",
    where: LI, caption: L(id), notes: [...extra, ...LI_NOTES] });
  const fb = (date, id, title) => ({ date, time: "0800", platform: "Facebook", title, type: "Page post, text with the link",
    where: FB, caption: toFacebook(L(id)), notes: [`The same text as LinkedIn post ${id}, without the hashtags.`, ...FB_NOTES] });
  const rd = (date, id, extra = []) => {
    const r = R_JAN[id] ?? { flair: flairOf(section(plan, id)), title: titleOf(section(plan, id)), body: quote(section(plan, id)) };
    return { date, time: "0800", platform: "Reddit", title: `${id}. ${r.title}`, type: `Text post, flair ${r.flair}`, where: RD,
      caption: `TITLE:\n${r.title}\n\nBODY:\n${r.body}`, notes: [...extra, ...RD_NOTES] };
  };
  // Reddit post 5 lives in the seed posts file, under a "## 5." heading, without tags on its link.
  const s5 = section(seed, "5");
  const post5 = { date: "2026-11-27", time: "0800", platform: "Reddit", title: `5. ${titleOf(s5)}`, type: "Text post, flair Discussion", where: RD,
    caption: `TITLE:\n${titleOf(s5)}\n\nBODY:\n${quote(s5).replace("https://eyecarejobs.ca/blog/ai-job-search-eye-care-canada", "https://eyecarejobs.ca/blog/ai-job-search-eye-care-canada?utm_source=reddit&utm_medium=social&utm_campaign=2026-11-reddit-community")}`, notes: RD_NOTES };
  const intro = section(plan, "L2");
  const firstComment = intro.split("**First comment, posted straight after:**")[1];
  const LAUNCH = "Launch week: if the launch is this week, post the launch announcement first and move this to the following week.";
  return [
    { date: "2026-11-23", time: "0800", platform: "LinkedIn", title: "L2. Introducing the page (post once)", type: "Company page post, then the first comment straight after", where: LI,
      caption: `${quote(intro.split("**First comment")[0])}\n\nFIRST COMMENT (post straight after):\n${quote(firstComment)}`,
      notes: ["Skip if you already posted the introduction (it was planned for 18th November).", ...LI_NOTES] },
    li("2026-11-25", "L1", "Optician pay"),
    post5,
    fb("2026-12-01", "L1", "Optician pay"),
    li("2026-12-02", "L6", "How optometrists are paid"),
    rd("2026-12-04", "R7"),
    fb("2026-12-08", "L6", "How optometrists are paid"),
    li("2026-12-09", "L8", "Becoming an optician"),
    rd("2026-12-11", "R8"),
    fb("2026-12-15", "L8", "Becoming an optician"),
    li("2026-12-16", "L10", "Assistant courses and certification"),
    rd("2026-12-18", "R9"),
    fb("2026-12-22", "L10", "Assistant courses and certification"),
    li("2026-12-23", "L12", "Independent or corporate"),
    fb("2026-12-29", "L12", "Independent or corporate"),
    li("2026-12-30", "L13", "Moving to Canada"),
    fb("2027-01-05", "L13", "Moving to Canada"),
    li("2027-01-06", "L14", "From the clinic to the road (supplier roles)"),
    rd("2027-01-08", "R10"),
    fb("2027-01-12", "L14", "From the clinic to the road (supplier roles)"),
    li("2027-01-13", "L15", "Who works in eye care (the census)"),
    rd("2027-01-15", "R11"),
    fb("2027-01-19", "L15", "Who works in eye care (the census)"),
    li("2027-01-20", "L16", "How to become an optometrist", ["Timely: OEBC exam registration closes at 12 noon Eastern on 29th January 2027."]),
    rd("2027-01-22", "R12"),
    { ...fb("2027-01-26", "L16", "How to become an optometrist"), notes: [LAUNCH, "The same text as LinkedIn post L16, without the hashtags.", ...FB_NOTES] },
    li("2027-01-27", "L17", "What an empty optician chair costs", [LAUNCH]),
    rd("2027-01-29", "R13", [LAUNCH]),
  ];
}

// Monthly check (from the plan's "What to track"): a quiet reminder, not a post.
export const CHECKS = [
  { date: "2026-12-01", time: "0900", platform: "Check", title: "Monthly numbers", type: "Reminder, not a post", where: "Instagram, LinkedIn, Facebook, Reddit and Kestrel Admin",
    caption: `Write down, beside the Search Console numbers:
Followers on Instagram, LinkedIn and Facebook.
Members on r/EyeCareJobsCanada, and which posts got replies.
Instagram: the 3 Reels with the most views and the most shares, and which got profile visits.
Sign ups by source (Admin, Waitlist shows the source; Search Console shows the rest).
1 thing to do more of next month, and 1 to stop.`, notes: [] },
  { date: "2027-01-04", time: "0900", platform: "Check", title: "Monthly numbers", type: "Reminder, not a post", where: "Instagram, LinkedIn, Facebook, Reddit and Kestrel Admin",
    caption: `Write down, beside the Search Console numbers:
Followers on Instagram, LinkedIn and Facebook.
Members on r/EyeCareJobsCanada, and which posts got replies.
Instagram: the 3 Reels with the most views and the most shares, and which got profile visits.
Sign ups by source (Admin, Waitlist shows the source; Search Console shows the rest).
1 thing to do more of next month, and 1 to stop.
Also: is the launch date confirmed? If so, the launch posts (Takes flight, the countdown Stories, Post 25) can go in.`, notes: [] },
];
