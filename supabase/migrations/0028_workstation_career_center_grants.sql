-- Workstation Career Center API grants.
-- This migration grants only the service_role table privileges required by
-- token-protected Career API routes. It does not change RLS, public access,
-- Storage policies, bucket visibility, or existing data.

grant select on table public.profiles to service_role;
grant select on table public.admin_users to service_role;

grant select, delete on table public.resume_items to service_role;
grant insert (
  item_type,
  title,
  organization,
  role_title,
  location,
  start_date,
  end_date,
  is_current,
  summary,
  bullets,
  skills,
  tags,
  details,
  sort_order,
  visibility,
  is_featured,
  related_project_id,
  related_publication_id,
  related_knowledge_id,
  related_skill_id
) on table public.resume_items to service_role;
grant update (
  item_type,
  title,
  organization,
  role_title,
  location,
  start_date,
  end_date,
  is_current,
  summary,
  bullets,
  skills,
  tags,
  details,
  sort_order,
  is_featured,
  related_project_id,
  related_publication_id,
  related_knowledge_id,
  related_skill_id
) on table public.resume_items to service_role;

grant select, delete on table public.resume_versions to service_role;
grant insert (
  title,
  target_role,
  summary,
  language,
  template_key,
  visibility,
  is_active,
  is_featured,
  notes,
  profile_fields,
  section_order,
  template_options
) on table public.resume_versions to service_role;
grant update (
  title,
  target_role,
  summary,
  language,
  template_key,
  is_active,
  is_featured,
  notes,
  profile_fields,
  section_order,
  template_options
) on table public.resume_versions to service_role;

grant select, insert, update, delete on table public.resume_version_items to service_role;

grant select, delete on table public.resume_jd_reviews to service_role;
grant insert (
  owner_id,
  resume_version_id,
  company_name,
  job_title,
  job_direction,
  job_location,
  application_channel,
  jd_text,
  target_keywords,
  ai_result,
  match_summary,
  missing_keywords,
  matched_keywords,
  risks,
  next_actions,
  application_status,
  notes,
  model_name
) on table public.resume_jd_reviews to service_role;
grant update (
  company_name,
  job_title,
  job_direction,
  job_location,
  application_channel,
  application_status,
  notes
) on table public.resume_jd_reviews to service_role;

alter table public.workstation_operation_logs
  drop constraint if exists workstation_operation_logs_method_check;

alter table public.workstation_operation_logs
  add constraint workstation_operation_logs_method_check
  check (method in ('GET', 'POST', 'PATCH', 'DELETE'));
