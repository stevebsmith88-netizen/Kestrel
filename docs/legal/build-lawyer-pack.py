#!/usr/bin/env python3
"""Builds docs/legal/Kestrel-lawyer-review-pack.html from the brief below plus the pages and documents it quotes.
Run from the repository root after `npm run build`, with the site running on port 3189:
  PORT=3189 npm start &   then   python3 docs/legal/build-lawyer-pack.py   then   node docs/legal/render-pdf.mjs
"""
import html, os, re, urllib.request

# PACK=full (default), business (no employment content, for a business, privacy and technology reviewer) or employment (Part A only)
PACK = os.environ.get("PACK", "full")

def page(path):
    raw = urllib.request.urlopen(f"http://127.0.0.1:3189{path}").read().decode()
    body = re.search(r"<main[^>]*>(.*?)</main>", raw, re.S).group(1)
    body = re.sub(r"<!-- -->", "", body)
    return body

def md(text):
    """A very small markdown reader: headings, bold, lists and paragraphs. Enough for docs/breach-plan.md."""
    out, in_list = [], False
    for line in text.splitlines():
        line = line.rstrip()
        inline = lambda s: re.sub(r"`([^`]+)`", r"<code>\1</code>", re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html.escape(s)))
        if re.match(r"^\s*[-*] ", line):
            if not in_list: out.append("<ul>"); in_list = True
            out.append(f"<li>{inline(re.sub(r'^\s*[-*] ', '', line))}</li>")
            continue
        if in_list: out.append("</ul>"); in_list = False
        if not line: continue
        h = re.match(r"^(#{1,3}) (.*)", line)
        if h: out.append(f"<h{len(h.group(1))+1}>{inline(h.group(2))}</h{len(h.group(1))+1}>"); continue
        if line.startswith("|"): continue
        if line.startswith(">"):
            quoted = line.lstrip("> ").strip()
            if quoted: out.append(f'<p style="margin-left:14pt;color:#5A6672;">{inline(quoted)}</p>')
            continue
        out.append(f"<p>{inline(line)}</p>")
    if in_list: out.append("</ul>")
    return "\n".join(out)

terms, posting, privacy = page("/terms"), page("/posting-policy"), page("/privacy")
breach = md(open("docs/breach-plan.md").read())

def q(n, text, why=""):
    return f'<li value="{n}">{text}{f"<span class=why>{why}</span>" if why else ""}</li>'

CSS = """
@page { size: Letter; margin: 0.8in 0.8in 0.9in 0.8in; }
body { font-family: Georgia, 'Times New Roman', serif; color: #1B2B4B; font-size: 10.5pt; line-height: 1.5; }
h1 { font-size: 24pt; margin: 0 0 4pt; }
h2 { font-size: 15pt; margin: 22pt 0 6pt; border-bottom: 1px solid #D8B48A; padding-bottom: 3pt; break-after: avoid; }
h3 { font-size: 12pt; margin: 14pt 0 4pt; break-after: avoid; }
h4 { font-size: 10.5pt; margin: 10pt 0 2pt; }
p { margin: 0 0 7pt; } ul, ol { margin: 0 0 8pt; padding-left: 20pt; } li { margin-bottom: 4pt; }
table { border-collapse: collapse; width: 100%; margin: 6pt 0 12pt; font-size: 9.5pt; break-inside: auto; }
th, td { border: 1px solid #C9CED3; padding: 4pt 6pt; vertical-align: top; text-align: left; } th { background: #F7F1E6; }
tr { break-inside: avoid; }
.cover { padding-top: 90pt; } .cover .kicker { color: #A4502C; letter-spacing: .12em; text-transform: uppercase; font-size: 10pt; font-family: Helvetica, Arial, sans-serif; }
.cover p { font-size: 12pt; } .meta { color: #5A6672; font-size: 10pt; }
.box { border: 1px solid #D8B48A; background: #FBF8F2; padding: 8pt 10pt; margin: 8pt 0 12pt; break-inside: avoid; }
.fill { background: #FFF6D6; border: 1px dashed #A4502C; padding: 1pt 4pt; font-family: Helvetica, Arial, sans-serif; font-size: 9.5pt; }
.why { display: block; color: #5A6672; font-size: 9.5pt; margin-top: 2pt; }
.pb { break-before: page; }
.appendix main, .appendix .wrap { max-width: none; }
.appendix .notice { border: 1px solid #A4502C; padding: 6pt 8pt; background: #FFF6EE; }
code { font-family: Menlo, Consolas, monospace; font-size: 9pt; }
.small { font-size: 9pt; color: #5A6672; }
a { color: #8C4024; }
"""

BRIEF = f"""
<div class="cover">
  <p class="kicker">Confidential. Prepared to obtain legal advice.</p>
  <h1>Kestrel Eye Care Jobs</h1>
  <p style="font-size:16pt;margin-bottom:18pt;">Legal review pack</p>
  <p>For a fixed fee review meeting. Everything that needs a lawyer's eyes is in this one document: what the business is, the questions in order of priority, and the documents themselves.</p>
  <p class="meta">Prepared on 31st October 2026 by Steve Smith, founder, from an audit of the website and its code carried out on 30th October 2026. Updated on 12th November 2026 with a page on what has changed since 5th November 2026 and 4 new questions (Part H), from a second audit.<br>
  The legal references in this pack are an AI assistant's reading and were not checked by a lawyer. Where it is unsure, it says so. Please verify them.</p>
  <div class="box"><strong>How to use this pack.</strong> Part 1 is the plain summary. The page after it lists what has changed since 5th November 2026. Parts A to H are the 45 questions, numbered, in the order I would like to cover them. If time is short, Parts A and B come first because they decide the launch date, and C to H can follow by email. The two background sections after Part H describe what the site collects and what has already been decided. The appendices are the policies exactly as they are published today, the breach plan, the consent wordings and the email list.</div>
</div>

<h2 class="pb">Part 1. The business in one page</h2>
<p><strong>What it is.</strong> Kestrel Eye Care Jobs (eyecarejobs.ca) is a self serve job board for Canadian eye care: optometrists, opticians, optometric assistants and technicians, practice managers, patient care teams and, later, supplier representatives and locums. Independent and corporate practices post side by side. Candidates search free; clinics pay to post.</p>
<p><strong>Where it stands.</strong> Not launched. A "coming soon" page with a waitlist is public. Accounts, job posting, applications, an admin review queue and an AI job ad writer are built and tested, but only with my own test accounts. There are no real users, no payments and no outreach to clinics. Clinic sign up is by invitation only until launch. Target: a free launch in January 2027 at the earliest, only after the matters in Part A are settled. A blog is being written to build search ranking over time.</p>
<p><strong>The people.</strong> I am the only founder and the only person with access. I work full time for another organisation (see Part A). I am not a developer: the software is written by an AI coding assistant at my direction, and I review and approve it.</p>
<p><strong>Money.</strong> Free launch for 30 to 60 days, then introductory prices of $39 (support staff), $49 (opticians) and $59 (optometrists) per 30 day post, then $79 a single post or $199 a month for a clinic pass (up to 5 live posts), with an annual option of $1,990. Prices are before HST. Payments (Stripe) are not built yet. Target revenue is $150,000 a year in 18 to 24 months, on running costs under $10,000 a year.</p>
<p><strong>What the product promises that has legal edges.</strong> Every post must show a pay range (no more than $50,000 wide unless the top is over $200,000), say yes or no to "existing vacancy" and to "uses AI to screen candidates", and must not require "Canadian experience". Candidates apply through Kestrel; clinics see an application only after the candidate sends it. Later, Kestrel may list jobs it finds on clinics' own careers pages (labelled "found on the clinic's website, not yet claimed"), expire them after 21 days, and invite the clinic to claim them. That outreach is switched off.</p>

<h3>Who handles what</h3>
<table>
<tr><th>Provider</th><th>What it does for Kestrel</th><th>Personal information it handles</th><th>Where</th></tr>
<tr><td>Supabase</td><td>Database, sign in, stored resumes</td><td>Accounts, profiles, applications, resumes, waitlist</td><td>Canada (Canada Central)</td></tr>
<tr><td>Vercel</td><td>Hosts the website and runs the server code</td><td>Everything that passes through a page or form</td><td>Server functions run in Montreal (set on 31st October 2026). The content delivery network is global</td></tr>
<tr><td>Resend</td><td>Sends email (sign up confirmations, alerts, application updates)</td><td>Recipient email address, message content</td><td>United States. Resend states that account data and logs are stored in the US whatever sending region is chosen</td></tr>
<tr><td>Anthropic</td><td>AI that drafts job ads for clinics</td><td>Only the job details a clinic types in; never candidate information</td><td>United States</td></tr>
<tr><td>Cloudflare</td><td>"Turnstile" bot check on forms</td><td>Browser signals</td><td>Cloudflare's global network</td></tr>
<tr><td>Google</td><td>Staff email (Workspace); optional "Continue with Google" sign in</td><td>Emails to hello@ and privacy@; sign in details</td><td>Google's data centres (not a Canada only service)</td></tr>
<tr><td>Namecheap</td><td>Domain registration</td><td>Registrant details (mine)</td><td>n/a</td></tr>
</table>
<p class="small">I have accepted each provider's data processing terms. Stripe will be added at paid launch.</p>

<h2 class="pb">What has changed since 5th November 2026</h2>
<p>Everything below is built. Nothing has launched: there are still no real users, no payments and no outreach to clinics. Items marked "switched off" exist in the code but are off in the live settings, so nobody is affected by them today. The questions that come out of this page are in Part H (questions 42 to 45).</p>
<table>
<tr><th>What</th><th>In plain English</th><th>Status</th></tr>
<tr><td>Resume reading on Kestrel's own server</td><td>A candidate can press "Fill in from my resume". Kestrel's own server reads the text of that one PDF or Word file with fixed rules, to suggest answers for the profile. No AI and no other service is involved, the text is not kept, and nothing is saved unless the candidate ticks it and saves. It reads PDF and Word files only, up to 3 MB, with limits on pages and time. It runs on Vercel's servers. The provider table in Part 1 says those run in Montreal (set on 31st October 2026); that setting has not yet been confirmed in the Vercel dashboard.</td><td>Live for accounts</td></tr>
<tr><td>The inbox</td><td>Messages from Kestrel to a signed in person inside their account (for example an update on an application), with a read and unread mark. They are kept until the account is deleted. How long they should be kept has not been decided.</td><td>Live for accounts</td></tr>
<tr><td>"Where are you in eye care"</td><td>An optional answer on a candidate's first step page: working in eye care now, studying or training, or not working in eye care yet. It is private to the candidate and is not part of an application.</td><td>Live for accounts</td></tr>
<tr><td>A 30 day hold on changing a name</td><td>After a person changes their name on the account page, they cannot change it again for 30 days unless they write to us. The date of the last change is stored. The aim is that a clinic does not see the same applicant arrive under different names. An application keeps the name used when it was sent.</td><td>Built; needs one database update that has not been run yet</td></tr>
<tr><td>First week emails</td><td>Up to 3 welcome emails for new accounts, on days 1, 3 and 7, with tips on getting started.</td><td>Built, switched off. Nobody is sent them</td></tr>
<tr><td>Pay as a percentage, a guaranteed minimum, or a daily rate</td><td>For optometrist jobs only, a clinic may give pay as a percentage range (up to 10 percentage points wide) of production, collections, billings or exam fees, instead of or as well as dollars. Any dollar figure may be marked as a guaranteed minimum, and optometrist jobs may use a daily rate up to $200 wide. A line with a percentage only and no dollar figure is accepted. "Negotiable" on its own is never accepted.</td><td>Built; applies to every new post</td></tr>
<tr><td>Job view and Apply click counts</td><td>Kestrel counts, for each job and each day, how many times the page was viewed and how many times Apply was pressed, so clinics can see how a post is doing. There are no cookies and the counts do not record who the visitor is.</td><td>Live</td></tr>
<tr><td>Recommended for you, and the private preferences behind it</td><td>A rules based list on a candidate's home page (no AI). It uses private choices the candidate makes: home town and province, how far they would travel, provinces, types of work and other roles they would consider, the lowest pay they would accept, a preference for an independent or a corporate practice, and jobs they mark "Not interested". Clinics never see any of these. They are included in the candidate's data download.</td><td>Live for accounts</td></tr>
<tr><td>The found listings reader and the province search</td><td>Two admin only tools. The reader uses Anthropic's AI to read one page of a clinic's own public careers website and turn it into a draft listing. It refuses job boards and colleges, and obeys the site's robots rules. The province search uses AI web search to find clinics that appear to be hiring, and saves the clinic's published contact email and where it was found. Both send public pages and search text to Anthropic, and never any candidate information. Nothing they find is published, and nobody is contacted from them.</td><td>Built, with publishing and outreach switched off</td></tr>
<tr><td>The price comparison page</td><td>A public page at /compare that names competing job boards (Jobs4ECPs, OJobs, Eluta, Indeed, LinkedIn and ZipRecruiter) with their published prices, read by hand from their public pages and dated. It also says Kestrel needs no credit card to post during the free launch.</td><td>Live since 6th November 2026</td></tr>
</table>
<p class="small">Also changed, with no new legal question: the privacy policy and security page now list what the profile holds, say plainly what the AI provider is sent, and separate news and offers emails (which need the tick) from emails about an account or an application. The data download now includes the private preferences, the career stage answer, the jobs marked not interested and the date of the last name change.</p>

<h2 class="pb">Part A. My employment and the disclosure to my employer</h2>
<div class="box"><strong>Why this comes first.</strong> I plan to launch only after my employer has been told and has acknowledged it. I would like your advice on the agreement before I make that disclosure.</div>
<table>
<tr><td style="width:32%"><strong>My employer</strong></td><td>An organisation that supports independent optometry practices through a buying group. It is not named in this document. I will name it at the meeting.</td></tr>
<tr><td><strong>My role</strong></td><td>Business coach, working directly with member clinics. I do not run their hiring.</td></tr>
<tr><td><strong>Overlap</strong></td><td><strong>Yes, and this is the central issue.</strong> Kestrel's core audience is independent optometry practices, and several hundred of them are my employer's member clinics. My employer offers its members a job board. It is for members only: posts can be made public, but they get little search traffic. Another group runs a similar members only board. The best known public job board in the field is owned by a subsidiary of my employer. I do not work for that subsidiary. I coach the member clinics in my day job. I would like Kestrel to be able to benefit those members, possibly under a paid arrangement. Without that, Kestrel could not serve a large share of independent clinics.</td></tr>
<tr><td><strong>What I have kept separate</strong></td><td>Kestrel uses no employer data, member lists, devices, accounts, email or branding. It has its own domain, email, accounts and hosting. Work on it is done in my own time. Clinic outreach is switched off. I have confirmed this is accurate.</td></tr>
<tr><td><strong>What already exists in public</strong></td><td>The domain eyecarejobs.ca, a coming soon page with a waitlist (1 test entry), and a blog being prepared. No clinics or candidates have been contacted.</td></tr>
</table>
<ol>
{q(1,"Please review sections 7 and 9 of my employment agreement (attached). What do they restrict: outside business activity, competing business, soliciting my employer's clients or members, use of confidential information, or ownership of anything I create?")}
{q(2,"Does Kestrel, as described, fall inside any restriction? My employer offers a job board or postings service to the same independent clinics that Kestrel targets. Kestrel would also compete with a public job board owned by my employer's subsidiary. Is Kestrel a competing business, a conflict of interest, or both? Does my exposure change depending on which parts I do (for example, a job board versus outreach to independent clinics, or my using what I know from coaching them)?")}
{q(3,"What should the disclosure say, in what form, and to whom? Do I need written consent, or is acknowledgement enough? How should it describe the overlap with my employer's job board? Can you draft or review the letter?")}
{q(4,"Is it a problem that the domain, the waitlist page and a blog exist before the disclosure? Is there anything I should stop, slow down or avoid until it is acknowledged?")}
{q(5,"What should I do to keep my work and Kestrel clearly separate, beyond what I have already done?")}
{q(6,"If my employer objects or sets conditions, what are my realistic options? For example: a different audience (suppliers, corporate groups and candidates rather than my employer's member clinics), a promise not to contact member clinics, a delay, negotiated terms, or an arrangement where Kestrel is offered to members as a benefit, possibly paid for by my employer. If that is possible: how do I avoid being on both sides of the deal, who should negotiate for my employer, when in the process should it be raised (in the disclosure or after), and how should payment be structured?")}
</ol>

<h2>Part B. The company and what it owns</h2>
<ol>
{q(7,"Federal or Ontario corporation? Who should hold the shares? I may give a family member a private role, such as an emergency backup contact: does that have any legal consequences?. Name search (NUANS): can the legal name be Kestrel Eye Care Jobs, or should that be a registered business name?")}
{q(8,"Assignment to the company of everything Kestrel runs on: the domain (registered in my name at Namecheap), the logo and skyline artwork (my own), the website code (written by an AI coding assistant under my direction: who owns it, and is anything needed to make ownership clear?), and the accounts (Supabase, Vercel, GitHub, Resend, Anthropic, Google Workspace).")}
{q(9,"Trademark. Is a search and filing worthwhile for the name and the logo before launch? \"Kestrel\" is a common word and \"Eye Care Jobs\" is descriptive. Which classes, and how would you sequence this with incorporation? (I understand a company registration does not on its own protect a brand across Canada.)")}
{q(10,"Insurance: should the company carry cyber liability or professional liability cover before launch?")}
{q(11,"Which provincial and federal registrations are needed to operate? I am in Ontario. The mailing address in the footer, 6013 Yonge Street, 3rd Floor, North York, Ontario M2M 3W2, is a business or shared office address, and I am happy to publish it..")}
</ol>
<p class="small">For my accountant, not the lawyer: HST registration timing (sales may pass $30,000 around month 10), Business Number, bank account, Stripe fees and how to restate the revenue model net of payment costs.</p>

<h2 class="pb">Part C. The Terms, Posting policy and Privacy policy (Appendices A, B, C)</h2>
<p>All three are plain English drafts, published with a "draft for review" banner (Terms and Posting policy). The Terms name no company. Email sign ups now agree to the terms and the privacy policy, and Kestrel records which version and when. I would like each reviewed and, where needed, rewritten.</p>
<ol>
{q(12,"The contracting party is only \"Kestrel Eye Care Jobs\". Who is it (corporation or sole proprietor), and what governing law and forum should apply?")}
{q(13,"The liability cap is \"the amount you paid us in the last 12 months\", which is $0 for every candidate, and for every clinic during the free launch. Is that acceptable, and what would you suggest?")}
{q(14,"There is no indemnity from clinics for their own posts or their use of applicants' data. Should there be?")}
{q(15,"Once a clinic opens an application, who is responsible for the applicant's personal information (Kestrel or the clinic)? How should the terms and the privacy policy say so? This also decides who answers an access request (question 23).")}
{q(16,"Listings Kestrel finds on a clinic's own website: what do the terms need to say, and how should a clinic have one taken down? Today only the claim page has a \"remove it\" email link.")}
{q(17,"The AI ad builder: the clinic must check a draft before posting and is responsible for it. Is the wording enough, and should the policy say more about how the AI is used?")}
{q(18,"\"Using Kestrel after a change means you accept it\" (Terms, near the end). Will that bind people, particularly consumers?")}
{q(19,"Fees and refunds, before prices switch on: refunds are not given if Kestrel removes a post for breaking the rules; the monthly pass renews automatically; there is an annual option; HST is added. What must the terms and checkout say (auto renewal disclosure, cancellation, refunds), and do clinics count as businesses or consumers here?")}
{q(20,"Remove the \"draft\" banners once reviewed. What version and date should be recorded as the agreed terms?")}
{q(21,"The privacy policy is out of date in places: it still says accounts and job posting are \"still to come\", and one sentence says we only email people who ticked the consent box, although job alerts go to people who set one up. Please correct these in your rewrite.")}
</ol>

<h2>Part D. Privacy and personal information</h2>
<ol>
{q(22,"Where data is processed. The database and resumes are in Canada. The website's server functions now run in Montreal, but the content delivery network, Resend, Anthropic, Cloudflare and Google may process data elsewhere. How should the policy describe this, and are the providers' standard terms enough?")}
{q(23,"Access requests. \"Download my information\" gives a candidate their profile, applications, letters and alerts. It does not include a clinic's private notes about them, their waitlist entry or their email choices (the last two are being added). Must Kestrel hand over a clinic's notes, or can it refer the candidate to the clinic that wrote them?")}
{q(24,"Retention. Today everything is kept indefinitely. My proposal, for you to correct: unconfirmed waitlist sign ups 30 days; applications and their resume copies 2 years after the job ends; \"let the clinic keep my details for future roles\" 12 months unless renewed; job reports and listing claims 2 years; job posts 3 years. Ontario now requires employers with 25 or more employees to keep public job postings for 3 years: is that the clinic's duty only, or does Kestrel need to keep postings too?")}
{q(25,"Deleting accounts. At the moment, if a clinic deletes its account, its jobs and every application it received are deleted, and disappear from candidates' trackers; deleting a candidate removes their applications from clinics. I want to keep a candidate's own copy (title, clinic name, location, status) after a clinic leaves, and tell affected people. What should happen to each side, and for how long?")}
{q(26,"The privacy policy promises \"a minimal record that we received and carried out your request\" when someone deletes an account. Kestrel now records only the role and the number of jobs and applications, with no names or emails. Is that enough?")}
{q(27,"Quebec. Quebec can be selected everywhere, but there is no French and no Law 25 work. Option (a): keep Quebec out for now, showing \"Quebec coming later\". Option (b): do the work first (French terms and privacy policy, a privacy impact assessment for US services, an incident register). Which do you recommend, and what wording should (a) use?")}
{q(28,"The privacy officer. The policy says \"our privacy officer\" and privacy@eyecarejobs.ca. I plan to publish the title (Founder and Privacy Officer) and the contact address, and give the name on request. A backup person is named in the internal breach plan but not published. Is that enough for PIPEDA and for Quebec's requirement to publish the title and contact details?")}
{q(29,"The breach plan (Appendix D). Please review it, supply the lawyer's name and number, and say whether I should tell a clinic when its applicants' data is involved.")}
{q(30,"The consent wordings in Appendix E: the waitlist and sign up consent to \"launch news, job alerts, product updates and offers\"; the apply form's \"let the clinic keep my details for future roles\"; the job alert set up. Are they valid express consent under CASL and PIPEDA?")}
</ol>

<h2>Part E. Email and outreach (CASL)</h2>
<ol>
{q(31,"Please review the clinic outreach email (Appendix E) before any is sent. It relies on implied consent: an address a clinic has published for hiring or business enquiries, and a message only about that role. It carries Kestrel's name, the mailing address and a working unsubscribe, processed at once. Is that basis sound for this use, and for generic addresses such as info@?")}
{q(32,"Job listings found on clinics' own careers pages. Copying facts is allowed but copying wording may not be; some clinic sites forbid automated copying. My rules: use only the clinic's own careers page, rewrite in our own words, link to the clinic's application page, never use its logo until claimed, expire after 21 days, recheck the page. Are these enough, and may Kestrel state \"existing vacancy\" and \"uses AI to screen\" for a clinic that has not told us? (I propose showing \"Not stated by the clinic\" until claimed.)")}
{q(33,"Unsubscribe links must keep working for 60 days after sending. I am keeping that, and adding a one click unsubscribe header. Anything else?")}
</ol>

<h2>Part F. Claims the product makes about the law</h2>
<ol>
{q(34,"Kestrel's posting rules are built to match Ontario's job posting rules from 1st January 2026 (pay range, \"existing vacancy\", AI screening disclosure, no Canadian experience requirement) and British Columbia's pay range rule. Please confirm the rules as built are right: pay range at most $50,000 wide unless the top is over $200,000; hourly pay converted at 2,080 hours; the two yes or no questions; and a ban on any wording about Canadian experience. Are any over or under inclusive?")}
{q(35,"How may Kestrel describe this in its own marketing (for example, \"helps you meet Ontario's rules\") without promising compliance? Please suggest safe wording and a disclaimer.")}
{q(36,"Does Kestrel, as a job board, have any duty of its own under these rules, or do they fall only on the employer posting?")}
{q(37,"An idea for later: reminding Ontario clinics of the 45 day interview outcome duty and adding an accommodation notice to job pages and the apply form. Please suggest wording, and say whether offering it creates any duty for Kestrel.")}
{q(38,"Pay benchmark on the post a job form. While a clinic enters its pay range, Kestrel shows a line such as \"Your range is in line with what is typical for opticians in Ontario\", with the source and date. The figures come from the Government of Canada's Job Bank wages data (open.canada.ca, Open Government Licence – Canada, which I credit with the licence's own attribution statement and a link). Where Job Bank has no figure, I may show a range made by AI, labelled as a rough starting point, and later Kestrel's own posted pay once a role and province has at least 10 posts from at least 3 clinics. It is guidance only and never blocks a post. Does sharing pay benchmarks need any particular wording, limits or disclaimer? Please also say whether showing pay posted by other clinics, even as a combined median, raises any competition law concern (for example about employers sharing pay information), and whether the AI starting range should be shown at all.")}
</ol>

<h2>Part G. Smaller matters</h2>
<ol>
{q(39,"Accessibility: I understand AODA's website rules apply from 50 employees and reporting from 20. Is a short accessibility statement still wise?")}
{q(40,"Analytics. I plan cookie free analytics and Google Search Console. Does that need any notice or consent?")}
{q(41,"Anything else a new Canadian online marketplace for regulated health professionals should have in place before launch that I have not asked about?")}
</ol>

<h2>Part H. New questions since 5th November 2026</h2>
<p>These come from the page "What has changed since 5th November 2026". Question 45 repeats the retention question from Part D (question 24) because the inbox and the new profile information add to it.</p>
<ol>
{q(42,"The career stage answer (\"working in eye care now\", \"studying or training\", \"not working in eye care yet\") is private to the candidate today and is never sent with an application. May a clinic ever be shown it, for example as part of an application, if the candidate agrees? Or is it better never shown, because it could reveal something about a candidate's circumstances?")}
{q(43,"First week emails. Kestrel has up to 3 welcome emails for new accounts (days 1, 3 and 7), switched off. Is a new account an existing business relationship under CASL, so they can go to a person who made an account but did not tick the marketing box, or do they need the consent tick? They are tips on getting started and contain no offers. If the answer is that they need the tick, they will only go to people who ticked.")}
{q(44,"Pay shown as a percentage only. For optometrist jobs a clinic can post, for example, 28% to 35% of production with no dollar figure. Does that meet Ontario's requirement to state a pay range, and British Columbia's? If not, should a dollar figure (for example a guaranteed minimum) be required alongside a percentage?")}
{q(45,"Retention, now including the inbox. This is the retention question from the October audit (question 24), still open, with 2 additions: inbox messages are kept until the account is deleted, and a candidate's private preferences, hidden jobs, career stage answer and last name change date are kept for as long as the account is open. What periods do you recommend for each, and for messages in particular? I have thought of about 12 months and of 3 years, and have not decided.")}
</ol>

<h2>Documents to bring</h2>
<ul>
<li>My employment agreement, and any employee handbook or policy on outside activities.</li>
<li>This pack (the policies are in the appendices, exactly as published).</li>
<li>A name search result, once done.</li>
<li>The drafted disclosure letter, if you would like me to bring a first attempt.</li>
</ul>

<h2 class="pb">Background 1. What the site collects, in short</h2>
<table>
<tr><th>Who</th><th>What is collected</th><th>Why</th><th>Who sees it</th></tr>
<tr><td>Anyone on the waitlist</td><td>Name, email, province, role, clinic name (clinics), the consent wording and time</td><td>Launch news once Kestrel opens</td><td>Admin only</td></tr>
<tr><td>Candidate account</td><td>Name, email, password (or Google sign in), profession, licensed provinces, years of experience, availability, phone, a resume, job alerts</td><td>Apply to jobs and follow applications; job alerts</td><td>The candidate. A clinic sees an application only after the candidate sends it, as it was when sent</td></tr>
<tr><td>Application</td><td>Cover letter, resume copy, details sent, a copy of the job title and clinic name, status history</td><td>Apply</td><td>The clinic that received it; the candidate</td></tr>
<tr><td>Clinic account</td><td>Name, email, clinic profile, contact for alerts, confirmation of hiring directly (not an agency), jobs, templates, private notes about applicants</td><td>Post jobs and manage applicants</td><td>The clinic; admin for review</td></tr>
<tr><td>Reports and claims</td><td>Who reported or claimed a listing, their email, the reason</td><td>Safety and claiming listings</td><td>Admin only</td></tr>
<tr><td>Everyone</td><td>Terms version agreed and date; do not email list; a log of account deletions with no personal details</td><td>Records</td><td>Admin only</td></tr>
</table>
<p class="small">Not collected today: payment details (Stripe will handle them), health information, government identifiers, tracking cookies.</p>

<h2>Background 2. Decisions already made, for information</h2>
<ul>
<li>Clinic sign up is invitation only until launch; the board is not open.</li>
<li>Marketing emails are only sent to people who ticked a consent box, plus job alerts that a person set up themselves.</li>
<li>No scraping of Indeed, LinkedIn, Jobs4ECPs or the provincial college registers. Seeding, when it happens, uses clinics' own careers pages only.</li>
<li>Row level security protects every database table. Account lock down (two step sign in) is in progress, and a security audit was completed on 30th October 2026.</li>
</ul>
"""

def cut(text, start, end=None):
    i = text.index(start)
    return text[i:] if end is None else text[i:text.index(end)]

cover = cut(BRIEF, '<div class="cover">', '<h2 class="pb">Part 1.')
part1 = cut(BRIEF, '<h2 class="pb">Part 1.', '<h2 class="pb">Part A.')
partA = cut(BRIEF, '<h2 class="pb">Part A.', '<h2>Part B.')
rest = cut(BRIEF, '<h2>Part B.')
bring_i = rest.index('<h2>Documents to bring</h2>')
rest_questions, rest_bring = rest[:bring_i], rest[bring_i:]

if PACK == "business":
    cover = cover.replace("Legal review pack</p>", "Legal review pack: business, privacy and technology</p>", 1)
    cover = cover.replace("Parts A to H are the 45 questions, numbered, in the order I would like to cover them. If time is short, Parts A and B come first because they decide the launch date, and C to H can follow by email.", "Parts B to H are questions 7 to 45, in the order I would like to cover them. If time is short, Parts B and C come first and the rest can follow by email. Part H holds the 4 newest questions, about what has been built since 5th November 2026. Questions 1 to 6 are about employment and are being handled separately.", 1)
    part1 = part1.replace("I work full time for another organisation (see Part A). I am not a developer", "I am building Kestrel alongside other work. I am not a developer", 1)
    part1 = part1.replace("only after the matters in Part A are settled", "only after the company, policy and other legal matters in this pack are settled", 1)
    bring = '<h2>Documents to bring</h2><ul><li>This pack (the policies are in the appendices, exactly as published).</li><li>A name search result, once done.</li></ul>'
    brief_html = cover + part1 + rest_questions + bring + cut(BRIEF, '<h2 class="pb">Background 1.')
elif PACK == "employment":
    cover = cover.replace("Legal review pack</p>", "Legal review pack: employment and disclosure</p>", 1)
    cover = cover.replace("For a fixed fee review meeting. Everything that needs a lawyer's eyes is in this one document: what the business is, the questions in order of priority, and the documents themselves.", "For a fixed fee review meeting about my employment agreement and the disclosure to my employer. It gives a short summary of the business, and the questions.", 1)
    cover = re.sub(r'<div class="box"><strong>How to use this pack\.</strong>.*?</div>', '<div class="box"><strong>How to use this pack.</strong> Part 1 summarises the business. Part A has the questions, numbered 1 to 6. My employment agreement is attached separately. Business, privacy and technology questions are being handled separately.</div>', cover, count=1, flags=re.S)
    part1_short = part1[:part1.index('<h3>Who handles what</h3>')]
    bring = '<h2>Documents to bring</h2><ul><li>My employment agreement, and any employee handbook or policy on outside activities.</li><li>The disclosure letter, if I bring a first attempt.</li></ul>'
    brief_html = cover + part1_short + partA + bring
else:
    brief_html = BRIEF

EMAILS = """
<h2 class="pb">Appendix E. Consent wordings, outreach email and the email list</h2>
<h3>E1. Consent wordings saved with each sign up</h3>
<table>
<tr><th>Where</th><th>Exact wording</th></tr>
<tr><td>Waitlist form and account sign up (optional box)</td><td>"Yes, email me launch news, job alerts, product updates and offers from Kestrel Eye Care Jobs. I can unsubscribe at any time."</td></tr>
<tr><td>Email sign up (required box)</td><td>"I agree to the terms of use and the privacy policy."</td></tr>
<tr><td>Google sign in, first visit (required box)</td><td>"I agree to the privacy policy and the terms of use."</td></tr>
<tr><td>Apply form (required)</td><td>"I agree that [clinic] can see this application, my resume and my details. Kestrel keeps them private from everyone else."</td></tr>
<tr><td>Apply form (optional)</td><td>"Optional: if this role is filled, let [clinic] keep my details for future roles. I can ask them to delete them at any time."</td></tr>
</table>
<h3>E2. The first email to a clinic whose job Kestrel has listed (switched off)</h3>
<div class="box">
<p><strong>Subject:</strong> Your [job title] job is now on Kestrel Eye Care Jobs</p>
<p>Hello [clinic] team,</p>
<p>We are Kestrel Eye Care Jobs, a job board for eye care across Canada. We found the [job title] job on your own careers page ([source page]), and we have listed it on Kestrel so more eye care professionals can see it.</p>
<p>The listing is free. It is described in our own words, it is marked as not yet claimed, and every Apply button sends people straight to your own application page. We have not used your logo.</p>
<p>Advertising a job in more than one place helps more of the right people see it. Being on Kestrel does not replace or change anything on your own website or on other job boards, and there is nothing you need to do.</p>
<p>You can claim the listing to update it, add your pay range and see who is interested, or ask us to take it down and we will do so straight away. Just reply to this email.</p>
<p>We are writing to you because this address is published on your website for hiring and business enquiries, and this message is only about that job. If you would rather not hear from us, use the link at the bottom and we will stop.</p>
<p class="small">Footer on every email: "You are receiving this because this address is published on your website for hiring enquiries." An unsubscribe link, and Kestrel's name and mailing address (6013 Yonge Street, 3rd Floor, North York, Ontario M2M 3W2).</p>
</div>
<h3>E3. Every email Kestrel sends</h3>
<table>
<tr><th>Email</th><th>To</th><th>Kind</th><th>Basis</th><th>Unsubscribe</th></tr>
<tr><td>Confirm your waitlist email</td><td>The person who signed up</td><td>Marketing (a consent request counts)</td><td>Ticked box, wording saved</td><td>Link in footer</td></tr>
<tr><td>You're on the list</td><td>Confirmed sign up</td><td>Marketing</td><td>Ticked box plus confirmation</td><td>Link; do not email list checked</td></tr>
<tr><td>Job alert digest</td><td>Candidate</td><td>Treated as marketing</td><td>The alert the candidate set up</td><td>Signed link; list checked</td></tr>
<tr><td>Application updates and close out</td><td>Candidate</td><td>About their application</td><td>Not needed</td><td>Can be turned off in Account</td></tr>
<tr><td>New application, 14 day reminder</td><td>Clinic alert address</td><td>About their account</td><td>Not needed</td><td>Can be turned off</td></tr>
<tr><td>Job approved, needs a change, closes in 3 days</td><td>Clinic</td><td>About their account</td><td>Not needed</td><td>Closing soon respects the reminder choice</td></tr>
<tr><td>Job taken down; claim confirmed, approved, declined</td><td>Clinic or claimant</td><td>About their account or request</td><td>Not needed</td><td>None</td></tr>
<tr><td>Sign up, password reset, change email</td><td>Account holder</td><td>About their account</td><td>Not needed</td><td>None</td></tr>
<tr><td>Admin alerts</td><td>Steve (and a backup address if set)</td><td>Internal</td><td>n/a</td><td>None</td></tr>
<tr><td>Clinic outreach (E2)</td><td>Published hiring address</td><td>Marketing, implied consent</td><td>CASL s. 10(9)(b)</td><td>Signed link; list checked. Not yet sent to anyone</td></tr>
</table>
<p class="small">Every email carries the sender's name, the mailing address and "The Kestrel team". Unsubscribes take effect immediately. Replies go to hello@eyecarejobs.ca.</p>
"""

APPENDICES = f"""<div class="appendix">
<h2 class="pb">Appendix A. Terms of use, as published on 31st October 2026</h2>
<p class="small">Rendered from https://eyecarejobs.ca/terms. Navigation and footer removed.</p>
{terms}
<h2 class="pb">Appendix B. Posting policy, as published</h2>
{posting}
<h2 class="pb">Appendix C. Privacy policy, as published</h2>
{privacy}
<h2 class="pb">Appendix D. Breach plan (internal)</h2>
<p class="small">From the internal document docs/breach-plan.md. The backup person and the lawyer are to be filled in, and the backup person's name is deliberately kept out of this and every other document in the code repository.</p>
{breach}
{EMAILS}
</div>"""

head = f"""<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><title>Kestrel Eye Care Jobs: legal review pack</title><style>{CSS}</style></head><body>"""
doc = head + brief_html + (APPENDICES if PACK != "employment" else "") + "</body></html>"
name = {"full": "Kestrel-lawyer-review-pack", "business": "Kestrel-review-pack-business-privacy-technology", "employment": "Kestrel-review-pack-employment"}[PACK]
open(f"docs/legal/{name}.html", "w").write(doc)
print("written", name, len(doc))
