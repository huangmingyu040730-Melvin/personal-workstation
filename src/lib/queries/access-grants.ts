import type { AccessGrantContentType, ContentAccessGrantRecord, ContentAccessGrantWithTarget } from "@/lib/content-types";
import { createClient } from "@/lib/supabase/server";
import type { Visibility } from "@/lib/types";

type TargetOption = {
  id: string;
  type: AccessGrantContentType;
  title: string;
  href: string;
  visibility: Visibility;
};

export type GrantContentOptions = Record<AccessGrantContentType, TargetOption[]>;

const emptyOptions: GrantContentOptions = {
  project: [],
  publication: [],
  skill: [],
  knowledge: []
};

export async function getAccessGrants(filters?: { status?: string; contentType?: string }) {
  const supabase = await createClient();

  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("content_access_grants")
    .select("*")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.contentType && filters.contentType !== "all") {
    query = query.eq("content_type", filters.contentType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getAccessGrants failed", { code: error.code, message: error.message });
    return [];
  }

  return attachGrantTargets((data ?? []) as ContentAccessGrantRecord[]);
}

export async function getAccessGrantById(id: string) {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from("content_access_grants").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("getAccessGrantById failed", { code: error.code, message: error.message });
    return null;
  }

  const [grant] = await attachGrantTargets(data ? [data as ContentAccessGrantRecord] : []);
  return grant ?? null;
}

export async function getGrantContentOptions(): Promise<GrantContentOptions> {
  const supabase = await createClient();

  if (!supabase) {
    return emptyOptions;
  }

  const [projects, publications, skills, knowledge] = await Promise.all([
    supabase.from("projects").select("id,title,slug,visibility").eq("visibility", "restricted").order("updated_at", { ascending: false }),
    supabase.from("publications").select("id,title,slug,visibility").eq("visibility", "restricted").order("updated_at", { ascending: false }),
    supabase.from("skills").select("id,name,slug,visibility").eq("visibility", "restricted").order("updated_at", { ascending: false }),
    supabase.from("knowledge_notes").select("id,title,slug,visibility").eq("visibility", "restricted").order("updated_at", { ascending: false })
  ]);

  for (const result of [projects, publications, skills, knowledge]) {
    if (result.error) {
      console.error("getGrantContentOptions failed", { code: result.error.code, message: result.error.message });
      return emptyOptions;
    }
  }

  return {
    project: (projects.data ?? []).map((item) => ({
      id: item.id,
      type: "project",
      title: item.title,
      href: `/projects/${item.slug}`,
      visibility: item.visibility as Visibility
    })),
    publication: (publications.data ?? []).map((item) => ({
      id: item.id,
      type: "publication",
      title: item.title,
      href: `/publications/${item.slug}`,
      visibility: item.visibility as Visibility
    })),
    skill: (skills.data ?? []).map((item) => ({
      id: item.id,
      type: "skill",
      title: item.name,
      href: `/skills/${item.slug}`,
      visibility: item.visibility as Visibility
    })),
    knowledge: (knowledge.data ?? []).map((item) => ({
      id: item.id,
      type: "knowledge",
      title: item.title,
      href: `/knowledge/${item.slug}`,
      visibility: item.visibility as Visibility
    }))
  };
}

export async function getGrantTarget(type: AccessGrantContentType, id: string) {
  const options = await getGrantContentOptions();
  return options[type].find((item) => item.id === id) ?? null;
}

async function attachGrantTargets(grants: ContentAccessGrantRecord[]): Promise<ContentAccessGrantWithTarget[]> {
  if (grants.length === 0) {
    return [];
  }

  const options = await getGrantContentOptions();

  return grants.map((grant) => ({
    ...grant,
    target: options[grant.content_type].find((item) => item.id === grant.content_id) ?? null
  }));
}
