import type { AccessGrantContentType, ContentAccessGrantRecord, ContentAccessGrantWithTarget } from "@/lib/content-types";
import { createClient } from "@/lib/supabase/server";
import type { Visibility } from "@/lib/types";

type TargetOption = {
  id: string;
  type: AccessGrantContentType;
  title: string;
  slug: string;
  href: string;
  adminHref: string;
  visibility: Visibility;
};

export type GrantContentOptions = Record<AccessGrantContentType, TargetOption[]>;
export type AccessGrantEffectiveStatus = "active" | "expired" | "revoked";

const emptyOptions: GrantContentOptions = {
  project: [],
  publication: [],
  skill: [],
  knowledge: []
};

export function getAccessGrantEffectiveStatus(grant: Pick<ContentAccessGrantRecord, "status" | "expires_at">, now = new Date()): AccessGrantEffectiveStatus {
  if (grant.status === "revoked") {
    return "revoked";
  }

  if (grant.expires_at && new Date(grant.expires_at).getTime() <= now.getTime()) {
    return "expired";
  }

  return "active";
}

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

  if (filters?.status === "revoked") {
    query = query.eq("status", "revoked");
  } else if (filters?.status === "expired") {
    query = query.eq("status", "active").not("expires_at", "is", null).lte("expires_at", new Date().toISOString());
  } else if (filters?.status === "active") {
    query = query.eq("status", "active").or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
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
  return getGrantContentOptionsByVisibility("restricted");
}

async function getGrantContentOptionsByVisibility(visibility: "restricted" | "all"): Promise<GrantContentOptions> {
  const supabase = await createClient();

  if (!supabase) {
    return emptyOptions;
  }

  const visibilityFilter = <T>(query: T) => {
    if (visibility === "restricted") {
      return (query as { eq: (column: string, value: string) => T }).eq("visibility", "restricted");
    }

    return query;
  };

  const [projects, publications, skills, knowledge] = await Promise.all([
    visibilityFilter(supabase.from("projects").select("id,title,slug,visibility")).order("updated_at", { ascending: false }),
    visibilityFilter(supabase.from("publications").select("id,title,slug,visibility")).order("updated_at", { ascending: false }),
    visibilityFilter(supabase.from("skills").select("id,name,slug,visibility")).order("updated_at", { ascending: false }),
    visibilityFilter(supabase.from("knowledge_notes").select("id,title,slug,visibility")).order("updated_at", { ascending: false })
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
      slug: item.slug,
      href: `/projects/${item.slug}`,
      adminHref: `/dashboard/projects/${item.id}`,
      visibility: item.visibility as Visibility
    })),
    publication: (publications.data ?? []).map((item) => ({
      id: item.id,
      type: "publication",
      title: item.title,
      slug: item.slug,
      href: `/publications/${item.slug}`,
      adminHref: `/dashboard/publications/${item.id}`,
      visibility: item.visibility as Visibility
    })),
    skill: (skills.data ?? []).map((item) => ({
      id: item.id,
      type: "skill",
      title: item.name,
      slug: item.slug,
      href: `/skills/${item.slug}`,
      adminHref: `/dashboard/skills/${item.id}`,
      visibility: item.visibility as Visibility
    })),
    knowledge: (knowledge.data ?? []).map((item) => ({
      id: item.id,
      type: "knowledge",
      title: item.title,
      slug: item.slug,
      href: `/knowledge/${item.slug}`,
      adminHref: `/dashboard/knowledge/${item.id}`,
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

  const options = await getGrantContentOptionsByVisibility("all");

  return grants.map((grant) => ({
    ...grant,
    target: options[grant.content_type].find((item) => item.id === grant.content_id) ?? null
  }));
}
