# Clinic outreach and Canada's anti-spam law (CASL)

Clinic outreach is OFF. Nothing in the site sends it. It stays off until Steve confirms his disclosure conversation at Eye Recommend has happened, and until the pieces marked "to build" below exist.

The email itself is in `lib/outreach.ts`, with a picture of how it looks in `docs/casl-outreach-example.png`. `lib/outreach.test.ts` checks it still has what the law needs.

## What CASL needs in every commercial email

1. Who is sending it: Kestrel Eye Care Jobs, named in the email.
2. A mailing address: 6013 Yonge Street, 3rd Floor, North York, Ontario M2M 3W2. It is in the footer of every email.
3. A working unsubscribe, in every email, honoured within 10 business days. We aim for straight away.
4. Permission. For a first email to a business, "implied consent" can work when all of these are true:
   - the address was conspicuously published, for example on the clinic's careers or contact page,
   - the clinic did not say "no unsolicited email" next to it, and
   - the email is only about that person's business role, which here is hiring for the job we found.
5. Honest content: no misleading subject line, and the footer must say the true reason they are getting it (the outreach footer says the address is published for hiring enquiries).

## Rules we follow

- Send only to an address published for hiring or business enquiries. Never to a personal address, and never to anything taken from Eye Recommend.
- One email about the listing, one short follow up at most, then stop unless they reply.
- Keep a record for each send: the address, the page it came from, the date we found it, and the date we sent. This is our proof of implied consent.
- Honour "take it down" at once, and add the address to the suppression list.

## To build before any outreach

- A suppression list (addresses that unsubscribed or asked us to stop) that is checked before every send.
- An unsubscribe page for clinic addresses that are not waitlist or account holders.
- The "claim your listing" page that the email's button points to.
- The record of where each address was found.
- A person (Steve) approving each batch before it goes.

This is a plain English summary, not legal advice. Have a lawyer check it before the first send.
