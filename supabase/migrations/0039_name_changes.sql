-- 0039: the hold on changing your name (Steve, 12th November 2026).
--   * name_changed_at: when a person last changed their name. Every change, including the first, starts a 30 day hold before the
--     next one. Only the website's server writes it (there is no permission for signed in people to change it), so nobody can clear their own hold.
--   * To unlock someone early (a typo, a legal name change) after they write to hello@, run in the Supabase SQL editor:
--       update public.profiles set name_changed_at = null where id = (select id from auth.users where email = 'their@email.ca');
-- Nothing else changes, and nobody's name is changed. Safe to run more than once.

alter table public.profiles add column if not exists name_changed_at timestamptz;
