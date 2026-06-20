-- v1.2.9 Workstation document upload API MVP grants.
-- This migration only grants the minimum table permissions needed by the
-- server-side upload-intent/finalize API. It does not change RLS, Storage
-- policies, bucket visibility, public download routes, file visibility, or
-- existing data.

grant select on table public.document_collections to service_role;

grant update (
  file_count,
  total_size,
  updated_at
) on table public.document_collections to service_role;

grant select (
  id,
  storage_bucket,
  storage_path,
  file_size,
  collection_id,
  name,
  visibility
) on table public.documents to service_role;

grant insert (
  name,
  category,
  storage_bucket,
  storage_path,
  file_size,
  mime_type,
  collection_id,
  original_name,
  relative_path,
  folder_path,
  related_type,
  related_id,
  visibility
) on table public.documents to service_role;
