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

## Research coverage (as of 1st November 2026)

The 7 research areas Steve was asked about earlier, and what the repository holds for each. "Built" means the board itself, not the answer to the research question.

| Area | Status | What exists, and what is missing |
| --- | --- | --- |
| 1. Industry landscape | Partly covered | docs/market-sizing.md has workforce, practice and independent share figures, at low to medium confidence because the primary sources were blocked. Missing: the Ontario optometry college, the OAO, and labour outlook reports. |
| 2. Workforce demand and supply | Partly covered | Job Bank hiring signals and regional shortages are in the sizing doc. Missing: international recruitment and training pipelines. |
| 3. Regulatory and licensing | To do | Nothing on overseas conversion routes, exams or visas. The NACOR and PLAR route for opticians appeared in the AI research and is unverified. |
| 4. Competitors and employers | To do | No analysis of which chains hire consistently, how they recruit, or which agencies are active in Canada and what they offer. Hand review of public pages only. No scraping. |
| 5. Compensation and benefits | To do | No benchmark yet. Every Kestrel post carries a pay range, so Kestrel builds its own data after launch. |
| 6. Market trends | To do | Myopia, AMD and technology demand are not addressed. Suited to the blog. |
| 7. Networking and primary research | Partly covered | Steve's weekly job counts (docs/market-count-sheet.xlsx) are real primary data. Conferences, LinkedIn and Waterloo are not started. |

## Open questions raised so far

Each question has the context it came from. Status is open unless stated.

### Strategy

1. **Is the agency a real plan?** Answered: a long term option, not a current plan.
2. **Does the agency idea belong in the Eye Recommend disclosure conversation?** Steve will not raise it for now. The conflict of interest stays open: Steve works full time at a buying group serving independent optometry, and a paid placement service for the same clinics could be read as a conflict. Revisit, with advice, before any Stage 2 or 3 step.
3. **What is Zest's role?** Steve has emails and a set of research questions from Zest. If Zest is a UK agency looking at Canada, any overseas recruiting raises immigration and licensing rules (question 12). Their emails have not been added. Check none of it comes from Eye Recommend before adding anything.
4. **Does the UK model carry over to Canada?** UK optical agencies show demand for specialist recruitment. But the UK is more consolidated, with a few large chains placing many hires, while Canada has many small buyers placing 1 or 2 each. The UK figures are inconsistent (the text says the UK market is about double Canada's, its table says about triple) and unsourced.
5. **What would the positioning, value proposition and USP be for an agency?** Raised in the earlier research questions. Not worked on, and not needed unless the option becomes real.

### Legal and compliance (for the lawyer)

6. **When does a job board become a licensed recruiter?** The research says pure advertising boards are exempt and finding someone a job for a fee is not. Does the "Find your fit" quiz, a "recommended candidates" list, or sending candidates to a clinic change the answer?
7. **What consent wording is valid for a talent matching opt-in?** Under PIPEDA, CASL and (if Quebec is in scope) Law 25. The research asks for an unticked, optional gate, which fits Kestrel's view. A required consent at signup is not voluntary.
8. **Can board data be used for placement later?** Only if the purpose is clear at the point of collection. This decides whether the Stage 1 opt-in must be built early.
9. **One company or two?** The research suggests a separate company for the agency, so liability and the board's data stay apart. Needs a lawyer and an accountant, and should be settled before the agency holds any candidate data.
10. **What are Quebec's permit and French language requirements?** The research attributes recruiter rules to the CNESST, which is unconfirmed. Quebec listings would need French versions.
11. **What duties come with placing a licensed professional?** Checking registration and disciplinary history. The research warns of negligent credentialing claims.
12. **What rules apply to recruiting from overseas?** Immigration and visas, and any rules on fees charged to foreign workers. Not researched.
13. **Is a locum marketplace a temporary help agency?** A board listing locum shifts is different from a platform that arranges and pays locums. The second can fall under temporary help agency rules.
14. **Do rebates and charging structures meet Canadian trading law?** Raised in the earlier questions. Kestrel's pricing ladder is decided. Any rebate or discount tied to Eye Recommend members belongs in the disclosure conversation.

### Product

15. **Widen the profession list?** Kestrel uses 5 professions. The research proposes 7, adding Contact Lens Fitter, COA/COT and optical lab technician as separate titles.
16. **Add structured benefits fields?** College fee reimbursement, relocation and sign-on bonuses, as optional fields and search filters. Small board feature, not agency work.
17. **Add locum or relief availability and billing software experience to candidate profiles?** Useful as clinic search filters now. Software would be a fixed list (Visual Eyes, Wink, Acuitas, Telus Health eClaims).
18. **When to build the talent matching opt-in and consent log (Stage 1)?** Cheap, helps CASL today, keeps the agency door open. Needs Steve's go-ahead and SQL on both databases.
19. **Collect licence numbers?** Current view: no, except from candidates who opt in to matching, and only after the lawyer agrees.
20. **Enforce pay transparency by province?** The research suggests it. Kestrel already requires a pay range on every post in every province, which is stricter. Recommendation: leave as is.

### Market and data

21. **How often do clinics really hire?** The most important unknown in the plan. The sizing doc shows a cautious case (0.3 to 1.6 roles per practice a year) and a higher turnover case (0.7 to 2.9). Steve's weekly counts and Kestrel's first months of traffic will show which.
22. **Are the market figures right?** The sizing doc could not open Statistics Canada, the Canadian Association of Optometrists or ISED pages. Verify each figure against the source.
23. **Who hires consistently, and how do they recruit?** Chains against independents, and which agencies are active in Canada with what offer. Area 4 above.
24. **What do roles pay?** A benchmark before launch. Area 5 above.
25. **Which trends shape demand?** Myopia management, AMD and technology. Area 6 above, and blog material.
26. **Who should Steve talk to?** Practice owners, conferences (Vision Expo, OAO), LinkedIn and optometry forums, and the Waterloo optometry school. Use no Eye Recommend contacts or lists.
27. **How do overseas professionals get into practice?** Areas 2 and 3 above. Linked to question 12.
