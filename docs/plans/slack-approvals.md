# Approve from Slack (plan, 14th November 2026)

Status: built 14th November 2026 (Steve said yes to buttons only, no button on a flagged job, and claims as well as jobs). Send back from Slack is the second step, not built. Steve's setup steps are in `docs/slack-setup.md`.

## What Steve wants

Approve a job listing or a clinic's claim from the Slack alert itself, without opening the admin pages.

## How it would work

1. The alert for a job waiting for review (in #kestrel-jobs) and for a claim waiting (in #kestrel-support) gets an **Approve** button, beside the link to the review queue.
2. Pressing it sends Slack's message to a new address on the site, `/api/slack/actions`. The site checks 3 things before doing anything: the message really came from Slack (Slack signs every message, and the site checks the signature and that it is fresh), the person who pressed it is on Steve's list of approvers (their Slack member ID), and the job or claim is still waiting.
3. The site then runs the same approval as the review queue (`approveJobNow` for a job, a shared version of `approveClaim` for a claim), writes the same note in the job's Activity ("Approved by Kestrel, from Slack"), and replaces the buttons in Slack with the result ("Approved by Steve at 4:12 pm"). Pressing twice does nothing, because the job is no longer waiting.

Typing the word "approve" is not part of this. A typed word has no way to say which job is meant, and a stray word in a channel could approve the wrong one. A button sits right under the job it approves.

## Rules to keep it safe

- **Flagged jobs have no Approve button.** A job with any automatic flag (pay problem, role and price band mismatch, a changed live job, a clinic with no website) shows only "Open in the review queue", so the review queue stays the single check for anything that needs a look. A claim shows its checks the same way.
- **Approving a job charges the clinic's saved card** when the free launch is over, exactly as approving in the queue does. The alert shows the payment line, so Steve sees what pressing the button does.
- **Send back is not done from Slack in the first version.** It needs a note for the clinic, which means a Slack pop up form and one more permission. The alert links to the review queue for that. It can follow as a second step.
- **Only live gets buttons.** The demo site posts into the same Slack, and a Slack app has 1 address for its buttons, so a demo alert's button would reach the live site. Demo alerts carry no buttons.
- **No new SQL.** The job's Activity notes already record who did what.

## What Steve does in Slack (about 10 minutes, once)

1. At api.slack.com/apps, open the Kestrel app, then Interactivity and Shortcuts, switch it on, and enter the address `https://eyecarejobs.ca/api/slack/actions`.
2. Copy the app's Signing Secret (under Basic Information) into Vercel as `SLACK_SIGNING_SECRET`, marked Sensitive, in the live project.
3. Find his own Slack member ID (in Slack, open his profile, the three dots, Copy member ID) and put it in Vercel as `SLACK_APPROVER_IDS` (several IDs separated by commas, so a trusted person can be added later). It is not secret but stays out of the repository.

## What Claude builds

- `app/api/slack/actions/route.ts`: checks the signature, the approver and the freshness, answers Slack inside its 3 seconds, then does the work in the background and updates the message.
- `lib/slack-signature.ts` (pure, tested), `lib/slack-actions-core.ts` (what each button does, tested), buttons added to the alert text in `lib/slack-text.ts`, a shared claim approval in `lib/claim-actions.ts`.
- Tests: a forged or old message is refused, a person not on the list is refused, a flagged job has no button, a job already decided cannot be approved twice, the demo has no buttons.
- Two settings added to `docs/settings.md`, `.env.example` and `docs/security.md`.

## Questions for Steve

1. Is a button (and no typed word) right?
2. Is "no button on a flagged job" right?
3. Claims too, as well as jobs?
4. Send back from Slack as a second step, after this works?
