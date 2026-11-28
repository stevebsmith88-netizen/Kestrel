// Added on 28th November 2026 (Steve): the dry eye "Things heard in clinic, winter edition" Reel on Sunday 29th November. To keep 1 post
// a day, Find us moves to the 30th, 3 questions to 1st December, and Guess the pay (optician, Ontario) moves to 7th January, away from
// the optician pay post that has just gone out. These moves are applied after the daily spacing in build-ics.mjs (MOVES).
const R = "design/social-and-merch/instagram-guides/";
const cover = (f) => `${R}${f}.mp4 · cover ${R}${f}-cover.jpg (Edit cover, Add from camera roll)`;
export const DRY = [
  { date: "2026-11-29", time: "1900", fixed: true, platform: "Instagram", title: "Reel: I'm not crying (Things heard, winter edition)", type: "Reel. Show in profile grid: OFF", file: cover("dry-eye-reel"), loc: "Canada",
    caption: `"I'm not crying. My eyes just water when I go outside."

Every clinic hears this one once the cold arrives. Plot twist: watery eyes can actually be a sign of dry eye. Cold wind outside and the heating on inside both dry the eyes out, so they make extra tears to make up for it.

Gritty, watery or tired eyes this winter? Book in with your optometrist.

Eye care teams, which one do you hear most in winter? Tell us below.

#ThingsHeardInClinic #DryEye #EyeCare #Optometry #EyeCareJobs`,
    alt: "A short animation in the Things heard in clinic style, winter edition. On navy with falling snow, a line drawn eye blinks and sheds 3 tears. Text reads: \"I'm not crying. My eyes just water when I go outside.\" Said every winter. Meant every time. A cream card slides up: Plot twist: Watery eyes can be a sign of dry eye. Cold wind out, heating on. Gritty, watery or tired eyes? Book in with your optometrist. Ends with the Kestrel Eye Care Jobs logo, Every eye care job shows its pay, and Link in bio.",
    notes: ["Music: over the top sad violin or sad piano (the joke), or light winter pizzicato. About 120 BPM, or 60 if slow: the Plot twist card lands at 8 seconds."] },
];
// Title (start of it) to its new date, applied after the daily spacing.
export const MOVES = { "Reel: Find us": "2026-11-30", "Reel: 3 questions to ask": "2026-12-01", "Reel: Guess the pay, optician, Ontario": "2027-01-07" };
