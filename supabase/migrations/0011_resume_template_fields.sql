-- Phase 2K-C: resume template fields and print controls.
-- This migration must be applied after 0001 through 0010.

alter table public.resume_items
  add column if not exists details jsonb not null default '{}'::jsonb;

alter table public.resume_version_items
  add column if not exists visible_fields jsonb not null default '{}'::jsonb;

alter table public.resume_versions
  add column if not exists profile_fields jsonb not null default '{
    "show_photo": true,
    "show_gender": true,
    "show_age": true,
    "show_phone": true,
    "show_email": true,
    "show_location": false,
    "show_headline": false,
    "show_website": false
  }'::jsonb,
  add column if not exists section_order text[] not null default ARRAY[
    'education',
    'experience',
    'campus',
    'projects',
    'research',
    'skills',
    'certifications',
    'awards',
    'other'
  ],
  add column if not exists template_options jsonb not null default '{}'::jsonb;

create index if not exists resume_items_details_gin_idx on public.resume_items using gin(details);
