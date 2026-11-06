# Accessibility pass, 6th November 2026

What was checked, what was found and what is left. Audit item R37 (required fields, focus after a mistake) had already been fixed in Phase 2A: `components/Field.tsx` passes `aria-required`, the star is explained at the top of long forms, and `components/focus-problem.ts` moves focus to the first problem after a send.

## Automatic scan (axe-core, WCAG 2.2 AA and best practice)

17 public pages, on a phone width (390 px) and a desktop width: home, jobs, 2 job pages, apply, clinics, sign in, sign up, forgot password, privacy, terms, posting policy, find your fit, blog, a blog post, contact and report a job.

- Found: 1 issue. The call to action box on blog posts was an `aside` inside the article, which breaks the page landmark rules. Changed to a labelled section (`app/blog/[slug]/page.tsx`).
- After the change: no violations on any page at either width, including colour contrast and touch target size.

## Checked by reading the code

- Page language is set (`en-CA`), and zoom is not blocked.
- A "Skip to main content" link exists. Keyboard focus shows a 3 px ring on links, buttons, fields, summaries and radio choices.
- Motion is switched off for people who ask for reduced motion, including the number count up.
- Sign up, sign in, profile and clinic forms carry the right `autocomplete` values.
- Error messages are announced (`role="alert"`) and linked to their field.

## What was not checked, and why

Automatic checks find roughly a third to a half of real problems, so this is a good start and not a pass certificate.

- **Signed in pages** (post a job, the applicants board, candidate profile, the dashboard, admin) need a signed in session, which this environment does not have. Steve can run the free Lighthouse accessibility check in Chrome (open the page, DevTools, Lighthouse, Accessibility) on the demo site, on those pages, and send the results.
- **A screen reader and keyboard only run through** of the 3 main journeys (apply for a job, post a job, track an application). Worth doing once with VoiceOver on the phone before launch.
- **Text size at 200%** and **high contrast mode** were not tried by eye.
- The lawyer pack could ask whether Ontario's accessibility rules (AODA) apply to a business of this size once it is incorporated.
