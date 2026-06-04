import type { KnowledgeNoteRecord } from "@/lib/content-types";
import { knowledgeNotes as mockNotes } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import type { Visibility } from "@/lib/types";

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

export async function getPublicKnowledgeNotes(filters?: { category?: string; q?: string; limit?: number }) {
  const supabase = await createClient();

  if (!supabase) {
    const notes = mockKnowledgeFallback()
      .filter((note) => note.visibility === "public")
      .filter((note) => !filters?.category || filters.category === "all" || note.category === filters.category)
      .filter((note) => matchesKnowledgeSearch(note, filters?.q ?? ""))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

    return typeof filters?.limit === "number" ? notes.slice(0, filters.limit) : notes;
  }

  let query = supabase
    .from("knowledge_notes")
    .select("*, projects(id,title,slug)")
    .eq("visibility", "public" satisfies Visibility)
    .order("updated_at", { ascending: false });

  if (filters?.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  if (typeof filters?.limit === "number") {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getPublicKnowledgeNotes failed", { code: error.code, message: error.message });
    return [];
  }

  const notes = (data ?? []) as KnowledgeNoteRecord[];
  return filters?.q ? notes.filter((note) => matchesKnowledgeSearch(note, filters.q ?? "")) : notes;
}

export async function getPublicKnowledgeNoteBySlug(slug: string) {
  const supabase = await createClient();

  if (!supabase) {
    return mockKnowledgeFallback().find((note) => note.visibility === "public" && note.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from("knowledge_notes")
    .select("*, projects(id,title,slug)")
    .eq("visibility", "public" satisfies Visibility)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("getPublicKnowledgeNoteBySlug failed", { code: error.code, message: error.message });
    return null;
  }

  return data as KnowledgeNoteRecord | null;
}

export async function countPublicKnowledgeNotes() {
  const supabase = await createClient();

  if (!supabase) {
    return mockKnowledgeFallback().filter((note) => note.visibility === "public").length;
  }

  const { count, error } = await supabase.from("knowledge_notes").select("id", { count: "exact", head: true }).eq("visibility", "public");

  if (error) {
    console.error("countPublicKnowledgeNotes failed", { code: error.code, message: error.message });
    return 0;
  }

  return count ?? 0;
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
