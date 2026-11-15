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
4. Put each address in Vercel. A "Vercel setting" here means an Environment Variable, which is just a named box the website reads. Do this in the live project, and again in the demo project:
   1. Go to vercel.com and open the project (**kestrel** is the live site, **kestrel-demo** is the demo).
   2. Click **Settings** along the top, then **Environment Variables** on the left.
   3. Click **Add New** (or the box at the top of the list).
   4. In **Key**, type the name from the table above exactly, for example `SLACK_WEBHOOK_URL_JOBS`.
   5. In **Value**, paste the webhook address for that channel (it starts `https://hooks.slack.com/services/`).
   6. Under **Environments**, tick **Production**. You do not need Preview.
   7. Tick **Sensitive** if it is offered, so the value is hidden afterwards. Click **Save**.
   8. Repeat for the other channels, 1 key each.
   9. The website only reads new settings when it is built again. Open **Deployments**, click the 3 dots beside the newest one, choose **Redeploy**, and untick **Use existing Build Cache**, then confirm.
   The demo can use the same addresses as live, since every message says demo or live.
5. In Kestrel, open the initials menu, Payments and Stripe, and press Send a test message to each channel. Each message names the channel it is for, so you can see every one land in the right place.

## Making Slack work for you (no code needed)

- **Quiet hours:** Slack has these built in. In the Slack app, open Preferences, Notifications, and set a schedule (for example no notifications overnight and on weekends). That is better than anything the website could do, because it follows you across devices.
- **Mute a channel:** press and hold a channel on your phone, or use the bell icon in the channel on a computer, and choose what to be told about. Muting #kestrel-signups and keeping #kestrel-support loud is a good start.
- **Phone:** install the Slack app and sign in with the same account, so alerts reach your phone.
- **Bookmarks and pins:** pin the link to Admin in each channel, so it is 1 tap away.

## Approve buttons (jobs and claims)

Once these are set up, the alert for a job waiting for review, and for a claim confirmed by email, has an **Approve** button. Pressing it asks "Are you sure?", then approves exactly as the review queue does, and replaces the buttons with "Approved by you from Slack at 4:12 pm". A job with anything flagged has no button, only a link to the review queue. The plan is in `docs/plans/slack-approvals.md`. Do this in the **live** project only, because the demo gets no buttons.

1. At api.slack.com/apps, open the Kestrel app. Choose **Interactivity and Shortcuts**, switch it **On**, and in **Request URL** enter `https://eyecarejobs.ca/api/slack/actions`, then **Save Changes**.
2. Still in the app, choose **Basic Information** and find **Signing Secret**. Click **Show**, copy it. It is a password, so never paste it into a chat.
3. In Vercel (the **kestrel** project, Settings, Environment Variables), add `SLACK_SIGNING_SECRET` with that value, Production, Sensitive.
4. Find your own Slack member ID: in Slack click your picture, then **Profile**, then the three dots, then **Copy member ID** (it looks like `U0ABC123`). In Vercel add `SLACK_APPROVER_IDS` with that value, Production. To let a trusted person approve later, add their ID after a comma.
5. Redeploy as in step 4 above (Deployments, the 3 dots, Redeploy, untick the build cache).
6. The next job or claim alert will have the button. If it does not, tell Claude what you see.

## Send back and Decline buttons

These sit beside Approve. **Send back** is on every job waiting for review, flagged or not, because it publishes and charges nothing. **Decline** is on a claim waiting for review. Pressing either opens a small form in Slack asking for your note, which is emailed to the clinic or the claimant exactly as you write it (at least 10 characters). The message then changes to "Sent back by you from Slack". They need one more setting, a bot token:

1. At api.slack.com/apps, open the Kestrel app. Choose **App Home** and make sure the app has a display name (this gives it a bot user, which the token belongs to).
2. Choose **OAuth and Permissions**. Under **Bot Token Scopes**, add `chat:write`. Slack may then show a banner asking you to **Reinstall to Workspace**. Do that and allow it.
3. On the same page, copy the **Bot User OAuth Token** (it starts `xoxb-`). It is a password, so never paste it into a chat.
4. In Vercel, in the live project (**kestrel**), add `SLACK_BOT_TOKEN` with that value, Production, **Sensitive**. Then redeploy without the build cache.
5. Open Payments and Stripe on the live site. The Approve buttons box should now show the bot token as OK and "Will Send back and Decline appear? Yes".

Slack's screens change from time to time. If a step looks different, tell Claude what you see.

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
