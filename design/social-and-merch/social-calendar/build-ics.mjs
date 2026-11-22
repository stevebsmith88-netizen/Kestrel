// Social media calendar as an .ics file (Steve, 21st November 2026): every planned post at 7 pm Toronto on its day, with the platform,
// what to post, the image or video file, the caption, the alt text, the location and any checks, so it can be opened in any calendar app.
// Run from the repo root: node design/social-and-merch/social-calendar/build-ics.mjs <path to instagram-master-schedule.md>
// The master schedule (posts 10 to 40) lives on main in docs/marketing/instagram-master-schedule.md; the Reels and cross posts made
// in Steve's Instagram chat of 16th to 21st November 2026 are listed below. Only posts from today onwards are included.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, resolve } from "node:path";
import { BATCH } from "./batch-2026-11-22.mjs";
import { WEEKEND } from "./batch-2026-11-21-weekend.mjs";
import { FOCUS } from "./batch-2026-11-22-focus.mjs";
import { otherChannels, CHECKS } from "./other-channels.mjs";

const ROOT = resolve(".");
const OUT = join(ROOT, "docs/marketing/kestrel-social-calendar.ics");
// The plan documents live on main. Read the local copy if this branch has one, otherwise the copy on origin/main.
const readDoc = (rel) => existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), "utf8") : execSync(`git show origin/main:${rel}`, { encoding: "utf8", maxBuffer: 1 << 24 });
const masterPath = process.argv[2];
const TODAY = process.env.FROM ?? new Date().toISOString().slice(0, 10);
const MONTHS = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };

// Words that are out of date since pre launch opened (Steve, 20th November 2026): sign up is open, so "join the waitlist" becomes
// "create your account".
const WAITLIST_CHECK = "CHECK: this still says waitlist. Sign up is open in pre launch, so change it to \"Pre launch is open. Create your account: link in bio.\" (the image too, if the words are on it).";

// 1. Posts 10 to 40 from the master schedule.
const md = masterPath ? readFileSync(masterPath, "utf8") : readDoc("docs/marketing/instagram-master-schedule.md");
const events = [];
for (const block of md.split(/\n(?=### )/)) {
  const head = block.match(/^### (\d+)\. (.+)/);
  const when = block.match(/\*\*When:\*\* \w+ (\d+)\w\w (\w+) (\d{4})/);
  if (!head || !when || +head[1] < 10) continue;
  const date = `${when[3]}-${String(MONTHS[when[2]]).padStart(2, "0")}-${String(when[1]).padStart(2, "0")}`;
  const image = (block.match(/\*\*Image:\*\* `([^`]+)`/) || [])[1];
  const loc = (block.match(/\*\*Location:\*\* ([^·\n]+)/) || [])[1]?.trim();
  const codes = [...block.matchAll(/```text\n([\s\S]*?)```/g)].map((m) => m[1].trim());
  const caption = codes[0] ?? "", alt = codes[1] ?? "";
  const notes = [];
  if (+head[1] === 20) { // Updated for pre launch (Steve, 21st November 2026); the panel is rebuilt by build-photo-panels.mjs (p03).
    events.push({ date, platform: "Instagram", title: `Post 20: Photo: Opening soon, pre launch is open`, type: "Feed post (single image)",
      file: "Canva photo post: swap in the new panel design/social-and-merch/instagram-guides/p03-opening-soon.png over the same photo", loc,
      caption: `Kestrel Eye Care Jobs opens in early 2027, and pre launch is open now. Create your account, set up your profile and job alerts, and be first to see eye care jobs across Canada, every one with its pay.

Link in bio.

#EyeCareJobs #Optometry #Opticians #CanadaJobs #EyeCare`,
      alt: "Text reads: Opening soon. Pre launch is open. Create your account: link in bio. Eye care jobs across Canada, every one with its pay. eyecarejobs.ca. Photo of an optometrist fitting a trial frame on a patient.",
      notes: ["The old version of this image said Join the waitlist. Use the new panel."] });
    continue;
  }
  if (/waitlist/i.test(caption + alt)) notes.push(WAITLIST_CHECK);
  if (/Launch day/.test(block)) notes.push("Launch day. Before posting, check every claim is true today: sign up and posting are live.");
  events.push({ date, platform: "Instagram", title: `Post ${head[1]}: ${head[2].replace(/ \(new\)$/, "")}`, type: "Feed post (single image)",
    file: image ? `${image} (folder Kestrel-Instagram-1-to-40)` : "", caption, alt, loc, notes });
}

// 2. The Reels and cross posts from this chat.
const R = "design/social-and-merch/instagram-guides/";
const extra = [
  { date: "2026-11-22", platform: "Instagram", title: "Reel: Cut the noise, for candidates", type: "Reel. Show in profile grid: OFF",
    file: `${R}noise-reel-candidates.mp4 · cover ${R}noise-reel-candidates-cover.jpg (Edit cover, Add from camera roll)`, loc: "Canada",
    caption: `Scrolling 4,000 jobs to find the 1 that fits?

Kestrel Eye Care Jobs is built only for eye care in Canada. Choose your role and province, and see jobs for optometrists, opticians, assistants, technicians and practice teams. Nothing else.

Every job shows its pay. No "competitive salary", no guessing.

Pre launch is open. Create your account: link in bio.

#EyeCareJobs #Opticians #Optometry #OptometricAssistant #CanadaJobs`,
    alt: "A short animation. Grey job ads flood the screen, with titles like warehouse associate and rockstar wanted, and pay lines like competitive and not stated, while a counter races to 4,382 results. A kestrel swoops across and clears them. Text reads: 1 search. Only eye care. A search for optician in Alberta shows 3 jobs, each with its pay. Ends with the Kestrel Eye Care Jobs logo, Every job shows its pay, and Pre launch is open. Create your account: link in bio.",
    notes: ["Music: busy track with a drop at 5 seconds, when the bird swoops (search beat drop or transition).", "Share to your Story with a link sticker to eyecarejobs.ca/links."] },
  { date: "2026-11-25", platform: "Instagram", title: "Reel: Auto apply", type: "Reel. Show in profile grid: OFF",
    file: `${R}autoapply-reel.mp4 · cover ${R}autoapply-reel-cover.jpg (Edit cover, Add from camera roll)`, loc: "Canada",
    caption: `Applied to 312 jobs. Read none of them.

Auto apply tools fire off hundreds of applications a day, and clinics end up reading the same letter, again and again.

On Kestrel Eye Care Jobs, candidates can only apply for roles that fit their profession. Fewer, better applications, for jobs that fit. And every job shows its pay.

Pre launch is open. Create your account: link in bio.

#EyeCareJobs #Optometry #Opticians #Hiring #JobSearch`,
    alt: "A short animation. A phone with Auto apply switched on swipes right on every job, from optician to brain surgeon, while a counter reaches 312 applications sent today. Then a clinic's inbox fills with 200 copies of the same letter: Dear Hiring Manager, I am excited to apply for the [Job Title] position at [Company]. A kestrel swoops across and clears it. Text reads: Fewer, better applications. For jobs that fit. Only for roles that fit the candidate's profession. Ends with the Kestrel Eye Care Jobs logo and Pre launch is open. Create your account: link in bio.",
    notes: ["Music: fast and mechanical for the swiping, then calm from 8 seconds."] },
  { date: "2026-12-02", platform: "Instagram", title: "Reel: Eye care hiring, rewritten", type: "Reel. Show in profile grid: OFF",
    file: `${R}rules-reel.mp4 · cover ${R}rules-reel-cover.jpg (Edit cover, Add from camera roll)`, loc: "Canada",
    caption: `Eye care hiring has worked the same way for years. We're changing it.

"Salary: competitive" becomes the actual pay range, on every post.
"Is this job even real?" Every post says if it's an existing vacancy.
"Is a bot reading my application?" Every post says if AI screens candidates.
No agencies: jobs come from the clinics themselves.
And a person reads every post before it goes live.

See how we compare with other places to advertise eye care jobs: eyecarejobs.ca/compare

Pre launch is open. Create your account: link in bio.

#EyeCareJobs #PayTransparency #Optometry #Opticians #CanadaJobs`,
    alt: "A short animation on cream. Text reads: Eye care hiring has worked the same way for years. We're changing it. Then 5 old phrases are struck through, 1 at a time, by a chestnut feather, each with a new line beneath. Salary: competitive becomes The actual pay range, on every post. Is this job even real? becomes Every post says if it's an existing vacancy. Is a bot reading my application? becomes Every post says if AI screens candidates. Recruiters reposting clinic jobs becomes No agencies. Jobs come from the clinics. Posts go live unchecked becomes A person reads every post first. Ends with the Kestrel Eye Care Jobs logo, See how we compare: eyecarejobs.ca/compare, and Pre launch is open. Create your account: link in bio.",
    notes: ["Music: steady and confident, building with each line (search inspiring or anthem).", "Later: reuse each of the 5 lines as its own single image post or Story."] },
  { date: "2026-11-24", time: "0800", platform: "Facebook", title: "Find us post (also introduces the Page)", type: "Feed post (single image)",
    file: `${R}find-us-a-grid.jpg`, loc: "Canada",
    caption: `We're in 4 places now, so you can follow along wherever you already spend your time.

LinkedIn, for hiring news and updates for clinic owners and managers: https://www.linkedin.com/company/kestrel-eye-care-jobs/
Instagram, for guides, pay facts and the odd thing heard in clinic: https://www.instagram.com/kestreleye26/
Reddit, a community for people who work in eye care and the clinics that hire them: https://www.reddit.com/r/EyeCareJobsCanada/

Kestrel Eye Care Jobs opens in early 2027, a Canada-wide job board for optometrists, opticians, assistants, technicians and practice teams, with the pay shown on every job. Pre launch is open, create your account here: https://eyecarejobs.ca/?utm_source=facebook&utm_medium=social&utm_campaign=2026-11-find-us`,
    alt: "Text reads: Find us here. Before we open. 4 tilted tiles with line icons for LinkedIn, Facebook, Instagram and Reddit. Below: LinkedIn, our company page. Facebook, kestreleye26. Instagram, @kestreleye26. Reddit, r/EyeCareJobsCanada. eyecarejobs.ca.",
    notes: ["Skip if already posted."] },
  { date: "2026-11-24", time: "0800", platform: "Reddit", title: "Where do you usually hear about eye care jobs?", type: "Text post, flair Discussion",
    file: "", loc: "",
    caption: `Title: Where do you usually hear about eye care jobs?

Hi all. This community is for anyone who works in eye care in Canada (optometrists, opticians, assistants, technicians, front desk and practice managers) and the clinics that hire them.

It's run by Kestrel Eye Care Jobs, a job board for eye care that opens in early 2027, with the pay shown on every job. If you'd like to follow along elsewhere:

Website (pre launch is open): https://eyecarejobs.ca/?utm_source=reddit&utm_medium=social&utm_campaign=2026-11-find-us
LinkedIn: https://www.linkedin.com/company/kestrel-eye-care-jobs/
Facebook: https://www.facebook.com/kestreleye26
Instagram: https://www.instagram.com/kestreleye26/

To get things started, a genuine question: where do you usually hear about eye care jobs? A rep mentioning a clinic that's short staffed, a friend from school, a general job site, a sign in the window? And if you've hired, where did your best person come from?`,
    alt: "", notes: ["Add your own answer as the first comment.", "Skip if already posted."] },
  { date: "2026-11-27", platform: "Instagram", title: "Reel: Find us", type: "Reel. Show in profile grid: OFF",
    file: `${R}find-us-reel.mp4`, loc: "Canada",
    caption: `4 places to find us before the job board opens in early 2027.

LinkedIn: our company page
Facebook: kestreleye26
Instagram: right here
Reddit: r/EyeCareJobsCanada, for people who work in eye care and the clinics that hire them

Pay shown on every job. Pre launch is open. Create your account: link in bio.

#EyeCareJobs #Optometry #Opticians #EyeCareCanada #CanadaJobs`,
    alt: "A short animation on cream. Text reads: Find us here. Before we open. 4 tiles with line icons for LinkedIn, Facebook, Instagram and Reddit drop in and take turns: LinkedIn, our company page. Facebook, kestreleye26. Instagram, @kestreleye26. Reddit, r/EyeCareJobsCanada. Pre launch is open. Create your account: link in bio. eyecarejobs.ca.",
    notes: ["Music: light and bouncy (search playful pizzicato)."] },
  { date: "2026-12-06", platform: "Instagram", title: "Reel: 4 ways into eye care", type: "Reel. Show in profile grid: OFF",
    file: `${R}ways-in-reel.mp4 · cover ${R}ways-in-reel-cover.jpg (Edit cover, Add from camera roll)`, loc: "Canada",
    caption: `Want to work in optics, but not sure where to start?

Here are 4 ways in:
Front desk and patient care. Many clinics train you on the job.
Optometric assistant. Pre testing and helping with eye exams, often trained in the clinic.
Optician. Fitting glasses and contact lenses, with a college programme and a licence in most provinces.
Optical lab technician. Making the lenses, often trained in the lab.

Create your Kestrel account, pick the role you're interested in and your province, and we'll email you when jobs that fit are posted. Every job shows its pay. Our guides on getting started are in the link in bio too.

Pre launch is open. Create your account: link in bio.

#OpticianLife #OptometricAssistant #EyeCareCareers #EyeCareJobs #CanadaJobs`,
    alt: "A short animation on cream. Text reads: Want to work in optics? Not sure where to start? Then: 4 ways into eye care. A dotted chestnut path runs down past 4 stops, each with an icon: Front desk and patient care, many clinics train you on the job. Optometric assistant, pre testing and helping with eye exams, often trained in the clinic. Optician, fitting glasses and contact lenses, a college programme and a licence in most provinces. Optical lab technician, making the lenses, often trained in the lab. Then: Find your way in. Create your account, pick the role you're interested in and your province, and we'll email you when jobs that fit are posted. Ends with the Kestrel Eye Care Jobs logo and Pre launch is open. Create your account: link in bio.",
    notes: ["Sunday evening suits candidates.", "Music: warm and hopeful, light acoustic or piano."] },
  { date: "2027-01-21", platform: "Instagram", title: "Find us post (extra, Cream)", type: "Feed post (single image). Fits the grid between posts 24 and 25",
    file: `${R}find-us-a-grid.jpg`, loc: "Canada",
    caption: `We're in 4 places now, so you can follow along wherever you already spend your time.

LinkedIn: Kestrel Eye Care Jobs. Hiring news and updates for clinic owners and managers.
Facebook: kestreleye26
Instagram: right here, @kestreleye26
Reddit: r/EyeCareJobsCanada. A community for people who work in eye care and the clinics that hire them. Ask questions, compare notes, share what works.

The job board opens in early 2027, with the pay shown on every job. Pre launch is open. Create your account: link in bio.

#EyeCareJobs #Optometry #Opticians #EyeCareCanada #CanadaJobs`,
    alt: "Text reads: Find us here. Before we open. 4 tilted tiles with line icons for LinkedIn, Facebook, Instagram and Reddit. Below: LinkedIn, our company page. Facebook, kestreleye26. Instagram, @kestreleye26. Reddit, r/EyeCareJobsCanada. eyecarejobs.ca.",
    notes: ["If the launch date has been set by then, swap early 2027 for the date."] },
  { date: "2027-01-25", platform: "Instagram", title: "Reel: Takes flight (we're open)", type: "Reel. Show in profile grid: ON, then pin it in place of the logo post",
    file: `${R}takes-flight-reel.mp4 · cover ${R}takes-flight-reel-cover.jpg`, loc: "Canada",
    caption: `We're open.

Kestrel Eye Care Jobs is a Canada-wide job board built only for eye care: optometrists, opticians, optometric assistants, technicians, practice managers and the people at the front desk. Independent clinics and corporate groups post side by side.

Every job shows its pay. Every post is read by a person before it goes live.

Looking for your next role, or hiring for your clinic? Link in bio.

#EyeCareJobs #Optometry #Opticians #OptometricAssistant #CanadaJobs`,
    alt: "A short animation on cream. A stylized kestrel perches on a treetop in front of mountains and forest, takes off and swoops across the screen twice. On its third pass a chestnut feather falls from its tail and drifts down to the Kestrel wordmark, where it settles into place as the leg of the K. The full logo appears: Kestrel, Eye Care Jobs, Canada-wide eye care job board. Text reads: Now open. Every job shows its pay. Find your next role or post a job: link in bio. eyecarejobs.ca.",
    notes: ["Launch day only. Check every claim is true today: sign up and posting are live.", "Music: Arrival of the Birds again if your account allows it (the swell at about 15 seconds, when the feather lands), or uplifting strings from Instagram's library.", "If launch moves, move this with it."] },
];
events.push(...extra);
// Added on 22nd November 2026, in the free days between the posts above. Also written on their own to a second file, so they can be
// imported into the existing calendar without doubling anything.
events.push(...BATCH.map((e) => ({ ...e, batch: "2026-11-22" })));
events.push(...WEEKEND.map((e) => ({ ...e, batch: "2026-11-21-weekend" })));
events.push(...FOCUS.map((e) => ({ ...e, batch: "2026-11-22-focus" })));
// LinkedIn, Facebook and Reddit (22nd November 2026), and the monthly numbers check.
events.push(...otherChannels(readDoc("docs/marketing/reddit-and-linkedin-calendar.md"), readDoc("docs/marketing/reddit-seed-posts.md")), ...CHECKS);
// The launch posts stay where they are, but are marked until Steve confirms the date.
for (const e of events) if (e.date === "2027-01-25") e.title += " (launch date to confirm)";

// 3. Write the calendar: 7 pm Toronto, 30 minutes, with a reminder 30 minutes before.
const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fold = (line) => { const out = []; let cur = ""; for (const ch of line) { if (Buffer.byteLength(cur + ch) > 74) { out.push(cur); cur = " " + ch; } else cur += ch; } out.push(cur); return out.join("\r\n"); };
const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Kestrel Eye Care Jobs//Social calendar//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
  "X-WR-CALNAME:Kestrel", "X-WR-TIMEZONE:America/Toronto",
  "BEGIN:VTIMEZONE", "TZID:America/Toronto",
  "BEGIN:DAYLIGHT", "TZOFFSETFROM:-0500", "TZOFFSETTO:-0400", "TZNAME:EDT", "DTSTART:19700308T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU", "END:DAYLIGHT",
  "BEGIN:STANDARD", "TZOFFSETFROM:-0400", "TZOFFSETTO:-0500", "TZNAME:EST", "DTSTART:19701101T020000", "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU", "END:STANDARD",
  "END:VTIMEZONE"];
// Each event's UID comes from its date and title, so it stays the same however many posts are added around it.
const uid = (e) => "kestrel-social-" + e.date.replace(/-/g, "") + "-" + e.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) + "-v2@eyecarejobs.ca"; // v2 (22nd November 2026): new IDs so a fresh import is not matched to old copies in another calendar
const whereOf = (e) => e.where ?? (e.platform === "Instagram" ? `Instagram @kestreleye26${e.loc ? `, location tag: ${e.loc}` : ""}`
  : e.platform === "Facebook" ? "Facebook: the kestreleye26 Page (post as the Page, not your profile)"
  : e.platform === "Reddit" ? "Reddit: r/EyeCareJobsCanada (post as the Kestrel account)" : e.platform);
function calendar(list) {
  const out = [...lines];
  for (const e of list) {
    const d = e.date.replace(/-/g, "");
    // Steve, 22nd November 2026: the platform in the title, where to post in the location, an alert at the time, and everything to copy in the notes.
    const where = whereOf(e);
    const notes = [...(e.notes ?? [])];
    if (e.platform === "Instagram" && /^Reel/.test(e.type)) notes.push("Before sharing, turn on Share to Facebook so it also goes to the Facebook Page (the same video, no extra work).");
    const label = e.platform === "Check" ? "CHECKLIST:" : e.platform === "Instagram" ? "CAPTION (copy and paste):" : "POST (copy and paste):";
    const desc = [`Where: ${where}`, `Type: ${e.type}`, e.file && `File: ${e.file}`, ...notes.map((n) => `- ${n}`), "", label, e.caption,
      e.alt && "", e.alt && "ALT TEXT (Advanced settings, Accessibility):", e.alt].filter((x) => x !== undefined && x !== false && x !== null && x !== "").join("\n").replace(/\n(CAPTION|POST|CHECKLIST|ALT)/g, "\n\n$1");
    out.push("BEGIN:VEVENT", fold(`UID:${uid(e)}`), `DTSTAMP:${stamp}`,
      `DTSTART;TZID=America/Toronto:${d}T${(e.time ?? "1900")}00`, `DTEND;TZID=America/Toronto:${d}T${String(+(e.time ?? "1900") + 30).padStart(4, "0")}00`, // 7 pm unless a post says otherwise
      fold(`SUMMARY:${esc(`${e.platform}: ${e.title}`)}`), fold(`LOCATION:${esc(where)}`), fold(`DESCRIPTION:${esc(desc)}`),
      "BEGIN:VALARM", "ACTION:DISPLAY", fold(`DESCRIPTION:${esc(e.platform === "Check" ? `Kestrel: ${e.title}` : `Post now: ${e.platform}, ${e.title}`)}`), "TRIGGER:PT0M", "END:VALARM", "END:VEVENT");
  }
  out.push("END:VCALENDAR");
  return out.join("\r\n") + "\r\n";
}
const kept = events.filter((e) => e.date >= TODAY).sort((a, b) => (a.date + a.platform).localeCompare(b.date + b.platform));
writeFileSync(OUT, calendar(kept));
console.log(`Wrote ${kept.length} posts to ${OUT}`);
for (const e of kept) console.log(e.date, e.platform.padEnd(9), e.title, e.notes?.some((n) => n.startsWith("CHECK")) ? "  [CHECK]" : "");
