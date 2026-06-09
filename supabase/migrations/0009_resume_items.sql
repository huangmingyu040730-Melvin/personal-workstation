-- Phase 2K-A: resume item library.
-- This migration must be applied after 0001 through 0008.

create table if not exists public.resume_items (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('basic', 'education', 'experience', 'project', 'research', 'skill', 'certification', 'award', 'language', 'other')),
  title text not null,
  organization text,
  role_title text,
  location text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  summary text,
  bullets text[] not null default '{}'::text[],
  skills text[] not null default '{}'::text[],
  tags text[] not null default '{}'::text[],
  sort_order integer not null default 0,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  is_featured boolean not null default false,
  related_project_id uuid references public.projects(id) on delete set null,
  related_publication_id uuid references public.publications(id) on delete set null,
  related_knowledge_id uuid references public.knowledge_notes(id) on delete set null,
  related_skill_id uuid references public.skills(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resume_items_item_type_idx on public.resume_items(item_type);
create index if not exists resume_items_visibility_idx on public.resume_items(visibility);
create index if not exists resume_items_is_featured_idx on public.resume_items(is_featured);
create index if not exists resume_items_sort_order_idx on public.resume_items(sort_order);
create index if not exists resume_items_updated_at_idx on public.resume_items(updated_at desc);
create index if not exists resume_items_related_project_id_idx on public.resume_items(related_project_id);
create index if not exists resume_items_related_publication_id_idx on public.resume_items(related_publication_id);
create index if not exists resume_items_related_knowledge_id_idx on public.resume_items(related_knowledge_id);
create index if not exists resume_items_related_skill_id_idx on public.resume_items(related_skill_id);

drop trigger if exists resume_items_set_updated_at on public.resume_items;
create trigger resume_items_set_updated_at
before update on public.resume_items
for each row execute function public.set_updated_at();

alter table public.resume_items enable row level security;

drop policy if exists "Public can read public resume items" on public.resume_items;
create policy "Public can read public resume items"
on public.resume_items
for select
using (visibility = 'public' or public.is_admin());

drop policy if exists "Admins can manage resume items" on public.resume_items;
create policy "Admins can manage resume items"
on public.resume_items
for all
using (public.is_admin())
with check (public.is_admin());

grant select on public.resume_items to anon;
grant select, insert, update, delete on public.resume_items to authenticated;
