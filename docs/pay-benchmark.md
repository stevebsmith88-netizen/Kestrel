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
