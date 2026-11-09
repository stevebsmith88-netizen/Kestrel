# Definitions: who counts as what

Agreed by Steve on 6th November 2026 (marketing audit item 1): clinic and candidate aha moment = first application, response time = 1 business day. The rest were proposed by Claude and stand unless Steve changes them. Once agreed, the admin numbers, the funnel tracking and the emails all use these exact words, so nobody has to guess what "active" means.

Every definition below can be counted from data Kestrel already stores, so no new tracking is needed to start. Where a step needs a new date saved, it says so.

## People who might come

| Term | Meaning | How it is counted today |
| --- | --- | --- |
| Waitlist member | Someone who joined the waitlist and pressed the link in the confirmation email | `waitlist.confirmed_at` is set (migration 0014). An unconfirmed sign up is a "pending" sign up and is not counted as a member. |
| Visitor | A person who loads a public page | Not counted yet. Comes with the analytics tool (item 3). |

## Clinics

| Term | Meaning | How it is counted today |
| --- | --- | --- |
| Clinic lead | A clinic Kestrel knows of but has not heard from (found listing, province search lead) | `clinic_leads` and found listings (migrations 0023, 0025). Never contacted until Gate A. |
| Registered clinic | A clinic that created an account | A user with the clinic role. |
| Qualified clinic | A registered clinic with a profile and either a claimed listing or a first post submitted for review | `employers` row with `claimed` true, or a job with status `in_review` or later. |
| Customer | A clinic with at least 1 live post that was paid for, or posted free during the launch and approved | A job that reached `live`. During the free launch these are "launch customers". Once prices are on, paying customers are counted separately. |
| Activated clinic (the aha moment) | A clinic whose first live post has received its first application | First `applications` row on a live job from that clinic. Time to activate = days from sign up to that application. |
| Repeat clinic | A clinic that posts a second job within 60 days of its first | Two jobs with `posted_at` within 60 days. This is the number that matters most for the pass. |
| Active clinic | A clinic with at least 1 live post right now | Jobs with status `live` and `expires_at` in the future. |

## Candidates

| Term | Meaning | How it is counted today |
| --- | --- | --- |
| Registered candidate | A candidate with an account | A user with the candidate role. |
| Complete profile | Profession, province and at least one job alert or a saved CV | Candidate row with those fields filled. |
| Activated candidate (the aha moment) | Sends a first application, or opens a first job alert email | First `applications` row for the candidate. Alert opens are not tracked yet (needs the analytics work in item 3). |
| Returning candidate | Signs in or opens an alert in 2 different weeks within their first 30 days | Not counted yet. Needs sign in dates and email opens. |

## Quality of the first week (what "good" looks like)

- **Clinic:** account, profile, first post submitted, approved, live, first application, all within 14 days of signing up.
- **Candidate:** account, profile complete, first application within 7 days of signing up.

These are targets to measure against, not promises. Set real numbers after the first 20 clinics and 100 candidates.

## Response times

- A clinic's question to hello@ gets a human reply within 1 business day.
- A post submitted for review is read within 1 business day (the review promise on the site says a person reads every post).

## Not decided here

- Whether a clinic that only ever posts one free job counts as a customer. The proposal says yes during the free launch, but reports will always show launch customers separately from paying ones.

## Hire through Kestrel (November 2026)

A hire through Kestrel is a job where the clinic, on the "Filled it?" page or the applicants page's "Role filled?" box, said it found the person through Kestrel and named them from the list of applicants. That application becomes Hired and the job keeps its id (`jobs.filled_application_id`). Admin shows this count, how many clinics said Kestrel without naming anyone, how many filled another way (by source), and the share of ended jobs where the clinic told us. The numbers are self reported, so they are a floor, not a full count.
