import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import type { DocumentRelatedType } from "@/lib/content-types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { Visibility } from "@/lib/types";
import {
  type WorkstationKnowledgeCreateInput,
  type WorkstationProjectCreateInput,
  type WorkstationSkillCreateInput,
  toKnowledgePayload,
  toProjectPayload,
  toSkillPayload
} from "./schemas";

export type WorkstationQueryError = {
  code: "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_ERROR";
  message: string;
  status: number;
};

type WorkstationQueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: WorkstationQueryError };

type WorkstationSupabaseClient = SupabaseClient;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const visibilityValues = new Set(["public", "private", "unlisted"]);
const documentRelatedTypes = new Set(["publication", "project", "knowledge", "skill"]);

export type WorkstationListParams = {
  q: string | null;
  limit: number;
  offset: number;
  page: number;
  visibility: Visibility | null;
  category: string | null;
  platform: string | null;
  relatedType: DocumentRelatedType | null;
  relatedId: string | null;
};

function getSupabase(): WorkstationQueryResult<WorkstationSupabaseClient> {
  const supabase = createServiceRoleClient();

  if (!supabase) {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Workstation API data access is not configured.",
        status: 503
      }
    };
  }

  return { ok: true, data: supabase };
}

function parsePositiveInteger(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeSearchTerm(value: string | null) {
  const trimmed = value?.trim().slice(0, 80) ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function ilikePattern(value: string) {
  const sanitized = value
    .replace(/[,%(){}]/g, " ")
    .replace(/\s+/g, "%")
    .trim();

  return sanitized ? `%${sanitized}%` : null;
}

function buildIlikeOr(fields: string[], q: string | null) {
  if (!q) {
    return null;
  }

  const pattern = ilikePattern(q);
  return pattern ? fields.map((field) => `${field}.ilike.${pattern}`).join(",") : null;
}

function pagination(total: number | null, params: Pick<WorkstationListParams, "limit" | "offset" | "page">) {
  const knownTotal = total ?? 0;
  const nextOffset = params.offset + params.limit;

  return {
    limit: params.limit,
    page: params.page,
    cursor: params.offset,
    nextCursor: nextOffset < knownTotal ? String(nextOffset) : null,
    total: knownTotal,
    hasMore: nextOffset < knownTotal
  };
}

export function parseWorkstationListParams(searchParams: URLSearchParams): WorkstationQueryResult<WorkstationListParams> {
  const limit = Math.min(parsePositiveInteger(searchParams.get("limit"), DEFAULT_LIMIT), MAX_LIMIT);
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const cursorValue = searchParams.get("cursor");
  const cursor = cursorValue ? Number(cursorValue) : null;
  const offset = Number.isInteger(cursor) && cursor !== null && cursor >= 0 ? cursor : (page - 1) * limit;
  const visibilityParam = searchParams.get("visibility")?.trim() ?? null;
  const category = normalizeSearchTerm(searchParams.get("category"));
  const platform = normalizeSearchTerm(searchParams.get("platform"));
  const relatedTypeParam = searchParams.get("related_type")?.trim() ?? null;
  const relatedId = normalizeSearchTerm(searchParams.get("related_id"));

  if (visibilityParam && visibilityParam !== "all" && !visibilityValues.has(visibilityParam)) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid visibility filter.",
        status: 400
      }
    };
  }

  if (relatedTypeParam && relatedTypeParam !== "all" && !documentRelatedTypes.has(relatedTypeParam)) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid related_type filter.",
        status: 400
      }
    };
  }

  return {
    ok: true,
    data: {
      q: normalizeSearchTerm(searchParams.get("q")),
      limit,
      offset,
      page,
      visibility: visibilityParam && visibilityParam !== "all" ? visibilityParam as Visibility : null,
      category,
      platform,
      relatedType: relatedTypeParam && relatedTypeParam !== "all" ? relatedTypeParam as DocumentRelatedType : null,
      relatedId
    }
  };
}

function duplicateSlugMessage(error: { code?: string; message?: string }, fallback: string) {
  return error.code === "23505" ? "Slug already exists." : error.message || fallback;
}

export async function listWorkstationProjects(params: WorkstationListParams) {
  const supabaseResult = getSupabase();

  if (!supabaseResult.ok) {
    return supabaseResult;
  }

  let query = supabaseResult.data
    .from("projects")
    .select("id,title,slug,summary,status,visibility,updated_at,created_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(params.offset, params.offset + params.limit - 1);
  const search = buildIlikeOr(["title", "slug", "summary", "status"], params.q);

  if (params.visibility) {
    query = query.eq("visibility", params.visibility);
  }

  if (search) {
    query = query.or(search);
  }

  const { data, error, count } = await query;

  if (error) {
    return {
      ok: false as const,
      error: {
        code: "INTERNAL_ERROR" as const,
        message: error.message || "Failed to read projects.",
        status: 500
      }
    };
  }

  return {
    ok: true as const,
    data: {
      items: data ?? [],
      pagination: pagination(count, params)
    }
  };
}

export async function createWorkstationProject(input: WorkstationProjectCreateInput) {
  const supabaseResult = getSupabase();

  if (!supabaseResult.ok) {
    return supabaseResult;
  }

  const payload = toProjectPayload(input);

  if (!payload.success) {
    return {
      ok: false as const,
      error: {
        code: "VALIDATION_ERROR" as const,
        message: payload.error.issues[0]?.message ?? "Invalid project payload.",
        status: 400
      }
    };
  }

  const { data, error } = await supabaseResult.data
    .from("projects")
    .insert(payload.data)
    .select("id,title,slug,summary,status,visibility,updated_at,created_at")
    .single();

  if (error) {
    return {
      ok: false as const,
      error: {
        code: error.code === "23505" ? "VALIDATION_ERROR" as const : "INTERNAL_ERROR" as const,
        message: duplicateSlugMessage(error, "Failed to create project."),
        status: error.code === "23505" ? 400 : 500
      }
    };
  }

  // TODO: v1.2.2 write operation logs after operation_logs migration lands.
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");

  return { ok: true as const, data };
}

export async function listWorkstationKnowledge(params: WorkstationListParams) {
  const supabaseResult = getSupabase();

  if (!supabaseResult.ok) {
    return supabaseResult;
  }

  let query = supabaseResult.data
    .from("knowledge_notes")
    .select("id,title,slug,category,excerpt,project_id,visibility,updated_at,created_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(params.offset, params.offset + params.limit - 1);
  const search = buildIlikeOr(["title", "slug", "category", "excerpt"], params.q);

  if (params.visibility) {
    query = query.eq("visibility", params.visibility);
  }

  if (params.category) {
    query = query.eq("category", params.category);
  }

  if (search) {
    query = query.or(search);
  }

  const { data, error, count } = await query;

  if (error) {
    return {
      ok: false as const,
      error: {
        code: "INTERNAL_ERROR" as const,
        message: error.message || "Failed to read knowledge.",
        status: 500
      }
    };
  }

  return {
    ok: true as const,
    data: {
      items: data ?? [],
      pagination: pagination(count, params)
    }
  };
}

export async function createWorkstationKnowledge(input: WorkstationKnowledgeCreateInput) {
  const supabaseResult = getSupabase();

  if (!supabaseResult.ok) {
    return supabaseResult;
  }

  if (input.project_id) {
    const { data: project, error: projectError } = await supabaseResult.data
      .from("projects")
      .select("id")
      .eq("id", input.project_id)
      .maybeSingle();

    if (projectError) {
      return {
        ok: false as const,
        error: {
          code: "INTERNAL_ERROR" as const,
          message: projectError.message || "Failed to validate project.",
          status: 500
        }
      };
    }

    if (!project) {
      return {
        ok: false as const,
        error: {
          code: "NOT_FOUND" as const,
          message: "Project not found.",
          status: 404
        }
      };
    }
  }

  const payload = toKnowledgePayload(input);

  if (!payload.success) {
    return {
      ok: false as const,
      error: {
        code: "VALIDATION_ERROR" as const,
        message: payload.error.issues[0]?.message ?? "Invalid knowledge payload.",
        status: 400
      }
    };
  }

  const { data, error } = await supabaseResult.data
    .from("knowledge_notes")
    .insert(payload.data)
    .select("id,title,slug,category,excerpt,project_id,visibility,updated_at,created_at")
    .single();

  if (error) {
    return {
      ok: false as const,
      error: {
        code: error.code === "23505" ? "VALIDATION_ERROR" as const : "INTERNAL_ERROR" as const,
        message: duplicateSlugMessage(error, "Failed to create knowledge."),
        status: error.code === "23505" ? 400 : 500
      }
    };
  }

  // TODO: v1.2.2 write operation logs after operation_logs migration lands.
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/knowledge");

  return { ok: true as const, data };
}

export async function listWorkstationSkills(params: WorkstationListParams) {
  const supabaseResult = getSupabase();

  if (!supabaseResult.ok) {
    return supabaseResult;
  }

  let query = supabaseResult.data
    .from("skills")
    .select("id,name,slug,description,category,platforms,status,current_version,visibility,updated_at,created_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(params.offset, params.offset + params.limit - 1);
  const search = buildIlikeOr(["name", "slug", "description", "category", "status", "current_version"], params.q);

  if (params.visibility) {
    query = query.eq("visibility", params.visibility);
  }

  if (params.category) {
    query = query.eq("category", params.category);
  }

  if (params.platform) {
    query = query.contains("platforms", [params.platform]);
  }

  if (search) {
    query = query.or(search);
  }

  const { data, error, count } = await query;

  if (error) {
    return {
      ok: false as const,
      error: {
        code: "INTERNAL_ERROR" as const,
        message: error.message || "Failed to read skills.",
        status: 500
      }
    };
  }

  return {
    ok: true as const,
    data: {
      items: data ?? [],
      pagination: pagination(count, params)
    }
  };
}

export async function createWorkstationSkill(input: WorkstationSkillCreateInput) {
  const supabaseResult = getSupabase();

  if (!supabaseResult.ok) {
    return supabaseResult;
  }

  const payload = toSkillPayload(input);

  if (!payload.success) {
    return {
      ok: false as const,
      error: {
        code: "VALIDATION_ERROR" as const,
        message: payload.error.issues[0]?.message ?? "Invalid skill payload.",
        status: 400
      }
    };
  }

  const { create_initial_version, version_notes, version_released_at, ...skillPayload } = payload.data;
  void create_initial_version;
  void version_notes;
  void version_released_at;

  const { data, error } = await supabaseResult.data
    .from("skills")
    .insert(skillPayload)
    .select("id,name,slug,description,category,platforms,status,current_version,visibility,updated_at,created_at")
    .single();

  if (error) {
    return {
      ok: false as const,
      error: {
        code: error.code === "23505" ? "VALIDATION_ERROR" as const : "INTERNAL_ERROR" as const,
        message: duplicateSlugMessage(error, "Failed to create skill."),
        status: error.code === "23505" ? 400 : 500
      }
    };
  }

  // TODO: v1.2.2 write operation logs after operation_logs migration lands.
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/skills");

  return { ok: true as const, data };
}

export async function listWorkstationDocumentCollections(params: WorkstationListParams) {
  const supabaseResult = getSupabase();

  if (!supabaseResult.ok) {
    return supabaseResult;
  }

  let query = supabaseResult.data
    .from("document_collections")
    .select("id,title,description,collection_type,related_type,related_id,file_count,total_size,visibility,updated_at,created_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(params.offset, params.offset + params.limit - 1);
  const search = buildIlikeOr(["title", "description", "collection_type", "related_type"], params.q);

  if (params.relatedType) {
    query = query.eq("related_type", params.relatedType);
  }

  if (params.relatedId) {
    query = query.eq("related_id", params.relatedId);
  }

  if (search) {
    query = query.or(search);
  }

  const { data, error, count } = await query;

  if (error) {
    return {
      ok: false as const,
      error: {
        code: "INTERNAL_ERROR" as const,
        message: error.message || "Failed to read document collections.",
        status: 500
      }
    };
  }

  return {
    ok: true as const,
    data: {
      items: data ?? [],
      pagination: pagination(count, params)
    }
  };
}
