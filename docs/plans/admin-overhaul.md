# Admin console overhaul (plan, 14th November 2026)

Status: proposal, waiting for Steve's notes and his yes on the grouping. Nothing here is built. The review queue and Jobs page part is already done (14th November 2026, pull request 181).

Covers items 5, 9 and 20 of the next tasks in CLAUDE.md, and feeds item 18 (drop down menus for each account type) and item 6 (virtual assistant logins).

## What is there today

13 admin pages: Overview, Review queue, Jobs, Found listings, Post for a clinic, Outreach, Clinics, Claims, Reports, Help requests, Waitlist, Do not email, Payments. Two CSV downloads (numbers, waitlist) and one for found leads.

- The top bar (`NAV.admin` in `components/AppBarView.tsx`) lists 9: Overview, Review queue, Help requests, Clinics, Claims, Reports, Waitlist, Do not email, Live jobs. It wraps onto a second line on a wide screen.
- Jobs, Found listings, Post for a clinic, Outreach and Payments are not in the bar. They are reached from a sentence on the Overview, or by their address.
- The initials menu for an admin has an Account settings line that goes to `/account`, which only candidates and clinics can open, so it sends the admin away (item 9).
- The Overview holds the numbers, Gate C, the funnels, hires and the investor snapshot. What needs a decision shows only as small notices above them.

## Proposal: group by what Steve is doing

| Group | Pages | Why |
| --- | --- | --- |
| Overview | Overview | First, on its own |
| Needs attention | Review queue, Help requests, Claims, Reports | Everything waiting for a decision, each with a count, the group with a total |
| Jobs | Jobs, Found listings, Post for a clinic | The record and the tools that add jobs |
| People | Clinics, Waitlist, Do not email | Who is on Kestrel |
| Money | Payments | Kept apart so a helper can be kept out of it |
| Growth | Outreach | Switched off until the disclosure conversation |

- Top bar: Overview, then the 5 headings as small drop downs (the browser's own `details`, keyboard friendly), so it never wraps. On a phone every page sits in the Menu button under the same headings.
- Initials menu for an admin: Help and Sign out. No settings line until an admin account page exists.
- Counts come from the numbers the Overview already loads (`loadStats`), so no new queries.
- The menu is built from 1 list in `lib/admin-menu.ts`, where each page says which group it is in and who may see it. A virtual assistant's menu (item 6) is then a shorter list, and `lib/admin-menu.test.ts` can check every admin page appears in the list.

## Questions for Steve

1. Is the grouping right?
2. Rework the Overview itself too (what needs him first, the investor snapshot lower), or the navigation only for now?
3. Steve's own notes on the overhaul, to fold in before anything is built.

## Build order once agreed

1. `lib/admin-menu.ts` and the new top bar and drop downs, with the count badges, and the admin initials menu fix.
2. A short "Needs attention" block at the top of the Overview.
3. A pass over each page's wording and spacing, one page at a time, with Steve's notes.
4. Hand the same list to the virtual assistant login design (item 6).
