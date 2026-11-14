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

## Where Slack can go next

- A shared channel for a virtual assistant with only counts and links, once their access is designed (next tasks, item 6).
- Reminders and a weekly summary of the numbers.
- Vercel and GitHub notifications into a tech channel, using Slack's own apps with no code.
- Later, approving or sending back a job from the alert itself, which needs a Slack app with buttons and is a separate piece of work.
