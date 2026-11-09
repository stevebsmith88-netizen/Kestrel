# The launch home page

Built 7th November 2026 (marketing audit and Steve's request). Before launch the site shows the coming soon page. The moment sign up opens, the home page and header change to the launch layout by themselves.

## Three looks

| Look | When | What it is |
| --- | --- | --- |
| Coming soon | Only if asked for (`PRELAUNCH_HOME=no`) | The original page: large wordmark, tagline, skyline, waitlist form |
| Pre launch | Live from 8th November 2026, until sign up opens | The new look with the waitlist still the call to action: tagline under the wordmark, headline "Eye care jobs across Canada, opening soon", skyline, the two cards, the numbers box and the same waitlist form |
| Launch | When sign up opens | Job search first, as described below |

The pre launch look is the default (Steve, 8th November 2026), so nothing needs setting in Vercel. To put the original coming soon page back, set `PRELAUNCH_HOME` to `no` and redeploy. It only applies while sign up is closed, so it can never get in the way of launch: when you open sign up, the launch layout takes over whatever it says. Preview the pre launch look at `/launch-preview?mode=prelaunch`.

## What changes at launch

| | Before launch | After launch |
| --- | --- | --- |
| Home page | Coming soon: large wordmark, tagline, skyline, waitlist form | Job search first: headline, search box, skyline, latest jobs, browse by province and role, the clinic offer, typical pay, the numbers box, the blog strip (if on), and a candidate account call to action |
| Header | Wordmark, menu, "Join the waitlist" | Wordmark with "Canada-wide eye care job board" under it, menu, "Create account" |
| Page title | "Kestrel Eye Care Jobs | Coming soon" | "Eye care jobs across Canada" with its own description |

The wordmark is the existing file, unchanged. The tagline is text in Poppins, as the brand guide sets it. The skyline artwork is used as it is.

## Sample screens on the pre launch home (8th November 2026)

The pre launch home shows 2 screens of the product under the hero, "What the board will look like": the job search and a job page. They are screenshots of the demo site (sample clinics and jobs, with the demo banner and header cropped out), kept in `public/home/`, and the block says plainly that they are samples. There is no link to the demo site, by Steve's decision. The block lives in `components/PreLaunchHome.tsx` only, so it disappears by itself when the launch layout takes over, and the launch home shows real jobs instead. After launch the 2 image files can be deleted. If the job page or search page changes a lot before launch, retake the screens from the demo site. The job page sample was redone on 10th November 2026, after the Job facts box moved under the description: it was rendered from the real stylesheet and page structure (Playwright, 1080 pixels wide at 2x), not captured from the demo site. The search sample is still the original capture.

Idea for later (Steve, 8th November 2026, not built): a sponsored area on the home page listing either brand advertisements or chosen jobs. It must be labelled "Sponsored", must never look like an ordinary job, and waits for the disclosure conversation, like the sponsored listings in `docs/marketing/directory-plan.md`.

## What flips it

Nothing new to remember. At launch you already run `update public.signup_gate set open = true;` (see `docs/launch-checklist.md`). The layout follows that same gate, remembered for 5 minutes, and the home page refreshes at least hourly, so it changes within the hour. Redeploying in Vercel makes it immediate.

Optional override `LAUNCH_HOME` in Vercel: `yes` forces the launch layout, `prelaunch` forces the pre launch look, and `no` forces the original coming soon page back in an emergency. Leave it unset on the live site. The demo is a separate Vercel project, so set it there only. Its sign up gate is open (anyone with the link can make a demo account), so without a setting it shows the launch layout. Steve wants it to match the live site, so set `LAUNCH_HOME` to `prelaunch` there until launch, then to `yes` (or remove it, once the live gate opens the demo can follow its own).

## Looking at it before launch

`/launch-preview` shows the launch home page now, and `/launch-preview?mode=prelaunch` the pre launch look. It is not linked anywhere and is kept out of search results. With no jobs yet, the "Latest jobs" area shows a friendly "The first jobs are on their way" card and the browse block is hidden, so nothing looks broken at launch if there are few jobs.

## Files

`app/page.tsx` (chooses the page), `components/LaunchHome.tsx`, `components/SiteHeader.tsx`, `lib/launch.ts` and `lib/launch-rules.ts`, `app/launch-preview/page.tsx`, styles starting `.lh-` in `app/globals.css`.

## To do at launch

- Check the home page's latest jobs read well with the first seeded or claimed jobs.
- The waitlist form and confirmation emails stay for people who already joined. After launch, a new visitor is pointed to Create account instead.
- Remove `/launch-preview` once the launch layout is live, if you do not want it kept.
