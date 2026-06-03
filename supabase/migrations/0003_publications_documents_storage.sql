-- Phase 2C: private document storage for the personal workstation.
-- This migration must be applied after 0001_initial_schema.sql and
-- 0002_grant_api_table_privileges.sql.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'workspace-files',
  'workspace-files',
  false,
  20971520,
  array[
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
    'application/csv',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can read workspace files'
  ) then
    create policy "Admins can read workspace files"
    on storage.objects
    for select
    using (
      bucket_id = 'workspace-files'
      and public.is_admin()
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can upload workspace files'
  ) then
    create policy "Admins can upload workspace files"
    on storage.objects
    for insert
    with check (
      bucket_id = 'workspace-files'
      and public.is_admin()
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can update workspace files'
  ) then
    create policy "Admins can update workspace files"
    on storage.objects
    for update
    using (
      bucket_id = 'workspace-files'
      and public.is_admin()
    )
    with check (
      bucket_id = 'workspace-files'
      and public.is_admin()
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can delete workspace files'
  ) then
    create policy "Admins can delete workspace files"
    on storage.objects
    for delete
    using (
      bucket_id = 'workspace-files'
      and public.is_admin()
    );
  end if;
end $$;
