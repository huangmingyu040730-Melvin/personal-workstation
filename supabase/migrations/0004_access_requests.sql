-- Phase 2E-A: public access request workflow.
-- This migration must be applied after 0001, 0002 and 0003.

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  requester_name text not null check (char_length(requester_name) between 1 and 80),
  requester_email text not null check (char_length(requester_email) between 3 and 160),
  organization text check (organization is null or char_length(organization) <= 120),
  requested_content_type text check (
    requested_content_type is null
    or requested_content_type in ('project', 'publication', 'skill', 'knowledge', 'other')
  ),
  requested_content_title text check (requested_content_title is null or char_length(requested_content_title) <= 160),
  requested_content_url text check (requested_content_url is null or char_length(requested_content_url) <= 300),
  reason text not null check (char_length(reason) between 10 and 1200),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists access_requests_status_idx on public.access_requests(status);
create index if not exists access_requests_created_at_idx on public.access_requests(created_at desc);
create index if not exists access_requests_reviewed_at_idx on public.access_requests(reviewed_at desc);

drop trigger if exists access_requests_set_updated_at on public.access_requests;
create trigger access_requests_set_updated_at
before update on public.access_requests
for each row execute function public.set_updated_at();

alter table public.access_requests enable row level security;

drop policy if exists "Public can submit access requests" on public.access_requests;
create policy "Public can submit access requests"
on public.access_requests
for insert
with check (
  status = 'pending'
  and admin_note is null
  and reviewed_at is null
);

drop policy if exists "Admins can read access requests" on public.access_requests;
create policy "Admins can read access requests"
on public.access_requests
for select
using (public.is_admin());

drop policy if exists "Admins can update access requests" on public.access_requests;
create policy "Admins can update access requests"
on public.access_requests
for update
using (public.is_admin())
with check (public.is_admin());

grant insert on table public.access_requests to anon;
grant select, update on table public.access_requests to authenticated;
