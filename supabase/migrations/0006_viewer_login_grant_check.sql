-- Phase 2E-B hotfix: allow viewer login to check whether an email has any active grant.
-- Apply after 0005_restricted_content_access.sql.

create or replace function public.can_request_viewer_login(viewer_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.content_access_grants grants
    where lower(grants.grantee_email) = lower(btrim(coalesce(viewer_email, '')))
      and grants.status = 'active'
      and (grants.expires_at is null or grants.expires_at > now())
  );
$$;

revoke all on function public.can_request_viewer_login(text) from public;
grant execute on function public.can_request_viewer_login(text) to anon, authenticated;
