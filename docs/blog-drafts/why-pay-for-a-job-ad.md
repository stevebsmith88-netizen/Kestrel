# Draft: "Why pay for a job ad?" (Tuesday 26th January 2027)

Status: outline for Steve, 14th November 2026. The numbers are blanks for Steve to give an idea of. They must be a plain example of a made up clinic, labelled as one, from Steve's general sense of the industry or a published public source. Never from Eye Recommend member data, and never presented as an industry average.

## The argument in 1 line

A job ad is the cheapest part of hiring. The expensive part is the chair that stays empty, and the weeks spent sorting through the wrong applicants.

## Shape of the post

1. **The honest question.** Free listings exist, so why pay? Sometimes you should not: a quick internal or part time role may fill from a free post or a referral. Say so up front.
2. **What an empty optician chair costs.** Walk through 1 made up clinic, then show the same sum for a smaller and a larger one, because the cost grows with how many exams the clinic runs.
3. **The hand off.** When there is no optician, the optometrist either dispenses (and loses exam time) or patients leave with their prescription and buy elsewhere. The smooth walk from the exam room to the dispensary is where the sale is kept.
4. **What a slow hire adds.** Weeks open, the owner's evenings spent screening, overtime for the team, locum days.
5. **What the ad itself costs.** Pay per click boards bill by the click, so the final bill is unknown until the budget is gone, and a large spend can still bring a handful of the wrong people. A flat fee for 30 days is known in advance. (During the free launch: "free while we launch". Check `lib/pricing.ts` and `/compare` on the day.)
6. **Try it with your own numbers.** Link to the calculator.

## The worked example (Steve to fill the blanks)

Labelled in the post as: "A made up clinic, to show the sum. Your own numbers will differ."

| | Smaller clinic | Mid sized clinic | Larger clinic |
| --- | --- | --- | --- |
| Optometrists | 1 | 2 | 3 or more |
| Eye exams a month | ___ | ___ | ___ |
| Share of patients who need new glasses | ___% | ___% | ___% |
| Share who buy them in the clinic, with an optician | ___% | ___% | ___% |
| Share who buy them in the clinic, without one | ___% | ___% | ___% |
| Average spectacle sale | $___ | $___ | $___ |
| **Glasses revenue at risk each month** | worked out | worked out | worked out |

The sum: exams a month × share needing glasses × (buy in clinic with an optician minus without one) × average sale.

Then the hiring side, for the mid sized clinic only:

| | Example |
| --- | --- |
| Weeks a typical optician hire stays open | ___ |
| Owner hours spent screening per hire | ___ |
| Overtime or locum cover a week while short | $___ |

## The calculator (to build once the post is approved)

A small box on `/clinics` and at the end of the post. The owner types 4 numbers: exams a month, share needing glasses, the drop in buying in clinic without an optician, and average sale. It shows: "An empty optician chair could be costing you about $X a month in glasses sales", with the sum written out underneath so nothing is hidden. Nothing typed is saved or sent anywhere. No email needed to see the answer.

## What Steve can give

- A rough idea for each blank above (round numbers are fine: they are an example).
- 1 real story of a free post that dragged on, or a hire that took too long, with no clinic named.
- What owners say they dislike about paying per click.

## Rules

Facts only where stated as facts. No promise of applicant numbers or time to hire. Competitor prices only from `docs/competitor-pricing.md`, dated. Paragraphs, few headings, a pull quote, and a photo from the Canva design.
