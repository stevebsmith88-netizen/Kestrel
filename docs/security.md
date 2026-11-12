# Security playbook

What we hold, who can reach it, how to change a key in 5 minutes, and what to do if a service we use is breached. Read this once now, so you are not reading it for the first time on a bad day.

## What is worth protecting

- **People's information:** names, email addresses, phone numbers, resumes and cover letters, and who applied to what. This is the part that matters most, and the part privacy law cares about (PIPEDA).
- **The ability to send email as Kestrel,** and to run the ad builder on our bill.
- **The website itself:** if someone could change the code or the settings, they could point visitors anywhere.

We do not hold card numbers (Stripe will), health records or passwords (Supabase stores only a scrambled form of passwords).

## Every secret, what it can do, and how to change it

Change one by creating the new key first, putting it in Vercel (Settings, Environment Variables, Production and Preview), redeploying without the build cache, and only then deleting the old key. Mark each one **Sensitive** in Vercel, so it cannot be read back from the dashboard.

| Secret | Where it lives | What someone with it could do | How to change it |
| --- | --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` (the Supabase secret key) | Vercel only | Read and change everything in the database, including every resume and application. The most powerful key we have. | Supabase, Project Settings, API Keys: create a new secret key, swap it into Vercel, redeploy, delete the old key. |
| `RESEND_API_KEY` | Vercel only | Send email as Kestrel. Cannot read the database. | Resend, API Keys: create `kestrel-website`, swap, redeploy, delete the old one. |
| `RESEND_WEBHOOK_SECRET` | Vercel only | Proves a bounce or spam complaint message really came from Resend (`/api/resend`). Someone holding it could add addresses to the do not email list. | Resend, Webhooks, the eyecarejobs.ca endpoint: roll the signing secret, paste the new one into Vercel, redeploy. |
| Resend SMTP key (used by Supabase for sign up emails) | Supabase, Authentication, SMTP | Send email as Kestrel. | Create a new Resend key, paste it into Supabase's SMTP settings, delete the old one. |
| `ANTHROPIC_WORKSPACE_ID` | Vercel (optional) | Not secret. Only needed if the Anthropic key is not tied to a workspace. Names which workspace requests are billed to. | Change the value in Vercel and redeploy. |
| `ANTHROPIC_API_KEY` | Vercel only | Run AI requests on our bill. Cannot read the database. Keep a monthly spend limit on it. | Anthropic console, API keys: create, swap, redeploy, delete the old one. |
| `SUPABASE_SERVICE_ROLE_KEY` (demo project) | The `kestrel-demo` Vercel project only (see docs/demo-site.md) | Full access to the demo database, which holds sample data only and no real information. It cannot reach the live database. | Supabase, the demo project, Project Settings, API: roll the secret key, update it in the `kestrel-demo` Vercel project, redeploy. Or delete the demo project. |
| `ADMIN_BACKUP_EMAIL` | Vercel only | Receives the same admin alerts as ADMIN_ALERT_EMAIL. Nothing else. | Change the value in Vercel and redeploy. |
| `CLINIC_INVITE_CODE` | Vercel only | Lets someone who has the code create a clinic account while sign up is by invitation. Nothing else. | Choose a new code in Vercel (Production), redeploy, and send the new one to invited clinics. |
| `TURNSTILE_SECRET_KEY` | Vercel only | Check bot test results as if it were the site's own. Cannot read the database. | Cloudflare, Turnstile, the widget, Settings: rotate the secret key, swap it in Vercel, redeploy. |
| Google sign in Client Secret | Supabase only (Authentication, Providers, Google) | Pretend to be our Google sign in. Cannot read the database. | Google Cloud, Google Auth Platform, Clients: add a new secret, paste it into Supabase, then delete the old one. |
| `INDEXNOW_KEY` | Vercel (a setting, public by design) | Nothing harmful. Search engines read it from a key file on the site to trust our "this page changed" pings. Not set on the demo site. | Make a new key in Vercel, redeploy, and see `docs/marketing/search-engines.md`. |
| `ADMIN_ALERT_EMAIL` | Vercel only | Not secret. The address that gets admin alerts. | Change the value in Vercel and redeploy. |
| `CRON_SECRET` | Vercel only | Run the daily housekeeping job on demand (expire jobs, send alert emails). | Make up a new long random string in Vercel and redeploy. Vercel sends it automatically. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public by design | Nothing on its own. Our database rules (row level security) decide what it can see, and we have tested them. | Not secret. Only change it if Supabase asks. |
| Stripe keys (when built) | Vercel only | Take payments and read customers. | Use restricted keys, and roll them in the Stripe dashboard. |

Links we email (unsubscribe, confirm your email) are signed with the Supabase secret key. If that key changes, links already sent stop working, which is safe.

## Accounts to lock down (do these once)

Turn on 2 step sign in (an authenticator app, not text messages) and use a password manager for each: **GitHub, Vercel, Supabase, Namecheap, Google Workspace, Resend, Anthropic, Stripe** and the Cloudflare account when it exists. These accounts can do more damage than any key above. Also:

- Namecheap: turn on the domain lock, and 2 step sign in. Whoever controls the domain controls the email too.
- GitHub: turn on Dependabot alerts (free), and secret scanning and push protection if the plan allows. Require a pull request before changes reach `main`.
- Vercel: mark secrets Sensitive, and remove anyone who does not need access.
- Supabase: upgrade to Pro for daily backups, and do a test restore once before launch.

## Emergency switches

A maintenance switch (`MAINTENANCE_MODE`) puts the whole site behind a "back soon" page, and `docs/breach-plan.md` has the click by click steps for that, for signing everyone out, for stopping all email, and for going back to the last good version. It is a setting, not a secret, and it must be set in each Vercel project (live and demo) separately.

## If personal information is lost or seen by the wrong person

Follow `docs/breach-plan.md`: one page, with a message to send and a log to fill in.

## If a service we use says it has been breached

Hugging Face's July 2026 breach is the example: attackers got internal datasets and credentials, and the company told users to rotate their tokens and check their account activity. Kestrel does not use Hugging Face. The same steps apply to any of our services:

1. **Read what the company says it affects.** Do not guess.
2. **Rotate that service's keys** (table above), most powerful first: the Supabase secret key, then Resend, then Anthropic, then `CRON_SECRET`.
3. **Look for anything unfamiliar:** Vercel (Deployments: any you did not make), Supabase (Authentication users and logs), Resend (emails sent), the Anthropic console (usage), GitHub (recent commits and who has access).
4. **If personal information may have been seen,** the law asks us to judge whether there is a real risk of significant harm. If so we must tell the affected people and the Office of the Privacy Commissioner of Canada as soon as possible, and keep a record of every breach for 24 months. Ask the lawyer. Write down what happened and when as you go.
5. **Tell people plainly** what happened, what we did and what they should do. No spin.

## What already protects us

- No secret has ever been committed to the code (the whole history was checked), and the secrets never reach a visitor's browser (checked by building with fake secrets and searching everything sent to browsers).
- Every secret is read only by server code, and the files that use them refuse to load in a browser.
- Row level security protects every table: a signed in person can only see their own rows, and we have tested the rules against a real database. The tests are kept in the repository and can be run again at any time: `bash scripts/dev/rls-tests.sh` (99 tests on a throwaway database, never the live one). Run them after any change to permissions or policies.
- Resumes sit in a private store and open only through a link that works for 1 minute.
- Packages: 13 direct (plus 4 development tools used only to build), all pinned to an exact version, none runs code when installed (no package in `package-lock.json` has an install script), and `npm audit` reports 0 known problems. Check it monthly.
- We do not download or run any AI model or dataset from the internet, and a resume is opened by our servers in 1 case only: when the candidate chooses Fill in from my resume, Kestrel's own server reads the text of that 1 file with fixed rules, no AI and no other service (`lib/resume-text.ts`). That reader is a place an uploaded file could attack, so it has limits on size, pages and time, with tests that build hostile files (`lib/resume-text.test.ts`, limits listed in `docs/cv-scanning.md`). Otherwise a resume is opened only by the clinic, on their own computer.
- The ad builder sends Anthropic what a clinic types in, up to 8 of that clinic's earlier ads (read from our database by our own server) and text from the clinic's own public website. The admin tools also send it a clinic's public careers page and web searches. It never sends candidate information, and Anthropic's side only receives text and returns text, with no access to our database. `lib/ai-disclosure.test.ts` checks that the ad builder and admin tools never read candidate tables.

## Known gaps

- **Bots:** the Cloudflare Turnstile check is built into the waitlist, sign up, password reset request and report forms, and into sign in after 5 failed tries (see Sign in guard). On previews and local work it runs only when both Turnstile keys are set. On the live site, if a key is missing, `lib/turnstile.ts` refuses sign ups and the other forms until it is set, rather than letting bots through (the demo site is exempt). The health check at `/api/health` lists a missing key by name.
- **Uploaded resumes are checked, but not virus scanned.** The type and size are checked, and files with macros, scripts or embedded programs are refused, but a real antivirus scan is still to be added before launch. See `docs/cv-scanning.md`.
- **No 2 step sign in on the admin area** beyond the account's own. Your Supabase account having 2 step sign in matters.
- **A stricter content security policy** (which limits what scripts a page may run) is not on yet. It is worth adding with the full audit, because it needs testing.

## Setting up the bot check (Cloudflare Turnstile)

1. Create a free Cloudflare account with a Kestrel address, turn on 2 step sign in, then Turnstile, Add widget, hostname `eyecarejobs.ca`, mode Managed.
2. In Vercel add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (the Site Key, public) and `TURNSTILE_SECRET_KEY` (the Secret Key, mark Sensitive, never paste it into chat or email) to **Production**.
3. For **Preview**, add Cloudflare's published test keys instead, because preview addresses are not on the real widget. Check Cloudflare's Turnstile testing page for the current values.
4. Redeploy without the build cache. The site key is read when the site is built, so the check only appears after a new build.
5. Both keys must be set. On previews and local work the check is skipped when either key is missing. On the live site a missing key makes the forms refuse, so that bots are never let through by accident (`lib/turnstile.ts`).

## Sign in guard

Failed sign in attempts are counted per email and per visitor in `sign_in_attempts` (migration 0024), using scrambled keys. After 5 failures in 15 minutes, the sign in form asks for the bot check before another try. If Supabase's own limit is reached, people see a "wait a few minutes" message. A good sign in clears the email's count, and the daily job removes counts older than a day. If the table is missing or unreadable, sign in carries on as before and the problem is logged.
