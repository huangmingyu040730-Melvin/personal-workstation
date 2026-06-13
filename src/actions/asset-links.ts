"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ResearchAssetType } from "@/lib/content-types";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { buildAssetDashboardHref } from "@/lib/queries/asset-links";
import { getOptionalString, getString } from "@/lib/forms";
import { getSafeDashboardRedirect } from "@/lib/safe-redirect";
import {
  assetLinkCreateSchema,
  assetLinkDeleteSchema,
  assetLinkUpdateSchema
} from "@/lib/validations/asset-link";

type AdminSupabaseClient = NonNullable<Awaited<ReturnType<typeof getAdminClient>>["supabase"]>;

function getReturnPathWithError(returnTo: string, message: string): never {
  const url = new URL(returnTo, "https://local.invalid");
  url.searchParams.delete("notice");
  url.searchParams.set("error", message);
  redirect(`${url.pathname}${url.search}`);
}

function getDashboardPathname(value: string) {
  return new URL(value, "https://local.invalid").pathname;
}

function getAssetTableName(type: ResearchAssetType) {
  return type === "project"
    ? "projects"
    : type === "knowledge"
      ? "knowledge_notes"
      : type === "skill"
        ? "skills"
        : "publications";
}

async function ensureAssetExists(
  supabase: AdminSupabaseClient,
  type: ResearchAssetType,
  id: string
) {
  const table = getAssetTableName(type);
  const { data, error } = await supabase.from(table).select("id").eq("id", id).maybeSingle();

  if (error) {
    console.error("asset link existence check failed", {
      type,
      id,
      code: error.code,
      message: error.message
    });
    return false;
  }

  return Boolean(data);
}

function assetLinkErrorMessage(error: { code?: string; message?: string }) {
  if (error.code === "23505") {
    return "这条显式关联已经存在。";
  }

  if (error.code === "23514") {
    return "不能把资产关联到自身，请重新选择目标资产。";
  }

  if (error.message?.includes("research_asset_links")) {
    return "保存显式关系失败，请确认 0019 migration 已执行。";
  }

  return error.message || "显式关系保存失败，请稍后重试。";
}

export async function createAssetLinkAction(formData: FormData) {
  const returnTo = getSafeDashboardRedirect(getOptionalString(formData, "return_to"));
  const parsed = assetLinkCreateSchema.safeParse({
    source_type: getString(formData, "source_type"),
    source_id: getString(formData, "source_id"),
    target_type: getString(formData, "target_type"),
    target_id: getString(formData, "target_id"),
    relation_type: getString(formData, "relation_type"),
    note: getOptionalString(formData, "note"),
    return_to: returnTo
  });

  if (!parsed.success) {
    getReturnPathWithError(returnTo, parsed.error.issues[0]?.message ?? "请检查显式关系表单。");
  }

  const { supabase, isAdmin, actorId, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    getReturnPathWithError(returnTo, error ?? "当前账号没有管理员权限。");
  }

  const [sourceExists, targetExists] = await Promise.all([
    ensureAssetExists(supabase, parsed.data.source_type, parsed.data.source_id),
    ensureAssetExists(supabase, parsed.data.target_type, parsed.data.target_id)
  ]);

  if (!sourceExists) {
    getReturnPathWithError(returnTo, "来源资产不存在或当前账号无权读取。");
  }

  if (!targetExists) {
    getReturnPathWithError(returnTo, "目标资产不存在或当前账号无权读取。");
  }

  const { data, error: insertError } = await supabase
    .from("research_asset_links")
    .insert({
      source_type: parsed.data.source_type,
      source_id: parsed.data.source_id,
      target_type: parsed.data.target_type,
      target_id: parsed.data.target_id,
      relation_type: parsed.data.relation_type,
      note: parsed.data.note,
      created_by: actorId
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("createAssetLinkAction insert failed", {
      sourceType: parsed.data.source_type,
      sourceId: parsed.data.source_id,
      targetType: parsed.data.target_type,
      targetId: parsed.data.target_id,
      relationType: parsed.data.relation_type,
      code: insertError.code,
      message: insertError.message
    });
    getReturnPathWithError(returnTo, assetLinkErrorMessage(insertError));
  }

  await writeActivityLog({
    action: "research_asset_link.create",
    entityType: "research_asset_link",
    entityId: data.id,
    metadata: {
      source_type: parsed.data.source_type,
      source_id: parsed.data.source_id,
      target_type: parsed.data.target_type,
      target_id: parsed.data.target_id,
      relation_type: parsed.data.relation_type
    }
  });

  revalidatePath(getDashboardPathname(returnTo));
  revalidatePath(buildAssetDashboardHref(parsed.data.source_type, parsed.data.source_id));
  revalidatePath(buildAssetDashboardHref(parsed.data.target_type, parsed.data.target_id));
  revalidatePath("/dashboard");
  redirect(returnTo);
}

export async function updateAssetLinkAction(formData: FormData) {
  const returnTo = getSafeDashboardRedirect(getOptionalString(formData, "return_to"));
  const parsed = assetLinkUpdateSchema.safeParse({
    link_id: getString(formData, "link_id"),
    relation_type: getString(formData, "relation_type"),
    note: getOptionalString(formData, "note"),
    return_to: returnTo
  });

  if (!parsed.success) {
    getReturnPathWithError(returnTo, parsed.error.issues[0]?.message ?? "请检查显式关系表单。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    getReturnPathWithError(returnTo, error ?? "当前账号没有管理员权限。");
  }

  const { data: existing, error: readError } = await supabase
    .from("research_asset_links")
    .select("id,source_type,source_id,target_type,target_id,relation_type")
    .eq("id", parsed.data.link_id)
    .maybeSingle();

  if (readError) {
    console.error("updateAssetLinkAction read failed", {
      linkId: parsed.data.link_id,
      code: readError.code,
      message: readError.message
    });
    getReturnPathWithError(returnTo, "读取显式关系失败，请稍后重试。");
  }

  if (!existing) {
    getReturnPathWithError(returnTo, "这条显式关系不存在或已被删除。");
  }

  const link = existing as {
    id: string;
    source_type: ResearchAssetType;
    source_id: string;
    target_type: ResearchAssetType;
    target_id: string;
    relation_type: string;
  };

  const { error: updateError } = await supabase
    .from("research_asset_links")
    .update({
      relation_type: parsed.data.relation_type,
      note: parsed.data.note
    })
    .eq("id", parsed.data.link_id);

  if (updateError) {
    console.error("updateAssetLinkAction update failed", {
      linkId: parsed.data.link_id,
      sourceType: link.source_type,
      sourceId: link.source_id,
      targetType: link.target_type,
      targetId: link.target_id,
      relationType: parsed.data.relation_type,
      code: updateError.code,
      message: updateError.message
    });
    getReturnPathWithError(returnTo, assetLinkErrorMessage(updateError));
  }

  await writeActivityLog({
    action: "research_asset_link.update",
    entityType: "research_asset_link",
    entityId: parsed.data.link_id,
    metadata: {
      source_type: link.source_type,
      source_id: link.source_id,
      target_type: link.target_type,
      target_id: link.target_id,
      relation_type: parsed.data.relation_type
    }
  });

  revalidatePath(getDashboardPathname(returnTo));
  revalidatePath(buildAssetDashboardHref(link.source_type, link.source_id));
  revalidatePath(buildAssetDashboardHref(link.target_type, link.target_id));
  revalidatePath("/dashboard");
  redirect(returnTo);
}

export async function deleteAssetLinkAction(formData: FormData) {
  const returnTo = getSafeDashboardRedirect(getOptionalString(formData, "return_to"));
  const parsed = assetLinkDeleteSchema.safeParse({
    link_id: getString(formData, "link_id"),
    return_to: returnTo
  });

  if (!parsed.success) {
    getReturnPathWithError(returnTo, parsed.error.issues[0]?.message ?? "关系 ID 无效。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    getReturnPathWithError(returnTo, error ?? "当前账号没有管理员权限。");
  }

  const { data: existing, error: readError } = await supabase
    .from("research_asset_links")
    .select("id,source_type,source_id,target_type,target_id,relation_type")
    .eq("id", parsed.data.link_id)
    .maybeSingle();

  if (readError) {
    console.error("deleteAssetLinkAction read failed", {
      linkId: parsed.data.link_id,
      code: readError.code,
      message: readError.message
    });
    getReturnPathWithError(returnTo, "读取显式关系失败，请稍后重试。");
  }

  if (!existing) {
    getReturnPathWithError(returnTo, "这条显式关系不存在或已被删除。");
  }

  const { error: deleteError } = await supabase
    .from("research_asset_links")
    .delete()
    .eq("id", parsed.data.link_id);

  if (deleteError) {
    console.error("deleteAssetLinkAction delete failed", {
      linkId: parsed.data.link_id,
      code: deleteError.code,
      message: deleteError.message
    });
    getReturnPathWithError(returnTo, deleteError.message || "删除显式关系失败，请稍后重试。");
  }

  const link = existing as {
    id: string;
    source_type: ResearchAssetType;
    source_id: string;
    target_type: ResearchAssetType;
    target_id: string;
    relation_type: string;
  };

  await writeActivityLog({
    action: "research_asset_link.delete",
    entityType: "research_asset_link",
    entityId: parsed.data.link_id,
    metadata: {
      source_type: link.source_type,
      source_id: link.source_id,
      target_type: link.target_type,
      target_id: link.target_id,
      relation_type: link.relation_type
    }
  });

  revalidatePath(getDashboardPathname(returnTo));
  revalidatePath(buildAssetDashboardHref(link.source_type, link.source_id));
  revalidatePath(buildAssetDashboardHref(link.target_type, link.target_id));
  revalidatePath("/dashboard");
  redirect(returnTo);
}
