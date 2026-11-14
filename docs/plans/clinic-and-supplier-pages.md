# Plan: public clinic pages, several locations, and supplier accounts (14th November 2026)

Steve wants this built before launch (mid to late January 2027). Nothing below is built yet. It needs new database tables, so it comes with SQL to run on both databases.

## 1. Public clinic pages

An address for each clinic, such as `/clinics/northgate-eye-care-kelowna`, showing: name, town and province, practice type, a short description in the clinic's own words, benefits, photos (with a pass), and **its open jobs with a count** ("3 open jobs"). Each job page links to it.

**Search:** yes, it helps. Pages about real local employers are what people and AI assistants look for ("optician jobs Kelowna", "is Northgate Eye Care a good place to work"). Each page carries Organization data for search engines, and is in the sitemap only when it has live jobs or a filled in description, so empty pages never get indexed.

**Fill from the clinic's website, without AI:** the clinic types its website, and Kestrel reads that 1 page with fixed rules: the page title, the description the site gives itself, its logo or share image, and any business details the site publishes in standard search engine data (address, phone, opening hours). It obeys the site's robots rules, saves nothing until the clinic ticks to accept each field, and never copies the clinic's own page text wholesale. The same no AI approach as "Fill in from my resume".

**Rules kept:** only claimed clinics get a public page; no logo until claimed; nothing private (the alert email never shows); Quebec clinics follow the existing Quebec rule; the page is drawn signed out and saved once, like job pages.

## 2. Several locations, 1 owner

An account can hold several locations, each with its own clinic page (so candidates see the right town). A pass or Group pass covers posts at any of them. A group page lists the locations. A location can be moved between accounts only by Kestrel (by email), to avoid disputes.

## 3. Supplier accounts

Suppliers already have an employer type and can post field based jobs and receive applicants. To add:

- **Supplier sign up:** choose "Supplier or manufacturer" at sign up, with wording for companies, not clinics.
- **Supplier page:** like a clinic page: what the company makes or does, where it works, and its open jobs.
- **Premium supplier page:** adds a **Promotions** block for offers aimed at clinics, each clearly labelled as a promotion, with start and end dates, read by a person before it shows (as job posts are), and no pay or hiring claims.
- **Claiming by email domain:** to claim or edit a supplier page, the person signs in with a work email at the company's own domain (for example someone@supplier.com for supplier.com). Kestrel sends a link to that address to confirm it. Free email services (Gmail, Outlook and so on) cannot claim. A company with several domains asks by email.

**Gate:** selling premium supplier pages and promotions waits for Steve's disclosure conversation, like the other supplier offers. Free supplier pages and jobs can go ahead.

## Suggested order

1. Public clinic pages, with the website fill (the most useful for launch).
2. Several locations (needed by groups at launch).
3. Supplier sign up and pages, then the domain claim; premium and promotions after the disclosure conversation.
