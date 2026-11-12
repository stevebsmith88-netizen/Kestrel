# How many taps to get started: candidates and clinics

Measured on demo.eyecarejobs.ca on 12th November 2026, at phone width (375 pixels), on the fastest path a real person would take. A "tap" is any click, tick, choice from a list or file pick. A "typed field" is any box the person types into. Scrolling is counted in screens (812 pixels on a phone). The audit accounts used were deleted afterwards.

**The live site adds 1 step the demo does not:** confirming the email address (leave the site, open the email, tap the link, come back). Whether the person then lands back on the job they were applying for could not be checked from here.

## Candidate: a stranger arrives on a job from Google and sends an application

| Screen | What the person does | Taps | Typed |
| --- | --- | --- | --- |
| 1. Job page | Quick Apply | 1 | |
| 2. Apply page (signed out) | Create account | 1 | |
| 3. Sign up | "Looking for a job" is already chosen. First name, last name, email, password; tick the terms; Create my account | 2 | 4 |
| (live only) Email | Open the email, tap the confirmation link | 2 | |
| 4. Apply page | "One thing first": Complete my profile | 1 | |
| 5. Profile | Scroll about 1.3 screens to the resume box; choose file (plus 1 or 2 taps in the phone's file picker); Upload; Read my resume; Save the ticked answers; Back to the job | 7 | |
| 6. Apply page | Scroll about 2.5 screens; tick "I agree the clinic can see this"; Send my application; then "Send without a note" when no note was written | 3 | |
| **Total** | | **15 (17 on the live site)** | **4** |

**6 screens**, about 4 screens of scrolling, and a trip to the email inbox on the live site.

**What works well already:** coming from a job, sign up skips the first step page and goes straight back to the job. "Read my resume" fills in the role, town and province in 1 go, so nobody types them. The second application onward is only 4 taps (Quick Apply, tick, Send, Send without a note).

**Where people are likely to drop out:**
1. The detour after sign up. The person wanted to apply, but lands on "One thing first", then a long profile page where the resume box is more than a screen down.
2. 3 separate buttons for the resume (Upload, Read my resume, Save the ticked answers) for what feels like 1 job.
3. On the apply page, the Send button is nearly 3 screens down on a phone, below the full list of details.
4. 2 extra taps at the very end: an unticked "I agree" box, and a second question if there is no cover note.

## Clinic: a clinic owner arrives on the home page and submits a first job

| Screen | What the person does | Taps | Typed |
| --- | --- | --- | --- |
| 1. Home | Post a job | 1 | |
| 2. For clinics | Create account | 1 | |
| 3. Sign up | Switch from "looking for a job" to "hiring for a clinic"; first name, last name, email, password; tick the terms; Create my account | 3 | 4 |
| (live only) Email | Open the email, tap the confirmation link | 2 | |
| 4. Dashboard | Create my clinic profile | 1 | |
| 5. Clinic profile | Clinic name, city, alert email (typed again, although it was given at sign up); type of employer; province; number of staff; tick "I am hiring directly"; Create my clinic profile | 7 | 3 |
| 6. Dashboard | Post a job | 1 | |
| 7. Post a job | Job title, lowest pay, highest pay, description; role; type of work; the 2 yes or no questions; Submit for review. City, province, "on site", "a year" and "through Kestrel" are already filled in | 7 | 4 |
| **Total** | | **21 (23 on the live site)** | **11** |

**7 screens**, plus the email trip on the live site. The ad builder replaces typing the description with typing a few lines and 1 tap.

**Where clinics are likely to drop out:**
1. Choosing "hiring for a clinic" at sign up, although they arrived from "Post a job". The sign up page can already open with it chosen; the For clinics page does not use that.
2. Typing their email twice (sign up, then "send applicant alerts to").
3. 2 trips back to the dashboard before they can post: after sign up, and after the clinic profile.
4. 2 separate agreement ticks (the terms at sign up, then "I am hiring directly").
5. "Number of staff", a required question that only Kestrel uses.

## What simpler would look like

Each change is small, needs no database change, and keeps every rule, answer and record Kestrel has today. The 2 marked "lawyer" change how consent is given, so they should go on the lawyer's list first.

### Candidate: from 15 taps and 6 screens to about 7 taps and 3 screens

| # | Change | Saves |
| --- | --- | --- |
| C1 | Put "Add your resume" on the apply page itself for a first application: pick the file, it is read straight away, and the role, town and province appear for a quick check. No detour to the profile | 4 taps, 2 screens |
| C2 | On the apply page, a short summary of what is sent with "See all details" to open it, so Send sits near the top on a phone | about 2.5 screens of scrolling |
| C3 | Drop the second "Send without a note" question. Keep the encouragement to write a note in the page | 1 tap |
| C4 | Replace the "I agree the clinic can see this" tick with a plain sentence above Send ("Sending shares this application with Harbourside Optical"). Lawyer | 1 tap |
| C5 | Switch on Google sign in at launch (already built). It replaces all 4 typed fields and the email confirmation | 4 typed, 2 taps |
| C6 | Make sure the email confirmation link returns the person to the job they were applying for | the person does not get lost |
| C7 | 1 name field instead of first and last? Not recommended: clinics expect both, and the saving is small | |

### Clinic: from 21 taps and 7 screens to about 13 taps and 5 screens

| # | Change | Saves |
| --- | --- | --- |
| K1 | "Post a job" and the For clinics page open sign up with "hiring for a clinic" already chosen | 1 tap |
| K2 | Fill in the alert email with the sign up email (they can change it) | 1 typed |
| K3 | After the clinic profile, go straight to the Post a job form | 1 tap, 1 screen |
| K4 | Go straight from sign up to the clinic profile, with no stop on the empty dashboard | 1 tap, 1 screen |
| K5 | Make "number of staff" optional, or ask it later on the dashboard | 2 taps |
| K6 | Fold "I am hiring directly" into the sign up tick for clinics ("I agree to the terms and posting policy, and I am hiring directly"). Lawyer | 1 tap |
| K7 | Fill in the job title from the role chosen ("Optician"), which the clinic can change | 1 typed |
| K8 | Google sign in at launch, as C5 | 4 typed, 2 taps |

## Suggested order

1. **C1, C2, C3, K1 to K5, K7** in 1 branch. Claude, about 1 day. No SQL, no settings, nothing for the lawyer.
2. **C4 and K6** go on the lawyer's list (consent wording), then are built.
3. **C5, K8** at launch: switch on `ENABLE_GOOGLE_SIGNIN` in the live project.
4. **C6**: check the confirmation email on the live site once the network allows it, and fix if it loses the job.
