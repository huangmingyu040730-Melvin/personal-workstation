-- Phase 2L-B: market brief artifacts and markdown preview.
-- This migration must be applied after 0013_market_briefs.sql.

alter table public.market_briefs
  add column if not exists markdown_content text,
  add column if not exists generation_status text not null default 'manual',
  add column if not exists generated_at timestamptz,
  add column if not exists generator_name text,
  add column if not exists source_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists artifact_files jsonb not null default '[]'::jsonb;

alter table public.market_briefs
  drop constraint if exists market_briefs_generation_status_check;

alter table public.market_briefs
  add constraint market_briefs_generation_status_check
  check (generation_status in ('manual', 'draft', 'generated', 'failed', 'needs_review', 'archived'));

create index if not exists market_briefs_generation_status_idx on public.market_briefs(generation_status);
