# Pay benchmark

Shown to a clinic on the post a job form (and the edit form), under the pay boxes. It compares the range the clinic types with what is typical for that role in that province. It is guidance only. It never blocks, delays or changes a post.

## Source, licence and date

- **Data:** the Job Bank "Wages" dataset from Employment and Social Development Canada, on open.canada.ca: https://open.canada.ca/data/en/dataset/adad580f-76b0-4502-bd05-20c125de9116
- **File used:** `2a71-das-wage2025opendata-esdc-all-19nov2025-vf.csv`, revised 19th November 2025, downloaded by Claude on 5th November 2026. The file is served from `opencanada.blob.core.windows.net`, which is why that host is allowed in the cloud environment.
- **Licence:** Open Government Licence – Canada, version 2.0 (https://open.canada.ca/en/open-government-licence-canada). The dataset page names no attribution of its own, so the licence's default statement is used and shown on the form with a link: "Contains information licensed under the Open Government Licence – Canada."
- **What the licence asks of us:** acknowledge the source, link the licence, do not suggest the Government of Canada endorses Kestrel, and do not use its names or logos. The form says the figures are adapted (hourly and yearly pay put on one basis) and not endorsed. The licence gives the data "as is", so the form also says it is guidance only. Whether anything more is needed is question 38 in the lawyer pack.
- **What the figures are:** wages come from Statistics Canada surveys. Hourly occupations use the Labour Force Survey 2023 to 2024. Optometrists are published as a yearly amount from the 2021 Census, so that figure is the oldest. Each line on the form states the years it covers.

## How roles map to Job Bank groups

Job Bank groups jobs by the National Occupational Classification (NOC) 2021. A match is "exact" when the group is named for the role and "closest" when Kestrel picked the nearest group. The form says "closest" where that applies and always names the group.

| Kestrel role | Job Bank group | Match |
| --- | --- | --- |
| Optometrist | Optometrists (NOC 31111) | Exact |
| Optician | Opticians (NOC 32100) | Exact |
| Optometric assistant or technician | Other assisting occupations in support of health services (NOC 33109) | Closest. Steve to confirm on Job Bank (see below) |
| Patient care or reception | Receptionists (NOC 14101) | Closest |
| Practice or clinic manager | Supervisors, general office and administrative support workers (NOC 12010) | Closest. Steve to confirm (see below) |

Provinces: all 13 where Job Bank publishes a figure (43 of 65 role and province pairs). Prince Edward Island, the territories and a few optometrist rows are suppressed by Statistics Canada for small numbers, so the form shows nothing there.

**Left out on purpose, for now:**

- **Practice or clinic manager** started as "Managers in health care" (NOC 30010, about $56 an hour in Ontario) or "Other administrative services managers" (NOC 10019, about $50). Both are dominated by senior managers, so a clinic manager would read as "below". Office and administrative supervisors (NOC 12010, about $31 an hour in Ontario) look closer to a clinic manager, so that is the closest match used. Not verified, so it carries the "closest" note.
- **Vision therapist.** No clear Job Bank group. Uses the starting range path.
- **Field and supplier roles** (sales or territory representative, trainer, field service technician, account or practice development manager). The sales groups (62100 and 64101) do not say whether equipment or consumables are sold, and base pay is mixed with commission. No group for trainers or field technicians fits. Held back.

**To check on Job Bank (Steve, 5 minutes):** search "optometric assistant", "receptionist" and "office manager" (and "dental office manager" for comparison) at https://www.jobbank.gc.ca/trend-analysis/search-wages and note which occupation group Job Bank offers. If it is not NOC 33109 for assistants (or NOC 12010 for managers), tell Claude and the mapping and the blog post follow it. Claude could not run that search from the cloud environment (the page needs a browser session), and did not guess.

## How the comparison works

- Hourly pay is multiplied by 2,080 hours (the same conversion the pay range rule uses) so everything is compared as a yearly amount. The result is shown in whichever basis the clinic chose.
- The middle of the clinic's range is compared with the middle half of pay for the role (first to third quartile in the Job Bank file). Below the first quartile is "below", above the third is "above", anything between is "in line with". Where only a median is known, within 10% of it is "in line".
- Wording uses "typical" and "median". Never "national average".

## Which figure is shown

1. **Official Job Bank wages** where the role and province have them.
2. **Kestrel's own posted pay**, once a role and province have at least 10 posts. Claude added a second condition: those posts must come from at least 3 different clinics, so one clinic reposting cannot set the figure and no single clinic's pay can be read off it. Say if you want only the 10 post rule. It counts posts that clinics wrote and Kestrel approved (live, closed or expired), not drafts and not found listings. It uses the middle of each posted range and needs no migration.
3. **An AI starting range**, labelled "Starting point, from AI", only for a role and province with neither of the above. Stored in `lib/pay-starting-ranges.ts`, which is empty today (see below).
4. Nothing.

Pay scraped from Indeed, LinkedIn, Jobs4ECPs or any other job board is never used.

## AI starting ranges

None are shown yet. Claude had no Anthropic key in the session that built this, and will not write pay figures from memory. When Steve wants them (the main gaps are vision therapist, practice manager, and every province outside Ontario, Alberta and British Columbia), the route is:

1. Claude uses the Anthropic key on the live site, with web search on public sources other than job boards (Job Bank, college and association salary surveys, public sector pay scales), to propose a range for each missing role and province, with the source of each.
2. Steve reads the list. Only ranges he accepts go into `lib/pay-starting-ranges.ts`, each with the date and a one line basis.
3. The form shows them under "Starting point, from AI", with the sentence "It is a rough starting point, not fact", and they drop out as soon as Job Bank or Kestrel's own posts cover that role and province.

## Refreshing the figures

Job Bank publishes a new file each November or December. Download it, run `scripts/build-pay-benchmark.py` (instructions at the top of the script), run `npm test`, read the diff, and update the file name and date in this page.

## Where the code is

`lib/pay-benchmark.ts` (rules and wording), `lib/pay-benchmark-data.ts` (generated figures), `lib/pay-benchmark-server.ts` (Kestrel's own posted pay, totals only), `lib/pay-starting-ranges.ts`, `components/PayBenchmark.tsx`, and tests in `lib/pay-benchmark.test.ts`. No new database change, key or service.

## The yearly summary page (13th November 2026)

`/resources/eye-care-pay-summary` (`lib/pay-summary.ts`) works out, from the same figures as the pay table, where each public role is paid most and least and the gap between them. Its numbers update by themselves when the data file is rebuilt. At each yearly refresh, also change `UPDATED` in `app/resources/eye-care-pay-summary/page.tsx` and `paySummary` in `lib/page-dates.ts`, and read the "short version" paragraph again in case the story has changed (for example a different province on top).

## Check before the next refresh: "low" and "high" on Job Bank's own page (8th November 2026)

ChatGPT and Copilot both quote Job Bank's page for Alberta opticians as $17.36 low, $28.00 median and $39.40 high. Kestrel's table, built from the open data file, shows Q1 $25.00, median $28.00 and Q3 $39.40 and calls the range "the middle half of pay". The median and the top figure agree. The bottom does not, and the public wording depends on what Job Bank's "low" and "high" mean.

**To check (Steve, 5 minutes):** open Job Bank's wages page for Opticians in Alberta (https://www.jobbank.gc.ca/marketreport/wages-occupation/4345/AB, which uses the older occupation code) and the current one for NOC 32100, and read how Job Bank defines Low and High (it explains them on the page). Then tell Claude which is true:

- If Job Bank's low and high are the 25th and 75th percentiles, our Q1 should match and the data file or the mapping needs a look.
- If they are the 10th and 90th percentiles, or a different measure, our "middle half" label is right for our figures, and the Resources page should say in a line why it differs from the Job Bank page, since assistants and people compare the two.

Nothing on the site changes until that is known. The same check applies to every province and role in the table.

## Pay bases other than salary and hourly (Phase 2, 9th November 2026)

The "typical pay" line compares **salary and hourly pay only**. It stays quiet for a daily rate, a daily minimum guarantee and a percentage of production, because Job Bank has no daily or percentage figure and turning a daily rate into a year would overstate a part time optometrist. Kestrel's own posted pay statistics skip those jobs too, and "Recommended for you" never drops a job because a daily or percentage pay cannot be compared with a candidate's minimum (`yearlyPay` in `lib/job-pay.ts`). Optometrist wages stay off the public pay table.
