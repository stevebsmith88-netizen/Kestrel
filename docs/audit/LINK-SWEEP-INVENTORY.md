# Link sweep inventory (read only, for Wednesday)

Made on 10th November 2026 by scanning every page and component (`app` and `components`) for links with no button or style class of their own. Nothing in the site was changed. It is the starting list for the sweep described in `docs/gemini-intake-plan-2026-11-08.md` ("Follow up to Phase 1D").

**What it counted:** 171 plain links in total. Not counted: the header menu, the footer and the app bar, because their containers already style their links, and anything that already has a button or tab class.

| Pile | Count | What to do |
| --- | --- | --- |
| Stands alone (the link is the whole line) | 50 | Make each a button or a plain bold navigation link |
| Title in a heading | 11 | Navy, no underline, underline only on hover and focus |
| Inside a sentence | 110 | Leave. Keep a thin underline (WCAG 1.4.1) |

This is a first pass by script, so treat it as close, not exact. A link split over several lines, or built from a variable, can be missed, and "stands alone" is decided from the text on the same line. Each line needs a look on Wednesday, with a before and after sketch for the ones that change.

## Stands alone: button or navigation link (50)

**`app/admin/found/page.tsx`**
- line 70: "Back to the overview" -> `/admin`

**`app/admin/reports/page.tsx`**
- line 60: "Open the job" -> `/jobs/${r.job_id`

**`app/blog/[slug]/page.tsx`**
- line 52: "All articles" -> `/blog`

**`app/blog/page.tsx`**
- line 34: "Read the article" -> `/blog/${p.slug`

**`app/candidate/applications/[id]/page.tsx`**
- line 35: "Back to my applications" -> `/candidate/applications`

**`app/candidate/page.tsx`**
- line 54: "My saved cover letters" -> `/candidate/letters`

**`app/claim/verify/page.tsx`**
- line 22: "Go to my dashboard" -> `/clinic`
- line 30: "Find jobs" -> `/jobs`

**`app/clinic/applications/[id]/page.tsx`**
- line 52: "Back to all applicants" -> `/clinic/jobs/${a.job_id`

**`app/clinic/jobs/[id]/applicants/page.tsx`**
- line 58: "Back to your dashboard" -> `/clinic`

**`app/clinic/jobs/[id]/ending/page.tsx`**
- line 60: "Back to your dashboard" -> `/clinic`

**`app/compare/page.tsx`**
- line 171: "ZipRecruiter" -> `ZIPRECRUITER_URL`

**`app/contact/page.tsx`**
- line 23: "hello@eyecarejobs.ca" -> `mailto:hello@eyecarejobs.ca`

**`app/error.tsx`**
- line 18: "Go to the home page" -> `/`

**`app/eye-care-jobs/page.tsx`**
- line 36: "……) : null}" -> `provinceHref(p)`
- line 44: "……) : null}" -> `/jobs?role=${encodeURIComponent(r.role)`

**`app/jobs/[id]/apply/page.tsx`**
- line 72: "Change these in my profile" -> `/candidate/profile`
- line 85: "Back to the job" -> `/jobs/${job.id`

**`app/jobs/[id]/claim/page.tsx`**
- line 51: "Back to the job" -> `/jobs/${job.id`

**`app/jobs/[id]/page.tsx`**
- line 52: "Back to all jobs" -> `/jobs`
- line 117: "Report this job" -> `/jobs/${job.id`

**`app/jobs/[id]/report/page.tsx`**
- line 23: "Back to the job" -> `/jobs/${job.id`

**`app/jobs/page.tsx`**
- line 144: "Start again with every job" -> `/jobs`
- line 184: "Browse eye care jobs by province and role" -> `/eye-care-jobs`

**`app/not-found.tsx`**
- line 18: "Go to the home page" -> `/`

**`app/privacy/page.tsx`**
- line 168: "Office of the Privacy Commissioner of Canada" -> `https://www.priv.gc.ca`

**`app/resources/ontario-job-ads/page.tsx`**
- line 82: "Ontario government: your guide to the Employment Standards A" -> `GUIDE`
- line 83: "Ontario Regulation 476/24, the rules and exemptions for job " -> `REGULATION`

**`app/resources/page.tsx`**
- line 90: "…" -> `l.url`

**`app/unsubscribe/[id]/page.tsx`**
- line 18: "Back to Kestrel" -> `/`

**`app/unsubscribe/address/page.tsx`**
- line 21: "Back to Kestrel" -> `/`
- line 36: "Back to Kestrel" -> `/`

**`app/waitlist/confirm/page.tsx`**
- line 20: "Back to Kestrel" -> `/`
- line 28: "Join the waitlist" -> `/#join`
- line 37: "Join the waitlist" -> `/#join`

**`components/AccountView.tsx`**
- line 21: "Back to my home" -> `home`

**`components/AdminNumbers.tsx`**
- line 35: "…" -> `/admin?period=${p.value`

**`components/AuthForms.tsx`**
- line 80: "Back to sign in" -> `/sign-in`
- line 112: "Forgot your password?" -> `/forgot-password`
- line 218: "Back to sign in" -> `/sign-in`

**`components/DirectoryTable.tsx`**
- line 56: "…" -> `https://${s.replace(/^https?:\/\//, "")`

**`components/EyeCareNumbers.tsx`**
- line 26: "…" -> `s.url`

**`components/FoundListingReader.tsx`**
- line 44: "… (opens in a new tab)" -> `l.url`
- line 83: "… (opens in a new tab)" -> `reading.url`

**`components/HomeBelowHero.tsx`**
- line 58: "privacy policy" -> `/privacy`

**`components/HomeBlogStrip.tsx`**
- line 23: "Read the article" -> `/blog/${feature.slug`
- line 30: "…" -> `/blog/${p.slug`
- line 36: "See all articles" -> `/blog`

**`components/LandingView.tsx`**
- line 101: "……) : null}" -> `l.href`
- line 108: "Browse eye care jobs by province and role" -> `/eye-care-jobs`

## Title in a heading (11)

**`app/blog/page.tsx`**
- line 32: "…" -> `/blog/${p.slug`

**`app/candidate/applications/page.tsx`**
- line 60: "…" -> `/candidate/applications/${a.id`

**`app/candidate/page.tsx`**
- line 70: "What you are looking for" -> `/candidate/profile#looking-for`
- line 93: "…" -> `/jobs/${j.id`
- line 118: "See all" -> `/candidate/applications`
- line 123: "…" -> `/candidate/applications/${a.id`

**`app/clinic/jobs/[id]/applicants/page.tsx`**
- line 91: "…" -> `/clinic/applications/${r.id`

**`app/jobs/[id]/claim/page.tsx`**
- line 88: "hello@eyecarejobs.ca" -> `mailto:hello@eyecarejobs.ca`

**`components/HomeBlogStrip.tsx`**
- line 21: "…" -> `/blog/${feature.slug`

**`components/JobCard.tsx`**
- line 12: "…" -> `/jobs/${j.id`

**`components/LaunchHome.tsx`**
- line 49: "See all jobs" -> `/jobs`

## Inside a sentence: leave as is (110)

Not listed one by one. They keep the thin underline from Phase 1D. The files with the most are:

- `app/resources/page.tsx`: 12
- `components/AuthForms.tsx`: 7
- `app/compare/page.tsx`: 5
- `app/terms/page.tsx`: 5
- `app/admin/found/page.tsx`: 4
- `app/privacy/page.tsx`: 4
- `components/LaunchHome.tsx`: 4
- `components/AdminNumbers.tsx`: 4
- `app/admin/page.tsx`: 3
- `app/resources/ontario-job-ads/page.tsx`: 3
