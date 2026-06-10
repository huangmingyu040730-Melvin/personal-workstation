-- Phase 2L-D-A: market brief generation job tracking.
-- This migration must be applied after 0014_market_brief_artifacts.sql.

create table if not exists public.market_brief_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,

  brief_date date not null,
  market text not null default 'A股',
  status text not null default 'queued',
  runner_name text not null default 'manual-skill-mock',

  request_payload jsonb not null default '{}'::jsonb,
  source_snapshot jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  market_brief_id uuid references public.market_briefs(id) on delete set null,
  error_message text,

  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint market_brief_generation_jobs_status_check
    check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled'))
);

create index if not exists market_brief_generation_jobs_owner_id_idx on public.market_brief_generation_jobs(owner_id);
create index if not exists market_brief_generation_jobs_brief_date_idx on public.market_brief_generation_jobs(brief_date desc);
create index if not exists market_brief_generation_jobs_status_idx on public.market_brief_generation_jobs(status);
create index if not exists market_brief_generation_jobs_market_idx on public.market_brief_generation_jobs(market);
create index if not exists market_brief_generation_jobs_market_brief_id_idx on public.market_brief_generation_jobs(market_brief_id);

drop trigger if exists market_brief_generation_jobs_set_updated_at on public.market_brief_generation_jobs;
create trigger market_brief_generation_jobs_set_updated_at
before update on public.market_brief_generation_jobs
for each row execute function public.set_updated_at();

alter table public.market_brief_generation_jobs enable row level security;

drop policy if exists "Admins and owners can manage market brief generation jobs" on public.market_brief_generation_jobs;
create policy "Admins and owners can manage market brief generation jobs"
on public.market_brief_generation_jobs
for all
using (public.is_admin() or auth.uid() = owner_id)
with check (public.is_admin() or auth.uid() = owner_id);

revoke all on public.market_brief_generation_jobs from anon;
grant select, insert, update, delete on public.market_brief_generation_jobs to authenticated;
