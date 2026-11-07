# The launch home page

Built 7th November 2026 (marketing audit and Steve's request). Before launch the site shows the coming soon page. The moment sign up opens, the home page and header change to the launch layout by themselves.

## Three looks

| Look | When | What it is |
| --- | --- | --- |
| Coming soon | Today (the default) | The original page: large wordmark, tagline, skyline, waitlist form |
| Pre launch | Optional, before launch | The new look with the waitlist still the call to action: tagline under the wordmark, headline "Eye care jobs across Canada, opening soon", skyline, the two cards, the numbers box and the same waitlist form |
| Launch | When sign up opens | Job search first, as described below |

To use the pre launch look on the live site, set `PRELAUNCH_HOME` to `yes` in Vercel and redeploy. It only applies while sign up is closed, so it can stay set: when you open sign up, the launch layout takes over whatever it says. Preview it at `/launch-preview?mode=prelaunch`.

## What changes at launch

| | Before launch | After launch |
| --- | --- | --- |
| Home page | Coming soon: large wordmark, tagline, skyline, waitlist form | Job search first: headline, search box, skyline, latest jobs, browse by province and role, the clinic offer, typical pay, the numbers box, the blog strip (if on), and a candidate account call to action |
| Header | Wordmark, menu, "Join the waitlist" | Wordmark with "Canada-wide eye care job board" under it, menu, "Create account" |
| Page title | "Kestrel Eye Care Jobs | Coming soon" | "Eye care jobs across Canada" with its own description |

The wordmark is the existing file, unchanged. The tagline is text in Poppins, as the brand guide sets it. The skyline artwork is used as it is.

## What flips it

Nothing new to remember. At launch you already run `update public.signup_gate set open = true;` (see `docs/launch-checklist.md`). The layout follows that same gate, remembered for 5 minutes, and the home page refreshes at least hourly, so it changes within the hour. Redeploying in Vercel makes it immediate.

Optional override `LAUNCH_HOME` in Vercel: `yes` forces the launch layout (use this on the demo site, so it shows the new layout with sample data) and `no` forces the original coming soon page back in an emergency. Leave it unset on the live site. The demo is a separate Vercel project, so set it there only.

## Looking at it before launch

`/launch-preview` shows the launch home page now, and `/launch-preview?mode=prelaunch` the pre launch look. It is not linked anywhere and is kept out of search results. With no jobs yet, the "Latest jobs" area shows a friendly "The first jobs are on their way" card and the browse block is hidden, so nothing looks broken at launch if there are few jobs.

## Files

`app/page.tsx` (chooses the page), `components/LaunchHome.tsx`, `components/SiteHeader.tsx`, `lib/launch.ts` and `lib/launch-rules.ts`, `app/launch-preview/page.tsx`, styles starting `.lh-` in `app/globals.css`.

## To do at launch

- Check the home page's latest jobs read well with the first seeded or claimed jobs.
- The waitlist form and confirmation emails stay for people who already joined. After launch, a new visitor is pointed to Create account instead.
- Remove `/launch-preview` once the launch layout is live, if you do not want it kept.
