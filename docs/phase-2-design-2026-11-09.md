# Phase 2 design: optometrist pay basis, tags, employee count (9th November 2026)

**Update, 9th November 2026 (Steve's answers):** the daily rate and daily minimum range is now simply up to $200 a day wide, with no "unless the top is over $770" exception (the table below that shows 260 days is superseded). Percentage range: 10 points. The "of production, collections or billings" choice stays as a short drop down defaulting to production, with a plain line of help text under it. Found listings stay hourly or yearly only. Software skills private plus a boost in Recommended for you. Employee count required for new clinics.

Status: DESIGN ONLY, for Steve to approve. Nothing is built. No migration has been written. Next free migration number: **0034** (checked all 73 branches on GitHub, none uses 0034 or higher).

Pay stays public on every job. Nothing here hides pay behind a login. A pay range is required for every pay basis.

## A. Pay basis

### The 5 choices on the form

"How is the pay worked out?" The first 2 are what clinics see today. The last 3 appear only when the role is Optometrist (Steve can widen this later).

| Choice on the form | Boxes the clinic fills in | Example |
| --- | --- | --- |
| A yearly salary | Lowest pay, Highest pay | $95,000 to $120,000 a year |
| An hourly wage | Lowest pay, Highest pay | $24 to $28 an hour |
| A daily rate | Lowest daily rate, Highest daily rate | $900 to $1,100 a day |
| A percentage of production | Lowest %, Highest %, "The percentage is of" (production, collections or billings) | 28% to 35% of production |
| A daily minimum guarantee | Lowest minimum, Highest minimum, and a tick box: "Also paid a percentage when it comes to more than the minimum", which opens the percentage boxes | $600 to $800 a day minimum, with or without 28% to 35% |

Any role also gets one optional line, "Bonus, commission or anything else that is part of the pay" (300 characters). This is the existing "pay extras" box with a clearer label, so no new column. It covers test case (d).

Form note above the boxes: "A pay range is required on every post, whichever way the pay is worked out. 'Negotiable' or 'discussed at interview' on its own is not accepted. Enter the range you expect to pay, even if the final offer may be higher."

### The required range, for each choice

| Choice | What must be filled in | Width rule |
| --- | --- | --- |
| Salary | Both boxes (single figure: same number in both) | Today's rule, unchanged: up to $50,000 wide, unless the top is over $200,000 |
| Hourly | Both boxes | Today's rule, unchanged: up to $24 an hour wide, unless the top is over $96 |
| Daily rate | Both boxes | Same rule on a yearly basis, using 260 working days (the same 8 hour day that 2,080 hours already assumes): **up to $192 a day wide, unless the top is over $770 a day** |
| Percentage | Both boxes and what it is of | **Up to 10 points wide.** No "unless over" escape, because a percentage has no yearly figure to test |
| Daily minimum | Both money boxes. If the tick box is on, both percentage boxes and what it is of | The money part follows the daily rule. The percentage part follows the percentage rule |

Numbers to check the daily rule against:

| Daily range | Width | Over a year (260 days) | Result |
| --- | --- | --- | --- |
| $600 to $800 | $200 | $52,000 wide, top $208,000 | Allowed (top over $200,000) |
| $900 to $1,100 | $200 | top $286,000 | Allowed |
| $500 to $690 | $190 | $49,400 wide | Allowed |
| $500 to $700 | $200 | $52,000 wide, top $182,000 | Refused. Message: "Daily ranges can be up to $192 a day wide, unless the top is over $770 a day." |

Numbers to check the percentage rule against. The dollar columns are an illustration of what 10 points is worth at a made up level of production, not a statistic:

| Percentage range | Width | Result | Worth of the width at $500,000 production | at $750,000 |
| --- | --- | --- | --- | --- |
| 16% to 20% | 4 points | Allowed | $20,000 | $30,000 |
| 28% to 35% | 7 points | Allowed | $35,000 | $52,500 |
| 25% to 35% | 10 points | Allowed | $50,000 | $75,000 |
| 25% to 36% | 11 points | Refused. Message: "Percentage ranges can be up to 10 points wide, for example 28% to 38%." | | |

Why 10: at $500,000 of production, 10 points is exactly the $50,000 that the salary rule allows, and a flat number is easy to explain. It is looser than the salary rule once production is higher. 8 points would be stricter. This is the one number I would like you to choose (recommended: 10, and it goes on the lawyer list).

### Limits so odd values cannot get in

| Value | Rule |
| --- | --- |
| Blank | Refused: "Enter the lowest pay, for example 900." |
| Words such as "negotiable" | Refused: "Enter numbers only. A pay range is required on every post, so 'negotiable' is not accepted." |
| Zero or negative | Refused (the database also refuses it) |
| Percentage over 100 | Refused (the database also refuses it) |
| Very long | Boxes are cut at 20 characters. Largest values accepted: salary $1,000,000, hourly $500, daily $5,000, percentage 100. Above that: a plain message, not a database error |
| Highest lower than lowest | Refused, as today |
| Percentage or daily choice on a non optometrist role | Refused with a plain message |

Review queue flags (a person still decides): daily pay outside $200 to $2,500, a percentage outside 10 to 60, "Pay range is too wide" for the new bases, plus today's flags.

### What people see

One function builds the pay wording everywhere (`payText`), so no screen can show `$0`, `$NaN`, `null` or `undefined`. If a job ever has incomplete pay it shows "Pay not stated", never a number.

| Case | Job page, "Pay" line and review queue | Job card chips |
| --- | --- | --- |
| (a) Daily minimum range | Guaranteed minimum $600 to $800 a day | Minimum $600 to $800 a day |
| (b) Percentage range | 28% to 35% of production | 28% to 35% of production |
| (c) Both together | A guaranteed minimum of $600 to $800 a day, or 28% to 35% of production when that comes to more | 2 chips: Minimum $600 to $800 a day, and 28% to 35% of production |
| (d) Hourly or salary plus a note | $24 to $28 an hour, and on the job page a second line "Also part of the pay: yearly bonus" (the existing line) | $24 to $28 an hour |
| (e) Blank or "negotiable" | Cannot be saved or submitted | n/a |

Where it appears: job card, job page and the page description, apply page, claim page, candidate home, clinic dashboard, review queue, the "what changed" view for an edited live job, templates, the copy kept when a live job is edited (the `job_versions` snapshot), the data download, and Admin. Emails: I searched the email code and none of it reads pay, so none changes.

The daily minimum wording assumes "the higher of" (a guarantee against a percentage). If a clinic pays both added together, the form tells it to say so in the bonus line.

## B. Structured data (JobPosting `baseSalary`)

Rule: a percentage is never put into `baseSalary`, because it only takes dollar amounts.

| Choice | `baseSalary` | What the visible page must say |
| --- | --- | --- |
| Salary | minValue, maxValue, unitText YEAR | $95,000 to $120,000 a year |
| Hourly | unitText HOUR | $24 to $28 an hour |
| Daily rate | unitText DAY (Google accepts it) | $900 to $1,100 a day |
| Daily minimum | the guaranteed range, unitText DAY | Guaranteed minimum $600 to $800 a day |
| Percentage only | **none** | 28% to 35% of production |
| Daily minimum plus percentage | the guaranteed range only, unitText DAY | The full sentence including the percentage |

For percentage and combined jobs, the page text and the markup `description` both carry the same pay sentence (added the same way "Also part of the pay" is added today), so the markup still matches the page word for word. A test checks that the sentence on the page and in the markup are the same string. The bonus note is already in both.

## C. Pay benchmark ("typical pay" line)

It compares **salary and hourly only**, exactly as today. It stays quiet for daily rate, daily minimum and percentage, because Job Bank has no daily or percentage figure and turning a daily rate into a year with 260 days would overstate a part time optometrist. Kestrel's own posted pay statistics already skip anything not hourly or yearly, and will keep doing so. Optometrist wages stay off the public pay table.

Same reasoning for "Recommended for you": a job whose pay cannot be turned into a year is not dropped for failing a candidate's minimum pay (today a missing figure would count as $0 and drop it, which I will fix).

## D. Equipment, software and specialty tags on a job

Fixed lists in code (`lib/job-tags.ts`), text only, no vendor logos. Product names are written the way you gave them.

- **Practice software (8):** Visual Eyes, RevolutionEHR, Wink, Acuitas, eVision, iFile, OD Office Pro, Optosys
- **Equipment (5):** Optos, OCT, Humphrey visual field, Topographer, Retinal photographs
- **Specialties (4):** Dry eye and IPL, Myopia control and ortho-k, Vision therapy, On-site edging lab

Not used: Officemate and Telus Health eClaims, which the Gemini notes named but are not on your list. One line in one file adds an item later, with no database change.

- **Form:** a "Tools and specialties" section with 3 groups of tick boxes. Optional. Any role can tick any tag.
- **Job card:** one small line of up to 3 names, then "and 2 more", for example "Wink, Optos, Dry eye and IPL and 2 more".
- **Job page:** a "Tools and specialties" block with 3 short labelled lists.
- **Search:** a "Software, equipment and specialties" filter under the existing filters. Within one group a job matches if it has **any** ticked item (a candidate who knows Wink or Acuitas wants either). Across groups, a job must match every group that has something ticked.
- Review queue and the "what changed" view show the tags. Templates carry them.
- Not added to Google's markup (Google has no field for it).

## E. Candidate software skills

Optional tick list on the candidate profile with the same 8 software names. **Your default, which I recommend: private to the candidate.** Clinics cannot see it, it is not added to an application, and the only use is a small boost in "Recommended for you" with a reason shown ("Uses Wink, which you use"). The existing database rules already keep a candidate profile private to the candidate. It is included in the candidate's own data download and goes when the account is deleted.

**Question for you:** is that the default you want, including the boost in Recommended for you? (Recommended: yes. Sharing with clinics on an application can be added later if you choose.)

## F. Employee count

Bands: 1 to 9, 10 to 24, 25 to 99, 100 or more. A required "How many people work at your clinic?" choice on the clinic profile (the first screen a new clinic sees after creating an account). Existing clinics are not forced; they are asked next time they save the profile. It changes no rule.

**Where it is stored, and why:** in the private clinic contact table (`employer_contacts`), next to the notification email, not on the clinic row. The clinic row can be read by any signed in user for clinics that have live jobs, so a candidate could have read the band through the API. The contact table is readable only by that clinic and by Admin. Seen in Admin in 2 places: the review queue (beside the clinic's other details) and a "Clinics by size" line in Admin numbers. The clinic also gets it in its own data download.

## G. Every file that reads pay

Found by searching `pay_min`, `pay_max`, `pay_period`, `pay_extras`, `formatPay`, `payRangeAllowed` and `baseSalary` across app, lib, components, supabase, scripts and docs (268 hits in 56 files).

| Group | Files | Change |
| --- | --- | --- |
| Rules | `lib/jobs.ts` (JobInput, cleanJob, validateJob, payRangeAllowed, reviewFlags, formatPay, markupDescription, jobPostingJsonLd), `lib/job-form.ts`, `lib/job-tags.ts` (new) | Main work |
| Show the pay | `components/JobCard.tsx`, `app/jobs/[id]/page.tsx`, `app/jobs/[id]/apply/page.tsx`, `app/jobs/[id]/claim/page.tsx`, `app/candidate/page.tsx`, `app/clinic/page.tsx`, `app/admin/review/page.tsx`, `app/admin/found/page.tsx` | Use `payText` / `payChips` |
| Forms | `components/JobForm.tsx`, `app/clinic/jobs/new/page.tsx`, `app/clinic/jobs/[id]/page.tsx`, `app/admin/post-for-clinic/[employerId]/page.tsx`, `components/ClinicProfileForm.tsx`, `components/CandidateProfileForm.tsx` | New fields |
| Saving and loading | `lib/clinic-actions.ts`, `lib/clinic.ts`, `lib/template-actions.ts`, `lib/admin-job-actions.ts`, `lib/candidate-actions.ts`, `lib/candidate.ts`, `lib/job-diff.ts` | Select lists, row building, diff labels |
| Search | `lib/public-jobs.ts` (columns and filters), `app/jobs/page.tsx` (filter boxes), `lib/empty-search.ts` ("drop this filter" links), landing pages through `JobCard` | Tag filters, wider column list |
| Benchmark and matching | `lib/pay-benchmark.ts`, `lib/pay-benchmark-server.ts`, `components/PayBenchmark.tsx`, `lib/recommend.ts` | Quiet for new bases, safe with missing pay, software boost |
| Download | `app/account/export/route.ts` | New columns |
| Found listings | `lib/found-listings.ts`, `lib/found-listing-actions.ts`, `lib/page-reader.ts`, `components/FoundListingReader.tsx`, `lib/found-db.ts` | **Stay as they are** (below) |
| Not job pay | `lib/candidate-prefs.ts`, `lib/ad-builder.ts` | Candidate's own minimum pay and the ad text. No change |
| Database | migrations 0005, 0013, 0015, 0019, 0023, 0031, `supabase/combined/run-everything.sql`, `supabase/verify.sql`, `supabase/demo/seed.sql`, `scripts/dev/fake-postgrest.js` | New migration, combined file, demo samples |
| Tests | `lib/jobs.test.ts`, `lib/job-form.test.ts`, `lib/job-diff.test.ts`, `lib/pay-benchmark.test.ts`, `lib/recommend.test.ts`, `lib/found-listings.test.ts` | Updated and new |

**Found listings and the province search.** Found listings stay **hourly or yearly only**. The tool copies pay only as the clinic's own page states it, in dollars, and the reader refuses weekly and monthly figures. Percentage and production wording on a public careers page is rare and easy to misread, and Kestrel must not state a fact for a clinic that the page does not state. A found listing keeps working under the new database rule (it is a plain hourly or yearly job). The province search stores clinic leads, not pay, so it is unaffected.

## H. The migration (0034)

All statements safe to run twice. Existing jobs keep working unchanged: every new column is empty or false for them, and they already fit the "plain pay" shape.

**jobs, new columns**
- `pay_is_minimum` boolean, default false, not null
- `pay_percent_min`, `pay_percent_max` numeric(5,2), each null or above 0 and at most 100
- `pay_percent_of` text, null or one of production, collections, billings
- `tags_software`, `tags_equipment`, `tags_specialties` text[], default empty, not null, at most 12 items each and each item at most 40 characters (the allowed names are checked in code, so adding a tag needs no migration)

**jobs, changed rules**
- `pay_period` also allows `day`.
- New check `jobs_pay_shape_check`, for every row including drafts: percentage min, max and "of" are all empty or all filled; `pay_is_minimum` is true only when `pay_period` is `day`; a percentage with no money requires `pay_period` empty.
- `jobs_complete_unless_draft` rebuilt (fourth time; keeps the closed job and found listing exceptions from 0019 and 0023). A submitted job must have one of: money range with period year, hour or day (max at least min, width rule with 260 days for day); or a percentage range only (max at least min, at most 10 points); or a daily minimum with an optional percentage range.

**Column permissions.** Added to the anon select list, and to the authenticated insert and update lists on jobs: all 7 new jobs columns. Without this a column silently fails to save. To make sure none is forgotten, a test reads the SQL and checks that every column the job form writes appears in the grant lists.

**Other tables**
- `employer_contacts.employee_band` text, null or one of `1_9`, `10_24`, `25_99`, `100_plus`. The table already has owner only rules, so no new grants are needed beyond its existing insert and update permission.
- `candidate_profiles.software_skills` text[], default empty, not null, at most 12 items. Insert and update grants added for it.
- `job_templates`: the same pay and tag columns, `pay_period` allows `day`, and the grants extended.
- `keep_live_version()` rebuilt so the copy kept when a live job is edited includes the new fields.
- `supabase/verify.sql` gets checks for each new column.

**Found while reading, to confirm in step 2:** migration 0031 added the "Recommended for you" preference columns to `candidate_profiles`, but I can find no insert or update permission for them, and the profile form saves with the signed in user's rights. If saving preferences fails on the live site with "permission denied", that is why. I will test it on the scratch database. If I am right, 0034 includes the missing permission (harmless if already fine).

**Process:** written as `supabase/migrations/0034_pay_basis_tags_headcount.sql`, copied into the combined file, run twice on a scratch database with existing sample jobs, then checked. **You run it on both the live and the demo database.** I tell you the moment it is ready. No new Vercel setting is planned.

Demo site: `supabase/demo/seed.sql` gets sample optometrist jobs for the 3 new pay choices and tags, so you can see them on the demo.

## I. Open question: extra detail for signed in optometrists

You said to skip it until after launch, so it is **not built**. For the record: my recommendation is to wait for the lawyer's answer first. Effort when you want it: about a day (an optional "extra pay detail" box that only signed in candidates with an optometrist profile can read, never part of the required public range, never in Google's markup). A self chosen "optometrist" profile is not verification, so treat it as a courtesy and not a gate.

## Questions for Steve

1. Approve the 5 form choices, the wording and the 3 shown only for the Optometrist role?
2. Percentage width: 10 points (recommended) or 8?
3. Daily rate width: $192 a day wide, unless the top is over $770 (260 days, matches the hourly rule)?
4. Keep "collections" as a third choice beside production and billings, or only the 2 you named?
5. Candidate software skills: private, plus the boost in Recommended for you (recommended)?
6. Employee count: required for new clinics, asked of existing clinics next time they save?
7. Found listings stay hourly or yearly only?

## For the lawyer's list (when you choose)

Percentage of production and daily minimum under Ontario and BC pay range rules (does a percentage range count as a range of expected compensation); the 10 point width rule; any use of the self declared employee count; candidate software skills under privacy; product names shown as text only.
