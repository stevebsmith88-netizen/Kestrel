# Security playbook

What we hold, who can reach it, how to change a key in 5 minutes, and what to do if a service we use is breached. Read this once now, so you are not reading it for the first time on a bad day.

## What is worth protecting

- **People's information:** names, email addresses, phone numbers, CVs and cover letters, and who applied to what. This is the part that matters most, and the part privacy law cares about (PIPEDA).
- **The ability to send email as Kestrel,** and to run the ad builder on our bill.
- **The website itself:** if someone could change the code or the settings, they could point visitors anywhere.

We do not hold card numbers (Stripe will), health records or passwords (Supabase stores only a scrambled form of passwords).

## Every secret, what it can do, and how to change it

Change one by creating the new key first, putting it in Vercel (Settings, Environment Variables, Production and Preview), redeploying without the build cache, and only then deleting the old key. Mark each one **Sensitive** in Vercel, so it cannot be read back from the dashboard.

| Secret | Where it lives | What someone with it could do | How to change it |
| --- | --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` (the Supabase secret key) | Vercel only | Read and change everything in the database, including every CV and application. The most powerful key we have. | Supabase, Project Settings, API Keys: create a new secret key, swap it into Vercel, redeploy, delete the old key. |
| `RESEND_API_KEY` | Vercel only | Send email as Kestrel. Cannot read the database. | Resend, API Keys: create `kestrel-website`, swap, redeploy, delete the old one. |
| Resend SMTP key (used by Supabase for sign up emails) | Supabase, Authentication, SMTP | Send email as Kestrel. | Create a new Resend key, paste it into Supabase's SMTP settings, delete the old one. |
| `ANTHROPIC_API_KEY` | Vercel only | Run AI requests on our bill. Cannot read the database. Keep a monthly spend limit on it. | Anthropic console, API keys: create, swap, redeploy, delete the old one. |
| `CLINIC_INVITE_CODE` | Vercel only | Lets someone who has the code create a clinic account while sign up is by invitation. Nothing else. | Choose a new code in Vercel (Production), redeploy, and send the new one to invited clinics. |
| `TURNSTILE_SECRET_KEY` | Vercel only | Check bot test results as if it were the site's own. Cannot read the database. | Cloudflare, Turnstile, the widget, Settings: rotate the secret key, swap it in Vercel, redeploy. |
| Google sign in Client Secret | Supabase only (Authentication, Providers, Google) | Pretend to be our Google sign in. Cannot read the database. | Google Cloud, Google Auth Platform, Clients: add a new secret, paste it into Supabase, then delete the old one. |
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
- Row level security protects every table: a signed in person can only see their own rows, and we have tested the rules against a real database.
- CVs sit in a private store and open only through a link that works for 1 minute.
- Packages: 11 direct, all pinned to an exact version, none runs code when installed, and `npm audit` reports 0 known problems. Check it monthly.
- We do not download or run any AI model or dataset from the internet, and CVs are never opened or processed by our servers, so there is no pipeline an uploaded file could attack. A CV is opened only by the clinic, on their own computer.
- The ad builder sends only the job details a clinic types in, receives text, and has no access to the database or to anything else.

## Known gaps

- **Bots:** the Cloudflare Turnstile check is built into the waitlist, sign up, password reset and report forms. It only works once both Turnstile keys are in Vercel. Sign in is left without it on purpose, because Supabase already limits sign in attempts and the check adds friction for real people.
- **Uploaded CVs are checked, but not virus scanned.** The type and size are checked, and files with macros, scripts or embedded programs are refused, but a real antivirus scan is still to be added before launch. See `docs/cv-scanning.md`.
- **No 2 step sign in on the admin area** beyond the account's own. Your Supabase account having 2 step sign in matters.
- **A stricter content security policy** (which limits what scripts a page may run) is not on yet. It is worth adding with the full audit, because it needs testing.

## Setting up the bot check (Cloudflare Turnstile)

1. Create a free Cloudflare account with a Kestrel address, turn on 2 step sign in, then Turnstile, Add widget, hostname `eyecarejobs.ca`, mode Managed.
2. In Vercel add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (the Site Key, public) and `TURNSTILE_SECRET_KEY` (the Secret Key, mark Sensitive, never paste it into chat or email) to **Production**.
3. For **Preview**, add Cloudflare's published test keys instead, because preview addresses are not on the real widget. Check Cloudflare's Turnstile testing page for the current values.
4. Redeploy without the build cache. The site key is read when the site is built, so the check only appears after a new build.
5. Both keys must be set for the check to run. If only one is set, the forms carry on without it, so a half finished setup can never lock people out.
