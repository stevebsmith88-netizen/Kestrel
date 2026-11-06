# Sponsored posts: a simple plan (5th November 2026, not built, no price on the site)

Steve's brief: a sponsored option that shows on both independent and corporate posts, runs for a number of days, is chosen when a clinic orders a post, and stays simple for clinics and for us. No price is shown anywhere yet, and nothing about it is on the website.

Decision (6th November 2026): sponsored posts launch with Stripe, in the paid launch phase (Phase 4 in `docs/audit/NEXT-STEPS-PHASES.md`).

## How it works for a clinic

One extra choice when ordering a post: **Boost this post**, with None, 7 days, 14 days or 30 days. The boost can never run longer than the post itself. A clinic can also add a boost to a live post later from the dashboard. The price is one flat amount per day, the same for every clinic, independent or corporate. The dashboard shows how many times the boosted post was shown and clicked, next to its normal views.

## The question: what if 10 clinics are boosted?

Only a few spots exist, so the plan is a fair rotation, with a cap so a spot stays worth buying.

- A results page has 2 sponsored spots at the top. A sponsored post only appears for a search it matches: the same province, and the same role if the visitor chose one.
- Each time the page loads, 2 are picked at random from the boosted posts that match. With 10 matching, each gets about 1 spot in 5 of the page views. Nobody sits in the top spot all day, and nobody is hidden all day.
- A cap keeps this honest. Suggested: at most 6 boosted posts per province at one time. When a province is full, the clinic picks a later start date, so the offer is never oversold.
- A boosted post that shows in a sponsored spot is left out of the normal list on that page, so it never appears twice.
- It is always labelled "Sponsored", on the card and for screen readers.

## What we are not doing, and why

- **No auction or bidding.** Harder for clinics to understand and harder to build, and it favours the biggest groups over independents.
- **No pay per click.** The pricing page promises "no charge by the click", and a flat daily price keeps that true.
- **No reserved top spot by the day.** That needs a booking calendar. Rotation gives the same result with far less to build.
- **No change to Google's job listing data.** A boost only changes where the post shows on Kestrel.

## What has to exist first

1. Job views and apply clicks (built on 6th November, migration 0030). The daily price should be set from real numbers, after a few weeks of data, not guessed now.
2. Stripe, the company and the bank account (Gate A), because the boost is chosen at checkout.
3. Then about 2 days of work: a `sponsored_until` date on jobs, the 2 spots on the search page, the cap check, the order choice and the dashboard numbers.

## Decisions to take later

- The price per day, once views are known.
- Whether Clinic pass Plus includes some boost days each month. It could be a reason to choose Plus.
- The cap per province.
- Ask the lawyer whether the "Sponsored" label wording is enough.
