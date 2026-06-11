-- Phase 2P-A: document collections and folder upload metadata.
-- This migration keeps existing document rows and storage objects intact.

create table if not exists public.document_collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  collection_type text not null default 'folder_upload'
    check (collection_type in ('folder_upload', 'attachment_bundle', 'skill_package', 'general_batch')),
  related_type text,
  related_id uuid,
  root_folder_name text,
  file_count integer not null default 0,
  total_size bigint not null default 0,
  visibility text not null default 'private'
    check (visibility in ('public', 'private', 'unlisted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents
  add column if not exists collection_id uuid references public.document_collections(id) on delete set null,
  add column if not exists original_name text,
  add column if not exists relative_path text,
  add column if not exists folder_path text;

create index if not exists document_collections_related_idx
on public.document_collections(related_type, related_id);

create index if not exists document_collections_owner_id_idx
on public.document_collections(owner_id);

create index if not exists document_collections_updated_at_idx
on public.document_collections(updated_at desc);

create index if not exists documents_collection_id_idx
on public.documents(collection_id);

drop trigger if exists document_collections_set_updated_at on public.document_collections;

create trigger document_collections_set_updated_at
before update on public.document_collections
for each row execute function public.set_updated_at();

alter table public.document_collections enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'document_collections'
      and policyname = 'Admins can manage document collections'
  ) then
    create policy "Admins can manage document collections"
    on public.document_collections
    for all
    using (public.is_admin())
    with check (public.is_admin());
  end if;
end $$;

grant select, insert, update, delete
on table public.document_collections
to authenticated;

revoke all
on table public.document_collections
from anon;

update storage.buckets
set
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/markdown',
    'text/plain',
    'text/csv',
    'text/tab-separated-values',
    'application/csv',
    'application/json',
    'text/json',
    'application/x-ipynb+json',
    'application/yaml',
    'application/x-yaml',
    'text/yaml',
    'text/x-yaml',
    'text/javascript',
    'application/javascript',
    'application/typescript',
    'video/mp2t',
    'text/x-python',
    'text/x-r-source',
    'application/sql',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-tar',
    'application/gzip',
    'application/x-gzip',
    'application/x-7z-compressed'
  ]::text[]
where id = 'workspace-files';
