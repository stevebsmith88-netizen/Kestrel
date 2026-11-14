# Settings for the 2 Vercel projects

Every setting the code reads (found by searching the code for `process.env`, 12th November 2026, audit P1-18), what it does, and the value it should have in the **live** project (`kestrel`, eyecarejobs.ca) and the **demo** project (`kestrel-demo`, demo.eyecarejobs.ca). Settings are in Vercel, under the project, **Settings, Environment Variables**. A change takes effect on the next deployment, so redeploy after changing one.

Claude cannot see Vercel, so the "should be" columns are what the code and the docs expect, not a reading of what is set today. Check each project against this table once, and again whenever a setting is added. When a new setting is added to the code, add a row here, to `.env.example` if it is not secret, and to `docs/security.md` if it is.

**Secret** means it must be marked **Sensitive** in Vercel, never pasted into a chat, and never put in `.env.example` or the repository. How to rotate each secret is in `docs/security.md`.

"Leave unset" means do not add it at all. "Not needed" means the demo works without it.

## Keys and addresses

| Setting | What it does | Live should be | Demo should be | Secret |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | The site's own address, used in emails, links and the sitemap. | `https://eyecarejobs.ca` | `https://demo.eyecarejobs.ca` | No |
| `SUPABASE_URL` | The database address, for the server. | the live Supabase project's URL | the demo Supabase project's URL | No |
| `NEXT_PUBLIC_SUPABASE_URL` | The same address, for sign in in the browser. | same as `SUPABASE_URL` | same as `SUPABASE_URL` | No |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The public browser key (starts `sb_publishable_`). Safe to be public; the database's own rules protect the data. | the live project's publishable key | the demo project's publishable key | No |
| `SUPABASE_SERVICE_ROLE_KEY` | The server key that can read and write everything. Also signs unsubscribe links. | the live project's secret key | the demo project's secret key | **Yes** |
| `RESEND_API_KEY` | Sends the website's own emails through Resend. Without it, emails are skipped quietly. | the `kestrel-website` Resend key | Not needed (the demo never sends email) | **Yes** |
| `RESEND_WEBHOOK_SECRET` | Proves a bounce or spam complaint message really came from Resend (`/api/resend`). | the webhook's signing secret from Resend | Not needed | **Yes** |
| `EMAIL_FROM` | The "from" line on emails. | Leave unset (the default is `Kestrel Eye Care Jobs <hello@mail.eyecarejobs.ca>`) | Not needed | No |
| `EMAIL_REPLY_TO` | Where replies to automatic emails go. | Leave unset (the default is `support@eyecarejobs.ca` since 14th November 2026) or set it to that | Not needed | No |
| `ADMIN_ALERT_EMAIL` | Your inbox for problems, reported jobs and things waiting for you. | your own address | Not needed | No (but private) |
| `ADMIN_BACKUP_EMAIL` | A second inbox for the same alerts, so none is lost. | the backup person's address (keep the name out of the repository) | Not needed | No (but private) |
| `CRON_SECRET` | Protects the daily job, so only Vercel can start it. | a long random string | Not needed | **Yes** |
| `ANTHROPIC_API_KEY` | The ad builder, the careers page reader and the province search. Without it those buttons are hidden. | the Anthropic key | optional (the same spend limit applies) | **Yes** |
| `ANTHROPIC_WORKSPACE_ID` | Only needed if the Anthropic key was not made inside a workspace. | Leave unset unless the Setup check on /admin/found asks for it | Leave unset | No |
| `STRIPE_SECRET_KEY` | Talks to Stripe from the server (checkout, payments). Starts `sk_test_` in test mode, or `rk_test_` for a restricted key. Admin, Payments checks it. | the test secret key until prices are switched on | the test secret key (never a live key) | **Yes** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe's public key, safe in the browser. Starts `pk_test_` in test mode, and must be the same mode as the secret key. | the test publishable key until prices are switched on | the test publishable key | No |
| `STRIPE_WEBHOOK_SECRET` | Proves a message to `/api/stripe/webhook` really came from Stripe (starts `whsec_`). Without it the webhook refuses everything; card saving still works through the clinic's own return to the site. Made in Stripe, Developers, Webhooks, when the endpoint is added. | the signing secret of the live site's webhook endpoint | the signing secret of the demo's webhook endpoint | **Yes** |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | The bot check's public key (Cloudflare Turnstile). | the Turnstile site key | Not needed | No |
| `TURNSTILE_SECRET_KEY` | The bot check's private key. On the live site, forms are refused if it is missing. | the Turnstile secret key | Not needed | **Yes** |
| `INDEXNOW_KEY` | Tells Bing and others about new job pages straight away. Does nothing until set. | the IndexNow key | Leave unset (the demo is not indexed) | No |

## On and off switches

| Setting | What it does | Live should be | Demo should be | Secret |
| --- | --- | --- | --- | --- |
| `DEMO_MODE` | Makes the site the demo: never sends email, shows sample data notices. | Leave unset. **Never `yes` on live.** | `yes` | No |
| `MAINTENANCE_MODE` | The emergency "back soon" switch (docs/breach-plan.md). Also stops the waitlist, the daily job and the view counter. | Leave unset (only `yes` in an emergency) | Leave unset | No |
| `CLINIC_SIGNUP` | `yes` lets clinics sign up without an invitation code. | Leave unset until clinic sign up opens to everyone | `yes` | No |
| `CLINIC_INVITE_CODE` | The code an invited clinic types at sign up while `CLINIC_SIGNUP` is not `yes`. | a code you choose and give to invited clinics | Not needed | No (but do not publish it) |
| `ENABLE_GOOGLE_SIGNIN` | `yes` shows Continue with Google (docs/google-signin.md). | unset until launch, then `yes` | Leave unset | No |
| `ENABLE_ONBOARDING_EMAILS` | `yes` sends the first week emails. Off until the lawyer answers question 43. | Leave unset | Leave unset (the demo sends nothing anyway) | No |
| `ENABLE_SEEDING` | `yes` lets found listings be published. Off until your disclosure conversation. | Leave unset | Leave unset | No |
| `ENABLE_OUTREACH` | `yes` sends clinic outreach emails. Off until your disclosure conversation and the lawyer's check. | Leave unset | Leave unset | No |
| `OUTREACH_DAILY_LIMIT` | Most outreach emails a day once outreach is on. Default 20. | Leave unset | Leave unset | No |
| `FORCE_PAID_CHECKOUT` | `yes` asks a clinic to save a card when it sends a job for review, even during the free launch and with a test Stripe key. For trying checkout on the demo site only. | **Leave unset. Never `yes` on live.** | `yes` while testing checkout, then unset | No |
| `ENABLE_COMPARE` | `no` hides the comparison page at /compare. On unless set to `no`. | Leave unset | Leave unset | No |
| `ENABLE_FIND_YOUR_FIT` | `yes` shows the Find your fit quiz. | Leave unset until you decide | Leave unset, or `yes` to show it in demos | No |
| `ENABLE_HOME_BLOG` | `yes` shows "From the blog" on the home page. | Leave unset until you want it | Leave unset | No |
| `PRELAUNCH_HOME` | `no` puts the original coming soon page back, before launch only. | Leave unset | Leave unset | No |
| `LAUNCH_HOME` | Forces a home page: `yes` launch layout, `prelaunch` the pre launch look, `no` the coming soon page. | Leave unset | `prelaunch` until launch, then `yes` or unset (docs/launch-home.md) | No |
| `DAILY_EMAIL_BUDGET` | The most emails the daily job sends in 1 run (default 50). `0` stops the daily job's emails. The daily total warning uses it too (audit P1-24). | Leave unset on Resend's free plan; raise it after a paid plan | Not needed | No |
| `AD_BUILDER_MODEL` | Which Claude model writes draft ads. Default `claude-sonnet-5-5`. | Leave unset | Leave unset | No |
| `PAGE_READER_MODEL` | Which Claude model reads careers pages. Default `claude-sonnet-5-5`. | Leave unset | Leave unset | No |

The sign up gate is **not** a Vercel setting. It lives in the database (migration 0021), so it cannot be skipped. To open sign up at launch, run `update public.signup_gate set open = true;` in the Supabase SQL editor of the live project. The demo's gate is already open.

## Set by Vercel or Next.js, never by you

| Setting | What it is |
| --- | --- |
| `VERCEL_ENV` | `production`, `preview` or `development`. Used to tell the live site from a preview. |
| `VERCEL_GIT_COMMIT_SHA` | Which version of the code is running. |
| `NODE_ENV` | Set by Next.js. |
| `NEXT_PHASE` | Set by Next.js while it builds. |

## Settings in Supabase, not Vercel

These are set in each Supabase project's dashboard, not in Vercel: the CAPTCHA protection (Authentication, Attack Protection), which should stay **off** because the database's sign up ticket does that job (audit P1-03, `docs/accounts-setup.md`), the SMTP settings that send sign up emails through Resend, the allowed sign in addresses (Authentication, URL Configuration), and Google sign in. The steps for each are in `docs/accounts-setup.md`, `docs/google-signin.md` and the Phase E notes in `docs/audit/AUDIT-FIXES-LOG.md`.
