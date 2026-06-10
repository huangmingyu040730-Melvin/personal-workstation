-- Phase 2L-A: private market brief management.
-- This migration must be applied after 0001 through 0012.

create table if not exists public.market_briefs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,

  brief_date date not null,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'published', 'archived')),
  market text not null default 'A股',

  summary text,
  market_overview text,
  index_performance text,
  style_performance text,
  sector_performance text,
  hot_topics text,
  capital_flows text,
  policy_news text,
  risk_alerts text,
  tomorrow_watch text,

  data_sources text[] not null default '{}',
  tags text[] not null default '{}',
  is_featured boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint market_briefs_owner_date_market_key unique (owner_id, brief_date, market)
);

create index if not exists market_briefs_owner_id_idx on public.market_briefs(owner_id);
create index if not exists market_briefs_brief_date_idx on public.market_briefs(brief_date desc);
create index if not exists market_briefs_status_idx on public.market_briefs(status);
create index if not exists market_briefs_tags_idx on public.market_briefs using gin(tags);

drop trigger if exists market_briefs_set_updated_at on public.market_briefs;
create trigger market_briefs_set_updated_at
before update on public.market_briefs
for each row execute function public.set_updated_at();

alter table public.market_briefs enable row level security;

drop policy if exists "Admins and owners can manage market briefs" on public.market_briefs;
create policy "Admins and owners can manage market briefs"
on public.market_briefs
for all
using (public.is_admin() or auth.uid() = owner_id)
with check (public.is_admin() or auth.uid() = owner_id);

revoke all on public.market_briefs from anon;
grant select, insert, update, delete on public.market_briefs to authenticated;
