create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  email text,
  headline text,
  bio text,
  education text,
  research_interests text[] not null default '{}',
  skill_tags text[] not null default '{}',
  contact jsonb not null default '{}'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  avatar_url text,
  resume_url text,
  visibility text not null default 'private' check (visibility in ('public', 'private', 'unlisted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text not null,
  background text,
  research_question text,
  methodology text,
  status text not null,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  is_featured boolean not null default false,
  start_date date,
  tags text[] not null default '{}',
  milestones text[] not null default '{}',
  visibility text not null default 'private' check (visibility in ('public', 'private', 'unlisted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  publication_type text not null,
  summary text not null,
  abstract text,
  published_on date,
  tags text[] not null default '{}',
  cover_url text,
  file_path text,
  is_featured boolean not null default false,
  project_id uuid references public.projects(id) on delete set null,
  visibility text not null default 'private' check (visibility in ('public', 'private', 'unlisted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_notes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text not null,
  excerpt text,
  content text,
  tags text[] not null default '{}',
  is_featured boolean not null default false,
  project_id uuid references public.projects(id) on delete set null,
  visibility text not null default 'private' check (visibility in ('public', 'private', 'unlisted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  content text,
  category text not null,
  platforms text[] not null default '{}',
  status text not null,
  current_version text,
  input_description text,
  output_description text,
  usage_guide text,
  skill_md_content text,
  repository_url text,
  is_featured boolean not null default false,
  visibility text not null default 'private' check (visibility in ('public', 'private', 'unlisted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skill_versions (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  version text not null,
  notes text,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (skill_id, version)
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  event_type text,
  project_id uuid references public.projects(id) on delete set null,
  visibility text not null default 'private' check (visibility in ('public', 'private', 'unlisted')),
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  storage_bucket text,
  storage_path text,
  file_size bigint,
  mime_type text,
  related_type text,
  related_id uuid,
  visibility text not null default 'private' check (visibility in ('public', 'private', 'unlisted')),
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists profiles_visibility_idx on public.profiles(visibility);
create index if not exists profiles_updated_at_idx on public.profiles(updated_at desc);
create index if not exists projects_visibility_idx on public.projects(visibility);
create index if not exists projects_status_idx on public.projects(status);
create index if not exists projects_is_featured_idx on public.projects(is_featured);
create index if not exists projects_updated_at_idx on public.projects(updated_at desc);
create index if not exists publications_visibility_idx on public.publications(visibility);
create index if not exists publications_project_id_idx on public.publications(project_id);
create index if not exists publications_is_featured_idx on public.publications(is_featured);
create index if not exists publications_published_on_idx on public.publications(published_on desc);
create index if not exists publications_updated_at_idx on public.publications(updated_at desc);
create index if not exists knowledge_notes_visibility_idx on public.knowledge_notes(visibility);
create index if not exists knowledge_notes_project_id_idx on public.knowledge_notes(project_id);
create index if not exists knowledge_notes_is_featured_idx on public.knowledge_notes(is_featured);
create index if not exists knowledge_notes_updated_at_idx on public.knowledge_notes(updated_at desc);
create index if not exists skills_visibility_idx on public.skills(visibility);
create index if not exists skills_status_idx on public.skills(status);
create index if not exists skills_is_featured_idx on public.skills(is_featured);
create index if not exists skills_updated_at_idx on public.skills(updated_at desc);
create index if not exists skill_versions_skill_id_idx on public.skill_versions(skill_id);
create index if not exists skill_versions_updated_at_idx on public.skill_versions(updated_at desc);
create index if not exists calendar_events_starts_at_idx on public.calendar_events(starts_at);
create index if not exists calendar_events_owner_id_idx on public.calendar_events(owner_id);
create index if not exists calendar_events_project_id_idx on public.calendar_events(project_id);
create index if not exists calendar_events_updated_at_idx on public.calendar_events(updated_at desc);
create index if not exists documents_category_idx on public.documents(category);
create index if not exists documents_owner_id_idx on public.documents(owner_id);
create index if not exists documents_related_idx on public.documents(related_type, related_id);
create index if not exists documents_updated_at_idx on public.documents(updated_at desc);
create index if not exists activity_logs_created_at_idx on public.activity_logs(created_at desc);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger publications_set_updated_at
before update on public.publications
for each row execute function public.set_updated_at();

create trigger knowledge_notes_set_updated_at
before update on public.knowledge_notes
for each row execute function public.set_updated_at();

create trigger skills_set_updated_at
before update on public.skills
for each row execute function public.set_updated_at();

create trigger skill_versions_set_updated_at
before update on public.skill_versions
for each row execute function public.set_updated_at();

create trigger calendar_events_set_updated_at
before update on public.calendar_events
for each row execute function public.set_updated_at();

create trigger documents_set_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.publications enable row level security;
alter table public.knowledge_notes enable row level security;
alter table public.skills enable row level security;
alter table public.skill_versions enable row level security;
alter table public.calendar_events enable row level security;
alter table public.documents enable row level security;
alter table public.activity_logs enable row level security;

create policy "Admins can manage admin users"
on public.admin_users
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read public profiles"
on public.profiles
for select
using (visibility = 'public' or public.is_admin());

create policy "Admins can write profiles"
on public.profiles
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read public projects"
on public.projects
for select
using (visibility = 'public' or public.is_admin());

create policy "Admins can write projects"
on public.projects
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read public publications"
on public.publications
for select
using (visibility = 'public' or public.is_admin());

create policy "Admins can write publications"
on public.publications
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read public notes"
on public.knowledge_notes
for select
using (visibility = 'public' or public.is_admin());

create policy "Admins can write notes"
on public.knowledge_notes
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read public skills"
on public.skills
for select
using (visibility = 'public' or public.is_admin());

create policy "Admins can write skills"
on public.skills
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage skill versions"
on public.skill_versions
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage calendar events"
on public.calendar_events
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage documents"
on public.documents
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can read activity logs"
on public.activity_logs
for select
using (public.is_admin());

create policy "Admins can insert activity logs"
on public.activity_logs
for insert
with check (public.is_admin());

create policy "Admins can delete activity logs"
on public.activity_logs
for delete
using (public.is_admin());
