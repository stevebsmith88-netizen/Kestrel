# Branches deleted, 28th November 2026

80 branches were deleted from GitHub with Steve's go ahead. Every one was checked against `main` by comparing its full file tree: its files are in `main`, or are the intended removals listed below, or were rescued into the repo first. Their commits are not lost. To bring any branch back, run (using the full ID in the table):

```
git push origin <full-id>:refs/heads/<branch-name>
```

A commit stays reachable on GitHub by its ID for a long while after its branch is deleted, but not forever, so restore soon if one is ever needed.

## Not carried over on purpose

- `lib/career-stage.ts` and its test (on 8 branches from 12th November): the career stage question was removed everywhere by Steve's decision of 12th November 2026.
- `supabase/combined/run-0005-to-0010.sql` (3 early branches): replaced by the numbered migrations and `supabase/combined/run-everything.sql`.
- `docs/email/auto-reply.html`: now at `docs/email-templates/auto-reply.html`.

## Rescued into the repo first

- `docs/quebec.md` from `claude/gifted-maxwell-row5cw`, now `docs/quebec-legal-notes-2026-11-06.md`.
- `undefined/apply-phone.png` (a screenshot saved by mistake in a folder called undefined), now `docs/audit/screenshots/apply-phone-2026-10-30.png`.

## Kept, not deleted

- `feature/outreach-dry-run`: an unmerged tool that checks each saved lead against the CASL conditions before anything could be sent (pull request 36 was closed without merging). Not in `main`.

## The branches

| Branch | Last commit | Full ID |
| --- | --- | --- |
| `address-in-footer` | 2026-10-29 | `d0c49d6b9b9f879b3c52c17d73979558b300e4bb` |
| `build-accounts` | 2026-10-29 | `18b00a8ffa1a48a66cf5ae788d6b9b92b63719bc` |
| `domain-live-status` | 2026-10-29 | `50b1d59ad5da3f22d6e88889f7caedf596b20705` |
| `email-auto-reply` | 2026-10-29 | `5ac13c8690311e573c50f759d7b64e8882470d28` |
| `import-kestrel-app` | 2026-10-29 | `d5eff498d267afdfd357c3ba333e0f57ddc964d1` |
| `menu-waitlist-first` | 2026-10-29 | `a18f20c4418015244e198d5a78b415dbb8ae77cb` |
| `privacy-policy` | 2026-10-29 | `9ac8c7a1ebd22e99e1ee7567926a13ec9548bf92` |
| `update-domain-notes` | 2026-10-29 | `8a087fdbef7bc97c6dc716872641d3ac6edda49b` |
| `update-project-status` | 2026-10-29 | `a64214b3f46bad09169e0bf68755d106c9825d4e` |
| `widen-waitlist-consent` | 2026-10-29 | `22555345e34897a70b7b99b4ac88e9ce7ed298f0` |
| `build-account-settings` | 2026-10-30 | `2c763acba85b8aae63256869b2ed62f0144dfedf` |
| `build-apply` | 2026-10-30 | `396ffaea9cc94f8612538669cbbaa6ea8494d479` |
| `build-automation` | 2026-10-30 | `b49faf4d3c996223eeea55a787827d33049c10ca` |
| `build-claim` | 2026-10-30 | `c0393313447cdc95fdeab53096a59f49b7e9f578` |
| `build-cleanups` | 2026-10-30 | `dba5392355fc22e718d2ccf0f4e86394eca10523` |
| `build-email-templates` | 2026-10-30 | `6b6d4a7d7dfa0cac5805e8d84bce0c92457b4038` |
| `build-google-signin` | 2026-10-30 | `8c962e4a7e57ef354e699e5b85d9c22120762694` |
| `build-jobs` | 2026-10-30 | `950d493ada38ae9f95119c265314ddfaa7b67c95` |
| `build-numbers-quiz-templates` | 2026-10-30 | `d7ff876e5d4567fe0b0db25348b24d629cab986c` |
| `build-roles-and-blog` | 2026-10-30 | `ee4bd6268c742bb6975d96c16809ce5c316de7f3` |
| `build-security-hardening` | 2026-10-30 | `d3c9fb00c5cb53e214191fd6f194373e68484349` |
| `build-suppression` | 2026-10-30 | `005b168a731d1de2c50c119466d9418a8d3cda95` |
| `build-turnstile` | 2026-10-30 | `48a15021a45d0edeb50d8d1c29cf886c7c5a987b` |
| `build-waitlist-and-editing` | 2026-10-30 | `08d2c638b3ce77f3932e7116cde3b3b4741a2703` |
| `docs-audit-handoff` | 2026-10-30 | `9543c203d35f5d20b49049cf1e1e8520b26c712e` |
| `account-delete-quieter` | 2026-10-31 | `09ae07a9addeed452b3e7991b93af94fee6c00fe` |
| `ai-style-guard` | 2026-10-31 | `2a4ab49d3f94c20d68757cfce7d3aade46eefe30` |
| `audit-report` | 2026-10-31 | `3e4ea7fc1b4f76c8779c3074e7ddd4db9742133c` |
| `backlog-search-filters` | 2026-10-31 | `3d2d9e2882a1e4c5fa397989b11efc7530b7afe5` |
| `blog-and-seo` | 2026-10-31 | `9fd2a7c8d085616f902132af4b06e9c1c3430f23` |
| `ci-and-steve-list` | 2026-10-31 | `9717cec2c9cf2f68e31e4a53f3e1d31d29efd031` |
| `clinic-email-options` | 2026-10-31 | `101b30a72686ef6f0e3b721977741eb504a05486` |
| `close-signups` | 2026-10-31 | `047faa793b0bdfe3a5fde9119173b03a9320357c` |
| `demo-site` | 2026-10-31 | `a498d02d989f8257d7265317b5ce6c02cf37a9ba` |
| `docs-next-steps-and-lawyer-brief` | 2026-10-31 | `a2233ca7cdb84c1ecc92d8ee6479322a389b89cd` |
| `docs-split-lawyer-packs` | 2026-10-31 | `2543aa6c99e928c6df8e634f00c1d14d0a566298` |
| `employment-ticks` | 2026-10-31 | `e1d04c37ccbca212063a93e783ea25eea528e794` |
| `home-blog-feature` | 2026-10-31 | `dad2f45ecd0869f247199d88527bd6469d093bbb` |
| `home-stats-box` | 2026-10-31 | `e58ef32634df8433d6266f25263bb80687f65fec` |
| `market-sheet-roles` | 2026-10-31 | `d0ebd6e4d8878ae5c3660a617992b9da8394e002` |
| `next-week-list` | 2026-10-31 | `d2a139118456acff0d9d61a5a46ddee18b27a5bb` |
| `phase-1a-sign-in-and-accounts` | 2026-10-31 | `1adf32178449ea1d37793fbb1c8c070396f50d22` |
| `phase-1b-data-safety` | 2026-10-31 | `59b0f50c734d650c5ca751d136aa5239ff5902a2` |
| `phase-1c-email-and-operations` | 2026-10-31 | `2e636391f089e56a83b9ab9592d2e60d4f7f30f5` |
| `phase-2a-pre-lawyer-fixes` | 2026-10-31 | `70336e82e98fdf533db00138fd5fec178b1fa554` |
| `quick-apply` | 2026-10-31 | `5288d644f22a8ab79a3f1f8c3225d2545e085661` |
| `site-copy-pass` | 2026-10-31 | `678c093f86cf9bdd9563ef5f384d3b4b7196a486` |
| `numbers-sources-shorter` | 2026-11-01 | `292d7ad5408b53a65e3b55ef3059fe0f087c2ce1` |
| `admin/post-for-clinic` | 2026-11-05 | `ec9b0f559ac99371aa631703694e936723ba091a` |
| `analytics-note` | 2026-11-05 | `70aed2815438885d5f15bc1377ec44645447028a` |
| `audit/r22-r25-r45` | 2026-11-05 | `1cd29dc6d6e19e27af412e5ea66ae29250d24dbc` |
| `blog/more-posts` | 2026-11-05 | `59be3821dec5d39c2308ff3468a5241960d59af0` |
| `blog/seasonal-hiring` | 2026-11-05 | `eb3dde84fcb3f12b0940086a6730f04fc08c2f8d` |
| `blog/seo-series` | 2026-11-05 | `0dd89cf17c0c371f48b292f7d3bb324f9d3251b9` |
| `claude/great-allen-57qmq6` | 2026-11-05 | `92f8539ccea03923bd8965a08271368f77d2f7d4` |
| `claude/upbeat-keller-6vupeb` | 2026-11-05 | `1e306442a8a8c8417f39bc8d4743c3901f517f21` |
| `claude/zealous-maxwell-8v6h56` | 2026-11-05 | `81f7ed7c9023e8c3da61ef35f6eee2eb68666583` |
| `docs/agency-pathway` | 2026-11-05 | `68c452596b016085c92990f5b8a8ab658dbf8a64` |
| `docs/business-setup` | 2026-11-05 | `7edbcdb329050fb408736ada93a3b8e50f60b99a` |
| `docs/notes-nov5-evening` | 2026-11-05 | `48355e763f983773f9d1deaa5a1714868690ab3c` |
| `docs/status-nov6` | 2026-11-05 | `da60892e9605ad7a41e2f16419a657fac7d46f56` |
| `email/auto-reply` | 2026-11-05 | `41c9e23b2e0a0b5ae2be10c7d125fe7ad994a77c` |
| `email/auto-reply-text` | 2026-11-05 | `7275f8f4a2c9197fea64ddda9dff00ab14bd69c7` |
| `feature/city-radius-and-roles` | 2026-11-05 | `849f1605980385fe4537cbc02de71e7493731ed3` |
| `feature/province-sweep` | 2026-11-05 | `828490c52d188a0561029844df10a31c861d0c4e` |
| `claude/amazing-keller-c7k18u` | 2026-11-06 | `f62cb67d4fe5505b94c2a9cb4c11de1f562c44cc` |
| `claude/gifted-maxwell-row5cw` | 2026-11-06 | `0b6d6e1aa5d51037070d133756a8a76314a6878c` |
| `claude/relaxed-babbage-itq5zq` | 2026-11-07 | `b816028e24857e322cc9e6658ba31d2517d5c16c` |
| `claude/serene-tesla-e4i39u` | 2026-11-08 | `dc438b882911e6973b83ef066944b9b96864d5a4` |
| `claude/kind-noether-7ykjjx` | 2026-11-09 | `5276852fcf3cc9b0f7282e2857e6e8d078888e18` |
| `claude/stoic-meitner-s4qzqp` | 2026-11-09 | `ae1818742b4e66fc5e58fff50f44b05bd16df464` |
| `claude/vigilant-planck-dqo6bd` | 2026-11-09 | `946f87686796f7f9805582e48cf83282d7e3cc7d` |
| `audit/2026-11-part1` | 2026-11-12 | `5618fadd7efec88d291a8c941c6182eb35b25d0b` |
| `claude/audit-fix-c` | 2026-11-12 | `ae03fc5f23e0e2b4009ac75243eea83cdabc1bd5` |
| `claude/audit-fix-e` | 2026-11-12 | `11cce9c936127fb06a0cc9536f99ba1a8ebf9cd9` |
| `claude/audit-fix-f` | 2026-11-12 | `4739ef8ccc95964efe08710a91908148dc019037` |
| `claude/focused-goldberg-2g7e6r` | 2026-11-12 | `376f8c2d5756d28d10e22a3a7e2bc544a876b6b1` |
| `claude/gallant-mccarthy-9abc7o` | 2026-11-12 | `4dda2d0c2deb0911e3b43331b6a62269e9e38491` |
| `claude/kestrel-audit-fixes-phase-b-m45r56` | 2026-11-12 | `d7a1652cdb142cfd852cad01f3d8209ce0aa9fa8` |
| `claude/kestrel-audit-fixes-phase-d-2mhi3o` | 2026-11-12 | `9b7518f697947a3d56dd58460fae6795b23db053` |
