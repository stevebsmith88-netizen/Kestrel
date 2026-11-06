# Terms: clinic passes, founding clinics and yearly payment (draft wording)

Draft of 6th November 2026 for Steve to edit and the lawyer to review. It is not on the website. It is written to slot into the "Fees and payment" section of `app/terms/page.tsx`, after the bullet about a monthly clinic pass. Square brackets are decisions or questions. Nothing here is legal advice.

## Draft wording

**Clinic passes**

1. Kestrel offers 2 clinic passes. The Clinic pass lets you have up to 5 live posts at once for support, patient care, optician and practice lead roles. Clinic pass Plus lets you have up to 5 live posts at once for any role, including optometrists.
2. A live post is a post that candidates can see. Drafts, posts in review, closed posts and expired posts do not count. When a post closes or expires, its place is free straight away. Posting the same job again counts as a new live post.
3. A pass is for your own hiring, for one clinic or for the locations of one group. You may not use it to post for other clinics or for clients. [Lawyer: how should "one group" be defined, for example common ownership?]
4. If a post is for a role that your pass does not cover, we will ask you to move to Clinic pass Plus, or to pay the single post price for that role, before the post goes live.
5. A featured clinic profile is part of a pass while you have one. We may change how a featured profile looks or where it appears, and we will not remove it while your pass is active without telling you. [Wording to be checked against what is built when Stripe launches.]
6. A monthly pass renews each month until you cancel. You can cancel at any time. Cancelling stops the next renewal, and your pass stays active until the end of the month you have paid for. [Lawyer: is a refund of the current month ever owed?]

**Founding clinics**

7. A clinic that takes a pass during the launch period is a founding clinic. A founding clinic keeps the price of its pass for 12 months from the day it starts paying, or until it cancels, whichever comes first.
8. The founding price applies to the pass you choose when you start. If a founding clinic on monthly payments later moves to a different pass, the price of the new pass at that time applies. If a founding clinic that has paid for a year moves up to Clinic pass Plus before the year ends, it pays the difference between the 2 founding yearly prices for the months that are left, and keeps the founding yearly rate for Plus until that year ends. [Example: after 4 months, 8 are left, so $1,500 x 8 / 12 = $1,000. Steve and the lawyer to confirm the method.] If you cancel and come back later, the price at that time applies.
9. After 12 months we may change the price. We will tell you at least 30 days before your next renewal. A price change applies to purchases and renewals made after the change. It does not change a post you have already paid for, or a period you have already paid for. [Lawyer: is 30 days enough notice?]

**Paying for a year**

10. During the launch period, founding clinics may pay for a year in advance: [$1,990 for the Clinic pass or $3,490 for Clinic pass Plus], which is 10 months for the price of 12. This covers 12 months of the pass.
11. A yearly payment renews by itself for another 12 months at the yearly price then in force, unless you cancel first. If we no longer offer a yearly option by then, it continues month by month at the monthly price then in force. We will email you at least 30 days before it renews, with the price, and you can cancel at any time before the renewal date. [Lawyer: check the notice and cancellation wording for automatic renewal.]
12. [Refund on a yearly payment. Option A: no refund once the pass has started, except where we cannot provide the service. Option B: a refund of the months not yet used, charged at the monthly price, less the 2 free months. Lawyer to advise which is fair and lawful for a business customer.]

**Everything else**

13. Prices are before HST or other taxes. Tax is added at checkout and shown on your receipt. Payments are handled by Stripe.
14. A coupon or free launch code has no cash value. It may end or have conditions, which we will state with the offer.

## Questions for the lawyer (add to the review pack)

1. Is the yearly payment wording fair and lawful, and which refund option should be used?
2. How should "one group" be defined for a pass used by a corporate group?
3. Is 30 days notice of a price change after the founding period enough, and do we need to say anything about prices during the 12 months?
4. Sponsored posts are planned for the paid launch (`docs/sponsored-ads-plan.md`). Does the "Sponsored" label need specific wording?
5. Recruiter wording in the Posting policy: "Outside recruiters, staffing agencies and job brokers may not post. A corporate group's own recruiting or HR team may post for the group's own locations." Is that clear and enforceable?
6. Job views and apply clicks are counted without cookies and shown to clinics (privacy policy, "What we collect"). Is the wording enough?

## Decisions made by Steve (6th November 2026)

- A founding clinic keeps the pass it first signed up for. A monthly clinic that moves up to Plus pays the Plus price at that time. The exception is a clinic that has paid for a year and then upgrades, which gets the founding yearly rate for Plus (clause 8).
- Yearly and monthly payments both renew by themselves, with an email reminder 30 days before a yearly renewal (clauses 6 and 11).
- A price change applies only to new purchases and renewals, never to a post or period already paid for (clause 9).

## Still open

- What a yearly payment renews into once the founding offer is over: the wording in clause 11 covers both a yearly price and monthly, so Steve decides whether a yearly option continues after launch.
- The refund on a yearly payment (clause 12).
- Moving down from Plus to the Clinic pass part way through a paid year. Suggested: not until the year ends.
