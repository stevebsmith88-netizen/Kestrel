# Stripe: before real payments (checklist, 14th November 2026)

Nothing here is switched on until Steve says so. Test mode and the sandbox stay as they are until every box is ticked. Live keys are swapped in last.

## In Stripe (Steve, live account, not the sandbox)

- [ ] **Customer emails:** Settings, Billing, Customer emails. Switch on emails for **successful payments** (receipts) so a clinic gets one after each charge. Test mode sends none, so check the setting in live mode.
- [ ] **Invoice template:** Settings, Billing, Invoice template. Add Kestrel's name and address, a footer, and the **HST number** as the account tax ID once it exists.
- [ ] **Public details:** business name Kestrel Eye Care Jobs, statement descriptor `KESTREL EYE CARE JOBS`, support email `support@eyecarejobs.ca`, and a phone number you are happy to show.
- [ ] **Payment methods:** Settings, Payment methods. Keep **Cards**. Apple Pay and Link are card based and can stay. Switch off Klarna and the regional methods (MB WAY, Satispay, Bancontact, BLIK, EPS, Pay by Bank, Pix), which do not suit Canadian clinics or charging a saved card later. Pre-authorized debit (Canadian bank payments) is worth a look later for the passes, because it costs less than cards.
- [ ] **Managed Payments off** at the account level (Kestrel is the seller).
- [ ] **Stripe Tax on** with the HST registration, and tax codes on each product (docs/plans/stripe-plan.md).
- [ ] **Live products and prices:** create them with the Payments page button once it is allowed in live mode, and check they match lib/pricing.ts.
- [ ] **Live webhook:** a destination for `https://eyecarejobs.ca/api/stripe/webhook` with event `checkout.session.completed`, its signing secret in the live Vercel project as `STRIPE_WEBHOOK_SECRET`.
- [ ] **Live keys** into the live Vercel project only (the demo keeps test keys), then redeploy without the build cache and check Admin, Payments.

## On the site

- [ ] Privacy policy has a payments section and the terms have the agreement to charge a saved card (draft: docs/legal/payments-privacy-draft.md).
- [ ] `FORCE_PAID_CHECKOUT` is unset on the live project.
- [ ] The free launch end date and the wording on the For clinics page, the help centre and the outreach email match each other (docs/plans/stripe-plan.md).
- [ ] An accountant has confirmed HST on business to business job adverts and whether to incorporate first (CLAUDE.md, Next tasks, item 17).
- [ ] A full trial on the demo with test cards: a good card, a declined card, a refused card then a new card, and a job that is sent back.
