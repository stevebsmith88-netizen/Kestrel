// Posts added to the calendar on 22nd November 2026 (Steve): the Reels and Stories made from 21st to 22nd November, fitted into the free
// days between the posts already scheduled (none of those move), weighted towards the rest of 2026 to bring people to the profile and
// sign up before launch. Launch countdown clips are held back until the launch date is confirmed. The founder Reel waits for the
// disclosure conversation. Every post is at 7 pm Toronto, like the rest of the calendar.
const R = "design/social-and-merch/instagram-guides/";
const cover = (f) => `${R}${f}.mp4 · cover ${R}${f}-cover.jpg (Edit cover, Add from camera roll)`;
const REEL = "Reel. Show in profile grid: OFF";
const STORY = "Story with a poll sticker (add the sticker in the app, in the empty space below the drawing)";
const JOB_BANK = "Source: Job Bank wages, Employment and Social Development Canada (Labour Force Survey 2024 to 2025). Contains information licensed under the Open Government Licence – Canada.";

export const BATCH = [
  { date: "2026-11-24", platform: "Instagram", title: "Story poll: Better 1... or 2?", type: STORY, file: `${R}story-poll-1-better-1-or-2.png`, loc: "",
    caption: "Poll options: 1 / 2", alt: "", notes: ["The next day, share the result as a Story."] },
  { date: "2026-11-28", platform: "Instagram", title: "Reel: 3 questions to ask in an optician interview", type: REEL, file: cover("questions-reel"), loc: "Canada",
    caption: `Got an optician interview coming up? Ask these 3 questions.

1. What does a normal week look like, including evenings, Saturdays and holiday cover?
2. If there's commission or a bonus, how exactly is it worked out, and what does a typical month look like?
3. Why is the position open? A new role, a retirement and a replacement for someone who left are very different stories.

On Kestrel Eye Care Jobs, you won't need to ask about the pay range: every job shows it. The full guide, with more questions and what to watch for, is in the link in bio.

#Opticians #InterviewTips #EyeCareJobs #OpticianLife #CanadaJobs`,
    alt: "A short animation. Text reads: Got an optician interview coming up? Ask these 3 questions. 3 navy cards flip over to show why each matters: What does a normal week look like? Including evenings, Saturdays and holiday cover. If there's commission or a bonus, how is it worked out? And what does a typical month look like? Why is the position open? A new role, a retirement and a replacement for someone who left are very different stories. Then: On Kestrel, you won't need to ask about the pay range. Ends with the Kestrel Eye Care Jobs logo.",
    notes: ["The guide went live on 27th November, so the link in bio points to it."] },
  { date: "2026-11-29", platform: "Instagram", title: "Reel: Guess the pay, optician, Ontario", type: REEL, file: cover("guess-the-pay-1"), loc: "Canada",
    caption: `Guess the pay: optician, Ontario.

A, B or C? Comment your guess before you watch to the end.

The typical (median) pay for an optician in Ontario is $29.00 an hour, and half earn between $23.44 and $35.43. Commission, an eyewear allowance and benefits matter too, so compare the whole offer.

On Kestrel Eye Care Jobs, you'll never have to guess: every job shows its pay. Pre launch is open. Create your account: link in bio.

${JOB_BANK}

#Opticians #OpticianPay #EyeCareJobs #OntarioJobs #PayTransparency`,
    alt: "A short quiz animation. Text reads: Guess the pay. Optician, Ontario. A, $22 an hour. B, $29 an hour. C, $36 an hour. Comment A, B or C. After a 5 second countdown, B is revealed: typical (median) pay $29.00 an hour. Half of opticians in Ontario earn between $23.44 and $35.43 an hour. Then: On Kestrel, you'll never have to guess. Every job shows its pay.",
    notes: ["Reply to guesses in the comments."] },
  { date: "2026-12-01", platform: "Instagram", title: "Reel: Job ad makeover (for clinics)", type: REEL, file: cover("makeover-reel"), loc: "Canada",
    caption: `"Competitive pay. Fast paced. Must be a team player." Sound familiar?

Here's the same optician ad, rewritten the way candidates want to read it: the actual pay range, the real week, who they'll work with, and 2 straight answers. Is it an existing vacancy? Do you use AI to screen applicants?

Clear ads get better applicants. On Kestrel Eye Care Jobs, the form asks for all of this, the pay guide shows how your range compares with what's typical in your province, and the ad builder drafts the listing for you.

Pre launch is open. Set up your clinic: link in bio.

#EyeCareJobs #Hiring #ClinicOwner #Optometry #PracticeManagement`,
    alt: "A short animation for clinics. Text reads: Your job ad, before and after. A plain ad says Optician wanted, Competitive pay, Fast paced busy clinic, Must be a team player. A chestnut feather scribbles out each line and the rewrite appears: Optician, Alberta, Full time. $27 to $33 an hour, plus an eyewear allowance, in line with what's typical in Alberta. 4 days a week, Tuesday to Friday, about 25 patients a day. You'll work alongside 2 opticians and an optometrist. Existing vacancy: Yes. Uses AI to screen candidates: No. Then: Clear ads get better applicants. Ends with the Kestrel Eye Care Jobs logo.",
    notes: ["Share to LinkedIn too: clinic owners are there."] },
  { date: "2026-12-04", platform: "Instagram", title: "Reel: Job ad phrases, translated", type: REEL, file: cover("phrases-reel"), loc: "Canada",
    caption: `Job ads have their own language. Here's the translation.

"Competitive salary": we'd rather not say yet. Ask for the pay range.
"Fast paced environment": it's busy. Ask how many patients a day.
"We're like a family": lovely, but hours matter too. Ask about evenings and Saturdays.
"Wear many hats": you might do a bit of everything. Ask what a typical day looks like.
"Must be flexible": the schedule may change. Ask how far ahead it's set.

On Kestrel Eye Care Jobs, you won't need to ask the first one: every job shows its pay. Which phrase have you seen most?

Pre launch is open. Create your account: link in bio.

#EyeCareJobs #JobSearch #Opticians #OptometricAssistant #CanadaJobs`,
    alt: "A short animation. Text reads: Job ads have their own language. Here's the translation. 5 phrases are circled by a chestnut feather, each with a translation and a question to ask: Competitive salary, we'd rather not say yet. Fast paced environment, it's busy. We're like a family, lovely but hours matter too. Wear many hats, you might do a bit of everything. Must be flexible, the schedule may change. Ends with: On Kestrel, you won't need to ask the first one. Every job shows its pay.",
    notes: [] },
  { date: "2026-12-05", platform: "Instagram", title: "Reel: Myth or fact? Eye care careers edition", type: REEL, file: cover("myth-fact-reel"), loc: "Canada",
    caption: `Myth or fact? Eye care careers edition.

"You need a university degree to work in optics." Myth. Many roles train you on the job, and opticians usually need a college programme and a licence.
"Opticians and optometrists do the same job." Myth. Optometrists examine eyes and diagnose; opticians fit and dispense glasses and contact lenses.
"Eye care is just retail." Myth. It's health care.
"You can start at the front desk and grow from there." Fact. Many people do.
"There's a new job board just for eye care in Canada." Fact. That's us: Kestrel Eye Care Jobs, where every job shows its pay.

Which one surprised you? Pre launch is open. Create your account: link in bio.

#EyeCareCareers #Opticians #Optometry #OptometricAssistant #EyeCareJobs`,
    alt: "A short quiz animation. 5 statements each get a stamp. You need a university degree to work in optics: Myth. Opticians and optometrists do the same job: Myth. Eye care is just retail: Myth. You can start at the front desk and grow from there: Fact. There's a new job board just for eye care in Canada: Fact, Kestrel Eye Care Jobs. Every job shows its pay.",
    notes: [] },
  { date: "2026-12-08", platform: "Instagram", title: "Reel: Your job ad and the law (for clinics)", type: REEL, file: cover("law-reel"), loc: "Canada",
    caption: `Hiring in Ontario or BC? Your job ad has rules.

Ontario, for employers with 25 or more employees, since 1st January 2026: show the pay range (no more than $50,000 wide), say whether it's an existing vacancy, say whether you use AI to screen applicants, and don't ask for "Canadian experience".

British Columbia, all employers: show the pay range in every public job posting.

On Kestrel Eye Care Jobs, every post covers all of this, whatever the size of your clinic. Save this for your next hire.

Pre launch is open. Set up your clinic: link in bio.

A plain summary, not legal advice.

#Hiring #ClinicOwner #Optometry #PayTransparency #OntarioJobs`,
    alt: "A short checklist animation for clinics. Text reads: What your job ad needs. Ontario, employers with 25 or more employees, since 1st January 2026: the pay range, no more than $50,000 wide; whether it's an existing vacancy; whether AI is used to screen applicants; no Canadian experience requirement. British Columbia, all employers: the pay range in every public job posting. Then: On Kestrel, every post covers all of this, whatever the size of your clinic. A plain summary, not legal advice.",
    notes: ["Share to LinkedIn too."] },
  { date: "2026-12-09", platform: "Instagram", title: "Reel: Guess the pay, front desk, British Columbia", type: REEL, file: cover("guess-the-pay-2"), loc: "Canada",
    caption: `Guess the pay: front desk and patient care, British Columbia.

A, B or C? Comment your guess before you watch to the end.

The typical (median) pay for receptionists in British Columbia, the closest Job Bank group to front desk and patient care, is $24.62 an hour, and half earn between $21.00 and $28.00.

On Kestrel Eye Care Jobs, you'll never have to guess: every job shows its pay. Pre launch is open. Create your account: link in bio.

${JOB_BANK}

#EyeCareJobs #PatientCare #BCJobs #PayTransparency #Optometry`,
    alt: "A short quiz animation. Text reads: Guess the pay. Front desk and patient care, British Columbia. A, $25 an hour. B, $19 an hour. C, $31 an hour. After a 5 second countdown, A is revealed: typical (median) pay $24.62 an hour. Half of receptionists in British Columbia earn between $21.00 and $28.00 an hour. Then: On Kestrel, you'll never have to guess. Every job shows its pay.",
    notes: [] },
  { date: "2026-12-11", platform: "Instagram", title: "Reel: Pre testing, explained", type: REEL, file: cover("pretesting-reel"), loc: "Canada",
    caption: `Ever wondered what happens before you see the optometrist?

Checking your details: your reason for the visit, your health and any medication, so the optometrist has the full picture.
The machine you look into: an autorefractor, an automatic reading of how your eyes focus, a starting point for your prescription.
The puff of air: non contact tonometry, measuring the pressure inside your eye as part of checking for glaucoma. (Sorry about the puff.)
Photos of the back of your eye: retinal imaging, so the optometrist can see your retina and any changes over time.
And some clinics also offer an OCT scan, a detailed scan of the layers at the back of your eye.

Depending on the clinic, the tests and their order vary. This is often the optometric assistant's job, with many clinics training you on the job.

Curious about working in eye care? Pre launch is open. Create your account: link in bio.

#OptometricAssistant #EyeExam #Optometry #EyeCareCareers #EyeCareJobs`,
    alt: "A short animation with line drawings. Text reads: Ever wondered what happens before you see the optometrist? Pre testing, explained. 1, checking your details. 2, the machine you look into. 3, the puff of air, sorry about the puff. 4, photos of the back of your eye. 5, some clinics also offer an OCT scan. Then: This is often the optometric assistant's job. Many clinics train you on the job.",
    notes: [] },
  { date: "2026-12-12", platform: "Instagram", title: "Story poll: Would you apply if the pay wasn't shown?", type: STORY, file: `${R}story-poll-4-apply-without-pay.png`, loc: "",
    caption: "Poll options: Yes / No", alt: "", notes: ["Screenshot the result: it's a figure you can quote later.", "The next day, share the result as a Story."] },
  { date: "2026-12-13", platform: "Instagram", title: "Reel: Just finished optometry school? (new ODs)", type: REEL, file: cover("new-od-reel"), loc: "Canada",
    caption: `Just finished optometry school? Here's what's next.

First, pass your board exam and register with the college in the province you'll practise in. Then choose your path. Most new ODs consider associate work in an independent practice, corporate or retail optical, locum work, and their own practice later on.

Pay comes as a day rate, a salary, or a percentage of billings. On Kestrel Eye Care Jobs, a job paid by percentage must also show the expected earnings in dollars, so you can compare offers before you apply.

Create your account, pick Optometrist and your province, and we'll email you when jobs that fit are posted. Pre launch is open: link in bio.

#Optometry #Optometrist #NewGrad #OptometryStudent #EyeCareJobs`,
    alt: "A short animation for new optometrists. Text reads: Just finished optometry school? Here's what's next. First, get licensed: pass your board exam, register with the college in the province you'll practise in. 4 paths most new ODs consider: associate in an independent practice, corporate or retail optical, locum work, your own practice later. How you'll be paid: a day rate, a salary, or a percentage of billings. On Kestrel, a job paid by percentage must also show the expected earnings in dollars.",
    notes: ["Post again in April or May, when final year students are deciding.", "Share on LinkedIn and Reddit too."] },
  { date: "2026-12-15", platform: "Instagram", title: "Reel: Guess the pay, optician, Nova Scotia", type: REEL, file: cover("guess-the-pay-3"), loc: "Canada",
    caption: `Guess the pay: optician, Nova Scotia.

A, B or C? Comment your guess before you watch to the end.

The typical (median) pay for an optician in Nova Scotia is $30.00 an hour, and half earn between $25.00 and $40.00, one of the widest spreads in Canada.

On Kestrel Eye Care Jobs, you'll never have to guess: every job shows its pay. Pre launch is open. Create your account: link in bio.

${JOB_BANK}

#Opticians #OpticianPay #EyeCareJobs #NovaScotiaJobs #PayTransparency`,
    alt: "A short quiz animation. Text reads: Guess the pay. Optician, Nova Scotia. A, $22 an hour. B, $26 an hour. C, $30 an hour. After a 5 second countdown, C is revealed: typical (median) pay $30.00 an hour. Half of opticians in Nova Scotia earn between $25.00 and $40.00 an hour. Then: On Kestrel, you'll never have to guess. Every job shows its pay.",
    notes: [] },
  { date: "2026-12-16", platform: "Instagram", title: "Reel: Follow the feather", type: REEL, file: cover("follow-feather-reel"), loc: "Canada",
    caption: `Follow the feather to your next job in eye care.

1. Pick your role: optometrist, optician, optometric assistant, front desk or practice manager.
2. Pick your province.
3. Get an alert: we'll email you when a job that fits is posted.
4. See the pay first: every job on Kestrel shows its pay.

Pre launch is open. Create your account: link in bio.

#EyeCareJobs #Optometry #Opticians #OptometricAssistant #CanadaJobs`,
    alt: "A short animation on cream. A chestnut feather drifts down. Text reads: Follow the feather to your next job in eye care. The feather lands on each step: 1, pick your role, Optician. 2, pick your province, Alberta. 3, get an alert, a bell rings. 4, see the pay first, a job card showing $27 to $33 an hour. The feather settles into the Kestrel logo as the leg of the K. Text reads: Follow the feather. Pre launch is open.",
    notes: [] },
  { date: "2026-12-18", platform: "Instagram", title: "Story poll: Clinic owners, where do your best hires come from?", type: STORY, file: `${R}story-poll-5-where-staff-come-from.png`, loc: "",
    caption: "Poll options: Word of mouth / Job sites", alt: "", notes: ["Screenshot the result: it tells you how clinics really hire."] },
  { date: "2026-12-19", platform: "Instagram", title: "Reel: Guess the pay, practice manager, Ontario", type: REEL, file: cover("guess-the-pay-4"), loc: "Canada",
    caption: `Guess the pay: practice manager, Ontario.

A, B or C? Comment your guess before you watch to the end.

The typical (median) pay for office and administrative supervisors in Ontario, the closest Job Bank group to a practice manager, is $35.75 an hour, and half earn between $29.00 and $46.00.

On Kestrel Eye Care Jobs, you'll never have to guess: every job shows its pay. Pre launch is open. Create your account: link in bio.

${JOB_BANK}

#PracticeManagement #EyeCareJobs #OntarioJobs #PayTransparency #Optometry`,
    alt: "A short quiz animation. Text reads: Guess the pay. Practice manager, Ontario. A, $36 an hour. B, $27 an hour. C, $45 an hour. After a 5 second countdown, A is revealed: typical (median) pay $35.75 an hour. Half of office and administrative supervisors in Ontario earn between $29.00 and $46.00 an hour. Then: On Kestrel, you'll never have to guess. Every job shows its pay.",
    notes: ["CHECK: this uses Job Bank's closest group for practice managers, still waiting for Steve's 5 minute check on Job Bank (docs/pay-benchmark.md). If you'd rather not use it yet, ask Claude to swap it for Optician, British Columbia."] },
  { date: "2026-12-20", platform: "Instagram", title: "Story poll: Round or square?", type: STORY, file: `${R}story-poll-2-round-or-square.png`, loc: "",
    caption: "Poll options: Round / Square", alt: "", notes: [] },
  { date: "2026-12-29", platform: "Instagram", title: "Story poll: The puff or the drops?", type: STORY, file: `${R}story-poll-3-puff-or-drops.png`, loc: "",
    caption: "Poll options: The puff / The drops", alt: "", notes: [] },
  { date: "2027-01-05", platform: "Instagram", title: "Story poll: Glasses or contacts?", type: STORY, file: `${R}story-poll-6-glasses-or-contacts.png`, loc: "",
    caption: "Poll options: Glasses / Contacts", alt: "", notes: [] },
];
