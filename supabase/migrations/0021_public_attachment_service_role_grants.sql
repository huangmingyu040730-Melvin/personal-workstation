-- Phase 2R-A-4A hotfix: allow server-side public attachment checks to use
-- the Supabase service role without changing public RLS or Storage policies.

grant select
on table
  public.projects,
  public.publications,
  public.knowledge_notes,
  public.skills,
  public.documents,
  public.document_asset_links
to service_role;
