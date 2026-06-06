-- Phase 2E-B: restricted content access MVP.
-- Apply after 0001, 0002, 0003 and 0004.

alter table public.projects drop constraint if exists projects_visibility_check;
alter table public.projects
add constraint projects_visibility_check check (visibility in ('public', 'private', 'unlisted', 'restricted'));

alter table public.publications drop constraint if exists publications_visibility_check;
alter table public.publications
add constraint publications_visibility_check check (visibility in ('public', 'private', 'unlisted', 'restricted'));

alter table public.knowledge_notes drop constraint if exists knowledge_notes_visibility_check;
alter table public.knowledge_notes
add constraint knowledge_notes_visibility_check check (visibility in ('public', 'private', 'unlisted', 'restricted'));

alter table public.skills drop constraint if exists skills_visibility_check;
alter table public.skills
add constraint skills_visibility_check check (visibility in ('public', 'private', 'unlisted', 'restricted'));

create table if not exists public.content_access_grants (
  id uuid primary key default gen_random_uuid(),
  grantee_email text not null check (char_length(grantee_email) between 3 and 160),
  content_type text not null check (content_type in ('project', 'publication', 'skill', 'knowledge')),
  content_id uuid not null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  expires_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists content_access_grants_active_unique_idx
on public.content_access_grants(lower(grantee_email), content_type, content_id)
where status = 'active';

create index if not exists content_access_grants_email_idx on public.content_access_grants(lower(grantee_email));
create index if not exists content_access_grants_content_idx on public.content_access_grants(content_type, content_id);
create index if not exists content_access_grants_status_idx on public.content_access_grants(status);
create index if not exists content_access_grants_expires_at_idx on public.content_access_grants(expires_at);
create index if not exists content_access_grants_updated_at_idx on public.content_access_grants(updated_at desc);

drop trigger if exists content_access_grants_set_updated_at on public.content_access_grants;
create trigger content_access_grants_set_updated_at
before update on public.content_access_grants
for each row execute function public.set_updated_at();

alter table public.content_access_grants enable row level security;

create or replace function public.has_content_access(target_content_type text, target_content_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.content_access_grants grants
      where grants.content_type = target_content_type
        and grants.content_id = target_content_id
        and grants.status = 'active'
        and lower(grants.grantee_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and (grants.expires_at is null or grants.expires_at > now())
    );
$$;

revoke all on function public.has_content_access(text, uuid) from public;
grant execute on function public.has_content_access(text, uuid) to anon, authenticated;

revoke all on table public.content_access_grants from anon;
revoke all on table public.content_access_grants from public;

drop policy if exists "Admins can manage content access grants" on public.content_access_grants;
create policy "Admins can manage content access grants"
on public.content_access_grants
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Grantees can read own active content grants" on public.content_access_grants;
create policy "Grantees can read own active content grants"
on public.content_access_grants
for select
to authenticated
using (
  status = 'active'
  and lower(grantee_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  and (expires_at is null or expires_at > now())
);

grant select, insert, update, delete on table public.content_access_grants to authenticated;

drop policy if exists "Public can read public projects" on public.projects;
create policy "Public can read public projects"
on public.projects
for select
using (
  visibility = 'public'
  or (
    visibility = 'restricted'
    and public.has_content_access('project', id)
  )
  or public.is_admin()
);

drop policy if exists "Public can read public publications" on public.publications;
create policy "Public can read public publications"
on public.publications
for select
using (
  visibility = 'public'
  or (
    visibility = 'restricted'
    and public.has_content_access('publication', id)
  )
  or public.is_admin()
);

drop policy if exists "Public can read public notes" on public.knowledge_notes;
create policy "Public can read public notes"
on public.knowledge_notes
for select
using (
  visibility = 'public'
  or (
    visibility = 'restricted'
    and public.has_content_access('knowledge', id)
  )
  or public.is_admin()
);

drop policy if exists "Public can read public skills" on public.skills;
create policy "Public can read public skills"
on public.skills
for select
using (
  visibility = 'public'
  or (
    visibility = 'restricted'
    and public.has_content_access('skill', id)
  )
  or public.is_admin()
);
