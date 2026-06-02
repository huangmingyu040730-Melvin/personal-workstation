import type { KnowledgeNoteRecord } from "@/lib/content-types";
import { knowledgeNotes as mockNotes } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

function mockKnowledgeFallback(): KnowledgeNoteRecord[] {
  return mockNotes.map((note) => ({
    id: note.id,
    slug: note.id,
    title: note.title,
    category: note.category,
    excerpt: note.excerpt,
    content: note.excerpt,
    tags: note.tags,
    is_featured: note.visibility === "public",
    project_id: null,
    visibility: note.visibility,
    created_at: note.updatedAt,
    updated_at: note.updatedAt,
    projects: null
  }));
}

function normalizeSearchTerm(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

export function matchesKnowledgeSearch(note: KnowledgeNoteRecord, q: string) {
  const keyword = normalizeSearchTerm(q);

  if (!keyword) {
    return true;
  }

  const searchableText = [note.title, note.excerpt, note.content, note.category, ...(note.tags ?? [])]
    .filter(Boolean)
    .join("\n")
    .toLocaleLowerCase("zh-CN");

  return searchableText.includes(keyword);
}

export async function getKnowledgeNotes(filters?: { category?: string; q?: string }) {
  const supabase = await createClient();

  if (!supabase) {
    return mockKnowledgeFallback();
  }

  let query = supabase
    .from("knowledge_notes")
    .select("*, projects(id,title,slug)")
    .order("updated_at", { ascending: false });

  if (filters?.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getKnowledgeNotes failed", { code: error.code, message: error.message });
    return [];
  }

  const notes = (data ?? []) as KnowledgeNoteRecord[];

  if (filters?.q) {
    return notes.filter((note) => matchesKnowledgeSearch(note, filters.q ?? ""));
  }

  return notes;
}

export async function getKnowledgeNoteById(id: string) {
  const supabase = await createClient();

  if (!supabase) {
    return mockKnowledgeFallback().find((note) => note.id === id || note.slug === id) ?? null;
  }

  const { data, error } = await supabase
    .from("knowledge_notes")
    .select("*, projects(id,title,slug)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getKnowledgeNoteById failed", { code: error.code, message: error.message });
    return null;
  }

  return data as KnowledgeNoteRecord | null;
}

export async function getRecentKnowledgeNotes(limit = 3) {
  const supabase = await createClient();

  if (!supabase) {
    return mockKnowledgeFallback().slice(0, limit);
  }

  const { data, error } = await supabase
    .from("knowledge_notes")
    .select("*, projects(id,title,slug)")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentKnowledgeNotes failed", { code: error.code, message: error.message });
    return [];
  }

  return (data ?? []) as KnowledgeNoteRecord[];
}
