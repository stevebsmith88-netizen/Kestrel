# Profile pages: what to create and exactly what to put on them

Marketing audit item 8. Steve creates these (they need his sign ins and verification). Use the same name, line, description and logo everywhere, so search engines and AI assistants treat them as one organisation. Created accounts should use a Kestrel address (kestrel@ or hello@), never an Eye Recommend address, and never carry any Eye Recommend branding or mentions.

## Copy to paste

| Field | Text |
| --- | --- |
| Name | Kestrel Eye Care Jobs |
| Line | Canada-wide eye care job board |
| Short description (under 160 characters) | Kestrel Eye Care Jobs is a Canada-wide job board for eye care. Every job shows its pay, and a person reads every post. |
| Longer description | Kestrel Eye Care Jobs is a job board for eye care in Canada. Optometrists, opticians, assistants, clinic teams and suppliers search in one place, and every job shows its pay. Independent and corporate practices post side by side, and a person reads every post before it goes live. Built by someone with over 20 years in the industry. |
| Website | https://eyecarejobs.ca |
| Email | hello@eyecarejobs.ca |
| Logo or profile picture | `public/brand/kestrel-profile-circle.png` |
| Share picture | `public/brand/kestrel-share-1200x630.png` |
| Category | Employment website, or Job board (use whichever the platform offers first) |
| Location | Canada |

Never redraw or edit the logo files. If a platform needs a banner, ask Claude to prepare one from the brand files as they are, and give the size the platform shows.

## Tagged website links (so Admin, Waitlist shows which profile sent a sign up)

| Profile | Website link to enter |
| --- | --- |
| LinkedIn | `https://eyecarejobs.ca/?utm_source=linkedin&utm_medium=organic-profile&utm_campaign=profile` |
| Facebook | `https://eyecarejobs.ca/?utm_source=facebook&utm_medium=organic-profile&utm_campaign=profile` |
| Bing Places or Google profile, if allowed | `https://eyecarejobs.ca/?utm_source=google&utm_medium=organic-profile&utm_campaign=profile` |

## Order of work

1. **Bing Webmaster Tools** (about 10 minutes). Sign in with the Kestrel account, choose to import from Google Search Console (already set up on 31st October 2026), and confirm the sitemap `https://eyecarejobs.ca/sitemap.xml` shows. Several AI assistants use Bing's index, so this one matters most.
2. **LinkedIn company page.** LinkedIn needs a personal profile to administer a page. Admins are not shown publicly on the page, but check the page shows no link to Eye Recommend. Use the copy above. Post nothing yet.
3. **Facebook page.** Same rules: a personal profile administers it, admins stay private by default, no Eye Recommend mentions. Choose the category, add the copy above, post nothing yet.
4. **Google Business Profile: probably skip.** Google generally lists businesses that meet customers in person or serve a local area. Kestrel is online only, so a profile may be refused, and a postcard to the mailing address would be needed to verify one. You asked for the address to stay off the website, so a profile that shows it is not worth chasing. Search Console already gives the site its Google presence. Revisit if Kestrel ever has a real service area.
5. **Instagram: later.** Only when there is regular content to post (the social plan in `docs/discoverability-plan.md`).

## After they exist

1. Send Claude the page addresses. Claude adds them to the Organization data on the home page (`sameAs`), which tells search engines these pages belong to Kestrel, and adds a footer link.
2. Do not post from them until the approval queue in the social plan exists. Posts come from things Kestrel owns: blog posts, the pay table, the resources page. Never unclaimed found listings.
3. Turn on 2 step sign in for every account and save it in the password manager (docs/security.md).
4. Add each account and its recovery email to docs/security.md, without passwords.
