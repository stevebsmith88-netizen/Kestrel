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

## Steve's answers (14th November 2026), and what changes

- **Clinic sizes:** by number of optometrists: 1, 2, and 3 or more. Exams a month still needed (Steve's rough idea, labelled as an example).
- **Share needing new glasses:** public data exists. A University of Waterloo study (2016, about 6,400 patients at its clinic) found a prescription change in 41% of routine exams of people with no symptoms, rising with age. To verify at the source before use. The gap between that, capture rate benchmarks and actual capture is the story.
- **Buying in the clinic with versus without an optician:** Steve says impossible to calculate. So the post does not claim a figure. It shows "if even 1 in 10 of those sales walks out while you are short, that is $X a month", and lets the owner pick the share in the calculator.
- **Average spectacle sale:** Steve's example, about $500 per 2 year cycle. The Vision Council's Canadian release (Q3 and Q4 2024) confirms a **median replacement cycle of 24 months** and that 38% paid $99 or less out of pocket, but gives **no average sale**. So $500 is labelled as an example, not credited to the Vision Council.
- **Weeks open:** 1 to 2 months, as Steve's rough idea.
- **Candidate quality:** the common problem is a gap between skills and wage expectations. Strong angle: a pay range on the ad filters both ways, so people whose expectations are far off do not apply, and the right ones know where they stand.

## More sources (Steve, 14th November 2026), read on 14th November 2026

- **Statistics Canada, "Vision health month" (statcan.gc.ca/o1/en/plus/6173):** 6,400 optometrists and 11,700 opticians working in Canada in 2023; 6,665 offices of optometrists in December 2023; **$695 million of prescription eyewear retail sales in the last quarter of 2023 alone** (including contact lenses and prescription sunglasses). Strong, citable scale figure for the post. Do not divide it by the number of offices: optical stores sell eyewear too.
- **The Vision Council, Canadian survey (Q1 and Q2 2025), via Optometry Times:** 47% of prescription glasses wearers bought in the last year, **most from their exam provider**; 43% have vision care insurance, mostly through work; 50% had an eye exam in the past year; 87% prefer buying eyewear in person. Supports the point that the clinic is where the sale happens, if someone is there to make it.
- **Average sale:** a clinic blog (myeyewellness.com) cites the Canadian Journal of Ophthalmology for prescription glasses costing "from 240 to almost 1,000 dollars". Steve's $500 example sits in that range. Trace the journal article itself before quoting it; until then use $500 as a labelled example only.
- **University of Waterloo "Careers in optometry" page:** says an average practice handles about 2,800 patient consultations a year, and an optometrist spends 41 hours a week in practice, 35 with patients. **The page is undated and looks old**: it says about 3,000 practising optometrists, but Statistics Canada counts 6,400 (2023) and the 2021 census 6,765, and its income figure ($70,000 to $80,000) is far below Job Bank's. Use 2,800 a year (about 230 a month) only as a labelled example, not as a current average.
- **CAO, "Vision Care Benefits: The Case for Comprehensive Coverage" (Don't Lose Sight booklet, public PDF from opto.ca, shared by Steve 14th November 2026):** a comprehensive eye exam with diagnostics and imaging generally costs **$200 to $250**, and a follow up with testing **$50 to $150** (fees vary by province, place and provider). Exams are recommended **every 24 months for most adults, and yearly for most children and seniors**. Use: the exam room side of the empty optician sum. Every hour an optometrist spends dispensing because no optician is there is exam time not booked, at about $200 to $250 an exam. Also: it says employers can use their benefit plan to attract talent, a line for the "attract the right candidates" post.
- **Health Canada, national strategy on eye care:** page would not load from this session (connection refused). Steve to share any line worth using, or try again later.

## The worked example (Steve to fill the blanks)

Labelled in the post as: "A made up clinic, to show the sum. Your own numbers will differ."

| | Smaller clinic | Mid sized clinic | Larger clinic |
| --- | --- | --- | --- |
| Optometrists | 1 | 2 | 3 or more |
| Eye exams a month | ___ | about 230 (2,800 a year, Waterloo's older example figure, Steve to confirm) | ___ |
| Share of patients who need new glasses | ___% | ___% | ___% |
| Share who buy them in the clinic, with an optician | ___% | ___% | ___% |
| Share who buy them in the clinic, without one | ___% | ___% | ___% |
| Average spectacle sale | $500 (Steve's example) | $500 | $500 |
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
