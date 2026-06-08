-- Phase 2J-A: editable public profile fields.
-- This migration must be applied after 0001 through 0006.

alter table public.profiles
  add column if not exists role_title text,
  add column if not exists organization text,
  add column if not exists location text,
  add column if not exists is_public boolean not null default false;

update public.profiles
set is_public = true
where visibility = 'public'
  and is_public = false;

create index if not exists profiles_is_public_idx on public.profiles(is_public);
