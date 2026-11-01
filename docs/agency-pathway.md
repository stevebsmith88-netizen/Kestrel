# Agency pathway: a long term option

Status: an option only. Nothing in this document is built, and nothing here is scheduled.
Decided by Steve on 1st November 2026.

## Decisions on record

1. The recruitment agency is a long term option, not a current intention. It does not change the launch plan or the audit phases.
2. Steve will not raise the agency idea in his Eye Recommend disclosure conversation for now. The open point is that Steve works full time at a buying group that serves independent optometry, and a paid placement service aimed at the same clinics could be read as a conflict. That is Steve's call to revisit. It must be revisited, with advice, before any agency step in Stage 2 or 3 below.
3. This file is where the thinking is kept, so it does not clutter docs/PLAN.md.

## Where the ideas came from

A chat with an AI assistant, a PDF summary of it, and its summaries of Reddit threads. None of it has been checked against the law or the original threads. Treat every legal figure (fees, the $25,000 letter of credit, which body licenses what in Quebec) as unverified until a Canadian employment lawyer confirms it.

## What stays true today

- Kestrel is a job board. The terms and the posting policy say Kestrel is not an employer, recruiter or employment agency, and they bar agencies from posting or contacting candidates. That is part of the pitch to clinics.
- No scraping of Indeed, LinkedIn, Jobs4ECPs or college registers. Seeding uses clinics' own careers pages only.
- No Eye Recommend data, lists, accounts or branding, ever.
- A candidate's profile is private. A clinic sees only what a candidate sent with an application.

## Stages

### Stage 0: now

Build nothing for the agency. Keep the board honest, because the trust it earns is the asset.

Already useful for a later move, and already in the plan: the fixed profession list, licensed provinces, the keep my details consent on applications, admin numbers, and the locum board listed as a later feature.

### Stage 1: cheap preparation (only when Steve chooses)

These cost little, help the board on their own, and keep the door open.

- **Talent matching opt-in.** One optional setting on the candidate profile, off by default, never required to sign up or apply. Save the date and time, and the exact wording shown, with a wording version. Follow the pattern of the terms record in migration 0018.
- **Consent log.** One table recording who agreed to what, whether it was express or implied, when, and which wording. This also serves CASL for alerts and newsletters today.
- **Locum or relief availability** and **billing software experience** (Visual Eyes, Wink, Acuitas, Telus Health eClaims) as fixed lists on the candidate profile. They work as search filters for clinics now.
- **Posting frequency per clinic** from the existing admin numbers. No new data collected.

Every SQL change here runs on both databases (live and demo), and any new setting goes in both Vercel projects.

### Stage 2: before any agency step

None of this is for Claude to decide. It needs Steve, a lawyer and an accountant.

- Get advice on conflict of interest with Eye Recommend, and have the disclosure conversation if the option becomes real.
- Decide the structure. The research suggests a separate company for the agency, so liability and the board's data stay apart. Set it up before the agency holds any candidate data.
- Confirm provincial licensing for each province Kestrel would place in, and what the bond or security costs.
- Rewrite the terms, the posting policy and the privacy policy. Tell clinics and candidates before anything changes.
- Review the "Find your fit" quiz and any matching or ranking features, so they do not cross the line from advertising into finding someone a job for a fee.
- Work out pricing for placement fees, replacement guarantees and payment terms.

### Stage 3: build (only after Stage 2)

- An applicant tracking system, or an export of matching opt-in candidates into one.
- Admin only verification fields: licence verified, date, regulatory body. Collected only from candidates who opted in.
- Provincial licence number format checks, if the lawyer agrees collecting the number is justified.
- Invoicing for large placement fees (Stripe invoices or bank transfer), separate from the self serve checkout.
- Quebec: French versions of listings and data fields, if Quebec is in scope.

## Questions for the lawyer

1. In Ontario and each other province, at what point does a job board become a licensed recruiter? Does a rules based matching quiz, a "recommended candidates" list, or a clinic being sent candidates change the answer?
2. What wording makes the talent matching opt-in valid under PIPEDA, CASL and (if Quebec is in scope) Law 25?
3. Can data collected for the board be used for placement later, if the opt-in is clear at collection?
4. One company or two? Which tax and liability points apply?
5. What are Quebec's permit and French language requirements for a board that lists Quebec jobs?
6. What duties come with placing a licensed professional (checking registration, disciplinary history)?

## Things we will not do

- A bundled consent at signup ("agree to the terms and to be contacted about placement").
- Collecting licence numbers from everyone at signup.
- Scraping job sites or college registers to build a candidate pool.
- Using any Eye Recommend clinic, contact or list for agency outreach.
