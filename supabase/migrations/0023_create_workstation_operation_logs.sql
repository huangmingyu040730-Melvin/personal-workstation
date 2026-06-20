-- v1.2.3: Workstation Admin API operation logs.
-- Logs are metadata-only audit records for token-protected Workstation API calls.

create table if not exists public.workstation_operation_logs (
  id uuid primary key default gen_random_uuid(),
  request_id text not null,
  actor_type text not null default 'workstation_token',
  actor_name text,
  token_hash text,
  action text not null,
  method text not null,
  route text not null,
  target_type text,
  target_id uuid,
  request_summary jsonb not null default '{}'::jsonb,
  status text not null,
  http_status integer,
  error_code text,
  error_message text,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

alter table public.workstation_operation_logs
  drop constraint if exists workstation_operation_logs_status_check;

alter table public.workstation_operation_logs
  add constraint workstation_operation_logs_status_check
  check (status in ('success', 'error'));

alter table public.workstation_operation_logs
  drop constraint if exists workstation_operation_logs_method_check;

alter table public.workstation_operation_logs
  add constraint workstation_operation_logs_method_check
  check (method in ('GET', 'POST'));

create index if not exists workstation_operation_logs_created_at_idx
  on public.workstation_operation_logs (created_at desc);

create index if not exists workstation_operation_logs_request_id_idx
  on public.workstation_operation_logs (request_id);

create index if not exists workstation_operation_logs_action_idx
  on public.workstation_operation_logs (action);

create index if not exists workstation_operation_logs_status_idx
  on public.workstation_operation_logs (status);

create index if not exists workstation_operation_logs_target_type_idx
  on public.workstation_operation_logs (target_type);

alter table public.workstation_operation_logs enable row level security;

drop policy if exists "Admins can read workstation operation logs" on public.workstation_operation_logs;

create policy "Admins can read workstation operation logs"
on public.workstation_operation_logs
for select
using (public.is_admin());

revoke all on table public.workstation_operation_logs from anon;
revoke all on table public.workstation_operation_logs from public;

grant select on table public.workstation_operation_logs to authenticated;
grant select, insert on table public.workstation_operation_logs to service_role;
