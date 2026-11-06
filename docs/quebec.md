# Operating in Quebec: what it takes, and how to produce things so they can be displayed (draft, 6th November 2026)

Steve's question: what are the legalities of operating in Quebec, and how do we produce things so that Quebec content can be displayed? This note collects what the audit already found (finding R31, `docs/audit/2026-10-30/lens-4.md` section 4.6) and turns it into options. **None of it is legal advice and none of it has been checked by a Quebec lawyer.** The statute references come from the audit's reading and must be confirmed by a lawyer who practises in Quebec before anything is built or promised.

## Where things stand today

Anyone can already pick Quebec on the waitlist, a candidate profile, a job alert and a job post. The whole site, the Terms, the Privacy policy and the emails are English only. The plan says French and Quebec's privacy law come before marketing in Quebec, and nothing stops a Quebec clinic joining now.

## The 3 areas of law the audit expects a Quebec lawyer to raise

1. **Quebec's language law (the Charter of the French Language, as changed by Bill 96).** As the audit reads it: a Quebec employer that publishes a job offer in English must publish it in French too, at the same time and with comparable reach (s. 41). That is the clinic's duty, but the post appears on Kestrel's board. A standard form contract such as the Terms of use must be offered in French first (s. 55). Whether and how far this reaches an Ontario business with no office in Quebec is a question for the lawyer.
2. **Quebec's private sector privacy law (Law 25).** Publish the privacy officer's title and contact details, publish governance rules, assess the privacy risk before personal information leaves Quebec (our services such as Vercel, Resend, Cloudflare, Google and Anthropic are US based), keep an incident register and report serious incidents to the privacy regulator (the Commission d'acces a l'information). The data export Kestrel already offers suits the right to take your data with you.
3. **Rules for recruiters and agencies in Quebec**, which matter if Kestrel ever acts as an agency (`docs/agency-pathway.md`). Not relevant to the job board as it stands, because agencies cannot post.

Not covered here, and worth asking about: the professional orders for optometrists and opticians in Quebec (what a job post may say about licensing), and whether Quebec has any pay posting rules that differ from Ontario's and BC's.

## "How do I produce things so they can be displayed?"

For a Quebec job to show on Kestrel, the practical needs are:

| What | Who produces it | How |
| --- | --- | --- |
| The job post in French (and English if the clinic wants both) | The Quebec clinic, helped by the ad builder | A French version field on the job. The ad builder drafts the French from the clinic's lines. A French speaking reviewer approves it before it goes live, as the review queue does today. |
| The 2 required answers and the pay range, in French | Kestrel | French labels on the job page ("Poste existant", "Utilise l'IA pour trier les candidats", the pay line). Needs a native review. |
| The Terms and Privacy policy in French | The lawyer, or a certified translator | A French version offered first to Quebec users. Do not rely on machine translation for legal text. |
| The site itself (menus, search, forms, emails) | Claude, reviewed by a native speaker | A French version of the interface, chosen by the visitor, with `lang` set correctly. A large piece of work. |
| Job alerts and emails to Quebec people | Claude | French templates, sent in French to anyone who chose Quebec or French. |
| The pay benchmark and Job Bank wages | Claude | Job Bank publishes in French too, so the source exists. |

## Options

- **A. Keep Quebec out for now (about 1 hour).** Hide Quebec from the province lists or show "Quebec coming later", and do not accept Quebec posts or sign ups. This removes the risk while the lawyer and Gate A are sorted out. It is what the audit suggested first.
- **B. Quebec posts only, in French (days of work).** Quebec clinics can post if they supply, or approve, a French version. French Terms and Privacy policy first. The rest of the site stays English for now. Needs the lawyer's yes on how much of the site must be French.
- **C. Full French site (weeks, plus a Quebec lawyer and a native reviewer).** Everything above. The right choice only when Quebec is a real market for Kestrel.

**Suggested path:** A now. Ask the lawyer the questions below at the first meeting. Choose B or C after the Ontario, Alberta and BC launch has real numbers. The blog idea "Quebec: hiring in French in an eye care practice" waits until then (`docs/blog.md`).

## Questions for the lawyer (a Quebec practitioner)

1. Does the French language law apply to Kestrel as an Ontario business with no office or staff in Quebec, when Quebec clinics post jobs and Quebec candidates use the site?
2. Are Kestrel's clinics the ones who must publish the French version of an offer, or does the board have its own duty? Is a bilingual post enough?
3. Must the Terms and Privacy policy be in French first for Quebec users, and which parts of the site must be French?
4. What do we need under Law 25 before collecting Quebec personal information (privacy impact assessment for US services, incident register, naming a privacy officer)?
5. Do the professional orders for optometrists and opticians in Quebec restrict what a job post can say?
6. If we choose option A, what wording should "Quebec coming later" use so that it is lawful and clear?

## Decisions for Steve

1. A, B or C for now (suggested: A).
2. Whether the first meeting with the lawyer is the right place to ask the Quebec questions, or a separate Quebec lawyer is needed.
