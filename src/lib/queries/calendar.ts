import type { CalendarEventRecord, CalendarEventType } from "@/lib/content-types";
import { formatDateInputValue } from "@/lib/format";
import { todayItems } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import type { Visibility } from "@/lib/types";
import { getKnowledgeNoteOptions } from "./knowledge";
import { getProjectOptions } from "./projects";
import { getPublicationOptions } from "./publications";
import { getSkillOptions } from "./skills";

type CalendarFilters = {
  range?: "upcoming" | "30days" | "all";
  eventType?: string;
  visibility?: string;
  startsAfter?: string;
  startsBefore?: string;
};

export type CalendarEventRelationOptions = {
  projects: Array<{ id: string; title: string }>;
  publications: Array<{ id: string; title: string }>;
  knowledge: Array<{ id: string; title: string }>;
  skills: Array<{ id: string; title: string }>;
};

function mockCalendarFallback(): CalendarEventRecord[] {
  const todayKey = formatDateInputValue();

  return todayItems.map((item, index) => {
    const hour = String(9 + index * 2).padStart(2, "0");
    const startsAt = new Date(`${todayKey}T${hour}:00:00+08:00`);

    return {
      id: item.id,
      title: item.title,
      description: null,
      location: null,
      starts_at: startsAt.toISOString(),
      ends_at: null,
      event_type: item.type === "会议" ? "meeting" : item.type === "研究" ? "research" : "general",
      project_id: null,
      publication_id: null,
      knowledge_note_id: null,
      skill_id: null,
      visibility: item.visibility === "public" ? "public" : "private",
      owner_id: null,
      // Storage fallback mirrors database UTC/ISO timestamps; UI formatting happens in src/lib/format.ts.
      created_at: startsAt.toISOString(),
      updated_at: startsAt.toISOString()
    };
  });
}

export async function getCalendarEvents(filters?: CalendarFilters) {
  const supabase = await createClient();

  if (!supabase) {
    return filterCalendarEvents(mockCalendarFallback(), filters);
  }

  let query = supabase.from("calendar_events").select("*").order("starts_at", { ascending: true });

  // Supabase range filters stay in UTC/ISO; user-facing display is normalized separately.
  const now = new Date();

  if (filters?.startsAfter) {
    query = query.gte("starts_at", filters.startsAfter);
  }

  if (filters?.startsBefore) {
    query = query.lte("starts_at", filters.startsBefore);
  }

  if (!filters?.startsAfter && !filters?.startsBefore && (!filters?.range || filters.range === "upcoming")) {
    query = query.gte("starts_at", now.toISOString());
  }

  if (!filters?.startsAfter && !filters?.startsBefore && filters?.range === "30days") {
    const end = new Date(now);
    end.setDate(end.getDate() + 30);
    query = query.gte("starts_at", now.toISOString()).lte("starts_at", end.toISOString());
  }

  if (filters?.eventType && filters.eventType !== "all") {
    query = query.eq("event_type", filters.eventType);
  }

  if (filters?.visibility && filters.visibility !== "all") {
    query = query.eq("visibility", filters.visibility);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getCalendarEvents failed", { code: error.code, message: error.message });
    return [];
  }

  return (data ?? []) as CalendarEventRecord[];
}

export async function getCalendarEventById(id: string) {
  const supabase = await createClient();

  if (!supabase) {
    return mockCalendarFallback().find((event) => event.id === id) ?? null;
  }

  const { data, error } = await supabase.from("calendar_events").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("getCalendarEventById failed", { code: error.code, message: error.message });
    return null;
  }

  return data as CalendarEventRecord | null;
}

export async function getUpcomingCalendarEvents(limit = 5) {
  const supabase = await createClient();

  if (!supabase) {
    return mockCalendarFallback().slice(0, limit);
  }

  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    // Supabase range filters stay in UTC/ISO; user-facing display is normalized separately.
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("getUpcomingCalendarEvents failed", { code: error.code, message: error.message });
    return [];
  }

  return (data ?? []) as CalendarEventRecord[];
}

export async function getCalendarRelationOptions(): Promise<CalendarEventRelationOptions> {
  const [projects, publications, knowledge, skills] = await Promise.all([
    getProjectOptions(),
    getPublicationOptions(),
    getKnowledgeNoteOptions(),
    getSkillOptions()
  ]);

  return {
    projects,
    publications,
    knowledge,
    skills
  };
}

export function getCalendarEventRelation(event: CalendarEventRecord, options: CalendarEventRelationOptions) {
  if (event.project_id) {
    const target = options.projects.find((item) => item.id === event.project_id);
    return target ? { label: "研究项目", title: target.title, href: `/dashboard/projects/${target.id}` } : null;
  }

  if (event.publication_id) {
    const target = options.publications.find((item) => item.id === event.publication_id);
    return target ? { label: "学术成果", title: target.title, href: `/dashboard/publications/${target.id}` } : null;
  }

  if (event.knowledge_note_id) {
    const target = options.knowledge.find((item) => item.id === event.knowledge_note_id);
    return target ? { label: "知识文章", title: target.title, href: `/dashboard/knowledge/${target.id}` } : null;
  }

  if (event.skill_id) {
    const target = options.skills.find((item) => item.id === event.skill_id);
    return target ? { label: "Skill", title: target.title, href: `/dashboard/skills/${target.id}` } : null;
  }

  return null;
}

function filterCalendarEvents(events: CalendarEventRecord[], filters?: CalendarFilters) {
  return events
    .filter((event) => !filters?.eventType || filters.eventType === "all" || event.event_type === (filters.eventType as CalendarEventType))
    .filter((event) => !filters?.visibility || filters.visibility === "all" || event.visibility === (filters.visibility as Visibility))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}
