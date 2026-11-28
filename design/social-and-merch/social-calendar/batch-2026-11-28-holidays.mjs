// Added on 28th November 2026 (Steve: "I got a bit excited the last couple of days creating things"): the Christmas and new year Reels,
// Your job / Our job, the licence fee Reel and the Maple Monday Stories. Only Reels are displaced (they are not on the grid), so the
// feed's planned order stays: 3 Guess the pay Reels move into January (HOLIDAY_MOVES, applied after the daily spacing).
const R = "design/social-and-merch/instagram-guides/";
const cover = (f) => `${R}${f}.mp4 · cover ${R}${f}-cover.jpg (Edit cover, Add from camera roll)`;
const reel = (date, title, f, caption, alt, notes, time = "1900") => ({ date, time, fixed: true, platform: "Instagram", title: `Reel: ${title}`, type: "Reel. Show in profile grid: OFF", file: cover(f), loc: "Canada", caption, alt, notes });
const MUSIC = (song, start) => `Music: add ${song} in Instagram and ${start}. The Reel is timed to it; play it through once before sharing.`;
export const HOLIDAYS = [
  { date: "2026-11-30", time: "1200", fixed: true, platform: "Instagram", title: "Story: Maple Monday (2 Stories)", type: "2 Stories", loc: "Canada",
    file: `${R}story-maple-1-made-for-canada.png and ${R}story-maple-2-poll.png`,
    caption: `Story 1: add #MapleMonday #ShopCanadian and a link sticker to eyecarejobs.ca.
Story 2: add a poll sticker: "Yes" / "Trying to".`, alt: "", notes: ["Stories can share a day with the 7 pm Reel."] },
  reel("2026-12-11", "The 12 days of Christmas (10 reasons)", "12-days-reel", `On the 12th day of Christmas… well, here are 10 reasons to sign up to Kestrel.

Jobs only in eye care. Every job says if it's an existing vacancy and if AI screens candidates. No "Canadian experience" requirements. Clinic profiles to look around. Every job shows its pay. You apply for the roles that fit you, get alerts for jobs that fit, and track every application in 1 place.

And a job board made for eye care in Canada. Pre launch is open: link in bio.

#12DaysOfChristmas #EyeCareJobs #Optometry #Opticians #CanadaJobs`,
    "A short animation on a snowy navy night. A stylized kestrel in a holiday hat sits on top of a Christmas tree like the star. Numbers count down from 10 to 1, each with a reason to join Kestrel, as ornaments are added: baubles, a gift, a pair of glasses, a trial lens, gold rings, an ophthalmoscope, a contact lens case and an eye chart tag. At 5, in gold: Every job shows its pay. At 1: and a job board made for eye care in Canada, as the kestrel flies off the tree. Ends with the Kestrel Eye Care Jobs logo, Pre launch is open for candidates, clinics and suppliers, and Link in bio.",
    [MUSIC("The Twelve Days of Christmas (feat. The Puppini Sisters; Bing Crosby, The Andrews Sisters)", "keep the start where Instagram puts it (the countdown from ten)")]),
  reel("2026-12-16", "It's the most wonderful time (sign up)", "wonderful-reel", `It's the most wonderful time of the year… to sign up to Kestrel.

Candidates: set your role and province, and get alerts for jobs that fit, every one with its pay.
Clinics: set up your clinic profile, ready to post, free during the launch.

Pre launch is open for candidates, clinics and suppliers: link in bio.

#MostWonderfulTime #EyeCareJobs #Optometry #Opticians #ClinicOwner`,
    "A short animation on a snowy navy night. A stylized kestrel in a holiday hat sits on top of a Christmas tree like the star. Text reads: It's the most wonderful time of the year… to sign up to Kestrel. A Candidates card lists: Set your role and province, Job alerts for jobs that fit, Every job shows its pay. A Clinics card lists: Set up your clinic profile, Post with the pay up front, Free to post during the launch. The kestrel takes off: Pre launch is open for candidates, clinics and suppliers. Ends with the Kestrel Eye Care Jobs logo, Happy holidays from the Kestrel team, and Link in bio.",
    [MUSIC("It's the Most Wonderful Time of the Year (Andy Williams)", "keep the start where Instagram puts it")]),
  reel("2026-12-19", "Last Christmas (for candidates)", "last-christmas-reel", `Last Christmas, I sent off my resume. The very next day: no reply. (And no idea what it paid.)

This year, every job on Kestrel shows its pay, you only apply for roles that fit you, and you can track every application in 1 place.

Candidates: pre launch is open. Create your account: link in bio.

#LastChristmas #EyeCareJobs #Opticians #Optometry #JobSearch`,
    "A short animation on a snowy navy night. A stylized kestrel in a holiday hat sits on a branch. Text reads: Candidates, this one's for you. Last Christmas, I sent off my resume, as a resume card is marked Sent. But the very next day: no reply, over an inbox showing 0 new messages, 1 day later, 1 week later. And no idea what it paid, either. This year, to save me from tears: the kestrel takes off. Every job shows its pay. Apply for the roles that fit you. Track every application in 1 place. Ends with: I'll give it to someone special, the Kestrel Eye Care Jobs logo, Pre launch is open, and Create your account: link in bio.",
    [MUSIC("Last Christmas", "use the same start point as your screen recording (the text 'Last Christmas' should appear as he sings it)")]),
  reel("2026-12-22", "Your job / Our job", "your-job-reel", `Your job: fitting a child's first glasses. Catching glaucoma before anyone notices a thing. Spotting signs of diabetes in the back of an eye. Running the tests, calming the nerves, and helping someone read the menu again.

An eye exam is so much more than a glasses check, and it takes a whole team to make it happen.

Our job: finding you the clinic where you can do that, with the pay shown up front.

Pre launch is open: link in bio.

#EyeCare #Optometry #Opticians #OptometricAssistant #EyeCareJobs`,
    "A short animation on cream. Text reads: Your job: and 6 lines appear in turn, each with a small icon: Fitting a child's first pair of glasses. Catching glaucoma before the patient notices anything. Spotting signs of diabetes in the back of an eye. Running the tests that start every exam. Putting a nervous first time patient at ease. Helping someone read the menu again. A chestnut card rises: Our job: Finding you the clinic where you can do that. With the pay shown up front. Ends with the Kestrel Eye Care Jobs logo, Pre launch is open, and Link in bio.",
    ["Music: warm and uplifting (search heartfelt or uplifting piano), about 104 BPM; a swell about 9 seconds in, when the Our job card rises."]),
  reel("2026-12-23", "All I want for Christmas is a job in eye care", "christmas-reel", `Dear Santa, all I want for Christmas is a job in eye care. With the pay shown up front, please.

What's on your wish list this year? Tell us below.

Happy holidays from the Kestrel team. Pre launch is open for candidates, clinics and suppliers: link in bio.

#HappyHolidays #EyeCareJobs #Optometry #Opticians #CanadaJobs`,
    "A short animation on navy with falling snow. A stylized kestrel in a chestnut and cream holiday hat perches on a wish list that reads: Dear Santa, A job I actually love, A team that has my back, The pay, shown up front, with a tick beside the last one. The kestrel takes off and swoops across as text reads: All I want for Christmas is a job in eye care. Ends with the Kestrel Eye Care Jobs logo, Happy holidays from the Kestrel team, and Pre launch is open: link in bio.",
    [MUSIC("All I Want for Christmas Is You", "set the start at about 0:38, where she begins 'All I want for Christmas is…' (the bird takes off as the bells come in)")]),
  reel("2026-12-28", "Licence fees: hours of work, by province", "licence-reel", `How many hours does an optician work just to pay for their licence?

Using each province's typical optician pay, the yearly licence fee works out to about 18 to 19 hours of work in Nova Scotia, and about 43 hours in Ontario, where the fee is $1,237.35 for 2027. That's more than twice Nova Scotia's fee, for $1 an hour less in typical pay.

Licence fees fund the regulator's work protecting patients. This is about seeing the full picture when you compare pay between provinces.

Pay is only half the picture. Every province's pay and licence fee is in our optician pay guide: link in bio.

Fees from each regulator's website, November 2026. 5 provinces checked so far, more coming.

#Opticians #OpticianLife #EyeCareJobs #Ontario #CanadaJobs`,
    "A short animation on cream. Text reads: How many hours does an optician work just to pay for their licence? Rows of small squares fill in, 1 square for each hour of work at the province's typical optician pay: Nova Scotia about 18 to 19 hours, Alberta about 24 to 30, Manitoba about 29 to 31, British Columbia about 35, and Ontario about 43, shown in chestnut. Text reads: Ontario's fee is more than twice Nova Scotia's. Pay is only half the picture. Ends with the Kestrel Eye Care Jobs logo and Link in bio.",
    [MUSIC("Cornfield Chase (Hans Zimmer)", "drag the start to 0:38 (Ontario starts filling as the orchestra swells)"), "Check the fees in the optician pay guide are still current before posting.", "If Ontario opticians push back in the comments, thank them and point to the guide; don't take sides on the fee."]),
  reel("2026-12-31", "New year, new job in eye care", "new-year-reel", `3, 2, 1… happy new year from the Kestrel team.

New year, new job in eye care? Kestrel opens in early 2027, a Canada-wide job board for optometrists, opticians, assistants, technicians and practice teams, with the pay shown on every job.

Pre launch is open for candidates, clinics and suppliers: link in bio.

#HappyNewYear #NewYearNewJob #EyeCareJobs #Optometry #Opticians`,
    "A short animation on a starry night sky. A countdown reads 3, 2, 1. A stylized kestrel in a striped party hat sits on a snowy branch and blows a party blower as fireworks burst in chestnut, buff and cream. Text reads: New year, new job in eye care. Ends with the Kestrel Eye Care Jobs logo, Happy new year from the Kestrel team, Opening early 2027, and Pre launch is open: link in bio.",
    [MUSIC("Auld Lang Syne (Whistle Snap) by Theme Stars", "keep the start where Instagram puts it ('3' lands on the first snap)"), "If the launch date is confirmed by then, change 'early 2027' in the caption to the date."], "1400"),
];
export const HOLIDAY_MOVES = { "Reel: Guess the pay, front desk, British Columbia": "2027-01-09", "Reel: Guess the pay, optician, Nova Scotia": "2027-01-14", "Reel: Guess the pay, practice manager, Ontario": "2027-01-16" };
