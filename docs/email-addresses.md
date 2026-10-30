# Email addresses and inboxes

Use this to set up the inboxes, so you can see which address each message arrived on.

## Addresses people are told to write to (they need to land in a real inbox)

| Address | Used for | Where it appears |
| --- | --- | --- |
| `hello@eyecarejobs.ca` | General help and questions, reports of a job, requests to remove a found listing, a clinic whose claim needs help | Contact page, Terms, Posting policy, claim page, report form, emails about a job taken down |
| `privacy@eyecarejobs.ca` | Seeing, correcting or deleting personal information, privacy questions | Contact page, Privacy policy, Account page |

## Addresses the site sends from or to

| Address | What it is | Set in |
| --- | --- | --- |
| `hello@mail.eyecarejobs.ca` | The "from" address of every automatic email the website sends (applications, alerts, confirmations) through Resend. A sending address, not an inbox. | `EMAIL_FROM` in Vercel (falls back to this) |
| `EMAIL_REPLY_TO` | Where replies to those automatic emails go. Set it to a real inbox so a reply is never lost. Recommended: `hello@eyecarejobs.ca`. | `EMAIL_REPLY_TO` in Vercel |
| `ADMIN_ALERT_EMAIL` | Where the site sends you alerts: a job to review or edited, a reported job, a claim, a problem with the daily job. | `ADMIN_ALERT_EMAIL` in Vercel |
| Supabase's "from" address | The sign up, password reset and change email messages. | Supabase, Authentication, SMTP settings |

## Suggested inboxes, if you want to see where a message came from

You can give each its own address, and Gmail shows which one a message arrived on (and "Send mail as" answers from the same one):

- `hello@` for help and questions (default for replies)
- `privacy@` for privacy requests, the one with a deadline, so keep it easy to spot
- `listings@` for found listings and claims (when seeding starts, so clinics have a clear place to answer)
- `alerts@` as the address you give `ADMIN_ALERT_EMAIL`, so every message from the site's own warnings lands in one folder

If you decide on others, tell me the names and I can send each kind of automatic email with its own reply address. The law needs only one thing from each marketing email: our name, our mailing address and a working unsubscribe, and those do not change.
