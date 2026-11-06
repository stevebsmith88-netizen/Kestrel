# Link tagging guide (UTM naming)

Marketing audit item 2, 6th November 2026. Every link Kestrel puts in an email, post or profile should carry 3 tags, so the Waitlist page in the admin area can say where each sign up came from. Without tags, the site can still record the website that sent a visitor (Google, LinkedIn), but not which email, post or campaign.

## The 3 tags

| Tag | What it answers | Rules |
| --- | --- | --- |
| `utm_source` | Who or what sent the visit | One lower case word: `google`, `linkedin`, `facebook`, `newsletter`, `flyer`, `bing`, `association-name` |
| `utm_medium` | The kind of channel | One of: `email`, `social`, `cpc` (paid), `referral`, `print`, `organic-profile` |
| `utm_campaign` | Which push | Month and name: `2026-12-launch`, `2027-03-founding-clinics` |

Use lower case, hyphens instead of spaces, no capitals, and no personal details ever (never a name or email in a tag). The site tidies tags it receives, but keep them clean at the source.

## Examples

- LinkedIn company page post about the pay table: `https://eyecarejobs.ca/resources?utm_source=linkedin&utm_medium=social&utm_campaign=2026-12-pay-table`
- A link in the footer of a clinic email: `https://eyecarejobs.ca/clinics?utm_source=outreach&utm_medium=email&utm_campaign=2027-03-founding-clinics`
- The printed flyer's address or QR code: `https://eyecarejobs.ca/?utm_source=flyer&utm_medium=print&utm_campaign=2027-02-toronto-flyer`
- Google Business profile website button: `https://eyecarejobs.ca/?utm_source=google&utm_medium=organic-profile&utm_campaign=profile`

Links Kestrel sends automatically (confirmation emails, alert digests) point to account pages and do not need tags.

## What the site does with them

1. On a visitor's first page in a browser session, `components/AttributionCapture.tsx` notes the 3 tags, the website that sent them (never our own pages) and the page they landed on. It is kept in that tab's session storage and cleared when the tab closes. Nothing is sent anywhere at this point.
2. If the visitor joins the waitlist, the form sends those notes with the sign up. The server cleans them again (`lib/attribution.ts`) and saves them in the `waitlist` table (migration 0032). Query strings are never saved, only the page path.
3. Admin, Waitlist shows a "Came from" column and a one line count by source.

## Limits to know about

- A visitor who reads a blog post from Google, closes the tab, and comes back later by typing the address will show as "Direct". Sign ups are attributed to the first page of that browser session only.
- Visitors with storage switched off still join normally, with no source saved.
- Account sign up is not tagged yet because sign up is closed until launch. Add it with the same helper when the gate opens (the funnel work in audit item 3).
- This does not count visitors. That comes with the analytics tool (audit item 3).

## Decisions to take to the lawyer

The privacy policy now says the website that sent a visitor, the landing page and any campaign tag are saved when a person joins the waitlist. Add this to the lawyer pack as a small change to `/privacy`.
