# Kestrel Eye Care Jobs: project guide for Claude

Read this first in every session. It holds the decisions already made, so they don't get re-litigated.

## What this is

Kestrel Eye Care Jobs (eyecarejobs.ca) is a self serve job board for Canadian eye care: optometrists, opticians, optometric assistants and technicians, practice managers, patient care teams, and later supplier reps and locums. Independent and corporate practices post side by side. Target: $150,000 a year in revenue within 18 to 24 months of paid launch, on running costs well under $10,000 a year.

The founder is Steve Smith. He is not a developer. Claude writes and maintains the code; Steve reviews previews and approves. Explain changes in plain English, keep him in control of anything that costs money or goes live.

Full business plan: the "Kestrel Eye Care Jobs: Business Proposal and Launch Plan v7" doc (https://claude.ai/artifact/2j9U84RzZ5vtmnNVtXPCTC). A working summary is in docs/PLAN.md.

## Non negotiables

- **Separation from Eye Recommend.** Steve works full time at Eye Recommend. Kestrel uses no Eye Recommend data, member lists, devices, accounts, email or branding. Never add Eye Recommend clinics, contacts or internal material to this project. Clinic outreach stays switched off until Steve confirms his disclosure conversation has happened.
- **Never commit secrets.** Keys live in .env.local and in Vercel's environment settings only.
- **Personal data stays in Canada where possible** (Supabase Canadian region) and is collected only with clear consent.
- **No scraping of Indeed, LinkedIn, Jobs4ECPs or provincial college registers.** Seeding uses clinics' own careers pages only, links back to the clinic, and expires after 21 days.

## Stack

| Job | Tool |
| --- | --- |
| Website and API routes | Next.js (App Router, TypeScript), in this repo |
| Hosting | Vercel (Hobby while private, Pro from launch since Hobby is non commercial) |
| Database and sign in | Supabase, Canadian region; Google sign in plus email and password |
| Payments | Stripe: single posts, monthly pass, coupons, HST via Stripe Tax |
| Email | Resend or Postmark (not chosen yet) |
| Ad builder and careers page reading | Claude API, server side only |
| Code | GitHub organisation for Kestrel |

Fonts are self hosted through @fontsource (no Google Fonts requests). Images live in /public.

## Current state

- The coming soon page (app/page.tsx) is a faithful copy of the Wix version and is live at https://eyecarejobs.ca (registered at Namecheap, DNS records entered in Namecheap's Advanced DNS, served by Vercel). The Wix copy is no longer needed.
- The waitlist form posts to app/api/waitlist/route.ts, which validates with lib/waitlist.ts and upserts into the Supabase table defined in supabase/migrations/0001_waitlist.sql. Without SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY it returns a 503 with a friendly message.
- The site is deployed on Vercel (Hobby) from this repo and saves sign ups to a Supabase project in the Canadian region. The repo currently lives in Steve's personal GitHub account; move it into the Kestrel organisation (Kestreleyecarejobs) when upgrading to Vercel Pro, because Hobby cannot deploy private organisation repos.
- Accounts are being built on the branch `build-accounts`: email and password sign in with candidate, clinic and admin roles (see docs/accounts-setup.md). Screen designs for the whole platform are in the "Kestrel platform screens" design artifact that Steve has approved. Launch scope is stages 1 to 3 together, with Stripe in test mode and a free launch coupon, then prices switched on later.
- The Wix page never went live, so there are no Wix sign ups to import.
- Waitlist consent wording covers launch news, job alerts, product updates and offers (CASL). Keep the wording in lib/waitlist.ts identical to what people see, since it is saved with every sign up.

## Brand

- Name: Kestrel Eye Care Jobs. Line: "Canada-wide eye care job board". Domain: eyecarejobs.ca.
- Palette: Kestrel Navy #1B2B4B, Chestnut #A4502C, Deep Chestnut #8C4024, Cream #F7F1E6, Wing Buff #D8B48A, Mist #DCE3E6, Paper #FBF8F2, Line #E3D9C8, Soft Navy #2B3F5F, Slate #5A6672. Tokens are in app/globals.css.
- Fonts: DM Serif Display (wordmark, headings), Source Serif 4 SemiBold ("EYE CARE JOBS"), Poppins Regular widely tracked (tagline), Source Sans 3 (body, buttons).
- Logo: the serif K whose leg is a two tone chestnut feather flicking under the "e". Files in public/brand (PNG and SVG, normal and reversed). Never redraw or "improve" the logo, the feather, or the skyline artwork. The skyline (public/skyline.png, source in design/) is Steve's own artwork and must be used as is.

## Writing style for anything users read

- No em dashes, and no hyphens used as punctuation. Use commas, full stops or "to".
- Numerals throughout (3, not three). Ordinal dates (1st January 2027).
- British spelling with Canadian conventions (centre, organisation, colour).
- Warm, plain, industry fluent, like a colleague who knows clinics. No recruiter clichés, no generic AI phrasing.
- Emails sign off as "The Kestrel team".

## Product rules already decided

- Pricing ladder: free launch (30 to 60 days), then introductory $39 support staff, $49 opticians, $59 optometrists per 30 day post, then standard $79 single post or $199 a month clinic pass (up to 5 live posts, featured profile; annual option $1,990). Prices before HST.
- Every post requires a pay range (max $50,000 wide unless over $200,000), a yes or no for "existing vacancy", and a yes or no for "uses AI to screen candidates". No "Canadian experience" requirements allowed in the text. This covers Ontario's January 1st 2026 rules and BC's pay range rule.
- Paid posts expire after 30 days, seeded posts after 21. Expired posts drop their JobPosting structured data immediately.
- Each job page carries JobPosting structured data that matches the visible page exactly.
- Seeded listings are labelled "Found on the clinic's website, not yet claimed", show facts in our own words with a link to the clinic's application page, and never use the clinic's logo until claimed.
- Outreach emails meet CASL: Kestrel's name, a mailing address, a working unsubscribe processed within 10 business days, sent only to published business addresses about the recipient's role.
- Launch features: clinic and candidate accounts, clinic profiles, post a job with the ad builder, checkout, search with filters (role, province, city, practice type, employment type), job pages, expiry, candidate alerts, clinic dashboard, admin review queue, and a simple rules based "Find your fit" quiz. Later: locum board, supplier roles, featured listings, AI culture match, French.

## Data model (planned)

- employers: clinic_name, practice_type (independent or corporate), website, logo_url, province, city, owner_user_id, status, claimed
- jobs: employer_id, title, role_category, employment_type, province, city, pay_min, pay_max, pay_period, is_existing_vacancy, uses_ai_screening, description, apply_url or apply_email, is_seeded, source_url, posted_at, expires_at, status
- candidates: user_id, profession, licensed_province, alert_roles, alert_provinces, consent_at
- job_alerts: candidate_id, job_id, sent_at
- waitlist: already built

Use row level security on every table. Write schema changes as numbered SQL files in supabase/migrations.

## How we work

1. Steve describes the change in plain English.
2. Claude makes it on a branch, runs `npm run build`, and explains what changed.
3. Push the branch; Vercel builds a preview link for Steve to check on his phone.
4. Steve approves; merge to main; Vercel puts it live.

Keep dependencies few and current, check `npm audit` monthly, and prefer built in Next.js, Supabase and Stripe features over extra libraries.

## Next tasks

1. Add a privacy policy page and link it from the form. It needs Kestrel's mailing address and contact details for CASL, so Steve must choose a mailing address first.
2. Decide on email at the domain (Google Workspace or free forwarding). Cloudflare Registrar does not sell .ca, so DNS stays in Namecheap's Advanced DNS; email records go there too.
3. Then the platform build, starting with the screen designs Steve approves.
