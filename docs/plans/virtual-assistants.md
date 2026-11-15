# Virtual assistant logins (plan, 15th November 2026)

Status: draft for Steve to approve. Nothing is built. This is item 6 in `CLAUDE.md`, step 8 of the order of work.

## What Steve wants the VA to do (decided 15th November 2026)

1. **Found listings.** Enter job facts by hand, in Kestrel's own words, from a clinic's own careers page, with a link to the clinic's application page (Admin, Found listings). Saved as drafts. Publishing stays with Steve and stays off (`ENABLE_SEEDING`).
2. **Find who is hiring.** Read Indeed by hand, only to see which clinics are hiring and who to contact (the exception Steve agreed on 8th November 2026). Nothing is copied from Indeed, and no Indeed link or text is saved anywhere in Kestrel.
3. **Outreach to clinics, later.** Phone calls and, in future, sending the outreach emails. Stays out of reach until Steve confirms his disclosure conversation has happened.

## What a VA can never see or do

Resumes, applicants, candidate profiles, applications, payments, Stripe and every key, clinic teams and settings, support requests and feedback, the waitlist and its email addresses, the Do not email list contents, inbox messages, and "Clinics" in Admin. No "sign in as". No approving or publishing a job or a claim. A VA is not an admin: the admin role stays as it is.

## How it works

**A new role, `assistant`, with a list of areas.** Today a profile is candidate, clinic or admin. Add the role `assistant` and a column `assistant_areas` (a list such as `found`, `leads`, `calls`, `outreach`). Steve ticks the areas per person, so a new VA starts with `found` and `leads` only and areas are added later without new code.

**Every VA page and action checks its area on the server.** One helper (`requireArea("found")`) is the only way into a VA page or action, the way `requireRole` works today. Most Admin actions write with the server key, so the check lives in code, with tests that prove an assistant is refused on every admin page and action outside the areas (`lib/assistant-access.test.ts`, plus an added case in the scripted access tests, `npm run test:db`). Database rules also deny an assistant any read of the sensitive tables.

**Own pages, not the admin pages.** An assistant never opens `/admin`. They get `/assistant` with a small menu showing only their areas (this is the VA menu in item 18):

- Dashboard: their to do list and today's counts.
- Found listings: the same reader and save as drafts form, with a Save as draft button and no Publish.
- Hiring leads: a simple log (below).
- Calls (later): the call list and log.
- Outreach (later): prepare batches and stop a sequence.

**Everything is logged.** A new table `assistant_actions` (who, when, area, what, which record) is written by every VA action and shown to Steve at Admin, People, Assistants, with a filter by person and day. The VA cannot read or change it.

**Sign in.** Steve invites a VA from Admin (a one time ticket, since sign up needs Kestrel's ticket, migration 0041). Email and password, with a second step (an authenticator code) required before any VA page opens. Steve can switch a VA off in 1 click, which ends access at once and keeps the log.

## Hiring leads (the Indeed exception, kept clean)

A VA records, per clinic: name, town, province, the role it seems to be hiring for, and the date. **Where the contact comes from matters.** Indeed only tells the VA who is hiring. The contact name and address saved must come from the clinic's own website (a published hiring or business address), because that is what CASL's implied consent rests on (`docs/casl-outreach.md`). The form therefore asks for the clinic's own page where the address is published, and refuses an address typed without one. The lead's "where found" field offers only "clinic's own site" or "phone call", never "Indeed", and the form refuses web addresses from indeed.com, linkedin.com, and the other boards. Leads join the existing province search leads list (`app/admin/found/leads.csv` shows the shape), so Steve sees 1 list.

## Outreach later: phone and email

**Calls.** A call list (clinics with a published phone number and a lead), then a log: date, who answered, outcome (not interested, send me info, call back on, wrong number, asked not to be contacted), and a note. Calls are to businesses about a business role only, and the VA never takes or writes down a personal number. "Asked not to be contacted" adds the clinic to the Do not email list at once (by domain) and to a call suppression list kept on our side. Rules for phone calls to businesses (identification, calling hours, an internal do not call list) need the lawyer's check. Kestrel has no lawyer yet, so this is raised in `docs/legal/Kestrel-legal-and-setup-plan-2026-11-12.pdf` first. A short script, written by Steve, is kept in `docs/marketing/`.

**Email.** Steve chose that the VA can eventually send. Recommended shape, which Steve can change:

- The VA **prepares** a batch (clinics with a published address, the page it came from and the date found) and **queues** it.
- **Steve releases the batch**, as today (`docs/casl-outreach.md` says adding a batch is his approval). Release can later pass to a trusted VA by ticking a separate area, `outreach_release`, once the process has run cleanly for a while.
- The daily job sends only while `ENABLE_OUTREACH` is "yes" and within `OUTREACH_DAILY_LIMIT`, so the VA never presses "send" on an individual email.
- A VA can stop a sequence by hand when a clinic replies.

Nothing in the outreach area is switched on for any VA before Steve confirms the disclosure conversation.

## SQL (both databases, one numbered file)

- `profiles.role` accepts `assistant`; `profiles.assistant_areas text[]`; `profiles.disabled_at`.
- `assistant_actions` (row level security on, no access for anyone but the server key).
- Hiring leads: either new columns on the existing leads table or `hiring_leads` (decided when building, after reading the leads table).
- Later, with calls: `call_log` and `call_suppressions`.
- Everything reads on a database without the new SQL, as for earlier migrations, and the combined run file is handed to Steve whole.

## Build order, with a stop for Steve's review after each

1. **A. Role, guard, log, invite and switch off,** with the VA menu and a Dashboard. Includes Admin, People, Assistants.
2. **B. Found listings for a VA** (save as draft only), then **Hiring leads.**
3. **C. Calls**, after the lawyer has looked at the phone rules.
4. **D. Outreach prepare and queue**, after the disclosure conversation.

Steve gets a preview link showing what a VA sees after A and B (the preview uses the demo database), plus a screenshot set.

## Questions for Steve

1. Where will the VA work from (Canada or another country)? Clinic contact details are mostly business information, but it affects the privacy policy, and nothing about resumes or candidates is ever visible to them.
2. One VA or several? The plan allows several, each with their own login and log.
3. Do you agree with releasing every outreach batch yourself at first (recommended)?
4. Will the VA use their own browser and device? The logins assume so.
