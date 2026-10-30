-- Small additions for the automatic housekeeping and the ad builder. Safe to run more than once.

-- When a clinic was last reminded that an application is still unopened.
alter table public.applications add column if not exists reminded_at timestamptz;

-- Every time someone uses the ad builder, so use can be capped. Server only.
create table if not exists public.ad_builder_uses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists ad_builder_uses_user_idx on public.ad_builder_uses (user_id, created_at desc);

alter table public.ad_builder_uses enable row level security;
revoke all on public.ad_builder_uses from anon, authenticated;
