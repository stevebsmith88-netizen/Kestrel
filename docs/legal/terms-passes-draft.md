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
8. The founding price applies to the pass you choose when you start. [Steve: if a founding clinic later moves from the Clinic pass to Plus, does it get the founding Plus price of $349, or the standard Plus price? Whichever you choose, say it here.] If you cancel and come back later, the price at that time applies.
9. After 12 months we may change the price. We will tell you at least 30 days before your next renewal. [Lawyer: is 30 days enough notice?]

**Paying for a year**

10. During the launch period, founding clinics may pay for a year in advance: [$1,990 for the Clinic pass or $3,490 for Clinic pass Plus], which is 10 months for the price of 12. This covers 12 months of the pass.
11. A yearly payment does not renew by itself. [Option A: we email you 30 days before it ends and it ends unless you choose to pay again. Option B: it renews at the price then in force unless you cancel, with a reminder 30 days before.] Steve prefers option A unless the lawyer says otherwise.
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

## Decisions for Steve

- The founding price when a clinic moves from the Clinic pass up to Plus (clause 8).
- Yearly payment: renew by itself, or end unless chosen again (clause 11).
- How much notice before a price change (clause 9).
