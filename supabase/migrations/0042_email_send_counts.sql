-- 0042: 1 count of the emails Kestrel's website sends each day (audit P1-24, Phase E, 12th November 2026).
-- Every email the website sends goes through 1 place (lib/email.ts), which adds 1 here after a send. The daily job reads today's count
-- first, so it only uses what button presses (a clinic declining 100 applicants, new applications) have left of DAILY_EMAIL_BUDGET.
-- When the day's total reaches 80% of that budget, Steve is emailed once that day. Days run on Toronto time.
-- Supabase's own sign up and password emails do not pass through the website, so they are not counted here.
-- Only the website's server key can read or add to it. Nobody's data is changed. Safe to run more than once.

create table if not exists public.email_send_counts (
  day       date primary key,
  sent      integer not null default 0 check (sent >= 0),
  warned_at timestamptz
);
alter table public.email_send_counts enable row level security;
revoke all on public.email_send_counts from public, anon, authenticated;

-- Adds 1 to today's count and returns the new total, and whether this send is the one that should warn Steve (true once a day, the
-- first time the total reaches 80% of the budget given, rounded up). Both happen in 1 step, so 2 sends at once cannot both warn.
create or replace function public.count_email_send(budget integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'America/Toronto')::date;
  total integer;
  warn  boolean := false;
  limit_at integer := greatest(1, ceil(greatest(budget, 0) * 0.8)::integer);
begin
  insert into public.email_send_counts (day, sent) values (today, 1)
  on conflict (day) do update set sent = public.email_send_counts.sent + 1
  returning sent into total;
  if total >= limit_at then
    update public.email_send_counts set warned_at = now() where day = today and warned_at is null;
    warn := found;
  end if;
  return jsonb_build_object('sent', total, 'warn', warn);
end;
$$;
revoke execute on function public.count_email_send(integer) from public, anon, authenticated;
grant execute on function public.count_email_send(integer) to service_role;

-- Old days are not needed for long: anything older than 90 days is removed each time this file is run.
delete from public.email_send_counts where day < (now() at time zone 'America/Toronto')::date - 90;
