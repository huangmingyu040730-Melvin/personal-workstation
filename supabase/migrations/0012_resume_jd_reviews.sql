-- Phase 2K-H: JD review history and application tracking.
-- This migration must be applied after 0001 through 0011.

create table if not exists public.resume_jd_reviews (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  resume_version_id uuid not null references public.resume_versions(id) on delete cascade,

  company_name text,
  job_title text,
  job_direction text,
  job_location text,
  application_channel text,

  jd_text text not null,
  target_keywords text[] not null default '{}',

  ai_result jsonb not null default '{}'::jsonb,
  match_summary text,
  missing_keywords text[] not null default '{}',
  matched_keywords text[] not null default '{}',
  risks text[] not null default '{}',
  next_actions text[] not null default '{}',

  application_status text not null default 'draft' check (application_status in ('draft', 'reviewed', 'ready', 'submitted', 'interview', 'rejected', 'offer', 'archived')),
  notes text,

  model_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resume_jd_reviews_owner_id_idx on public.resume_jd_reviews(owner_id);
create index if not exists resume_jd_reviews_version_id_idx on public.resume_jd_reviews(resume_version_id);
create index if not exists resume_jd_reviews_status_idx on public.resume_jd_reviews(application_status);
create index if not exists resume_jd_reviews_created_at_idx on public.resume_jd_reviews(created_at desc);
create index if not exists resume_jd_reviews_company_job_idx on public.resume_jd_reviews(company_name, job_title);

drop trigger if exists resume_jd_reviews_set_updated_at on public.resume_jd_reviews;
create trigger resume_jd_reviews_set_updated_at
before update on public.resume_jd_reviews
for each row execute function public.set_updated_at();

alter table public.resume_jd_reviews enable row level security;

drop policy if exists "Admins can manage resume jd reviews" on public.resume_jd_reviews;
create policy "Admins can manage resume jd reviews"
on public.resume_jd_reviews
for all
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update, delete on public.resume_jd_reviews to authenticated;
