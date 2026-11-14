# Design: team members, several locations, and admin support (14th November 2026)

For Steve to approve before any SQL is written. This changes **who can see applicants' resumes**, the most private data Kestrel holds, so the access rules are settled here first and then tested against a real database (`npm run test:db`) before Steve gets the SQL.

## How it works today

1 sign in owns 1 clinic (`employers.owner_id`, 1 per person). Every clinic permission in the database (26 rules) asks 1 question: "does this person own this clinic?" (`owns_employer`).

## What changes

### Team members (phase A, first)

- A new list of **members** for each clinic, with 3 levels:

| Level | Profile and team | Post and edit jobs | See applicants and resumes | Move applicants (shortlist, interview, decline) |
| --- | --- | --- | --- | --- |
| Owner | Yes | Yes | Yes | Yes |
| Can post and see applicants | No | Yes | Yes | Yes |
| Can see applicants only | No | No | Yes | No (can read, and add private notes) |

- The owner is added to the list automatically, so today's clinics keep working unchanged.
- Every database rule changes from "owns this clinic" to "is a member at this level". The tests check each level against each table, including that a member removed from a clinic loses access at once.
- **Inviting:** My clinic, Team: name, work email, level, Send invite. Kestrel emails a code and a link. The code works once, only for that email address, for 14 days. On sign up, "I have an invite code" opens a box; the link fills it in. Someone who already has an account signs in and enters the code on their dashboard.
- **Limits:** up to 10 members a clinic (more by asking Kestrel). The owner can remove anyone, and can hand ownership to another member (the old owner becomes "Can post").
- Applicant emails (new applicant alerts) still go to the clinic's alert address, not to every member.

### Several locations (phase B)

- 1 person can own several clinics. The 1 per person limit is removed.
- **My clinic, Locations:** add a location (name, town, province, About; the website fill works here too). Each location has its own public page and its own jobs.
- When someone belongs to more than 1 location, the dashboard has a **location picker** at the top, and "All locations" shows every job together.
- Team members are invited to chosen locations (tick boxes, all ticked by default).
- The Group pass and the "1 pass, 1 location" rule are applied when checkout is built; the locations themselves come first.

### Admin support (with phase A)

Steve's question: a way to help a clinic that is stuck. Proposed **Admin, Clinics**:
- Search by clinic name, town or email. Open a clinic to see its profile, locations, team, open invites and jobs.
- Fix things for them: edit the profile, resend or cancel an invite, remove a member, change the owner (only after an email from a published clinic address), and post a job for them (already built at Admin, Post for a clinic).
- **No "sign in as the clinic".** That would show Kestrel staff every applicant's resume, which the privacy policy does not cover and the clinic did not ask for. Admin sees applicant counts only, never resumes.
- Every admin change is saved in a log (who, what, when, why), and the clinic gets an inbox message ("Kestrel updated your profile at your request").

## Decisions for Steve

1. **"Can see applicants only":** read and add private notes, but no status changes (suggested). Or allow moving applicants too?
2. **Team members and locations:** owner ticks which locations each person sees, all ticked by default (suggested)?
3. **Team size:** 10 a clinic, free (suggested)?
4. **Admin:** edit tools with a log and no "sign in as" (suggested)?

## Build order and SQL

- **Phase A:** members, invites, the Team page, the invite code on sign up, Admin, Clinics, and the log. 1 migration (0045), run on both databases.
- **Phase B:** several locations, the picker and the Locations page. 1 migration (0046).
- Each phase keeps working on a database that has not had its SQL yet (the site falls back to today's 1 owner rule), and each comes with the whole combined SQL file.
- The privacy policy gets 1 line in phase A: team members a clinic invites can see applications to that clinic.
