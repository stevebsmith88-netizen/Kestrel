# Launch checklist, in order of ease and necessity

Work down the list. "You" is Steve. "Claude" means Claude builds it and you approve.

## 1. Do now (minutes each, and they unlock testing)

| # | What | Who | Time |
| --- | --- | --- | --- |
| 1 | Run `supabase/combined/run-everything.sql` (all migrations 0001 to 0019, with a check at the end). Safe to run again | You | 2 min |
| 2 | Create the new Resend key `kestrel-website` (sending access, your domain only) and add it to Vercel as `RESEND_API_KEY` | You | 5 min |
| 3 | Create the Anthropic key `kestrel-website` (own workspace, spending limit) and add it as `ANTHROPIC_API_KEY` | You | 5 min |
| 4 | Make up a long random string and add it as `CRON_SECRET` | You | 2 min |
| 5 | Add `ADMIN_ALERT_EMAIL` (your steve@ address) so the site can tell you about problems and reported jobs | You | 1 min |
| 6 | Redeploy without the build cache (Vercel, Deployments, the 3 dots, Redeploy, untick "Use existing build cache") | You | 3 min |
| 7 | Create the 3 test accounts (see `docs/test-accounts.md`) | You | 10 min |
| 8 | Add a free uptime check: UptimeRobot, monitor `https://eyecarejobs.ca/api/health`, alert to your email | You | 5 min |
| 9 | Walk through the end to end run in `docs/test-accounts.md` on the preview and tell Claude what looks wrong | You | 30 min |
| 10 | Approve, then Claude merges to main | You | 1 min |

Add each key to Production and Preview in Vercel (Settings, Environment Variables).

## 2. Before you invite anyone (small effort, important)

| # | What | Who |
| --- | --- | --- |
| 11 | Support inbox: set up `hello@` and `privacy@` as Google Workspace aliases (or a Google Group) and turn on "Send mail as" so replies come from them | You, with Claude's steps |
| 12 | DONE: Cloudflare Turnstile bot check (built, keys added and tested) | |
| 13 | Move Supabase to Pro (about $25 a month) for daily backups and no pausing | You |
| 14 | Name yourself privacy officer and write down a breach plan (a one page note) | You, Claude drafts |
| 15 | Lawyer reads the Terms, Posting policy and Privacy policy. Then Claude removes the "Draft for review" banner | You |
| 16 | DONE: Google sign in (built, set up and tested; see `docs/google-signin.md`) | |

## 2a. Lock down the accounts (you, about 45 minutes, see `docs/security.md`)

| # | What | Who |
| --- | --- | --- |
| 15a | 2 step sign in (authenticator app) and a password manager on GitHub, Vercel, Supabase, Namecheap, Google Workspace, Resend, Anthropic | You |
| 15b | Vercel: mark every secret as Sensitive. Namecheap: turn on the domain lock | You |
| 15c | Anthropic: a monthly spend limit on the Kestrel key. Resend: key limited to sending, for your domain | You |
| 15d | GitHub: turn on Dependabot alerts, and require a pull request before changes reach `main` | You |

## 3. Claude builds next

| # | What | Needs from you |
| --- | --- | --- |
| 17 | Stripe checkout in test mode with the FREELAUNCH coupon and HST | Your Stripe account and test keys |
| 18 | DONE: "Claim your listing" page (run migration 0012) | Nothing |
| 19 | DONE: waitlist confirmation email (run migration 0014) | Nothing |
| 20 | DONE: admin numbers and the "Find your fit" quiz | Nothing |
| 20a | DONE: saved job templates, application drafts and saved cover letters (run migration 0015) | Nothing |
| 21 | DONE: do not email list and clinic unsubscribe page | Nothing |
| 22 | DONE: text sizes now follow the browser's text size setting (tested at 150% and 200%) | Nothing |
| 22d | DONE: CVs with macros, scripts or embedded files are refused. A real virus scanner is still to choose, see `docs/cv-scanning.md` | Your decision |
| 22e | DONE: one page breach plan, `docs/breach-plan.md`. Fill in the backup person and the lawyer | You |
| 22f | Set `EMAIL_REPLY_TO` in Vercel to a real inbox (see `docs/email-addresses.md`) | You |
| 22a | Admin tool to add found listings (seeding). Editing a live job and Post again are DONE | Nothing |
| 22b | DONE: field based and supplier roles; blog with 3 starter posts (more topics in `docs/blog.md`) | Nothing |
| 22c | Pricing for field and supplier roles (decide with the Stripe step) | Your decision |

## 4. Before launch day

| # | What | Who |
| --- | --- | --- |
| 23 | Full audit: security, accessibility with a real screen reader, and a clean run of every flow | You choose the reviewer, Claude fixes findings |
| 24 | Test a restore from a Supabase backup once | You |
| 25 | Vercel Pro, and move the repo into the Kestrel GitHub organisation | You |
| 26 | Your disclosure conversation at Eye Recommend, then clinic outreach and listing seeding | You |
| 27 | Switch the Stripe test keys for live keys, then switch prices on | You |
