-- Phase 2N-A: market brief material package foundation.
-- This migration must be applied after 0016_market_brief_runner_service_role_grants.sql.

create table if not exists public.market_brief_material_packages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,

  package_date date not null,
  market text not null default 'A股',
  status text not null default 'ready',
  provider text,
  provider_label text,

  queries jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  source_snapshot jsonb not null default '{}'::jsonb,
  extracted_facts jsonb not null default '{}'::jsonb,
  warnings text[] not null default '{}',
  source_notes text[] not null default '{}',
  quality_score numeric,
  error_message text,

  collected_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint market_brief_material_packages_status_check
    check (status in ('collecting', 'ready', 'partial', 'failed', 'reviewed', 'archived')),
  constraint market_brief_material_packages_owner_date_market_key
    unique (owner_id, package_date, market)
);

create index if not exists market_brief_material_packages_owner_id_idx on public.market_brief_material_packages(owner_id);
create index if not exists market_brief_material_packages_package_date_idx on public.market_brief_material_packages(package_date desc);
create index if not exists market_brief_material_packages_status_idx on public.market_brief_material_packages(status);
create index if not exists market_brief_material_packages_market_idx on public.market_brief_material_packages(market);

drop trigger if exists market_brief_material_packages_set_updated_at on public.market_brief_material_packages;
create trigger market_brief_material_packages_set_updated_at
before update on public.market_brief_material_packages
for each row execute function public.set_updated_at();

alter table public.market_brief_material_packages enable row level security;

drop policy if exists "Admins and owners can manage market brief material packages" on public.market_brief_material_packages;
create policy "Admins and owners can manage market brief material packages"
on public.market_brief_material_packages
for all
using (public.is_admin() or auth.uid() = owner_id)
with check (public.is_admin() or auth.uid() = owner_id);

revoke all on public.market_brief_material_packages from anon;
grant select, insert, update, delete on public.market_brief_material_packages to authenticated;
