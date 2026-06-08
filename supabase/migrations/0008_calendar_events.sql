-- Phase 2J-B: site-local calendar events.
-- This migration must be applied after 0001 through 0007.

alter table public.calendar_events
  add column if not exists location text,
  add column if not exists publication_id uuid references public.publications(id) on delete set null,
  add column if not exists knowledge_note_id uuid references public.knowledge_notes(id) on delete set null,
  add column if not exists skill_id uuid references public.skills(id) on delete set null;

alter table public.calendar_events
  alter column event_type set default 'general';

update public.calendar_events
set event_type = 'general'
where event_type is null;

alter table public.calendar_events
  alter column event_type set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'calendar_events_event_type_check'
      and conrelid = 'public.calendar_events'::regclass
  ) then
    alter table public.calendar_events
      add constraint calendar_events_event_type_check
      check (event_type in ('general', 'meeting', 'research', 'deadline', 'review', 'reminder'));
  end if;
end $$;

create index if not exists calendar_events_publication_id_idx on public.calendar_events(publication_id);
create index if not exists calendar_events_knowledge_note_id_idx on public.calendar_events(knowledge_note_id);
create index if not exists calendar_events_skill_id_idx on public.calendar_events(skill_id);
create index if not exists calendar_events_visibility_idx on public.calendar_events(visibility);
create index if not exists calendar_events_visibility_starts_at_idx on public.calendar_events(visibility, starts_at);

grant select on public.calendar_events to anon;

create policy "Public can read public calendar events"
on public.calendar_events
for select
using (visibility = 'public');
