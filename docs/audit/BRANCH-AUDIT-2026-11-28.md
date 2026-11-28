# Branch audit, 28th November 2026

Read only. Nothing was deleted, merged or changed. Method: every remote branch was compared with `main` and with the pull request history on GitHub (272 pull requests, none open). Where a branch had no pull request, its added lines were checked against `main` file by file.

**138 branches in total.** 123 are already in `main` and safe to delete when Steve says so. 10 hold work that is not in `main`. 5 are probably safe but need a quick look.

## 1. Keep until the work is rescued (10)

Each of these has files or lines that `main` does not have. Decide per branch: bring it into `main` through a pull request, or confirm it is no longer wanted.

| Branch | Last commit | What is on it |
| --- | --- | --- |
| `claude/admiring-keller-vygzh4` | 2026-11-16 | Subscriptions and running costs tracker (docs/subscriptions.md). Not in main. |
| `claude/epic-hypatia-d7lz76` | 2026-11-17 | Parked note on the partner posting idea (docs/plans/partner-posting-idea.md). Not in main. |
| `claude/quirky-mccarthy-re3i9g` | 2026-11-20 | Merge of main with CLAUDE.md, AUDIT-2-PROMPT and STEVE-NEXT-STEPS edits. Probably superseded, check before deleting. |
| `claude/intelligent-hypatia-oholog` | 2026-11-26 | Quebec interest line under Gate C in Admin numbers, plus docs/plans/quebec.md. Not in main. |
| `claude/jolly-bell-e9fpj3` | 2026-11-20 | Privacy policy lines: age, sale of a business, linked sites, Do Not Track. Not in main. |
| `claude/wizardly-mayer-bed5u9` | 2026-11-25 | Blog post: women in optometry in Canada and worldwide, with its draft. Not in main. |
| `claude/bold-keller-2p1ppb` | 2026-11-12 | Audit prompts (AUDIT-FIX-PROMPTS.md, POST-AUDIT-PROMPT.md). Not in main. |
| `claude/gifted-davinci-b7tmxu` | 2026-11-20 | Instagram images and sticker artwork (design/social-and-merch/). Not in main. |
| `claude/hopeful-cannon-xoy1ju` | 2026-11-15 | Instagram posts 33 to 40 and the Who should we follow? post (design/social-and-merch/instagram-guides). Not in main. |
| `claude/laughing-fermat-6mj1bk` | 2026-11-15 | Virtual assistant plan (docs/plans/virtual-assistants.md), put on hold. Not in main. |

## 2. Probably safe, quick check first (5)

More than 97 percent of each branch's added lines are already in `main`, and no whole file is missing. The few differences look like later edits to `CLAUDE.md` and similar shared files.

| Branch | Last commit | Ahead of main |
| --- | --- | --- |
| `claude/kestrel-audit-fixes-phase-g-h67oku` | 2026-11-12 | 105 ahead of main |
| `audit/post-fix-review` | 2026-11-12 | 114 ahead of main |
| `claude/loving-faraday-3j5smt` | 2026-11-13 | 164 ahead of main |
| `claude/trusting-johnson-ij7rwy` | 2026-11-13 | 131 ahead of main |
| `claude/notes-job-title` | 2026-11-14 | 224 ahead of main |

## 3. Already in main (123)

Either merged through a pull request, or (the 33 old branches from 29th to 31st October and the 2 early November ones) carried in by another route, with every added line found in `main`. `feature/outreach-dry-run` had its pull request closed unmerged, but all of its lines are in `main` too.

| Branch | Last commit | How we know |
| --- | --- | --- |
| `address-in-footer` | 2026-10-29 | All added lines found in main |
| `build-accounts` | 2026-10-29 | All added lines found in main |
| `domain-live-status` | 2026-10-29 | All added lines found in main |
| `email-auto-reply` | 2026-10-29 | All added lines found in main |
| `import-kestrel-app` | 2026-10-29 | All added lines found in main |
| `menu-waitlist-first` | 2026-10-29 | All added lines found in main |
| `privacy-policy` | 2026-10-29 | All added lines found in main |
| `update-domain-notes` | 2026-10-29 | All added lines found in main |
| `update-project-status` | 2026-10-29 | All added lines found in main |
| `widen-waitlist-consent` | 2026-10-29 | All added lines found in main |
| `build-account-settings` | 2026-10-30 | All added lines found in main |
| `build-apply` | 2026-10-30 | All added lines found in main |
| `build-automation` | 2026-10-30 | All added lines found in main |
| `build-claim` | 2026-10-30 | All added lines found in main |
| `build-cleanups` | 2026-10-30 | All added lines found in main |
| `build-email-templates` | 2026-10-30 | All added lines found in main |
| `build-google-signin` | 2026-10-30 | All added lines found in main |
| `build-jobs` | 2026-10-30 | All added lines found in main |
| `build-numbers-quiz-templates` | 2026-10-30 | All added lines found in main |
| `build-roles-and-blog` | 2026-10-30 | All added lines found in main |
| `build-security-hardening` | 2026-10-30 | All added lines found in main |
| `build-suppression` | 2026-10-30 | All added lines found in main |
| `build-turnstile` | 2026-10-30 | All added lines found in main |
| `build-waitlist-and-editing` | 2026-10-30 | All added lines found in main |
| `docs-audit-handoff` | 2026-10-30 | All added lines found in main |
| `account-delete-quieter` | 2026-10-31 | Merged pull request |
| `ai-style-guard` | 2026-10-31 | Merged pull request |
| `audit-report` | 2026-10-31 | All added lines found in main |
| `backlog-search-filters` | 2026-10-31 | All added lines found in main |
| `blog-and-seo` | 2026-10-31 | Merged pull request |
| `ci-and-steve-list` | 2026-10-31 | Merged pull request |
| `clinic-email-options` | 2026-10-31 | Merged pull request |
| `close-signups` | 2026-10-31 | Merged pull request |
| `demo-site` | 2026-10-31 | Merged pull request |
| `docs-next-steps-and-lawyer-brief` | 2026-10-31 | All added lines found in main |
| `docs-split-lawyer-packs` | 2026-10-31 | All added lines found in main |
| `employment-ticks` | 2026-10-31 | Merged pull request |
| `home-blog-feature` | 2026-10-31 | Merged pull request |
| `home-stats-box` | 2026-10-31 | Merged pull request |
| `market-sheet-roles` | 2026-10-31 | All added lines found in main |
| `next-week-list` | 2026-10-31 | Merged pull request |
| `phase-1a-sign-in-and-accounts` | 2026-10-31 | All added lines found in main |
| `phase-1b-data-safety` | 2026-10-31 | All added lines found in main |
| `phase-1c-email-and-operations` | 2026-10-31 | All added lines found in main |
| `phase-2a-pre-lawyer-fixes` | 2026-10-31 | Merged pull request |
| `quick-apply` | 2026-10-31 | Merged pull request |
| `site-copy-pass` | 2026-10-31 | Merged pull request |
| `numbers-sources-shorter` | 2026-11-01 | Merged pull request |
| `admin/post-for-clinic` | 2026-11-05 | Merged pull request |
| `analytics-note` | 2026-11-05 | Merged pull request |
| `audit/r22-r25-r45` | 2026-11-05 | Merged pull request |
| `blog/more-posts` | 2026-11-05 | Merged pull request |
| `blog/seasonal-hiring` | 2026-11-05 | Merged pull request |
| `blog/seo-series` | 2026-11-05 | Merged pull request |
| `claude/great-allen-57qmq6` | 2026-11-05 | Merged pull request |
| `claude/upbeat-keller-6vupeb` | 2026-11-05 | Merged pull request |
| `claude/zealous-maxwell-8v6h56` | 2026-11-05 | Merged pull request |
| `docs/agency-pathway` | 2026-11-05 | Merged pull request |
| `docs/business-setup` | 2026-11-05 | Merged pull request |
| `docs/notes-nov5-evening` | 2026-11-05 | Merged pull request |
| `docs/status-nov6` | 2026-11-05 | Merged pull request |
| `email/auto-reply` | 2026-11-05 | Merged pull request |
| `email/auto-reply-text` | 2026-11-05 | Merged pull request |
| `feature/city-radius-and-roles` | 2026-11-05 | Merged pull request |
| `feature/outreach-dry-run` | 2026-11-05 | All added lines found in main |
| `feature/province-sweep` | 2026-11-05 | Merged pull request |
| `claude/amazing-keller-c7k18u` | 2026-11-06 | Merged pull request |
| `claude/gifted-maxwell-row5cw` | 2026-11-06 | All added lines found in main |
| `claude/relaxed-babbage-itq5zq` | 2026-11-07 | All added lines found in main |
| `claude/serene-tesla-e4i39u` | 2026-11-08 | Merged pull request |
| `claude/kind-noether-7ykjjx` | 2026-11-09 | Merged pull request |
| `claude/stoic-meitner-s4qzqp` | 2026-11-09 | Merged pull request |
| `claude/vigilant-planck-dqo6bd` | 2026-11-09 | Merged pull request |
| `audit/2026-11-part1` | 2026-11-12 | Merged pull request |
| `claude/audit-fix-c` | 2026-11-12 | Merged pull request |
| `claude/audit-fix-e` | 2026-11-12 | Merged pull request |
| `claude/audit-fix-f` | 2026-11-12 | Merged pull request |
| `claude/focused-goldberg-2g7e6r` | 2026-11-12 | Merged pull request |
| `claude/gallant-mccarthy-9abc7o` | 2026-11-12 | Merged pull request |
| `claude/kestrel-audit-fixes-phase-b-m45r56` | 2026-11-12 | Merged pull request |
| `claude/kestrel-audit-fixes-phase-d-2mhi3o` | 2026-11-12 | Merged pull request |
| `claude/founding` | 2026-11-14 | Merged pull request |
| `claude/invoices-receipts` | 2026-11-14 | Merged pull request |
| `claude/notes-batch` | 2026-11-14 | Merged pull request |
| `claude/notes-menus` | 2026-11-14 | Merged pull request |
| `claude/pass-confirm` | 2026-11-14 | Merged pull request |
| `claude/passes` | 2026-11-14 | Merged pull request |
| `claude/payment-activity` | 2026-11-14 | Merged pull request |
| `claude/peaceful-mccarthy-7y5wis` | 2026-11-14 | Merged pull request |
| `claude/plans-menu` | 2026-11-14 | Merged pull request |
| `claude/review-history` | 2026-11-14 | Merged pull request |
| `claude/review-in-place` | 2026-11-14 | Merged pull request |
| `claude/slack-alerts` | 2026-11-14 | Merged pull request |
| `claude/stripe-charge-fix` | 2026-11-14 | Merged pull request |
| `claude/stripe-diagnostics` | 2026-11-14 | Merged pull request |
| `claude/stripe-setup-mode` | 2026-11-14 | Merged pull request |
| `claude/stripe-step-2` | 2026-11-14 | Merged pull request |
| `claude/stripe-step-3` | 2026-11-14 | Merged pull request |
| `claude/adoring-allen-iollu8` | 2026-11-15 | Merged pull request |
| `claude/clinic-page-icons-under-button` | 2026-11-15 | Merged pull request |
| `claude/epic-hopper-71710m` | 2026-11-15 | Merged pull request |
| `claude/home-spacing` | 2026-11-15 | Merged pull request |
| `claude/inbox-bulk-actions` | 2026-11-15 | Merged pull request |
| `claude/logo-goes-home` | 2026-11-15 | Merged pull request |
| `claude/nifty-keller-1ngd7l` | 2026-11-15 | Merged pull request |
| `claude/public-page-beside-heading` | 2026-11-15 | Merged pull request |
| `claude/report-ack-and-social-icons` | 2026-11-15 | Merged pull request |
| `claude/tidy-public-clinic-page` | 2026-11-15 | Merged pull request |
| `claude/laughing-pascal-ikfe35` | 2026-11-16 | Merged pull request |
| `claude/reddit-notes-and-find-us` | 2026-11-16 | Merged pull request |
| `claude/intelligent-cray-fbxzx2` | 2026-11-17 | Merged pull request |
| `claude/demo-seed-new-features` | 2026-11-19 | Merged pull request |
| `claude/keen-meitner-puzslj` | 2026-11-19 | Merged pull request |
| `claude/slack-milestones` | 2026-11-19 | Merged pull request |
| `claude/zealous-heisenberg-0uz3o4` | 2026-11-19 | Merged pull request |
| `claude/happy-hypatia-y6zbs1` | 2026-11-20 | Merged pull request |
| `claude/jolly-bell-cz3bca` | 2026-11-20 | Merged pull request |
| `claude/gifted-shannon-3lj1vf` | 2026-11-25 | Merged pull request |
| `claude/elegant-heisenberg-fe5gyo` | 2026-11-26 | Merged pull request |
| `claude/pensive-albattani-rgbrvp` | 2026-11-27 | Merged pull request |
| `claude/practical-albattani-ex0zs6` | 2026-11-27 | Merged pull request |
| `claude/admiring-dijkstra-x8kc43` | 2026-11-28 | Merged pull request |
| `claude/laughing-hopper-52e5f5` | 2026-11-28 | Merged pull request |

## How to clean up safely

1. Rescue section 1 first (one pull request per branch, or one combined docs pull request).
2. Look at section 2, then delete.
3. Delete section 3 only after Steve says go. A deleted branch can be restored from its pull request page for a while, but not if it never had one, so the old no pull request branches are the ones to be careful with.
4. Turn on GitHub's setting Automatically delete head branches so this does not build up again.
