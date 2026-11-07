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
