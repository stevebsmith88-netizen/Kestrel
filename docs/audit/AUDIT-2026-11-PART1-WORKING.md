# Audit part 1, November 2026: working findings

Raw notes, written as each area is finished. The final report (`AUDIT-2026-11-PART1.md`) is built from this file.
Confidence words: Confirmed (reproduced or proven from the code), Likely, Possible.

## Area 0. First checks (12th November 2026, commit 3e42a07)

| Check | Result |
| --- | --- |
| `npm ci` | Clean install, no errors |
| `npm run typecheck` | Pass, 0 errors |
| `npm test` | Pass, 425 of 425 |
| `npm run build` | Pass. 181 pages generated. Every route except `/robots.txt`, `/sitemap.xml` (1 hour) and `/icon.svg` is marked "server rendered on demand" (see area K) |
| `npm audit` (all levels) | 0 known problems. 13 direct packages (docs/security.md says 11), all pinned exactly. No package runs an install script |
| `npm outdated` | Small updates waiting: next 16.4.3 to 16.4.6, @supabase/supabase-js 2.118.0 to 2.119.0, @anthropic-ai/sdk 1.3.0 to 1.8.0 |
| Secret scan, working tree | Nothing. Only made up test strings in `lib/setup-check.test.ts` |
| Secret scan, full history | 441 commits on 77 branches, from 28th October to 12th November 2026, after fetching the full history. Patterns searched: Anthropic, Stripe, Resend, Supabase secret and JWT keys, GitHub tokens, Google and AWS keys, private key blocks, Turnstile secrets, database addresses with passwords. Nothing real found. The only `.env` file ever committed is `.env.example`, which holds placeholders |
| Email addresses in history | Only Kestrel's own addresses and made up examples |

Notes for later areas:
- `.env.example` lists 12 settings. The code reads 32. The gap is checked against docs/security.md in area J.
- `docs/security.md` still says "CVs are never opened or processed by our servers". That stopped being true on 12th November 2026 (resume reader). Area I.
- `lib/directory-data.ts` exists although CLAUDE.md says the industry directory is "Not built". Area I.
