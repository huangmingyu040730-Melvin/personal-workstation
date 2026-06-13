-- Phase 2Q-B-1: explicit research asset links for admin workspace.
-- Documents stay on documents.related_type / related_id and document_collections.related_type / related_id.

create table if not exists public.research_asset_links (
  id uuid primary key default gen_random_uuid(),
  source_type text not null
    check (source_type in ('project', 'knowledge', 'skill', 'publication')),
  source_id uuid not null,
  target_type text not null
    check (target_type in ('project', 'knowledge', 'skill', 'publication')),
  target_id uuid not null,
  relation_type text not null default 'related'
    check (relation_type in ('related', 'supports', 'references', 'uses', 'produces', 'derived_from')),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint research_asset_links_no_self_link
    check (source_type <> target_type or source_id <> target_id),
  constraint research_asset_links_unique_relation
    unique (source_type, source_id, target_type, target_id, relation_type)
);

create index if not exists research_asset_links_source_idx
on public.research_asset_links(source_type, source_id);

create index if not exists research_asset_links_target_idx
on public.research_asset_links(target_type, target_id);

create index if not exists research_asset_links_relation_type_idx
on public.research_asset_links(relation_type);

create index if not exists research_asset_links_created_at_idx
on public.research_asset_links(created_at desc);

drop trigger if exists research_asset_links_set_updated_at on public.research_asset_links;

create trigger research_asset_links_set_updated_at
before update on public.research_asset_links
for each row execute function public.set_updated_at();

alter table public.research_asset_links enable row level security;

drop policy if exists "Admins can manage research asset links" on public.research_asset_links;
create policy "Admins can manage research asset links"
on public.research_asset_links
for all
using (public.is_admin())
with check (public.is_admin());

revoke all on table public.research_asset_links from anon;
revoke all on table public.research_asset_links from public;
grant select, insert, update, delete on table public.research_asset_links to authenticated;
