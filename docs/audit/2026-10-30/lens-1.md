# Lens 1: Security
Reach: all 15 "use server" files (46 actions) and 10 route handlers read end to end; open redirect proven in Chromium against a local production build with a forged session cookie; headers checked with curl on a local copy; database claims tested in kestrel_lens with BEGIN/ROLLBACK; CV and claim helpers tested directly. Could not reach live Supabase, Vercel, Cloudflare, Google or Resend, so their settings are on Steve's list.

## Findings
### 1.1 Open redirect after sign in (the "next" check can be beaten with a tab character)
- Severity: High  | Confidence: Confirmed
- For Steve: Someone can send a real eyecarejobs.ca sign in link that, after the person signs in, quietly sends them on to a look alike site that asks for their password again or for payment. Because the link starts on our real domain, people trust it.
- Evidence: lib/auth-copy.ts:23-26 (`safeNext` only rejects values starting with `//` or containing `\`). Used at app/sign-in/page.tsx:15 and :22, lib/auth-actions.ts:26 (password sign in), lib/auth-actions.ts:120 (Google), app/auth/callback/route.ts:11 and :16, app/auth/confirm/route.ts:13 and :18. Node: `safeNext("/\t/evil.com")` returns it unchanged and `new URL("/\t/evil.com","https://eyecarejobs.ca")` gives `https://evil.com/` (same for `\n` and `\r`). Local build with a forged session cookie: `curl -D - '/sign-in?next=/%09/evil.com'` answers `307` with `location: /<TAB>/evil.com`; Chromium then requested `http://attacker.invalid/phish` (script $S/lens-1/redirect-test.js).
- Detail: browsers and the WHATWG URL parser strip tab, CR and LF before parsing, so `/<TAB>/host` becomes the protocol relative `//host`. Paths: a signed in visitor opening /sign-in?next=..., the password sign in form (hidden `next`), and the Google round trip (next survives through /auth/callback, which then redirects to the attacker after a real code exchange).
- Proposed fix: in safeNext, reject any control character or whitespace (`/[\x00-\x1f\x7f\s]/`), then parse with `new URL(value, "https://x.invalid")` and accept only if the origin is unchanged; return `pathname + search + hash`. Add 4 tests (tab, LF, CR, `/\`). | Effort: 30 minutes | Who: Claude

### 1.2 Anyone can overwrite a waitlist entry and undo someone's unsubscribe
- Severity: Medium  | Confidence: Confirmed
- For Steve: If a stranger types someone else's email into the waitlist form, our record for that person is rewritten (name, province, clinic) and an earlier "unsubscribe" is wiped, so the export shows them as confirmed and happy to hear from us. Emailing them from that list at launch would break the anti spam law.
- Evidence: app/api/waitlist/route.ts:31-46 upserts on `email` with `unsubscribed_at: null`, new `consent_at` and `consent_text`, and leaves `confirmed_at` alone. Reproduced in kestrel_lens (BEGIN/ROLLBACK): a row confirmed 30 days ago and unsubscribed 2 days ago, after the route's upsert, reads `first_name=Stranger, audience=clinic, province=Yukon, confirmed=t, unsubscribed_at=NULL`. The do not email row survives (it is only deleted on reconfirm, lib/waitlist-actions.ts:112), so sendEmail still blocks marketing sent by the app, but app/admin/waitlist.csv/route.ts exports the rewritten row as subscribed.
- Detail: the form has no proof that the person typing owns the address. The confirmation email is right for new rows, but an existing row should not be changed until the link is pressed.
- Proposed fix: for an existing email, change nothing except (when not confirmed) resending the link; keep new answers pending until the signed confirm link is pressed; never clear `unsubscribed_at` in the route (only confirmWaitlist may, after the signed link). | Effort: 1 to 2 hours | Who: Claude

### 1.3 Clinic profile changes go live without review, and the form rules are not backed by the database
- Severity: Medium  | Confidence: Confirmed
- For Steve: After you approve a job, the clinic can change its name, website and "About" text at any time through the normal profile page, and the change shows on the live job page straight away without you seeing it. Separately, the checks in the forms (https only links, no "Canadian experience", no odd characters) live only in the website code, not in the database, so they are one layer deep.
- Evidence: lib/clinic-actions.ts:19-74 (saveClinic) updates `employers` at any time with no review step or admin alert; app/jobs/[id]/page.tsx:43 and :59-62 and lib/jobs.ts:307 publish clinic_name, about and website. Database test in kestrel_lens as a fresh clinic user (BEGIN/ROLLBACK): an employer with `website='javascript:alert(1)'` and a job with `apply_url='javascript:alert(document.cookie)'`, a title containing CR LF and a description saying "Canadian experience required" are all accepted (`status=in_review`); `update employers set direct_hire_confirmed_at='2020-01-01'` is accepted. The app checks are only in lib/jobs.ts:139-140, 169-176 and 199-205.
- Detail: the job side is contained today: an admin must approve every job, the admin sees apply_url as text (app/admin/review/page.tsx:89) and a "Canadian experience" flag (lib/jobs.ts:216), React 19.3 blocks `javascript:` links, and the publishable key is not shipped to browsers (it appears only in .next/server), which makes direct database calls harder. The profile side is the real gap: a scammer can get 1 honest job approved, then rewrite "About" to "send your SIN and banking details to ...".
- Proposed fix: while a clinic has a live job, either send name, website and about changes to the review queue or email the admin a before and after (notifyAdmin already exists). Add database checks as a second layer (`apply_url ~ '^https://'`, `website ~ '^https?://'`, no control characters in title, clinic_name and city) and a "link is not https" review flag. | Effort: 2 to 4 hours | Who: Claude

### 1.4 The CV "macros and scripts" refusal is easy to get past, including without compression
- Severity: Medium  | Confidence: Confirmed
- For Steve: The check that refuses CVs with hidden scripts can be fooled with a 2 character change, and it does not look at the trick most harmful Word files use (fetching a booby trapped template from the internet when opened). Clinics are the ones who open CVs, so a bad file would land on a clinic's computer with our name on it.
- Evidence: lib/applications.ts:128-138. Test script $S/lens-1/cv-bypass.mjs against the real function: a PDF with `/S /JavaScript /JS (...)` is refused, but the same PDF written `/S /J#61vaScript /J#53 (...)` (a legal PDF spelling of the same names) passes (`refused because: null`); a .docx whose `word/_rels/settings.xml.rels` points to `https://attacker.invalid/t.dotm` with `TargetMode="External"` passes, because the zip entry is compressed and the address is not visible in the raw bytes. docs/cv-scanning.md and docs/security.md:67 say macros, scripts and embedded programs "are refused".
- Detail: the regex reads raw bytes, so PDF name escapes (`#xx`), compressed object streams and every zipped part of a .docx are invisible to it. Antivirus (option A in docs/cv-scanning.md) helps with known malware but often misses remote template and external OLE links.
- Proposed fix: in activeContent, decode `#xx` in PDF names before matching and refuse PDFs that contain `/ObjStm` with `/OpenAction` or `/AA`; for .docx, unzip with the built in zlib and refuse any relationship with `TargetMode="External"` other than hyperlinks, plus `attachedTemplate`, `oleObject` and `altChunk`. Correct the 2 docs to say "a first filter". Keep the antivirus plan. | Effort: half a day | Who: Claude

### 1.5 The AI ad builder has a per account cap that can be beaten, and no overall cap
- Severity: Medium  | Confidence: Likely
- For Steve: Anyone can make free clinic accounts, and each one can run the ad builder 15 times a day, more if the requests are fired all at once. There is no ceiling across all accounts, so the Anthropic bill could climb overnight. The spend limit on the Anthropic key (already on your lock down list) is the safety net and should be set before the ad builder is switched on.
- Evidence: lib/ad-builder.ts:48-51 counts uses in the last 24 hours, then inserts a new row, with nothing in between that stops 2 requests counting at the same moment (no lock, no unique slot), so 20 parallel calls all see a count under 15. A failed count (`count` null) is treated as 0 (line 50). Any clinic account qualifies, with or without a clinic profile (line 53 falls back to "the employer"). Each call is `claude-opus-5-5` with `max_tokens: 8000` (lines 69-77); at $4 in and $20 out per million tokens (Anthropic's current price list), a normal call is about 2 cents and a call steered to the maximum length about 17 cents.
- Detail: sign up needs only an email confirmation (and Turnstile, when keys are set), so many accounts are cheap for a determined person. Rough worst case: 100 accounts x 15 calls x $0.17 = about $255 a day before the concurrency gap.
- Proposed fix: make the check and the claim one database step (a small SQL function that inserts only when fewer than 15 rows exist, called with rpc), add a site wide daily cap (for example 300 calls), require a saved clinic profile, lower `max_tokens` to about 3000 (the ad is 120 to 300 words, plus some thinking), and set the Anthropic monthly spend limit. | Effort: 1 to 2 hours | Who: Claude, Steve for the spend limit

### 1.6 The unsubscribe link is just the account number, and other users can see account numbers
- Severity: Low  | Confidence: Confirmed
- For Steve: Any signed in person can look up the account number of every clinic with a live job, and every clinic can see the account number of each applicant. Pasting that number into our unsubscribe address silently switches off that person's job alerts and news emails. Annoying rather than dangerous, but easy to close.
- Evidence: app/api/cron/daily/route.ts:136 and lib/unsubscribe.ts:13-26 use `/unsubscribe/<user id>` with no signature and add the person's email to the do not email list, which then blocks job alerts (lib/email.ts:13). kestrel_lens (BEGIN/ROLLBACK): a signed in candidate selecting from `employers` gets `owner_id` of a clinic with a live job (the `authenticated` role has SELECT on every column of employers and jobs, supabase/migrations/0005_clinics_and_jobs.sql:283 and :289, including owner_id, direct_hire_confirmed_at, status and review_note); `applications.candidate_id` is readable by the clinic (0006:191). Anonymous visitors cannot read owner_id.
- Detail: the waitlist link `/unsubscribe/<waitlist id>` is fine, because that id is never shown. The account version reuses an id that is not secret.
- Proposed fix: sign the account unsubscribe link the same way as `unsubscribeQuery` (lib/unsubscribe-token.ts:17), so a known id is not enough. Optionally stop strangers reading owner_id (column grants apply to every row, so the owner's own reads would move to a small view or function; lens 2 may have a view on this). | Effort: 1 hour | Who: Claude

### 1.7 Pages outside the session keeper can sign people out at random, most likely on the Apply page
- Severity: Medium  | Confidence: Likely
- For Steve: Once someone has been signed in for more than about an hour, visiting a public page (job search, a job, Apply, Report, Claim, blog, contact) can quietly use up their sign in renewal without saving the new one. The next account page then finds the old renewal already used and signs them out. The worst case is a candidate pressing Send on an application and landing on the sign in page instead.
- Evidence: proxy.ts:9-23 runs the session refresh only on account paths. getSession (lib/auth.ts:34-39, `db.auth.getUser()`) is called from 12 pages and routes outside that list, including app/jobs/[id]/apply/page.tsx:22, app/jobs/[id]/page.tsx:36, app/jobs/page.tsx and app/jobs/[id]/claim/page.tsx:29; server actions posted from those pages (applyToJob, startClaim, submitReport) also run outside it. In a page, lib/supabase/server.ts:17-21 swallows the cookie write, so a refreshed session is thrown away. @supabase/auth-js 2.118.0 refreshes an expired session inside getUser (GoTrueClient.js about line 2540 to 2547, `_callRefreshToken`).
- Detail: Supabase rotates the renewal token on every refresh and, with reuse detection on (the default), treats a second use of an old token after 10 seconds as theft and ends the session. Not reproducible here without real Supabase Auth; Steve's tests were probably shorter than the 1 hour token life.
- Proposed fix: use Supabase's standard matcher (every path except `_next/static`, `_next/image`, images and the font files), so the proxy refreshes and saves the session before any page or action runs. Then delete the comment "The public pages never touch the sign in session", which is no longer true. | Effort: 30 minutes plus a 2 hour test on a preview | Who: Claude, Steve to test

### 1.8 The preview address wildcard in Supabase's allowed return addresses may let a stranger capture a Google sign in
- Severity: High  | Confidence: Possible
- For Steve: The setup guide tells you to let Supabase send signed in people back to any address ending in "-kestrel18.vercel.app". Those addresses are on Vercel's shared domain, and anyone with a free Vercel account may be able to pick a name like "jobs-kestrel18.vercel.app". If they can, they could send a candidate or clinic a "Continue with Google" link that hands the person's sign in to the stranger instead of to us.
- Evidence: docs/google-signin.md:22 ("Under Redirect URLs, add `https://eyecarejobs.ca/**`, and for preview links `https://*-kestrel18.vercel.app/**`"). The Supabase project address is visible to every visitor who presses Continue with Google (the browser goes to `<project>.supabase.co/auth/v1/authorize`), and that address needs no key. An attacker made link of the form `/auth/v1/authorize?provider=google&redirect_to=https://<name>-kestrel18.vercel.app/` with no PKCE challenge returns the person's tokens to that page; pasted into an `sb-<project>-auth-token` cookie, they sign the attacker in to eyecarejobs.ca as that person.
- Detail: Supabase matches `*` against any characters except a dot, so `anything-kestrel18.vercel.app` matches. Not testable here: it depends on whether that wildcard was actually saved, and whether Vercel will hand an outsider a free `*-kestrel18.vercel.app` name (Vercel lets projects use any free `.vercel.app` name). The email templates are not affected, because they always link to the Site URL (docs/email-templates/*.html).
- Proposed fix: remove the wildcard. For previews, list only exact addresses Vercel has already given you (for example the fixed branch address), or point Preview at a separate Supabase project. Keep `https://eyecarejobs.ca/**`. | Effort: 10 minutes | Who: Steve (Supabase, Authentication, URL Configuration), Claude to update docs/google-signin.md

### 1.9 The bot check switches itself off without telling anyone if a key goes missing
- Severity: Low  | Confidence: Confirmed
- For Steve: If the Turnstile secret is ever deleted or mistyped in Vercel's Production settings, the sign up, waitlist, password reset and report forms quietly stop checking for bots, and nothing alerts you. That is the right choice while setting up, but not once the site is live.
- Evidence: lib/turnstile.ts:6 and :13 (`if (!turnstileEnforced()) return true`); docs/security.md:75 says this is on purpose. The health check (app/api/health/route.ts) does not report it. The Cloudflare answer is checked only for `success` (lib/turnstile.ts:23), not for `hostname` or `action`.
- Detail: the server side check itself is sound (one use tokens, 5 second timeout, fails closed if Cloudflare cannot be reached).
- Proposed fix: when `VERCEL_ENV === "production"`, treat a missing key as a failure (or at least add `turnstile: true/false` to /api/health so UptimeRobot alerts), and check `hostname` is eyecarejobs.ca. | Effort: 30 minutes | Who: Claude

### 1.10 Emailed links are signed with the database master key
- Severity: Low  | Confidence: Confirmed
- For Steve: The links in our emails (confirm your waitlist address, and the unsubscribe link planned for clinic outreach) are protected with the same key that opens the whole database. If that key ever has to be changed after a scare, every unsubscribe link already sent stops working, and the anti spam law expects unsubscribe links to keep working for at least 60 days.
- Evidence: lib/unsubscribe.ts:34 and lib/waitlist-actions.ts:17 pass `SUPABASE_SERVICE_ROLE_KEY` as the HMAC secret; lib/waitlist-confirm.ts:7 the same. docs/security.md:29 says "If that key changes, links already sent stop working, which is safe", which is not true for unsubscribe links.
- Detail: the signing itself is good (HMAC SHA 256, a purpose prefix per link type, timing safe compare in lib/unsubscribe-token.ts:14-46). Using the master key for a second job means it is handled in more code paths and cannot be rotated on its own.
- Proposed fix: add a separate `LINK_SIGNING_SECRET` (accept the old key as a fallback for 90 days), list it in docs/security.md, and correct the "which is safe" sentence. | Effort: 30 minutes | Who: Claude, Steve to add the variable

### 1.11 Small hardening items (grouped)
- Severity: Low  | Confidence: Confirmed
- For Steve: None of these is a hole on its own; each is a cheap extra lock.
- Evidence and fix, one line each:
  1. Content Security Policy has no `script-src` (next.config.ts:19; curl on a local copy shows `frame-ancestors 'none'; base-uri 'self'; object-src 'none'` on every page). No script injection was found, so this is defence in depth; a nonce based policy set in proxy.ts is the usual Next.js route (already a known gap in docs/security.md:69).
  2. HSTS is `max-age=31536000` without `includeSubDomains` (next.config.ts:18). Add it once mail.eyecarejobs.ca and any other subdomain are confirmed https only; `preload` is optional.
  3. Claim email matching treats the last 2 labels as the clinic's domain (lib/claims.ts:23), so `me@other.on.ca` matches `https://realclinic.on.ca` and `.qc.ca`, `.bc.ca`, `.co.uk` behave the same (script $S/lens-1/claims-test.mjs). An admin still approves every claim, so the risk is a misleading "Confirmed by email" badge on app/admin/claims/page.tsx:62. Fix: compare the full host after `www.`, or keep a short list of Canadian provincial second level domains.
  4. app/admin/waitlist.csv/route.ts:11 quotes cells containing `"`, `,` or LF but not a lone CR; add `\r` (the numbers export at app/admin/numbers.csv/route.ts:11 already does). Both exports neutralise leading `= + - @`, which is correct.
  5. A job title can contain CR LF when written directly to the database (see 1.3) and is placed in email subjects (lib/candidate-actions.ts:196, lib/applicant-actions.ts:53). Resend takes JSON, so header injection is unlikely, but stripping control characters in cleanJob and in the database check removes the question.
- Effort: 2 hours in total | Who: Claude

### 1.12 Sign in has no bot check, and Supabase's "attempts per address" limit sees Vercel's servers, not the visitor
- Severity: Medium  | Confidence: Likely
- For Steve: Our sign in form talks to Supabase from Vercel's servers, so Supabase's limit on sign in attempts counts Vercel's addresses rather than each visitor's. That makes the limit weak against someone guessing passwords, and on a busy launch day it could also be hit by real people, who would then be told their password is wrong.
- Evidence: lib/auth-actions.ts:13-27 calls `signInWithPassword` on the server (also lib/account-actions.ts:198 and lib/account-settings-actions.ts:276 for the password re checks). Any error other than `email_not_confirmed` becomes "That email and password don't match" (lines 22-24), including a rate limit (`over_request_rate_limit`). No Turnstile on sign in (docs/security.md:66 relies on "Supabase already limits sign in attempts"). The same applies to sign up and reset, but those have Turnstile.
- Detail: Supabase's hosted limits are per connecting IP, which here is a Vercel function address shared by many visitors. Not testable without the live project. The publishable key is not in the browser bundle, so the server action is the only practical way in, which also makes it the place to put the limit.
- Proposed fix: show a clear "too many attempts, wait a few minutes" message for `over_request_rate_limit`; add a small per email and per visitor IP counter (a table like ad_builder_uses, keyed on the `x-forwarded-for` Vercel provides) that asks for Turnstile after 5 failures in 15 minutes; review the Supabase Auth rate limit numbers before launch. | Effort: 2 to 3 hours | Who: Claude, Steve to check the Supabase numbers

### 1.13 docs/security.md "What already protects us", checked line by line
- Severity: Low  | Confidence: Confirmed
- For Steve: Most of the security page is true. 2 lines say more than the code does, and the "Known gaps" list is missing the items above. Worth correcting so the page can be trusted in a breach or an investor's due diligence.
- Evidence (docs/security.md:56-62, in order):
  1. No secret committed, none reaches the browser: TRUE. History scan and bundle scan by the coordinator; I also found the publishable key and Supabase address only in .next/server, never in .next/static.
  2. Secrets read only by server code, and those files refuse to load in a browser: TRUE in practice. lib/supabase-server.ts, lib/email.ts, lib/turnstile.ts, lib/suppression.ts, lib/waitlist-confirm.ts import "server-only"; the other readers are "use server" files, route handlers or server pages (lib/ad-builder.ts, lib/unsubscribe.ts, app/api/cron/daily/route.ts, app/waitlist/confirm/page.tsx:32, app/unsubscribe/address/page.tsx:15), which never ship to the browser.
  3. "A signed in person can only see their own rows": OVERSTATED. Any signed in person can read every column of live jobs and of clinics with a live job, including owner_id (1.6); clinics read applicants' snapshots by design. The public pages ask only for the columns they show (fake REST log: the job page and search select lists match what is displayed).
  4. CVs private, 1 minute links: TRUE in the code (app/candidate/cv/route.ts:15, app/clinic/applications/[id]/cv/route.ts:20, bucket created private at lib/candidate-actions.ts:24-28, no storage policies in any migration, so only the server key can read or write; path is `<user id>/<random>.ext`). UNVERIFIABLE live (the scratch check reports the bucket NOT YET, as expected).
  5. Packages: TRUE. 11 direct and 4 development dependencies, every one an exact version, 0 of 103 packages in package-lock.json has an install script, npm audit 0. (npm ls shows 2 stray packages, @emnapi/runtime and @img/sharp-wasm32, in the local node_modules only; they are not in the lock file and will not reach Vercel.)
  6. "CVs are never opened or processed by our servers": MOSTLY TRUE. The server reads the bytes to check the type and look for scripts (lib/candidate-actions.ts:73-77), with simple patterns that cannot be made to run slowly; nothing parses or renders the file. But the check is weaker than "refused" suggests (1.4).
  7. Ad builder sends only what the clinic typed and cannot reach the database: TRUE (lib/ad-builder.ts:54-64 sends the form fields plus the clinic's own name and About; the answer is only shown back to that clinic, who edits it, and the job still goes through review).
  Also: line 29 "links already sent stop working, which is safe" is FALSE for unsubscribe links (1.10), and line 66's reliance on Supabase's sign in limit is weaker than it reads (1.12).
- Proposed fix: correct lines 3, 6 and 29, and add 1.1 to 1.12 to "Known gaps" until each is fixed. | Effort: 20 minutes | Who: Claude

### 1.14 Anyone at a signed in screen can set a new password without knowing the old one
- Severity: Medium  | Confidence: Confirmed
- For Steve: Changing the email address and deleting the account both ask for the password, so a stranger at an unlocked computer cannot take over. But the "choose a new password" page works for anyone who is already signed in, with no old password and no email link. Someone at a clinic's shared front desk computer could set their own password, then sign in from home later and read every applicant and CV, or delete the account.
- Evidence: app/reset-password/page.tsx:13-14 only requires a session; lib/auth-actions.ts:89-109 (resetPassword) calls `updateUser({ password })` with no current password, no check that the person arrived from a reset email, and no reauthentication. Contrast lib/account-settings-actions.ts:276 and lib/account-actions.ts:197-200, which re check the password "even if someone left a signed in screen open".
- Detail: the reset email lands on /auth/confirm (type=recovery), which signs the person in and sends them to /reset-password, but nothing records that this session came from the email. Supabase's "Secure password change" setting only asks for reauthentication when the last sign in is older than 24 hours, so it does not cover a fresh open screen.
- Proposed fix: in app/auth/confirm/route.ts, when `type === "recovery"`, set a short lived (15 minute) httpOnly cookie signed with a server secret; in resetPassword, require that cookie, or else the current password; clear it after use. | Effort: 1 hour | Who: Claude

## Good things worth keeping
- Every one of the 46 server actions and 10 route handlers checks the session on the server, and every role check is server side (table below). No page or action trusts a role or id sent from the browser: ids always come from `session.userId`.
- Nobody can become an admin: the sign up trigger only maps `clinic` or else `candidate` (kestrel_lens: metadata `{"role":"admin"}` gives `role=candidate`), `authenticated` can update only the 3 name columns of profiles (an `update ... set role='admin'` and `set account_type_confirmed=false` both fail with "permission denied"), and the Google welcome step can run once and only picks candidate or clinic (lib/auth-actions.ts:140-165).
- Output encoding is right everywhere checked: both JSON-LD blocks escape every `<` (app/jobs/[id]/page.tsx:37, app/blog/[slug]/page.tsx:50), there is no other dangerouslySetInnerHTML, job text renders as plain React text, and every email goes through emailLayout, which HTML escapes headings, paragraphs, links and buttons (lib/email-layout.ts:3 and :9-16).
- CSV exports are admin only and neutralise leading `= + - @` (app/admin/waitlist.csv/route.ts:10, app/admin/numbers.csv/route.ts:10).
- CV storage: private bucket, server only access, random file names under the user's own folder, 60 second signed links with a download filename, filenames cleaned (lib/applications.ts:141-144), 3 MB limit checked before reading, and the clinic's CV link checks ownership through row level security before signing (app/clinic/applications/[id]/cv/route.ts:18).
- Claim links: 24 random bytes, only a SHA 256 hash stored, 2 day expiry, single use, tied to the signed in account, timing safe compare (lib/claims.ts:49-56, lib/claim-actions.ts:103-116). Claims are limited to 5 a day per account.
- Cron route: fails closed when CRON_SECRET is unset and compares in constant time (app/api/cron/daily/route.ts:33-37); local test: no header and a wrong secret both give 401.
- Security headers are present on every response, including X-Frame-Options DENY plus `frame-ancestors 'none'`, nosniff, a referrer policy and HSTS; `poweredByHeader` is off. Sensitive responses send `Cache-Control: no-store`.
- The publishable key and Supabase address are not shipped to browsers at all (0 hits in .next/static), which raises the bar for direct database calls.
- Supabase email templates link to the Site URL with fixed `next` values, so they cannot be pointed elsewhere (docs/email-templates/*.html).
- Server actions get Next.js's built in Origin check, so cross site form posts are refused.

### Every action and route, checked
Legend: S = session checked on the server; R = role; O = ownership enforced (RLS = by the database, Code = by an `eq` on the session id); SR = uses the service role key.

| Where | Actions or route | S | R | O | SR | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| lib/auth-actions.ts | signIn, signUp, forgotPassword, resetPassword, signOut, signInWithGoogle | n/a (sign in) | n/a | n/a | no | open redirect via `next` (1.1); resetPassword needs no proof (1.14); sign in limit (1.12) |
| lib/auth-actions.ts | chooseAccountType | yes | once only | Code | yes | OK |
| lib/account-actions.ts | deleteAccount | yes | candidate, clinic | Code | yes | OK, password re check |
| lib/account-settings-actions.ts | updateName, requestEmailChange, savePreferences | yes | candidate, clinic | RLS / Code | savePreferences yes | OK |
| lib/clinic-actions.ts | saveClinic, saveJob, closeJob, withdrawJob, deleteJob, repostJob | yes | clinic | RLS | no | OK; profile edits unreviewed (1.3) |
| lib/template-actions.ts | saveJobAsTemplate, deleteTemplate | yes | clinic | RLS | no | OK |
| lib/ad-builder.ts | buildAd | yes | clinic | Code | yes (counter) | cap can be beaten (1.5) |
| lib/candidate-actions.ts | saveCandidateProfile | yes | candidate | RLS | no | OK |
| lib/candidate-actions.ts | uploadCv, deleteCv, applyToJob, withdrawApplication | yes | candidate | Code | yes | OK; file check weak (1.4) |
| lib/letter-actions.ts, lib/alert-actions.ts | drafts, letter templates, alerts | yes | candidate | RLS | no | OK |
| lib/applicant-actions.ts | setApplicationStatus | yes | clinic | RLS read, then SR write | yes | OK |
| lib/applicant-actions.ts | saveApplicantNote | yes | clinic | RLS | no | OK |
| lib/claim-actions.ts | startClaim, verifyClaim | yes | clinic | Code | yes | OK (1.11 item 3) |
| lib/claim-actions.ts | approveClaim, rejectClaim | yes | admin | n/a | yes | OK |
| lib/admin-actions.ts | approveJob, rejectJob, takeDownReportedJob, dismissReport, addSuppression, removeSuppression | yes | admin | n/a | yes | OK |
| lib/report-actions.ts | submitReport | public | n/a | n/a | yes | OK: Turnstile, 10 a day per job |
| lib/waitlist-actions.ts | confirmWaitlist | public | n/a | signed link | yes | OK |
| lib/unsubscribe.ts | unsubscribe, unsubscribeAddress | public | n/a | id / signed link | yes | id is guessable by insiders (1.6) |
| app/api/waitlist/route.ts | POST | public | n/a | none | yes | overwrites other people's rows (1.2) |
| app/api/cron/daily/route.ts | GET | secret | n/a | n/a | yes | OK |
| app/api/health/route.ts | GET | public | n/a | n/a | yes | OK, returns only `{ok}` |
| app/auth/callback, app/auth/confirm | GET | code / token | n/a | n/a | no | open redirect (1.1) |
| app/account/export/route.ts | GET | yes | not admin | Code | yes | OK |
| app/candidate/cv/route.ts | GET | yes | candidate | Code | yes | OK |
| app/clinic/applications/[id]/cv/route.ts | GET | yes | clinic | RLS | yes (signing) | OK |
| app/admin/waitlist.csv, app/admin/numbers.csv | GET | yes | admin | n/a | yes | OK |
| Pages using SR | app/admin/* (5), app/account, app/clinic/applications/[id], app/jobs/[id]/claim | yes | requireRole or role check | Code / RLS first | yes | OK |

## Steve's checks
1. Supabase, Authentication, URL Configuration, Redirect URLs: if `https://*-kestrel18.vercel.app/**` is there, remove it and add only the exact preview address you use (1.8). Takes 2 minutes.
2. Supabase, Authentication, Rate Limits: note the "sign ups and sign ins" and "token refreshes" numbers and send them to Claude (1.12). Then Authentication, Logs: open 1 recent sign in and look at the IP address; if it is an Amazon or Vercel address rather than yours, 1.12 is confirmed.
3. Supabase, Authentication, Sign In / Providers, Email: tell Claude whether "Secure password change" and "Secure email change" are on (1.14).
4. Anthropic console, Billing or Limits: set a monthly spend limit on the Kestrel key before the ad builder is used by anyone but you (1.5).
5. Vercel, Project, Settings, Environment Variables, Production: confirm both `TURNSTILE_SECRET_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` are present, and that Preview uses Cloudflare's test keys (1.9).
6. On your phone, sign in, wait 70 minutes, open Jobs, open a job, press Apply, then open My applications. If you are sent to the sign in page, 1.7 is confirmed.

## Not audited, and why
- Live Supabase, Vercel, Cloudflare, Google and Resend settings (redirect URLs, rate limits, CAPTCHA, storage bucket, SMTP): no access from this session; turned into Steve's checks above.
- Real sign in, Google round trip and refresh token behaviour: Supabase Auth is not available locally; signed in behaviour was read from code, and only the sign in page redirect was exercised, with a forged cookie against the fake REST server.
- Storage policies in a real Supabase project: the scratch storage stub is minimal; I read every migration (none defines storage policies) and the server code instead.
- Detailed row level security for every table and role: lens 2 covers it; I only ran the queries needed to prove 1.2, 1.3 and 1.6 and the admin role checks.
- Whether Vercel would give an outsider a `*-kestrel18.vercel.app` name (1.8): would need creating a Vercel project, which is outside the rules.
