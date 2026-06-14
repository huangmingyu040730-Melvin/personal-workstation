-- Phase 2R-Z: remove external access requests, viewer login grants and restricted visibility.
-- Apply after 0021_public_attachment_service_role_grants.sql.

update public.projects
set visibility = 'private'
where visibility = 'restricted';

update public.publications
set visibility = 'private'
where visibility = 'restricted';

update public.knowledge_notes
set visibility = 'private'
where visibility = 'restricted';

update public.skills
set visibility = 'private'
where visibility = 'restricted';

drop policy if exists "Public can read public projects" on public.projects;
create policy "Public can read public projects"
on public.projects
for select
using (
  visibility = 'public'
  or public.is_admin()
);

drop policy if exists "Public can read public publications" on public.publications;
create policy "Public can read public publications"
on public.publications
for select
using (
  visibility = 'public'
  or public.is_admin()
);

drop policy if exists "Public can read public notes" on public.knowledge_notes;
create policy "Public can read public notes"
on public.knowledge_notes
for select
using (
  visibility = 'public'
  or public.is_admin()
);

drop policy if exists "Public can read public skills" on public.skills;
create policy "Public can read public skills"
on public.skills
for select
using (
  visibility = 'public'
  or public.is_admin()
);

alter table public.projects drop constraint if exists projects_visibility_check;
alter table public.projects
add constraint projects_visibility_check check (visibility in ('public', 'private', 'unlisted'));

alter table public.publications drop constraint if exists publications_visibility_check;
alter table public.publications
add constraint publications_visibility_check check (visibility in ('public', 'private', 'unlisted'));

alter table public.knowledge_notes drop constraint if exists knowledge_notes_visibility_check;
alter table public.knowledge_notes
add constraint knowledge_notes_visibility_check check (visibility in ('public', 'private', 'unlisted'));

alter table public.skills drop constraint if exists skills_visibility_check;
alter table public.skills
add constraint skills_visibility_check check (visibility in ('public', 'private', 'unlisted'));

drop function if exists public.can_request_viewer_login(text);
drop function if exists public.has_content_access(text, uuid);

drop table if exists public.content_access_grants cascade;
drop table if exists public.access_requests cascade;
