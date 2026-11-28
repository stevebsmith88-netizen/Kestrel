# Audit round 3: scope and plan (draft for Steve's approval)

Written 27th November 2026. Nothing here has been started beyond the baseline run below.

## Why now

The last audit (post audit review) was on 12th November 2026. Since then, 17 migrations (0043 to 0059), 4 new API routes and a large amount of clinic and candidate features have been added. Those changes have not been audited.

## Baseline (27th November 2026, branch claude/pensive-albattani-rgbrvp, commit 153e05c)

- `npm run test:db`: every migration ran twice cleanly, 293 of 293 access tests passed, 83 of 83 walk through checks passed.
- `npm test`: 863 of 863 passed.
- Not run: `npm run build`, `npm audit`, anything against the live or demo sites.

The access tests grew from 117 (12th November) to 293, so the new tables are covered. A pass here shows the rules the tests check are intact, not that the tests check the right things.

## Scope, in priority order

1. **Who can see and do what (highest risk).** Clinic teams and locations (0045, 0047): a view only member writing, a removed member keeping access, an invite code reused, a person on several locations reading the wrong one, the location cookie being forged. Admin access to a clinic only while a help request is open (0046). Server actions that write with the server key must check the level first.
2. **The Slack approvals endpoint** (`/api/slack/actions`). Signature and freshness checks, the approver list, replay, the demo and live separation, and that nothing approves a flagged job. Also what leaves Canada in any Slack message.
3. **Personal data.** Registration numbers (0056), social links (0054), follows (0057), saved jobs (0059), interest in clinics (0055, 0058), meeting links and calendar files, the Admin Candidates and Insights pages. Check each for: who can read it, whether it is in the data download, whether account deletion removes it, and whether the privacy policy and help centre say what is true.
4. **Money.** Job payments, passes and Founding clinics (0048 to 0052): the Stripe webhook, double charges, a refused card, a role band changed after payment, invoice links, the free launch no card rule.
5. **Public and search.** Saved and shared pages still never read the session (`lib/page-cache.test.ts`), structured data matches the visible page, new pages in the sitemap and `llms.txt`, and the blog links rule.
6. **Rules the brand and law depend on.** Pay rules, the apply rule, no Quebec jobs, no Eye Recommend material, no scraper or job board text, the writing style tests.
7. **Operations.** The daily job (new steps 5, 5d and the milestones), email volume against the daily budget, retention, secrets and settings tables in step with the code (`docs/settings.md`, `docs/security.md`), `npm audit`, and `npm run build` on a clean checkout.
8. **Fix list from last time.** Which of the open items in section 7 of `docs/audit/POST-AUDIT-2026-11-12.md` are still open.

Out of scope: legal review (no lawyer yet), Stripe live mode (not switched on), anything needing the live site, which this cloud session cannot reach.

## Method

- Work in the same 6 parts as the last review, writing to `docs/audit/POST-AUDIT-2-2026-11.md` with findings numbered P2-01 onward, severity and a ranked fix list.
- Read only, no code changes, until Steve picks which findings to fix. Fixes then go in phases with a gate between each, as before.
- For each new table, try to break it with `psql` as a visitor, another candidate, another clinic and a view only member, beyond what `rls-tests.sql` already tries.
- Steve's own checks (live site, Supabase dashboard, Vercel settings, Stripe) go in a separate short list.

## Effort

About 1 long session for the read only audit and report, then fix phases of 1 session each.
