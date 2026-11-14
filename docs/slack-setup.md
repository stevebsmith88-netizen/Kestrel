# Slack for Kestrel: setting up channels (14th November 2026)

For Steve, who is new to Slack. Slack's screens change now and then. If a step looks different, tell Claude what you see and it will adjust. Never paste a webhook address into a chat, an email or a screenshot: it is a password for posting into your channel.

## What you are setting up

Kestrel posts short alerts into Slack. They carry counts, clinic names and job titles, never an applicant's name, email or resume. Instead of 1 busy channel, there are 4 quiet ones, so you can mute any of them without losing the rest.

| Slack channel | What arrives there | Setting in Vercel |
| --- | --- | --- |
| #kestrel-jobs | A job waiting for review, a job going live, payments and refused cards, passes, Founding clinics | `SLACK_WEBHOOK_URL_JOBS` |
| #kestrel-signups | New clinic and candidate accounts, waitlist sign ups | `SLACK_WEBHOOK_URL_SIGNUPS` |
| #kestrel-support | Help requests, feedback, reported jobs, claims, and a reminder when one has waited more than 1 business day | `SLACK_WEBHOOK_URL_SUPPORT` |
| #kestrel-daily | The morning summary | `SLACK_WEBHOOK_URL_DAILY` |

You do not have to do all 4 at once. A channel without its own address uses the one you already have (`SLACK_WEBHOOK_URL`), so everything keeps working, and you can add channels one at a time.

## Steps (about 15 minutes, once)

1. In Slack, make the 4 channels (the plus beside Channels, then Create a channel). Make them private if you like. Names as in the table.
2. Go to api.slack.com/apps and open the Kestrel app you already made (the one with your current webhook).
3. Choose Incoming Webhooks, then Add New Webhook to Workspace, pick #kestrel-jobs, and Allow. Copy the new address. Repeat for each channel. One app can have many webhooks.
4. In Vercel, for both projects (live and demo), open Settings, Environment Variables, and add each address under its name from the table, marked Sensitive. Then redeploy without the build cache.
5. In Kestrel, open the initials menu, Payments and Stripe, and press Send a test message to each channel. Each message names the channel it is for, so you can see every one land in the right place.

## Making Slack work for you (no code needed)

- **Quiet hours:** Slack has these built in. In the Slack app, open Preferences, Notifications, and set a schedule (for example no notifications overnight and on weekends). That is better than anything the website could do, because it follows you across devices.
- **Mute a channel:** press and hold a channel on your phone, or use the bell icon in the channel on a computer, and choose what to be told about. Muting #kestrel-signups and keeping #kestrel-support loud is a good start.
- **Phone:** install the Slack app and sign in with the same account, so alerts reach your phone.
- **Bookmarks and pins:** pin the link to Admin in each channel, so it is 1 tap away.

## A tech channel for Vercel and GitHub (no code)

Slack has its own apps for these, so nothing needs building. Make a channel called #kestrel-tech. Steps can differ slightly from what is written here, so if a screen looks different, tell Claude what you see.

- **Vercel:** in Vercel, open Integrations and add the Slack integration for your team, then in #kestrel-tech use its link command to connect the 2 projects (live and demo). Choose to be told about failed deployments and finished production deployments only. Every pull request makes a preview build, so telling it everything would be very noisy.
- **GitHub:** in Slack, add the GitHub app, then in #kestrel-tech subscribe the repository (the command is `/github subscribe` followed by `stevebsmith88-netizen/Kestrel`). Keep it to pull requests and failed checks, and turn off the rest, so the channel stays quiet.
- Muting #kestrel-tech overnight is fine. Nothing there needs an answer from you.

## Where Slack can go next

- A shared channel for a virtual assistant with only counts and links, once their access is designed (next tasks, item 6).
- Reminders and a weekly summary of the numbers.
- Vercel and GitHub notifications into a tech channel, using Slack's own apps with no code.
- Approving a job or a claim from the alert itself, with a button. The plan is in `docs/plans/slack-approvals.md`.
