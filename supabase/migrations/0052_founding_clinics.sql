-- 0052: Founding clinics (Steve, 14th November 2026; step 5 of docs/plans/stripe-plan.md). Safe to run twice.
--
-- The first 50 clinic locations to have a job approved during the free launch are Founding clinics, in the order of that first approved job. Each
-- location counts once. A Founding clinic gets a mark on its public clinic page for good, and the founding price lock if it takes a pass while the
-- launch offer is open. Only the website's server reads and writes the list: the mark on the public page is added by the server, so visitors get
-- no access to this table.

create table if not exists public.founding_clinics (
  employer_id      uuid primary key references public.employers (id) on delete cascade,
  founding_number  integer not null unique check (founding_number between 1 and 50),
  claimed_at       timestamptz not null default now(),
  welcome_sent_at  timestamptz
);
alter table public.founding_clinics enable row level security;
revoke all on public.founding_clinics from anon, authenticated;

-- Takes the next place for a location, or returns the one it already has, or null when all places are taken. Two clinics approved at the same moment
-- cannot take the same number: the lock makes them queue. For the server only.
create or replace function public.claim_founding_place(emp uuid, max_places integer default 50)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  existing integer;
  taken integer;
  nxt integer;
begin
  perform pg_advisory_xact_lock(520052);
  select founding_number into existing from public.founding_clinics where employer_id = emp;
  if existing is not null then
    return existing;
  end if;
  select count(*) into taken from public.founding_clinics;
  if taken >= max_places then
    return null;
  end if;
  select coalesce(max(founding_number), 0) + 1 into nxt from public.founding_clinics;
  if nxt > max_places then
    return null;
  end if;
  insert into public.founding_clinics (employer_id, founding_number) values (emp, nxt);
  return nxt;
end;
$$;
revoke execute on function public.claim_founding_place(uuid, integer) from public, anon, authenticated;

-- Clinics that already have an approved job take their places now, in the order of their first approved job. Suppliers and manufacturers are not clinics.
do $$
declare
  r record;
begin
  for r in
    select e.id
    from public.employers e
    join public.jobs j on j.employer_id = e.id
    where j.posted_at is not null and e.practice_type in ('independent', 'corporate')
    group by e.id
    order by min(j.posted_at)
    limit 50
  loop
    perform public.claim_founding_place(r.id, 50);
  end loop;
end $$;

-- What a founding pass remembers: that it is a founding pass, until when its price is locked, the Stripe schedule that moves it to the price in force,
-- and which of the 2 emails about it have been sent. A clinic can read whether it is founding and the lock date for its own pass.
alter table public.location_passes
  add column if not exists founding boolean not null default false,
  add column if not exists price_locked_until timestamptz,
  add column if not exists stripe_schedule_id text,
  add column if not exists thanks_sent_at timestamptz,
  add column if not exists reminder_sent_at timestamptz;
grant select (founding, price_locked_until) on public.location_passes to authenticated;
