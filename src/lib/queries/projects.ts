import type { ProjectRecord, ProjectStatus } from "@/lib/content-types";
import { projects as mockProjects } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import type { Visibility } from "@/lib/types";

function mockProjectFallback(): ProjectRecord[] {
  return mockProjects.map((project) => ({
    id: project.id,
    slug: project.id,
    title: project.name,
    summary: project.summary,
    background: null,
    research_question: null,
    methodology: null,
    status: project.status === "规划中" ? "planning" : "in_progress",
    progress: project.progress,
    is_featured: project.visibility === "public",
    start_date: null,
    tags: project.tags,
    milestones: project.milestones,
    visibility: project.visibility,
    created_at: project.updatedAt,
    updated_at: project.updatedAt
  }));
}

export async function getProjects(filters?: { status?: string; visibility?: string }) {
  const supabase = await createClient();

  if (!supabase) {
    return mockProjectFallback();
  }

  let query = supabase.from("projects").select("*").order("updated_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.visibility && filters.visibility !== "all") {
    query = query.eq("visibility", filters.visibility);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getProjects failed", { code: error.code, message: error.message });
    return [];
  }

  return (data ?? []) as ProjectRecord[];
}

export async function getProjectById(id: string) {
  const supabase = await createClient();

  if (!supabase) {
    return mockProjectFallback().find((project) => project.id === id || project.slug === id) ?? null;
  }

  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("getProjectById failed", { code: error.code, message: error.message });
    return null;
  }

  return data as ProjectRecord | null;
}

export async function getPublicProjects(filters?: { status?: string; q?: string }) {
  const supabase = await createClient();

  if (!supabase) {
    return mockProjectFallback()
      .filter((project) => project.visibility === "public")
      .filter((project) => !filters?.status || filters.status === "all" || project.status === filters.status)
      .filter((project) => matchesProjectSearch(project, filters?.q ?? ""))
      .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || b.updated_at.localeCompare(a.updated_at));
  }

  let query = supabase
    .from("projects")
    .select("*")
    .eq("visibility", "public" satisfies Visibility)
    .order("is_featured", { ascending: false })
    .order("updated_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getPublicProjects failed", { code: error.code, message: error.message });
    return [];
  }

  const projects = (data ?? []) as ProjectRecord[];
  return filters?.q ? projects.filter((project) => matchesProjectSearch(project, filters.q ?? "")) : projects;
}

export async function getPublicProjectBySlug(slug: string) {
  const supabase = await createClient();

  if (!supabase) {
    return mockProjectFallback().find((project) => project.visibility === "public" && project.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("visibility", "public" satisfies Visibility)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("getPublicProjectBySlug failed", { code: error.code, message: error.message });
    return null;
  }

  return data as ProjectRecord | null;
}

export async function getProjectOptions() {
  const projects = await getProjects();
  return projects.map((project) => ({ id: project.id, title: project.title }));
}

function normalizeSearchTerm(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function matchesProjectSearch(project: ProjectRecord, q: string) {
  const keyword = normalizeSearchTerm(q);

  if (!keyword) {
    return true;
  }

  const searchableText = [
    project.title,
    project.summary,
    project.background,
    project.research_question,
    project.methodology,
    project.status,
    ...(project.tags ?? [])
  ]
    .filter(Boolean)
    .join("\n")
    .toLocaleLowerCase("zh-CN");

  return searchableText.includes(keyword);
}

export async function getFeaturedPublicProjects(limit = 2) {
  const supabase = await createClient();

  if (!supabase) {
    return mockProjectFallback().filter((project) => project.visibility === "public" && project.is_featured).slice(0, limit);
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("visibility", "public" satisfies Visibility)
    .eq("is_featured", true)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getFeaturedPublicProjects failed", { code: error.code, message: error.message });
    return [];
  }

  return (data ?? []) as ProjectRecord[];
}

export async function countPublicProjects() {
  const supabase = await createClient();

  if (!supabase) {
    return mockProjectFallback().filter((project) => project.visibility === "public").length;
  }

  const { count, error } = await supabase.from("projects").select("id", { count: "exact", head: true }).eq("visibility", "public");

  if (error) {
    console.error("countPublicProjects failed", { code: error.code, message: error.message });
    return 0;
  }

  return count ?? 0;
}

export async function countInProgressProjects() {
  const projects = await getProjects({ status: "in_progress" satisfies ProjectStatus });
  return projects.length;
}
