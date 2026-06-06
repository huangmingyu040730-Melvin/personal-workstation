import type { PublicationRecord } from "@/lib/content-types";
import { publications as mockPublications } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import type { Visibility } from "@/lib/types";
import { getPublicProjectById } from "./projects";

function mockPublicationFallback(): PublicationRecord[] {
  return mockPublications.map((publication) => ({
    id: publication.id,
    slug: publication.id,
    title: publication.title,
    publication_type: publication.type === "论文草稿" ? "academic_paper" : publication.type === "分析报告" ? "data_analysis" : "research_report",
    summary: publication.summary,
    abstract: null,
    published_on: publication.date,
    tags: publication.tags,
    cover_url: null,
    file_path: null,
    is_featured: publication.visibility === "public",
    project_id: null,
    visibility: publication.visibility,
    created_at: publication.date,
    updated_at: publication.date,
    projects: null
  }));
}

function normalizeSearchTerm(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

export function matchesPublicationSearch(publication: PublicationRecord, q: string) {
  const keyword = normalizeSearchTerm(q);

  if (!keyword) {
    return true;
  }

  const searchableText = [
    publication.title,
    publication.summary,
    publication.abstract,
    publication.publication_type,
    publication.projects?.title,
    ...(publication.tags ?? [])
  ]
    .filter(Boolean)
    .join("\n")
    .toLocaleLowerCase("zh-CN");

  return searchableText.includes(keyword);
}

export async function getPublications(filters?: { publicationType?: string; visibility?: string; q?: string }) {
  const supabase = await createClient();

  if (!supabase) {
    return mockPublicationFallback();
  }

  let query = supabase
    .from("publications")
    .select("*, projects(id,title,slug)")
    .order("published_on", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (filters?.publicationType && filters.publicationType !== "all") {
    query = query.eq("publication_type", filters.publicationType);
  }

  if (filters?.visibility && filters.visibility !== "all") {
    query = query.eq("visibility", filters.visibility);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getPublications failed", { code: error.code, message: error.message });
    return [];
  }

  const publications = (data ?? []) as PublicationRecord[];

  if (filters?.q) {
    return publications.filter((publication) => matchesPublicationSearch(publication, filters.q ?? ""));
  }

  return publications;
}

export async function getPublicationById(id: string) {
  const supabase = await createClient();

  if (!supabase) {
    return mockPublicationFallback().find((publication) => publication.id === id || publication.slug === id) ?? null;
  }

  const { data, error } = await supabase
    .from("publications")
    .select("*, projects(id,title,slug)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getPublicationById failed", { code: error.code, message: error.message });
    return null;
  }

  return data as PublicationRecord | null;
}

export async function getPublicPublications(filters?: { publicationType?: string; q?: string }) {
  const supabase = await createClient();

  if (!supabase) {
    return mockPublicationFallback()
      .filter((publication) => publication.visibility === "public")
      .filter((publication) => !filters?.publicationType || filters.publicationType === "all" || publication.publication_type === filters.publicationType)
      .filter((publication) => matchesPublicationSearch(publication, filters?.q ?? ""))
      .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || (b.published_on ?? b.updated_at).localeCompare(a.published_on ?? a.updated_at));
  }

  let query = supabase
    .from("publications")
    .select("*, projects(id,title,slug)")
    .eq("visibility", "public" satisfies Visibility)
    .order("is_featured", { ascending: false })
    .order("published_on", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (filters?.publicationType && filters.publicationType !== "all") {
    query = query.eq("publication_type", filters.publicationType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getPublicPublications failed", { code: error.code, message: error.message });
    return [];
  }

  const publications = (data ?? []) as PublicationRecord[];
  return filters?.q ? publications.filter((publication) => matchesPublicationSearch(publication, filters.q ?? "")) : publications;
}

export async function getPublicPublicationBySlug(slug: string) {
  const supabase = await createClient();

  if (!supabase) {
    return mockPublicationFallback().find((publication) => publication.visibility === "public" && publication.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from("publications")
    .select("*")
    .eq("visibility", "public" satisfies Visibility)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("getPublicPublicationBySlug failed", { code: error.code, message: error.message });
    return null;
  }

  const publication = data as PublicationRecord | null;

  if (!publication) {
    return null;
  }

  const project = await getPublicProjectById(publication.project_id);
  return { ...publication, projects: project ? { id: project.id, title: project.title, slug: project.slug } : null };
}

export async function getViewablePublicationBySlug(slug: string) {
  const supabase = await createClient();

  if (!supabase) {
    return mockPublicationFallback().find((publication) => publication.visibility === "public" && publication.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from("publications")
    .select("*, projects(id,title,slug)")
    .in("visibility", ["public", "restricted", "private"] satisfies Visibility[])
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("getViewablePublicationBySlug failed", { code: error.code, message: error.message });
    return null;
  }

  return data as PublicationRecord | null;
}

export async function getPublicPublicationsByProjectId(projectId: string, limit = 4) {
  const supabase = await createClient();

  if (!supabase) {
    return mockPublicationFallback()
      .filter((publication) => publication.visibility === "public" && publication.project_id === projectId)
      .slice(0, limit);
  }

  const { data, error } = await supabase
    .from("publications")
    .select("*")
    .eq("visibility", "public" satisfies Visibility)
    .eq("project_id", projectId)
    .order("published_on", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getPublicPublicationsByProjectId failed", { code: error.code, message: error.message });
    return [];
  }

  return (data ?? []) as PublicationRecord[];
}

export async function getPublicationOptions() {
  const publications = await getPublications();
  return publications.map((publication) => ({ id: publication.id, title: publication.title }));
}

export async function getRecentPublications(limit = 4) {
  const supabase = await createClient();

  if (!supabase) {
    return mockPublicationFallback().slice(0, limit);
  }

  const { data, error } = await supabase
    .from("publications")
    .select("*, projects(id,title,slug)")
    .order("published_on", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentPublications failed", { code: error.code, message: error.message });
    return [];
  }

  return (data ?? []) as PublicationRecord[];
}

export async function getFeaturedPublicPublications(limit = 3) {
  const supabase = await createClient();

  if (!supabase) {
    return mockPublicationFallback().filter((publication) => publication.visibility === "public" && publication.is_featured).slice(0, limit);
  }

  const { data, error } = await supabase
    .from("publications")
    .select("*, projects(id,title,slug)")
    .eq("visibility", "public" satisfies Visibility)
    .eq("is_featured", true)
    .order("published_on", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getFeaturedPublicPublications failed", { code: error.code, message: error.message });
    return [];
  }

  return (data ?? []) as PublicationRecord[];
}

export async function countPublicPublications() {
  const supabase = await createClient();

  if (!supabase) {
    return mockPublicationFallback().filter((publication) => publication.visibility === "public").length;
  }

  const { count, error } = await supabase.from("publications").select("id", { count: "exact", head: true }).eq("visibility", "public");

  if (error) {
    console.error("countPublicPublications failed", { code: error.code, message: error.message });
    return 0;
  }

  return count ?? 0;
}

export async function getPublicationStats() {
  const supabase = await createClient();

  if (!supabase) {
    const fallback = mockPublicationFallback();
    return {
      total: fallback.length,
      publicCount: fallback.filter((publication) => publication.visibility === "public").length,
      featuredCount: fallback.filter((publication) => publication.is_featured).length
    };
  }

  const [totalResult, publicResult, featuredResult] = await Promise.all([
    supabase.from("publications").select("id", { count: "exact", head: true }),
    supabase.from("publications").select("id", { count: "exact", head: true }).eq("visibility", "public"),
    supabase.from("publications").select("id", { count: "exact", head: true }).eq("is_featured", true)
  ]);

  for (const result of [totalResult, publicResult, featuredResult]) {
    if (result.error) {
      console.error("getPublicationStats failed", { code: result.error.code, message: result.error.message });
      return { total: 0, publicCount: 0, featuredCount: 0 };
    }
  }

  return {
    total: totalResult.count ?? 0,
    publicCount: publicResult.count ?? 0,
    featuredCount: featuredResult.count ?? 0
  };
}
