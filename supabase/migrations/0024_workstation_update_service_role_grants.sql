-- v1.2.5: Workstation update API service-role grants and PATCH log support.
-- This migration only enables the server-side Workstation Admin API to update
-- whitelisted asset metadata columns and record PATCH operation logs.
-- It does not modify RLS, Storage policies, buckets, Documents, public download
-- routes, visibility values, or existing data.

alter table public.workstation_operation_logs
  drop constraint if exists workstation_operation_logs_method_check;

alter table public.workstation_operation_logs
  add constraint workstation_operation_logs_method_check
  check (method in ('GET', 'POST', 'PATCH'));

grant select on table public.projects to service_role;

grant update (
  title,
  summary,
  status,
  tags,
  background,
  research_question,
  methodology
) on table public.projects to service_role;

grant select on table public.knowledge_notes to service_role;

grant update (
  title,
  category,
  excerpt,
  content,
  tags,
  project_id
) on table public.knowledge_notes to service_role;

grant select on table public.skills to service_role;

grant update (
  name,
  description,
  category,
  platforms,
  status,
  content,
  usage_guide,
  input_description,
  output_description,
  current_version,
  repository_url
) on table public.skills to service_role;
