-- 0032: where a waitlist sign up came from (marketing audit item 2).
-- The first visit of the browser session is saved with the sign up: the link tags (utm_source, utm_medium, utm_campaign),
-- the website that sent the visitor, and the page they landed on. No query strings are kept, so nothing personal can be
-- saved by accident. Safe to run more than once. Run it on BOTH databases (live and demo).

alter table public.waitlist
  add column if not exists utm_source    text check (utm_source is null or char_length(utm_source) <= 60),
  add column if not exists utm_medium    text check (utm_medium is null or char_length(utm_medium) <= 60),
  add column if not exists utm_campaign  text check (utm_campaign is null or char_length(utm_campaign) <= 60),
  add column if not exists referrer_host text check (referrer_host is null or char_length(referrer_host) <= 100),
  add column if not exists landing_path  text check (landing_path is null or char_length(landing_path) <= 120);
