-- 1. A clinic can edit a live job. The edit sends it back to review, so nothing changes on the public
--    site until a person has read it. The 30 days it started with keep running (only an admin can change the dates).
-- 2. The waitlist confirms email addresses with a link. Safe to run more than once.

create or replace function public.enforce_job_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  if (select auth.uid()) is null or public.is_admin() then
    return new;
  end if;

  if new.status <> old.status and not (
       (old.status = 'draft' and new.status = 'in_review')
    or (old.status = 'rejected' and new.status in ('draft', 'in_review'))
    or (old.status = 'in_review' and new.status = 'draft')
    or (old.status = 'live' and new.status in ('closed', 'in_review'))
  ) then
    raise exception 'That change is not allowed.';
  end if;

  if new.status = old.status and old.status in ('in_review', 'live', 'closed', 'expired')
     and (to_jsonb(new) - 'updated_at') <> (to_jsonb(old) - 'updated_at') then
    raise exception 'This job can no longer be edited.';
  end if;
  return new;
end;
$$;

alter table public.waitlist add column if not exists confirmed_at timestamptz;
alter table public.waitlist add column if not exists confirmation_sent_at timestamptz;
