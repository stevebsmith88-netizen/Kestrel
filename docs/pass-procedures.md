# Pass procedures (internal, not advertised)

For Steve and Claude when someone upgrades or changes a pass. Not on the website and not in the Terms, because the rules are hard to explain to a clinic. Decided by Steve on 6th November 2026. Stripe is not built yet, so check each step in test mode when it is.

## Monthly clinic moves from the Clinic pass up to Plus

- They pay the Plus monthly price in force at that time ($349 today). The founding lock belongs to the pass they first took, so it does not carry over to Plus.
- The change starts now. Stripe works out the part month on its own when the subscription's price is switched, and the clinic is shown the amount before confirming.

## Founding clinic that paid for a year, then upgrades to Plus

- This is the exception. They get the founding yearly rate for Plus ($3,490) for the rest of that year.
- They pay the difference between the 2 founding yearly prices for the months left: ($3,490 minus $1,990) x months left / 12. After 4 months, 8 are left: $1,500 x 8 / 12 = $1,000.
- Stripe's own proration should give the same figure when the yearly subscription is switched to the Plus yearly price. Check this in test mode, and use the formula as the cross check.
- At renewal they renew at the Plus yearly price they now pay (see below).

## Renewals

- Monthly and yearly both renew by themselves at the same price as before.
- The price only changes after at least 30 days notice (clause 9 of `docs/legal/terms-passes-draft.md`). A yearly renewal reminder email goes out at least 30 days before.
- Because a yearly renewal keeps the same price, a clinic that took the yearly option stays on 10 months for the price of 12 for as long as it renews. The yearly option can only be started during the founding period.

## Not covered yet

- Moving down from Plus to the Clinic pass part way through a paid year. Suggested: not until the year ends, with the change made at renewal.
- A refund on a yearly payment. Waiting on the lawyer.
