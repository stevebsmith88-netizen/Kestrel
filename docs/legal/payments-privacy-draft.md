# Payments and the privacy policy: draft for review (14th November 2026)

Kestrel has no lawyer yet. This is plain English draft wording for the paralegal to check before real payments start. The privacy policy page (`/privacy`) says only that it will be updated "when we start taking payments", so it needs a payments section first. Nothing here has been published.

## What is true today (checked against the code)

- A clinic types its card details on **Stripe's own page**. Kestrel's website and database never see or store a card number, expiry date or security code.
- Kestrel keeps, per payment: the clinic and job names, the amount, the date, the role band, the status, a **Stripe customer ID**, a **Stripe payment method ID** (a reference, not the card), the Stripe invoice ID, the invoice number and the invoice web links. A clinic can read its own payment status, amount and invoice links. The Stripe IDs are for the server only.
- Stripe processes the payment and may store and process information outside Canada, including in the United States.
- A card is saved when a job is sent for review and is charged only when Kestrel approves the job. A job that is not approved is never charged. During the free launch no card is asked for.

## Suggested wording for the privacy policy

**Payments.** When a clinic pays Kestrel, the payment is handled by Stripe, a payment company. The clinic enters its card details on Stripe's page. Kestrel never sees or keeps the card number, expiry date or security code. We keep a record of each payment: the clinic and job it was for, the amount, the date, an invoice number and a reference Stripe gives us so we can charge the saved card when a job is approved and show the clinic its invoices. Stripe may store and process this information outside Canada, including in the United States, under its own privacy policy.

**How long we keep payment records.** We keep payment and invoice records for 6 years, because Canadian tax rules require businesses to keep their books and records for that long. (To confirm with an accountant.)

## Suggested wording for the terms of use

By saving a card when you send a job for review, you agree that Kestrel may charge that card the price shown for your job once Kestrel approves it. If Kestrel does not approve the job, your card is not charged. For passes, you agree to the card being charged each month or year until you cancel.

## Open points for the paralegal and the accountant

- Add Stripe to the list of service providers in the privacy policy and the retention table (`lib/retention.ts` and the retention section of the policy).
- Confirm the 6 year period for payment records, and that clinics' payment records are not deleted when a clinic deletes its account (the tax rule overrides). The database already keeps payment rows when a job or clinic is deleted (migration 0048).
- Confirm the wording of the agreement to charge a saved card later, and whether Stripe's own page needs to show it.
