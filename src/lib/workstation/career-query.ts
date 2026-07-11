import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import type { ProfileRecord, ResumeItemRecord, ResumeJdReviewRecord, ResumeVersionWithItems } from "@/lib/content-types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type {
  WorkstationJdReviewCreateInput,
  WorkstationJdReviewUpdateInput,
  WorkstationResumeItemCreateInput,
  WorkstationResumeItemUpdateInput,
  WorkstationResumeVersionCreateInput,
  WorkstationResumeVersionUpdateInput
} from "./career-schemas";

export type WorkstationCareerError = {
  code: "VALIDATION_ERROR" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_ERROR";
  message: string;
  status: number;
};

export type WorkstationCareerResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: WorkstationCareerError };

export type WorkstationCareerListParams = {
  q: string | null;
  limit: number;
  offset: number;
  page: number;
  itemType: string | null;
  status: string | null;
  versionId: string | null;
  direction: string | null;
  channel: string | null;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const resumeItemTypes = new Set(["basic", "education", "experience", "project", "research", "skill", "certification", "award", "language", "other"]);
const applicationStatuses = new Set(["draft", "reviewed", "ready", "submitted", "interview", "rejected", "offer", "archived"]);

function getSupabase(): WorkstationCareerResult<SupabaseClient> {
  const supabase = createServiceRoleClient();

  if (!supabase) {
    return errorResult("INTERNAL_ERROR", "Workstation API data access is not configured.", 503);
  }

  return { ok: true, data: supabase };
}

function errorResult(code: WorkstationCareerError["code"], message: string, status: number) {
  return { ok: false as const, error: { code, message, status } };
}

function databaseError(error: { code?: string; message?: string } | null, fallback: string) {
  if (error?.code === "23503") {
    return errorResult("VALIDATION_ERROR", "A referenced Career Center record does not exist.", 400);
  }

  if (error?.code === "23505") {
    return errorResult("CONFLICT", "The Career Center record conflicts with existing data.", 409);
  }

  return errorResult("INTERNAL_ERROR", error?.message || fallback, 500);
}

function parsePositiveInteger(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeSearchTerm(value: string | null, limit = 80) {
  const normalized = value?.trim().slice(0, limit) ?? "";
  return normalized || null;
}

function ilikePattern(value: string) {
  const normalized = value.replace(/[,%(){}]/g, " ").replace(/\s+/g, "%").trim();
  return normalized ? `%${normalized}%` : null;
}

function pagination(total: number | null, params: Pick<WorkstationCareerListParams, "limit" | "offset" | "page">) {
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

function stripUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function parseWorkstationCareerListParams(searchParams: URLSearchParams): WorkstationCareerResult<WorkstationCareerListParams> {
  const limit = Math.min(parsePositiveInteger(searchParams.get("limit"), DEFAULT_LIMIT), MAX_LIMIT);
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const cursorParam = searchParams.get("cursor");
  const parsedCursor = cursorParam === null ? null : Number(cursorParam);
  const offset = parsedCursor !== null && Number.isInteger(parsedCursor) && parsedCursor >= 0 ? parsedCursor : (page - 1) * limit;
  const itemType = normalizeSearchTerm(searchParams.get("item_type"), 40);
  const status = normalizeSearchTerm(searchParams.get("status"), 40);
  const versionId = normalizeSearchTerm(searchParams.get("version_id"), 80);

  if (itemType && itemType !== "all" && !resumeItemTypes.has(itemType)) {
    return errorResult("VALIDATION_ERROR", "Invalid resume item_type filter.", 400);
  }

  if (status && status !== "all" && !applicationStatuses.has(status)) {
    return errorResult("VALIDATION_ERROR", "Invalid application status filter.", 400);
  }

  if (versionId && versionId !== "all" && !isUuid(versionId)) {
    return errorResult("VALIDATION_ERROR", "Invalid resume version id filter.", 400);
  }

  return {
    ok: true,
    data: {
      q: normalizeSearchTerm(searchParams.get("q")),
      limit,
      offset,
      page,
      itemType: itemType && itemType !== "all" ? itemType : null,
      status: status && status !== "all" ? status : null,
      versionId: versionId && versionId !== "all" ? versionId : null,
      direction: normalizeSearchTerm(searchParams.get("direction"), 80),
      channel: normalizeSearchTerm(searchParams.get("channel"), 120)
    }
  };
}

export async function getWorkstationCareerOverview() {
  const supabaseResult = getSupabase();
  if (!supabaseResult.ok) return supabaseResult;

  const supabase = supabaseResult.data;
  const [items, versions, reviews, submitted, interviews, offers] = await Promise.all([
    supabase.from("resume_items").select("id", { count: "exact", head: true }),
    supabase.from("resume_versions").select("id", { count: "exact", head: true }),
    supabase.from("resume_jd_reviews").select("id", { count: "exact", head: true }),
    supabase.from("resume_jd_reviews").select("id", { count: "exact", head: true }).eq("application_status", "submitted"),
    supabase.from("resume_jd_reviews").select("id", { count: "exact", head: true }).eq("application_status", "interview"),
    supabase.from("resume_jd_reviews").select("id", { count: "exact", head: true }).eq("application_status", "offer")
  ]);

  const firstError = [items.error, versions.error, reviews.error, submitted.error, interviews.error, offers.error].find(Boolean);
  if (firstError) return databaseError(firstError, "Failed to load Career Center overview.");

  return {
    ok: true as const,
    data: {
      resume_items: items.count ?? 0,
      resume_versions: versions.count ?? 0,
      jd_reviews: reviews.count ?? 0,
      applications: {
        total: reviews.count ?? 0,
        submitted: submitted.count ?? 0,
        interview: interviews.count ?? 0,
        offer: offers.count ?? 0
      }
    }
  };
}

export async function listWorkstationResumeItems(params: WorkstationCareerListParams) {
  const supabaseResult = getSupabase();
  if (!supabaseResult.ok) return supabaseResult;

  let query = supabaseResult.data
    .from("resume_items")
    .select("id,item_type,title,organization,role_title,location,start_date,end_date,is_current,summary,skills,tags,sort_order,visibility,is_featured,updated_at,created_at", { count: "exact" })
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false })
    .range(params.offset, params.offset + params.limit - 1);

  if (params.itemType) query = query.eq("item_type", params.itemType);
  const pattern = params.q ? ilikePattern(params.q) : null;
  if (pattern) query = query.or(`title.ilike.${pattern},organization.ilike.${pattern},role_title.ilike.${pattern},summary.ilike.${pattern}`);

  const { data, count, error } = await query;
  if (error) return databaseError(error, "Failed to list resume items.");

  return { ok: true as const, data: { items: data ?? [], pagination: pagination(count, params) } };
}

export async function showWorkstationResumeItem(id: string) {
  if (!isUuid(id)) return errorResult("VALIDATION_ERROR", "Invalid resume item id.", 400);
  const supabaseResult = getSupabase();
  if (!supabaseResult.ok) return supabaseResult;

  const { data, error } = await supabaseResult.data.from("resume_items").select("*").eq("id", id).maybeSingle();
  if (error) return databaseError(error, "Failed to load resume item.");
  if (!data) return errorResult("NOT_FOUND", "Resume item not found.", 404);
  return { ok: true as const, data };
}

export async function createWorkstationResumeItem(input: WorkstationResumeItemCreateInput) {
  const supabaseResult = getSupabase();
  if (!supabaseResult.ok) return supabaseResult;

  const { data, error } = await supabaseResult.data.from("resume_items").insert(input).select("*").single();
  if (error) return databaseError(error, "Failed to create resume item.");
  revalidateCareerPaths();
  return { ok: true as const, data };
}

export async function updateWorkstationResumeItem(id: string, input: WorkstationResumeItemUpdateInput) {
  if (!isUuid(id)) return errorResult("VALIDATION_ERROR", "Invalid resume item id.", 400);
  const supabaseResult = getSupabase();
  if (!supabaseResult.ok) return supabaseResult;

  const existing = await showWithClient(supabaseResult.data, "resume_items", id);
  if (!existing.ok) return existing;

  const payload = stripUndefined(input as Record<string, unknown>);
  if (payload.is_current === true) payload.end_date = null;
  const { data, error } = await supabaseResult.data.from("resume_items").update(payload).eq("id", id).select("*").single();
  if (error) return databaseError(error, "Failed to update resume item.");
  revalidateCareerPaths(id);
  return { ok: true as const, data };
}

export async function deleteWorkstationResumeItem(id: string) {
  if (!isUuid(id)) return errorResult("VALIDATION_ERROR", "Invalid resume item id.", 400);
  const supabaseResult = getSupabase();
  if (!supabaseResult.ok) return supabaseResult;

  const existing = await showWithClient(supabaseResult.data, "resume_items", id);
  if (!existing.ok) return existing;
  const { error } = await supabaseResult.data.from("resume_items").delete().eq("id", id);
  if (error) return databaseError(error, "Failed to delete resume item.");
  revalidateCareerPaths(id);
  return { ok: true as const, data: { id, title: existing.data.title, deleted: true } };
}

export async function listWorkstationResumeVersions(params: WorkstationCareerListParams) {
  const supabaseResult = getSupabase();
  if (!supabaseResult.ok) return supabaseResult;

  let query = supabaseResult.data
    .from("resume_versions")
    .select("id,title,target_role,summary,language,template_key,visibility,is_active,is_featured,updated_at,created_at,resume_version_items(count)", { count: "exact" })
    .order("is_active", { ascending: false })
    .order("updated_at", { ascending: false })
    .range(params.offset, params.offset + params.limit - 1);
  const pattern = params.q ? ilikePattern(params.q) : null;
  if (pattern) query = query.or(`title.ilike.${pattern},target_role.ilike.${pattern},summary.ilike.${pattern}`);

  const { data, count, error } = await query;
  if (error) return databaseError(error, "Failed to list resume versions.");

  const items = (data ?? []).map((item) => ({
    ...item,
    item_count: Array.isArray(item.resume_version_items) ? Number(item.resume_version_items[0]?.count ?? 0) : 0,
    resume_version_items: undefined
  }));
  return { ok: true as const, data: { items, pagination: pagination(count, params) } };
}

export async function showWorkstationResumeVersion(id: string): Promise<WorkstationCareerResult<ResumeVersionWithItems>> {
  if (!isUuid(id)) return errorResult("VALIDATION_ERROR", "Invalid resume version id.", 400);
  const supabaseResult = getSupabase();
  if (!supabaseResult.ok) return supabaseResult;

  const { data, error } = await supabaseResult.data
    .from("resume_versions")
    .select("*, resume_version_items(*, resume_items(*))")
    .eq("id", id)
    .maybeSingle();
  if (error) return databaseError(error, "Failed to load resume version.");
  if (!data) return errorResult("NOT_FOUND", "Resume version not found.", 404);

  const version = data as ResumeVersionWithItems;
  version.resume_version_items = [...(version.resume_version_items ?? [])].sort(
    (left, right) => left.section_key.localeCompare(right.section_key) || left.sort_order - right.sort_order
  );
  return { ok: true as const, data: version };
}

export async function createWorkstationResumeVersion(input: WorkstationResumeVersionCreateInput) {
  const supabaseResult = getSupabase();
  if (!supabaseResult.ok) return supabaseResult;
  const { items, ...versionPayload } = input;
  const supabase = supabaseResult.data;

  const { data: version, error } = await supabase.from("resume_versions").insert(versionPayload).select("*").single();
  if (error) return databaseError(error, "Failed to create resume version.");

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from("resume_version_items").insert(items.map((item) => ({ ...item, resume_version_id: version.id })));
    if (itemsError) {
      await supabase.from("resume_versions").delete().eq("id", version.id);
      return databaseError(itemsError, "Failed to save resume version items.");
    }
  }

  revalidateCareerPaths(undefined, version.id);
  return showWorkstationResumeVersion(version.id);
}

export async function updateWorkstationResumeVersion(id: string, input: WorkstationResumeVersionUpdateInput) {
  if (!isUuid(id)) return errorResult("VALIDATION_ERROR", "Invalid resume version id.", 400);
  const supabaseResult = getSupabase();
  if (!supabaseResult.ok) return supabaseResult;
  const supabase = supabaseResult.data;
  const existing = await showWorkstationResumeVersion(id);
  if (!existing.ok) return existing;

  const { items, ...versionInput } = input;
  const versionPayload = stripUndefined(versionInput as Record<string, unknown>);
  if (Object.keys(versionPayload).length > 0) {
    const { error } = await supabase.from("resume_versions").update(versionPayload).eq("id", id);
    if (error) return databaseError(error, "Failed to update resume version.");
  }

  if (items !== undefined) {
    const previousItems = existing.data.resume_version_items.map((item) => ({
      resume_version_id: item.resume_version_id,
      resume_item_id: item.resume_item_id,
      section_key: item.section_key,
      sort_order: item.sort_order,
      is_visible: item.is_visible,
      note: item.note,
      visible_fields: item.visible_fields
    }));
    const { error: deleteError } = await supabase.from("resume_version_items").delete().eq("resume_version_id", id);
    if (deleteError) return databaseError(deleteError, "Failed to replace resume version items.");

    if (items.length > 0) {
      const { error: insertError } = await supabase.from("resume_version_items").insert(items.map((item) => ({ ...item, resume_version_id: id })));
      if (insertError) {
        if (previousItems.length > 0) await supabase.from("resume_version_items").insert(previousItems);
        return databaseError(insertError, "Failed to save resume version items. Previous item selection was restored.");
      }
    }
  }

  revalidateCareerPaths(undefined, id);
  return showWorkstationResumeVersion(id);
}

export async function deleteWorkstationResumeVersion(id: string) {
  if (!isUuid(id)) return errorResult("VALIDATION_ERROR", "Invalid resume version id.", 400);
  const existing = await showWorkstationResumeVersion(id);
  if (!existing.ok) return existing;
  const supabaseResult = getSupabase();
  if (!supabaseResult.ok) return supabaseResult;

  const { count } = await supabaseResult.data.from("resume_jd_reviews").select("id", { count: "exact", head: true }).eq("resume_version_id", id);
  const { error } = await supabaseResult.data.from("resume_versions").delete().eq("id", id);
  if (error) return databaseError(error, "Failed to delete resume version.");
  revalidateCareerPaths(undefined, id);
  return { ok: true as const, data: { id, title: existing.data.title, cascaded_jd_reviews: count ?? 0, deleted: true } };
}

export async function listWorkstationJdReviews(params: WorkstationCareerListParams) {
  const supabaseResult = getSupabase();
  if (!supabaseResult.ok) return supabaseResult;

  let query = supabaseResult.data
    .from("resume_jd_reviews")
    .select("id,resume_version_id,company_name,job_title,job_direction,job_location,application_channel,match_summary,missing_keywords,matched_keywords,risks,next_actions,application_status,notes,model_name,created_at,updated_at,resume_versions(id,title,target_role)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(params.offset, params.offset + params.limit - 1);
  if (params.status) query = query.eq("application_status", params.status);
  if (params.versionId) query = query.eq("resume_version_id", params.versionId);
  if (params.direction && params.direction !== "all") query = query.eq("job_direction", params.direction);
  if (params.channel && params.channel !== "all") query = query.eq("application_channel", params.channel);
  const pattern = params.q ? ilikePattern(params.q) : null;
  if (pattern) query = query.or(`company_name.ilike.${pattern},job_title.ilike.${pattern},job_direction.ilike.${pattern},application_channel.ilike.${pattern},match_summary.ilike.${pattern}`);

  const { data, count, error } = await query;
  if (error) return databaseError(error, "Failed to list JD reviews.");
  return { ok: true as const, data: { items: data ?? [], pagination: pagination(count, params) } };
}

export async function showWorkstationJdReview(id: string) {
  if (!isUuid(id)) return errorResult("VALIDATION_ERROR", "Invalid JD review id.", 400);
  const supabaseResult = getSupabase();
  if (!supabaseResult.ok) return supabaseResult;

  const { data, error } = await supabaseResult.data
    .from("resume_jd_reviews")
    .select("id,resume_version_id,company_name,job_title,job_direction,job_location,application_channel,jd_text,target_keywords,ai_result,match_summary,missing_keywords,matched_keywords,risks,next_actions,application_status,notes,model_name,created_at,updated_at,resume_versions(id,title,target_role)")
    .eq("id", id)
    .maybeSingle();
  if (error) return databaseError(error, "Failed to load JD review.");
  if (!data) return errorResult("NOT_FOUND", "JD review not found.", 404);
  return { ok: true as const, data };
}

export async function resolveWorkstationCareerOwnerId() {
  const supabaseResult = getSupabase();
  if (!supabaseResult.ok) return supabaseResult;

  const { data, error } = await supabaseResult.data.from("admin_users").select("user_id").order("created_at", { ascending: true }).limit(2);
  if (error) return databaseError(error, "Failed to resolve Career Center owner.");
  if (!data || data.length === 0) return errorResult("INTERNAL_ERROR", "No Career Center admin owner is configured.", 503);
  if (data.length > 1) return errorResult("CONFLICT", "Multiple admin owners exist. Configure an explicit Career Center owner before using token writes.", 409);
  return { ok: true as const, data: data[0].user_id as string };
}

export async function createWorkstationJdReview(input: WorkstationJdReviewCreateInput) {
  const supabaseResult = getSupabase();
  if (!supabaseResult.ok) return supabaseResult;
  const owner = await resolveWorkstationCareerOwnerId();
  if (!owner.ok) return owner;

  const { data, error } = await supabaseResult.data
    .from("resume_jd_reviews")
    .insert({ ...input, owner_id: owner.data })
    .select("id")
    .single();
  if (error) return databaseError(error, "Failed to create JD review.");
  revalidateCareerPaths(undefined, input.resume_version_id, data.id);
  return showWorkstationJdReview(data.id);
}

export async function updateWorkstationJdReview(id: string, input: WorkstationJdReviewUpdateInput) {
  if (!isUuid(id)) return errorResult("VALIDATION_ERROR", "Invalid JD review id.", 400);
  const existing = await showWorkstationJdReview(id);
  if (!existing.ok) return existing;
  const supabaseResult = getSupabase();
  if (!supabaseResult.ok) return supabaseResult;

  const { error } = await supabaseResult.data.from("resume_jd_reviews").update(stripUndefined(input as Record<string, unknown>)).eq("id", id);
  if (error) return databaseError(error, "Failed to update JD review.");
  revalidateCareerPaths(undefined, existing.data.resume_version_id, id);
  return showWorkstationJdReview(id);
}

export async function deleteWorkstationJdReview(id: string) {
  if (!isUuid(id)) return errorResult("VALIDATION_ERROR", "Invalid JD review id.", 400);
  const existing = await showWorkstationJdReview(id);
  if (!existing.ok) return existing;
  const supabaseResult = getSupabase();
  if (!supabaseResult.ok) return supabaseResult;

  const { error } = await supabaseResult.data.from("resume_jd_reviews").delete().eq("id", id);
  if (error) return databaseError(error, "Failed to delete JD review.");
  revalidateCareerPaths(undefined, existing.data.resume_version_id, id);
  return { ok: true as const, data: { id, company_name: existing.data.company_name, job_title: existing.data.job_title, deleted: true } };
}

export async function getWorkstationCareerProfile(): Promise<ProfileRecord> {
  const supabaseResult = getSupabase();
  if (supabaseResult.ok) {
    const { data } = await supabaseResult.data.from("profiles").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (data) return data as ProfileRecord;
  }

  const { getProfileFallback } = await import("@/lib/queries/profile");
  return getProfileFallback();
}

export async function getWorkstationBasicResumeItems(): Promise<ResumeItemRecord[]> {
  const supabaseResult = getSupabase();
  if (!supabaseResult.ok) return [];
  const { data } = await supabaseResult.data.from("resume_items").select("*").eq("item_type", "basic").order("updated_at", { ascending: false });
  return (data ?? []) as ResumeItemRecord[];
}

async function showWithClient(supabase: SupabaseClient, table: "resume_items" | "resume_versions", id: string) {
  const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
  if (error) return databaseError(error, `Failed to load ${table}.`);
  if (!data) return errorResult("NOT_FOUND", `${table === "resume_items" ? "Resume item" : "Resume version"} not found.`, 404);
  return { ok: true as const, data };
}

function revalidateCareerPaths(resumeItemId?: string, resumeVersionId?: string, jdReviewId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/career");
  revalidatePath("/dashboard/resume");
  revalidatePath("/dashboard/resume/versions");
  revalidatePath("/dashboard/resume/jd-reviews");
  revalidatePath("/dashboard/resume/applications");
  if (resumeItemId) revalidatePath(`/dashboard/resume/${resumeItemId}`);
  if (resumeVersionId) {
    revalidatePath(`/dashboard/resume/versions/${resumeVersionId}`);
    revalidatePath(`/dashboard/resume/versions/${resumeVersionId}/preview`);
    revalidatePath(`/dashboard/resume/versions/${resumeVersionId}/jd-review`);
  }
  if (jdReviewId) revalidatePath(`/dashboard/resume/jd-reviews/${jdReviewId}`);
}

export type WorkstationJdReviewRecord = Omit<ResumeJdReviewRecord, "owner_id">;
