-- v1.2.5 hotfix: consolidate Workstation service_role grants.
-- This migration only grants the minimum table/column permissions needed by
-- Workstation Admin API list/create/update/log operations.
-- It does not change RLS, Storage policies, bucket visibility, public download
-- routes, Documents behavior, visibility values, or existing data.

-- Project list/create/update
grant select on table public.projects to service_role;

grant insert (
  title,
  slug,
  summary,
  background,
  research_question,
  methodology,
  status,
  progress,
  tags,
  milestones,
  start_date,
  is_featured,
  visibility
) on table public.projects to service_role;

grant update (
  title,
  summary,
  status,
  tags,
  background,
  research_question,
  methodology
) on table public.projects to service_role;

-- Knowledge list/create/update
grant select on table public.knowledge_notes to service_role;

grant insert (
  title,
  slug,
  category,
  excerpt,
  content,
  tags,
  project_id,
  is_featured,
  visibility
) on table public.knowledge_notes to service_role;

grant update (
  title,
  category,
  excerpt,
  content,
  tags,
  project_id
) on table public.knowledge_notes to service_role;

-- Skill list/create/update
grant select on table public.skills to service_role;

grant insert (
  name,
  slug,
  description,
  content,
  category,
  platforms,
  status,
  current_version,
  input_description,
  output_description,
  usage_guide,
  skill_md_content,
  repository_url,
  is_featured,
  visibility
) on table public.skills to service_role;

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

-- Document collection metadata list
grant select on table public.document_collections to service_role;

-- Workstation operation logs
grant select, insert on table public.workstation_operation_logs to service_role;

-- Ensure operation logs can record PATCH requests as well as GET/POST.
alter table public.workstation_operation_logs
  drop constraint if exists workstation_operation_logs_method_check;

alter table public.workstation_operation_logs
  add constraint workstation_operation_logs_method_check
  check (method in ('GET', 'POST', 'PATCH'));
