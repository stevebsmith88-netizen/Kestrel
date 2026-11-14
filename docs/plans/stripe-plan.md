# Stripe: plan and handover (14th November 2026)

Steve is setting up Stripe himself today and will carry on in a new chat. Nothing is built yet. **Read this first**, then `CLAUDE.md` (pricing rules), `lib/pricing.ts`, `docs/pass-procedures.md`, `docs/legal/refund-policy-draft.md` and section 5 of `docs/plans/clinic-and-supplier-pages.md` (Sales and HST page).

## Decisions already made (do not re-open)

- **Free launch, no card.** Posting is free for the first 30 to 60 days. A $0 checkout must never ask for a card: Stripe Checkout with `payment_method_collection: "if_required"` (CLAUDE.md, decided 6th November 2026). Keep the `/compare` wording "during the free launch" true.
- **Prices before HST**, in `lib/pricing.ts` (the 1 source of truth on the site; Stripe holds its own copies, so they must match):
  - Single 30 day post by role band: $59 support and patient care, $79 opticians and practice leads, $99 optometrists.
  - Clinic pass $199 a month, up to 5 live posts, all roles except optometrists. Clinic pass Plus $349 a month, up to 5 live posts, optometrists included. Both with a featured profile.
  - Yearly option, founding period only: $1,990 (Clinic pass) and $3,490 (Plus), 10 months for the price of 12.
- **Founding clinics** (`FOUNDING_CLINICS` in `lib/pricing.ts`, full rule in `docs/pass-procedures.md`): the first 50 clinic locations to post during the free launch. A founding clinic that takes a pass keeps that price **for 12 months from the pass start, or until it cancels, whichever comes first**, then the price in force applies after 30 days notice. Build as a Stripe **subscription schedule**: phase 1 at the founding price for 12 months, phase 2 at the price in force. 3 automatic emails: welcome as a founding clinic, thank you with the lock date, and a reminder 30 days before the lock ends (that is also the notice).
- **Passes renew by themselves** at the same price. A price change needs 30 days notice and applies only to later purchases and renewals. Upgrade and downgrade handling is internal (`docs/pass-procedures.md`).
- **1 pass, 1 location** (migration 0047): a single post or pass covers the location it was bought for. A **Group pass** covers 3 or more named locations under 1 owner, priced per location ($179 a month at Clinic pass level, $315 at Plus level, 5 live posts a location), on 1 invoice. Not to be built before the single passes work.
- **HST is charged on everything** once Steve has his HST number (he is registering with CRA; voluntary below $30,000). Use **Stripe Tax** (about 0.5% of each sale) to work out GST or HST by the buyer's province. Until the number exists, build and test in test mode with tax off, and show prices "plus HST".
- **Admin, Sales and HST page** for CRA: sales before tax, GST and HST by province, refunds and the total to report for any filing period, with a CSV for the accountant; invoices paid outside Stripe added by hand.
- **Refunds** (draft, not yet reviewed by the paralegal): no refund once a post is live; full refund if Kestrel does not approve a post or for billing mistakes; a goodwill free repost or credit at Kestrel's discretion; monthly pass cancel any time, no part refunds; yearly pass refundable within 14 days if no post was published. `docs/legal/refund-policy-draft.md`.
- **Later, not now:** referral codes (25% each, rewarded on the new clinic's first paid post, at most 4 a year, not for the same owner's locations); featured job $29, urgent badge $15 for 7 days; supplier premium pages and sponsorships (after the disclosure conversation). See `docs/marketing/marketing-opportunities.md`.
- **Founding supporters and sponsors** (contributions, sponsor packages) can use Stripe Payment Links or invoices before checkout exists; no code needed.

## What Steve does in Stripe (only he can, it is in his name)

1. Create the account at stripe.com. Public business name: **Kestrel Eye Care Jobs**. His personal name and bank account are only in Stripe's private identity check; customers see the business name.
2. Statement descriptor (what appears on a card statement): for example `KESTREL EYECARE`.
3. Stay in **Test mode** (the switch at the top of the dashboard). Nothing real is charged.
4. Developers, API keys: copy the **publishable** key (`pk_test_...`) and the **secret** key (`sk_test_...`).
5. In **Vercel**, both projects, Settings, Environment Variables: `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. **Never paste a key into the chat**; Steve only says they are there. The webhook signing secret (`STRIPE_WEBHOOK_SECRET`) comes later, when the webhook is built.
6. Stripe Tax: turn on later, once the HST number arrives.
7. Anything Stripe asks that he is unsure of (business type, industry, what is sold): talk it through before submitting. Kestrel sells online job advertising to businesses; Steve is likely a sole proprietor for now.

## Build order (each step its own branch and PR, test mode only)

1. **Settings and a status check**: read the 2 keys (add them to `docs/settings.md`, `.env.example`, `docs/security.md`), and an Admin check that the key works, like the Anthropic setup check on `/admin/found`. **Built 14th November 2026**: Admin, Payments (`/admin/payments`) shows whether both keys are there, look right, are the same mode, and are test keys, and a Test the Stripe key button reads the account (business name, statement line, country, Stripe Tax status) without charging or changing anything (`lib/stripe-setup.ts`, tested; `lib/stripe.ts` is the 1 place the site calls Stripe, with plain web requests, no Stripe library). No SQL.
2. **Products and prices** created from `lib/pricing.ts` by a script or an admin button, so Stripe and the site never disagree. The free launch coupon (100% off) with an end date.
3. **Checkout for a single post**: when a clinic sends a job for review, it goes through Checkout first; $0 with the launch coupon and no card asked (`if_required`). Record each payment against the job. A webhook (`/api/stripe/webhook`, signature checked with `STRIPE_WEBHOOK_SECRET`) marks it paid. Every new table gets row level security and access tests (`npm run test:db`), and SQL for both databases.
4. **Passes**: subscriptions, live post counting per location, the customer portal for cancelling, renewal emails.
5. **Founding clinics**: the first 50 list, the subscription schedule, the 3 emails.
6. **Sales and HST page** in Admin.
7. **Refund handling** in Admin (refund, or a goodwill credit), once the refund policy is reviewed and published.
8. Group pass, then the later items.

Prices are switched on only when Steve says so. Until then every checkout is test mode and the launch coupon makes posting free.
