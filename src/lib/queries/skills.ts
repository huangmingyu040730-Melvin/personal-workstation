import type { SkillRecord, SkillVersionRecord } from "@/lib/content-types";
import { skills as mockSkills } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

function mockSkillFallback(): SkillRecord[] {
  return mockSkills.map((skill) => ({
    id: skill.id,
    slug: skill.id,
    name: skill.name,
    description: skill.description,
    content: skill.description,
    category: skill.category,
    platforms: skill.platforms,
    status: skill.status === "可用" ? "available" : skill.status === "开发中" ? "developing" : "idea",
    current_version: skill.version,
    input_description: null,
    output_description: null,
    usage_guide: null,
    skill_md_content: null,
    repository_url: null,
    is_featured: skill.visibility === "public",
    visibility: skill.visibility,
    created_at: skill.updatedAt,
    updated_at: skill.updatedAt
  }));
}

export async function getSkills(filters?: { status?: string; visibility?: string }) {
  const supabase = await createClient();

  if (!supabase) {
    return mockSkillFallback();
  }

  let query = supabase.from("skills").select("*").order("updated_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.visibility && filters.visibility !== "all") {
    query = query.eq("visibility", filters.visibility);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getSkills failed", { code: error.code, message: error.message });
    return [];
  }

  return (data ?? []) as SkillRecord[];
}

export async function getSkillById(id: string) {
  const supabase = await createClient();

  if (!supabase) {
    return mockSkillFallback().find((skill) => skill.id === id || skill.slug === id) ?? null;
  }

  const { data, error } = await supabase.from("skills").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("getSkillById failed", { code: error.code, message: error.message });
    return null;
  }

  return data as SkillRecord | null;
}

export async function getSkillVersions(skillId: string) {
  const supabase = await createClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("skill_versions")
    .select("*")
    .eq("skill_id", skillId)
    .order("released_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getSkillVersions failed", { code: error.code, message: error.message });
    return [];
  }

  return (data ?? []) as SkillVersionRecord[];
}

export async function getFeaturedPublicSkills(limit = 3) {
  const supabase = await createClient();

  if (!supabase) {
    return mockSkillFallback().filter((skill) => skill.visibility === "public" && skill.is_featured).slice(0, limit);
  }

  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .eq("visibility", "public")
    .eq("is_featured", true)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getFeaturedPublicSkills failed", { code: error.code, message: error.message });
    return [];
  }

  return (data ?? []) as SkillRecord[];
}

export async function countPublicSkills() {
  const supabase = await createClient();

  if (!supabase) {
    return mockSkillFallback().filter((skill) => skill.visibility === "public").length;
  }

  const { count, error } = await supabase.from("skills").select("id", { count: "exact", head: true }).eq("visibility", "public");

  if (error) {
    console.error("countPublicSkills failed", { code: error.code, message: error.message });
    return 0;
  }

  return count ?? 0;
}

export async function countAvailableSkills() {
  const supabase = await createClient();

  if (!supabase) {
    return mockSkillFallback().filter((skill) => skill.status === "available").length;
  }

  const { count, error } = await supabase.from("skills").select("id", { count: "exact", head: true }).eq("status", "available");

  if (error) {
    console.error("countAvailableSkills failed", { code: error.code, message: error.message });
    return 0;
  }

  return count ?? 0;
}
