-- Phase 2K-B: resume versions and selected resume items.
-- This migration must be applied after 0001 through 0009.

create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  target_role text,
  summary text,
  language text not null default 'zh' check (language in ('zh', 'en')),
  template_key text not null default 'classic' check (template_key in ('classic', 'compact', 'research')),
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resume_version_items (
  id uuid primary key default gen_random_uuid(),
  resume_version_id uuid not null references public.resume_versions(id) on delete cascade,
  resume_item_id uuid not null references public.resume_items(id) on delete cascade,
  section_key text not null check (section_key in ('summary', 'education', 'experience', 'projects', 'research', 'skills', 'certifications', 'awards', 'other')),
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  unique (resume_version_id, resume_item_id)
);

create index if not exists resume_versions_visibility_idx on public.resume_versions(visibility);
create index if not exists resume_versions_is_active_idx on public.resume_versions(is_active);
create index if not exists resume_versions_is_featured_idx on public.resume_versions(is_featured);
create index if not exists resume_versions_updated_at_idx on public.resume_versions(updated_at desc);
create index if not exists resume_version_items_version_id_idx on public.resume_version_items(resume_version_id);
create index if not exists resume_version_items_item_id_idx on public.resume_version_items(resume_item_id);
create index if not exists resume_version_items_section_sort_idx on public.resume_version_items(resume_version_id, section_key, sort_order);

drop trigger if exists resume_versions_set_updated_at on public.resume_versions;
create trigger resume_versions_set_updated_at
before update on public.resume_versions
for each row execute function public.set_updated_at();

alter table public.resume_versions enable row level security;
alter table public.resume_version_items enable row level security;

drop policy if exists "Admins can manage resume versions" on public.resume_versions;
create policy "Admins can manage resume versions"
on public.resume_versions
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage resume version items" on public.resume_version_items;
create policy "Admins can manage resume version items"
on public.resume_version_items
for all
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update, delete on public.resume_versions to authenticated;
grant select, insert, update, delete on public.resume_version_items to authenticated;
