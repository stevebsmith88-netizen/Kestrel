# Privacy policy ideas from a competitor's policy (20th November 2026)

For the paralegal with the other drafts. Kestrel has no lawyer yet. Read from the public Jobs4ECPs policy (last updated July 2023). Its wording is a mix of UK, EU and US rules and is not copied. These are only things worth checking Kestrel's own `/privacy` page against.

What the competitor's policy has that `app/privacy/page.tsx` did not mention when checked (a quick word search, not a full read):

1. **A "Do Not Track" line.** It says its site does not respond to the signal. Kestrel uses no advertising or cross site tracking, so a plain line saying so is cheap and true (once Vercel Web Analytics is on at launch, check what it sets).
2. **Age.** It says it does not market to children under 13. Kestrel needs a line on the minimum age to hold an account (a candidate, or a clinic user).
3. **A sale of the business clause.** It says customer information may transfer if the business is sold. PIPEDA allows this for a business transaction only with conditions (the buyer uses it for the same purposes, and people are told). Worth a sentence.
4. **Payment processors.** It names Stripe and PayPal. Kestrel's live policy does not mention Stripe yet. The draft is `docs/legal/payments-privacy-draft.md` and has to go live before prices switch on.
5. **A named breach promise.** It promises notice within 7 business days. Under PIPEDA a breach with a real risk of significant harm must be reported to the Privacy Commissioner and to the people affected as soon as feasible, and a record kept for 24 months. Check Kestrel's breach line and `docs/security.md` say the same.
6. **Linked and third party sites.** A short line that Kestrel is not responsible for other sites a job links to (the clinic's own application page).
7. **Where the complaint goes.** It points to the Office of the Privacy Commissioner of Canada. Kestrel already does.

What Kestrel does better and should keep: the retention periods for each kind of record, the plain list of who receives what (a clinic gets a candidate's details only inside an application), data kept in Canada, a data download and deletion, and wording that fits Canadian rules (PIPEDA and CASL) with no EU or US boilerplate.

Not relevant to Kestrel today: Flash cookies, advertising networks, ad blocker detection, audience matching with partners, co-branded promotions, credit checks.
