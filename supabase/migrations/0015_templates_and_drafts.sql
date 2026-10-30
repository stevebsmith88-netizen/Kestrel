-- Saved templates and drafts. Safe to run more than once.
--  * job_templates: a clinic keeps up to 20 job templates to start new posts from.
--  * cover_letter_templates: a candidate keeps up to 5 cover letters to start from.
--  * application_drafts: a candidate's half written cover letter for a job, to come back to.
-- Each person can only see and change their own.

create or replace function public.touch_row()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- job templates
-- The two questions every post must answer (existing vacancy, AI screening) are deliberately not saved,
-- so they are answered fresh for each post.
create table if not exists public.job_templates (
  id              uuid primary key default gen_random_uuid(),
  employer_id     uuid not null references public.employers (id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 80),
  title           text check (title is null or char_length(title) <= 120),
  role_category   text check (role_category is null or role_category in (
                    'Optometrist', 'Optician', 'Optometric assistant or technician',
                    'Practice or clinic manager', 'Patient care or reception',
                    'Sales or territory representative', 'Trainer or clinical educator',
                    'Field service or equipment technician', 'Account or practice development manager')),
  employment_type text check (employment_type is null or employment_type in ('Full time', 'Part time', 'Locum', 'Contract')),
  province        text,
  city            text check (city is null or char_length(city) <= 80),
  pay_period      text check (pay_period is null or pay_period in ('year', 'hour')),
  pay_min         numeric(10, 2) check (pay_min is null or pay_min > 0),
  pay_max         numeric(10, 2) check (pay_max is null or pay_max > 0),
  description     text check (description is null or char_length(description) <= 8000),
  apply_method    text not null default 'kestrel' check (apply_method in ('kestrel', 'external')),
  apply_url       text check (apply_url is null or char_length(apply_url) <= 500),
  work_arrangement text not null default 'on_site' check (work_arrangement in ('on_site', 'field')),
  territory       text check (territory is null or char_length(territory) <= 200),
  pay_extras      text check (pay_extras is null or char_length(pay_extras) <= 300),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (employer_id, name)
);

create or replace function public.limit_job_templates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.job_templates where employer_id = new.employer_id) >= 20 then
    raise exception 'You can save up to 20 templates. Delete one to add another.';
  end if;
  return new;
end;
$$;

drop trigger if exists job_templates_limit on public.job_templates;
create trigger job_templates_limit before insert on public.job_templates for each row execute function public.limit_job_templates();
drop trigger if exists job_templates_touch on public.job_templates;
create trigger job_templates_touch before update on public.job_templates for each row execute function public.touch_row();

alter table public.job_templates enable row level security;
drop policy if exists "Clinics can read their templates" on public.job_templates;
create policy "Clinics can read their templates" on public.job_templates for select to authenticated using (public.owns_employer(employer_id));
drop policy if exists "Clinics can add templates" on public.job_templates;
create policy "Clinics can add templates" on public.job_templates for insert to authenticated with check (public.owns_employer(employer_id));
drop policy if exists "Clinics can change their templates" on public.job_templates;
create policy "Clinics can change their templates" on public.job_templates for update to authenticated using (public.owns_employer(employer_id)) with check (public.owns_employer(employer_id));
drop policy if exists "Clinics can delete their templates" on public.job_templates;
create policy "Clinics can delete their templates" on public.job_templates for delete to authenticated using (public.owns_employer(employer_id));

revoke all on public.job_templates from anon, authenticated;
grant select, delete on public.job_templates to authenticated;
grant insert (employer_id, name, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, description, apply_method, apply_url, work_arrangement, territory, pay_extras)
  on public.job_templates to authenticated;
grant update (name, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, description, apply_method, apply_url, work_arrangement, territory, pay_extras)
  on public.job_templates to authenticated;

-- ---------------------------------------------------------------- cover letter templates
create table if not exists public.cover_letter_templates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  body       text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create or replace function public.limit_cover_letter_templates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.cover_letter_templates where user_id = new.user_id) >= 5 then
    raise exception 'You can save up to 5 cover letters. Delete one to add another.';
  end if;
  return new;
end;
$$;

drop trigger if exists cover_letter_templates_limit on public.cover_letter_templates;
create trigger cover_letter_templates_limit before insert on public.cover_letter_templates for each row execute function public.limit_cover_letter_templates();
drop trigger if exists cover_letter_templates_touch on public.cover_letter_templates;
create trigger cover_letter_templates_touch before update on public.cover_letter_templates for each row execute function public.touch_row();

alter table public.cover_letter_templates enable row level security;
drop policy if exists "People can read their cover letters" on public.cover_letter_templates;
create policy "People can read their cover letters" on public.cover_letter_templates for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "People can add cover letters" on public.cover_letter_templates;
create policy "People can add cover letters" on public.cover_letter_templates for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "People can change their cover letters" on public.cover_letter_templates;
create policy "People can change their cover letters" on public.cover_letter_templates for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "People can delete their cover letters" on public.cover_letter_templates;
create policy "People can delete their cover letters" on public.cover_letter_templates for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.cover_letter_templates from anon, authenticated;
grant select, delete on public.cover_letter_templates to authenticated;
grant insert (user_id, name, body) on public.cover_letter_templates to authenticated;
grant update (name, body) on public.cover_letter_templates to authenticated;

-- ---------------------------------------------------------------- application drafts
create table if not exists public.application_drafts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  job_id       uuid not null references public.jobs (id) on delete cascade,
  cover_letter text not null default '' check (char_length(cover_letter) <= 5000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, job_id)
);

create or replace function public.limit_application_drafts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.application_drafts where user_id = new.user_id) >= 50 then
    raise exception 'You have a lot of saved drafts. Finish or delete some first.';
  end if;
  return new;
end;
$$;

drop trigger if exists application_drafts_limit on public.application_drafts;
create trigger application_drafts_limit before insert on public.application_drafts for each row execute function public.limit_application_drafts();
drop trigger if exists application_drafts_touch on public.application_drafts;
create trigger application_drafts_touch before update on public.application_drafts for each row execute function public.touch_row();

alter table public.application_drafts enable row level security;
drop policy if exists "People can read their drafts" on public.application_drafts;
create policy "People can read their drafts" on public.application_drafts for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "People can add drafts" on public.application_drafts;
create policy "People can add drafts" on public.application_drafts for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "People can change their drafts" on public.application_drafts;
create policy "People can change their drafts" on public.application_drafts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "People can delete their drafts" on public.application_drafts;
create policy "People can delete their drafts" on public.application_drafts for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.application_drafts from anon, authenticated;
grant select, delete on public.application_drafts to authenticated;
grant insert (user_id, job_id, cover_letter) on public.application_drafts to authenticated;
grant update (cover_letter) on public.application_drafts to authenticated;

revoke execute on function public.limit_job_templates() from public, anon, authenticated;
revoke execute on function public.limit_cover_letter_templates() from public, anon, authenticated;
revoke execute on function public.limit_application_drafts() from public, anon, authenticated;
