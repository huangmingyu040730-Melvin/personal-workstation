-- Phase 2P-G-1: multi-asset associations for Documents and Document Collections.
-- Documents stay outside research_asset_links; legacy related_type / related_id fields remain for compatibility.

create table if not exists public.document_asset_links (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  asset_type text not null
    check (asset_type in ('project', 'knowledge', 'skill', 'publication')),
  asset_id uuid not null,
  relation_type text not null default 'related'
    check (relation_type in ('related', 'source_material', 'supporting_material', 'deliverable', 'reference', 'input', 'output')),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_asset_links_unique_relation
    unique (document_id, asset_type, asset_id, relation_type)
);

create table if not exists public.document_collection_asset_links (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.document_collections(id) on delete cascade,
  asset_type text not null
    check (asset_type in ('project', 'knowledge', 'skill', 'publication')),
  asset_id uuid not null,
  relation_type text not null default 'related'
    check (relation_type in ('related', 'source_material', 'supporting_material', 'deliverable', 'reference', 'input', 'output')),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_collection_asset_links_unique_relation
    unique (collection_id, asset_type, asset_id, relation_type)
);

create index if not exists document_asset_links_document_id_idx
on public.document_asset_links(document_id);

create index if not exists document_asset_links_asset_idx
on public.document_asset_links(asset_type, asset_id);

create index if not exists document_asset_links_relation_type_idx
on public.document_asset_links(relation_type);

create index if not exists document_asset_links_created_at_idx
on public.document_asset_links(created_at desc);

create index if not exists document_collection_asset_links_collection_id_idx
on public.document_collection_asset_links(collection_id);

create index if not exists document_collection_asset_links_asset_idx
on public.document_collection_asset_links(asset_type, asset_id);

create index if not exists document_collection_asset_links_relation_type_idx
on public.document_collection_asset_links(relation_type);

create index if not exists document_collection_asset_links_created_at_idx
on public.document_collection_asset_links(created_at desc);

drop trigger if exists document_asset_links_set_updated_at on public.document_asset_links;

create trigger document_asset_links_set_updated_at
before update on public.document_asset_links
for each row execute function public.set_updated_at();

drop trigger if exists document_collection_asset_links_set_updated_at on public.document_collection_asset_links;

create trigger document_collection_asset_links_set_updated_at
before update on public.document_collection_asset_links
for each row execute function public.set_updated_at();

alter table public.document_asset_links enable row level security;
alter table public.document_collection_asset_links enable row level security;

drop policy if exists "Admins can manage document asset links" on public.document_asset_links;
create policy "Admins can manage document asset links"
on public.document_asset_links
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage document collection asset links" on public.document_collection_asset_links;
create policy "Admins can manage document collection asset links"
on public.document_collection_asset_links
for all
using (public.is_admin())
with check (public.is_admin());

revoke all on table public.document_asset_links from anon;
revoke all on table public.document_asset_links from public;
grant select, insert, update, delete on table public.document_asset_links to authenticated;

revoke all on table public.document_collection_asset_links from anon;
revoke all on table public.document_collection_asset_links from public;
grant select, insert, update, delete on table public.document_collection_asset_links to authenticated;

insert into public.document_asset_links (
  document_id,
  asset_type,
  asset_id,
  relation_type,
  created_by,
  created_at,
  updated_at
)
select
  id,
  related_type,
  related_id,
  'related',
  owner_id,
  created_at,
  updated_at
from public.documents
where related_type in ('project', 'knowledge', 'skill', 'publication')
  and related_id is not null
on conflict (document_id, asset_type, asset_id, relation_type) do nothing;

insert into public.document_collection_asset_links (
  collection_id,
  asset_type,
  asset_id,
  relation_type,
  created_by,
  created_at,
  updated_at
)
select
  id,
  related_type,
  related_id,
  'related',
  owner_id,
  created_at,
  updated_at
from public.document_collections
where related_type in ('project', 'knowledge', 'skill', 'publication')
  and related_id is not null
on conflict (collection_id, asset_type, asset_id, relation_type) do nothing;
