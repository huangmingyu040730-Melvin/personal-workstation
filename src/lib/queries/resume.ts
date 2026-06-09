import type { ResumeItemRecord, ResumeItemType } from "@/lib/content-types";
import { createClient } from "@/lib/supabase/server";
import { getKnowledgeNoteOptions } from "./knowledge";
import { getProjectOptions } from "./projects";
import { getPublicationOptions } from "./publications";
import { getSkillOptions } from "./skills";

type ResumeFilters = {
  itemType?: string;
  visibility?: string;
  q?: string;
};

export type ResumeRelationOptions = {
  projects: Array<{ id: string; title: string }>;
  publications: Array<{ id: string; title: string }>;
  knowledge: Array<{ id: string; title: string }>;
  skills: Array<{ id: string; title: string }>;
};

export type ResumeStats = {
  total: number;
  education: number;
  experience: number;
  project: number;
  skillCertificationAward: number;
};

export async function getResumeItems(filters?: ResumeFilters) {
  const supabase = await createClient();

  if (!supabase) {
    return [] as ResumeItemRecord[];
  }

  let query = supabase
    .from("resume_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  if (filters?.itemType && filters.itemType !== "all") {
    query = query.eq("item_type", filters.itemType);
  }

  if (filters?.visibility && filters.visibility !== "all") {
    query = query.eq("visibility", filters.visibility);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getResumeItems failed", { code: error.code, message: error.message });
    return [];
  }

  const items = (data ?? []) as ResumeItemRecord[];
  return filters?.q ? items.filter((item) => matchesResumeSearch(item, filters.q ?? "")) : items;
}

export async function getResumeItemById(id: string) {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from("resume_items").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("getResumeItemById failed", { code: error.code, message: error.message });
    return null;
  }

  return data as ResumeItemRecord | null;
}

export async function getResumeStats(): Promise<ResumeStats> {
  const items = await getResumeItems();

  return {
    total: items.length,
    education: items.filter((item) => item.item_type === "education").length,
    experience: items.filter((item) => item.item_type === "experience").length,
    project: items.filter((item) => item.item_type === "project" || item.item_type === "research").length,
    skillCertificationAward: items.filter((item) => ["skill", "certification", "award"].includes(item.item_type)).length
  };
}

export async function getRecentResumeItems(limit = 3) {
  const supabase = await createClient();

  if (!supabase) {
    return [] as ResumeItemRecord[];
  }

  const { data, error } = await supabase.from("resume_items").select("*").order("updated_at", { ascending: false }).limit(limit);

  if (error) {
    console.error("getRecentResumeItems failed", { code: error.code, message: error.message });
    return [];
  }

  return (data ?? []) as ResumeItemRecord[];
}

export async function getResumeRelationOptions(): Promise<ResumeRelationOptions> {
  const [projects, publications, knowledge, skills] = await Promise.all([
    getProjectOptions(),
    getPublicationOptions(),
    getKnowledgeNoteOptions(),
    getSkillOptions()
  ]);

  return { projects, publications, knowledge, skills };
}

export function getResumeItemRelation(item: ResumeItemRecord, options: ResumeRelationOptions) {
  if (item.related_project_id) {
    const target = options.projects.find((option) => option.id === item.related_project_id);
    return target ? { label: "研究项目", title: target.title, href: `/dashboard/projects/${target.id}` } : null;
  }

  if (item.related_publication_id) {
    const target = options.publications.find((option) => option.id === item.related_publication_id);
    return target ? { label: "学术成果", title: target.title, href: `/dashboard/publications/${target.id}` } : null;
  }

  if (item.related_knowledge_id) {
    const target = options.knowledge.find((option) => option.id === item.related_knowledge_id);
    return target ? { label: "知识文章", title: target.title, href: `/dashboard/knowledge/${target.id}` } : null;
  }

  if (item.related_skill_id) {
    const target = options.skills.find((option) => option.id === item.related_skill_id);
    return target ? { label: "Skill", title: target.title, href: `/dashboard/skills/${target.id}` } : null;
  }

  return null;
}

function normalizeSearchTerm(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function matchesResumeSearch(item: ResumeItemRecord, q: string) {
  const keyword = normalizeSearchTerm(q);

  if (!keyword) {
    return true;
  }

  const searchableText = [
    item.title,
    item.organization,
    item.role_title,
    item.location,
    item.summary,
    item.item_type,
    ...(item.bullets ?? []),
    ...(item.skills ?? []),
    ...(item.tags ?? [])
  ]
    .filter(Boolean)
    .join("\n")
    .toLocaleLowerCase("zh-CN");

  return searchableText.includes(keyword);
}

export function countResumeItemsByType(items: ResumeItemRecord[], type: ResumeItemType) {
  return items.filter((item) => item.item_type === type).length;
}
