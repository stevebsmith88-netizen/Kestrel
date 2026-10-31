# Phase 0 results, 31st October 2026

What Steve found and decided while working through `PHASE-0-WALKTHROUGH.md`. No secrets are recorded here.

| Step | Finding | Status |
| --- | --- | --- |
| 1. Google wildcard (R4) | The `kestrel` preview wildcard was in Supabase Redirect URLs. Removed. Site URL is correct. | Done |
| 2. Supabase plan and backups (R1) | Free plan. No backups today. Upgrade to Pro (US$25 a month) before inviting anyone, and sooner if real waitlist sign ups start arriving. The uptime monitor reading the database daily also stops the free plan pausing the project after a week of inactivity. | Decision: upgrade before launch or before real sign ups |
| 3. Previews and live data (R9) | Preview is ticked for the Supabase and Resend variables, so previews use live data. Vercel Deployment Protection is on (Standard), so only Steve can open previews. A separate Supabase project for previews is not built. | Partly. Do the separate project before anyone but Steve uses the site |
| 4. Email capacity (R7) | Resend Free: 100 a day, 3,000 a month, 13 used. Supabase: emails 30 an hour, sign ups and sign ins 30 per 5 minutes per IP, token refreshes 150 per 5 minutes. | Fine for now. Raise the Supabase email and sign in limits and move Resend to Pro before launch |
| 5. Settings (R12, R8, R49) | `EMAIL_REPLY_TO` is not set (the code now defaults to hello@). `ADMIN_ALERT_EMAIL`, `CRON_SECRET` and both Turnstile keys exist, and Preview uses Cloudflare test keys. hello@ reaches the kestrel@ inbox and a reply from it works. privacy@ alias has now been created in Google. | Retest privacy@ |
| 6. Anthropic limit (R24) | Spend limit set to US$20 a month. Ad builder switched from Opus 5.5 to Sonnet 5.5 (branch 1C). | Done |
| 7. Password change (R20) | "Secure email change" was on. "Secure password change" was off and is now on. | Done |
| 8. Regions (R28) | Vercel function region was US East. Now Montreal (yul1), the only Canadian option, and redeployed. Supabase is Canada. | Done. Privacy policy wording still to update with the lawyer |
| 9. Daily job logs (R8) | Vercel Hobby shows only the last hour, so nothing to see. The heartbeat in branch 1C records each run from now on. | Re-check after 1C is live |
| 10. Lockdown (R14) | 2 step sign in in progress, account by account. Some services were opened with the original Gmail account and are being moved to kestrel@eyecarejobs.ca. | In progress |
| 11. What is live (R10) | 2 candidate accounts, 0 clinics, 0 jobs, 1 waitlist entry (unconfirmed). All Steve's tests. | Cleared |
| 12. Grants (R51) | Results match what the audit expected: waitlist has open table grants for anon and authenticated (protected by row level security with no policies), profiles has read for authenticated. | Cleared. Optional: revoke the open waitlist grants as a second layer |
| 13. Waitlist emails | Nobody emailed. | Done |
| 21. Real applicants | Nothing from outside Steve's test accounts. | Cleared |

Still open for Steve: finish 2 step sign in, move admin to kestrel@eyecarejobs.ca, fill the backup person and lawyer in `docs/breach-plan.md`, Search Console, Vercel Pro and the Supabase upgrade before launch, Gate A (check 19).
