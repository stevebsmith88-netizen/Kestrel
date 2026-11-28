-- 0050: invoices and receipts (Steve, 14th November 2026; item 13 of the Next tasks). Safe to run twice.
--
-- When a job is approved the saved card is now charged through a Stripe invoice, which has its own number, a web page and a PDF (and carries HST
-- once Stripe Tax is on). These columns keep the invoice for each payment. A clinic can read the number and the 2 links for its own payments,
-- so it can open or download a receipt again; the Stripe invoice id stays for the website's server only.

alter table public.job_payments
  add column if not exists stripe_invoice_id text,
  add column if not exists invoice_number text,
  add column if not exists invoice_url text,
  add column if not exists invoice_pdf_url text;

grant select (invoice_number, invoice_url, invoice_pdf_url) on public.job_payments to authenticated;
