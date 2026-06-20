-- v1.2.7: allow Workstation Admin API to update project progress and start_date.
-- This migration only grants service_role update permission for existing project metadata columns.
-- It does not add columns, change RLS, modify Storage, public download routes, Documents, or visibility behavior.

grant update (
  progress,
  start_date
) on table public.projects to service_role;
