grant select
on table
  public.profiles,
  public.projects,
  public.publications,
  public.knowledge_notes,
  public.skills
to anon;

grant select, insert, update, delete
on table
  public.profiles,
  public.projects,
  public.publications,
  public.knowledge_notes,
  public.skills,
  public.skill_versions,
  public.calendar_events,
  public.documents,
  public.activity_logs
to authenticated;
