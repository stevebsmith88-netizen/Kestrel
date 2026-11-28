# Subscriptions and running costs

The 1 place to track what Kestrel pays for, for costings and for tax. Steve (16th November 2026): keep this current every time a plan starts, changes or is cancelled.

**How to use it.** Add a row when something is signed up for, change the status when it changes, and file every invoice (the PDF from the service, not a card statement line) in 1 folder per year, for example `Kestrel invoices/2026/`. Canadian record keeping asks for 6 years. Amounts are before HST unless noted. "USD" lines are converted at the card's rate, so keep the card statement amount too.

**For the accountant.** Once the corporation and its HST account exist (`docs/business-setup-notes.md`), the HST paid on these bills can be claimed back as input tax credits, but only with a proper invoice in the corporation's name. Until then, note which card or account paid each bill, and move billing to the corporation when it exists. Overseas services (Vercel, Supabase, Anthropic, Resend, Slack) usually charge no Canadian HST, and the accountant decides how to treat that.

## Paying now

| Service | What it does for Kestrel | Plan | Price | Billed | Started | Status | Paid by | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Vercel | Hosts the live site and the demo | Pro | US$22.65 a month (Steve, 16th November 2026; the list price is US$20 a seat, the rest is to confirm from the invoice) | Monthly | November 2026 | Active | To confirm | Hobby is non commercial, so Pro is needed from launch. Both Vercel projects (live and demo) sit under it. |
| Namecheap | The eyecarejobs.ca domain and DNS records | Domain registration | To confirm | Yearly | 2026 | Active | To confirm | Renewal date to confirm. Turn on auto renew or diarise it, since losing the domain loses the site and email. |

## Planned or probably signed up for (confirm each one)

Prices below are published list prices or figures already in the plan, not invoices. Replace each with the real amount once the first invoice is in.

| Service | What it does | Plan | Expected price | Status to confirm | Notes |
| --- | --- | --- | --- | --- | --- |
| Supabase | Database, sign in, resume storage (Canadian region) | Pro, for the live project | US$25 a month | Free until launch? Pro needed before launch for backups and a restore test | The demo project is a second project. Check whether it is on the free plan (it pauses when idle) or paid. |
| Resend | Automatic email from mail.eyecarejobs.ca (sign up, alerts, first week emails) | Free, moving to paid | Free now, about US$20 a month for the Pro plan | Paid Resend is a launch gate task | The free plan has a daily send cap. Supabase sign up emails go through it too. |
| Google Workspace | Steve's addresses and aliases at eyecarejobs.ca (steve@, hello@, support@) | Business Starter | About CA$8 to CA$10 a user a month | Active? | Each alias is free. A separate user costs more. Keep it separate from every other business Steve works for. |
| Anthropic API | The ad builder, careers page reader and the province search | Pay as you go | A few dollars a month, set a monthly spend limit | Active | Billed by use, so the amount moves. Keep the spend limit on the key (`docs/security.md`). |
| Claude (Steve's plan) | The assistant that builds and maintains the code | Pro or Max | To confirm | Active | A business cost if used only for Kestrel. Confirm the plan and keep the invoice. |
| Stripe | Card payments for posts and passes | No monthly fee | 2.9% plus CA$0.30 a payment, plus Stripe Tax if switched on (about 0.5% of the transaction) | Test mode now | Fees come out of payouts, so record the gross sale and the fee separately, not just the net deposit. |
| Slack | Alerts to Steve's phone | Free | Free | Active | The free plan keeps limited history. Paid is not needed. |
| Cloudflare Turnstile | Bot check on forms | Free | Free | Active | |
| Google Search Console and Bing Webmaster Tools | Search reporting | Free | Free | Active | |
| GitHub | Code storage | Free, or Team once the repository moves to the Kestrel organisation | Free to about US$4 a user a month | Free now | Hobby cannot deploy private organisation repositories, so the move is part of the launch gate. |

## Likely costs still to come

| Item | Why | Rough size | Notes |
| --- | --- | --- | --- |
| Incorporation | The company that holds the brand, code and domain | One off, plus a yearly filing | Ask the accountant first (`docs/business-setup-notes.md`). |
| Accountant | HST registration, year end, tax | One off setup plus yearly | Not a subscription, but part of the running costs. |
| Lawyer | Terms, privacy policy, review pack | One off | Kestrel has no lawyer yet (`docs/legal/`). |
| Extra domains | kestreljobs.ca and kestreleyecare.ca | About CA$15 to CA$20 each a year | Optional, from the plan. |
| Pushover | Phone alerts as a second destination | About US$5 once | Optional, only if wanted beside Slack. |
| Paid search or social ads | Launch marketing | A budget Steve sets | Track each ad platform as its own line. |
| Virtual assistant | Found listings and outreach lists | Hourly or monthly | A contractor, not a subscription. Keep their invoices with these. |
| Google Play and Apple developer accounts | Only if the home screen app goes to the app stores | About US$25 once for Google, US$99 a year for Apple | After launch, if at all. |

## Plan figures

`docs/PLAN.md` budgets about CA$65 a month at launch: Vercel Pro US$20, Supabase Pro US$25, and a few dollars of email and AI. With Vercel at US$22.65, Resend Pro and Google Workspace added, the real figure is closer to CA$130 to CA$150 a month, still well inside the $10,000 a year ceiling. Update the plan figure once the invoices are in.

## Month by month log

Add 1 line per bill as it arrives (date, service, amount in the billed currency, CAD amount on the card, HST if any, invoice filed yes or no).

| Date | Service | Amount | CAD on card | HST | Invoice filed |
| --- | --- | --- | --- | --- | --- |
| November 2026 | Vercel Pro | US$22.65 | To confirm | None | To do |
