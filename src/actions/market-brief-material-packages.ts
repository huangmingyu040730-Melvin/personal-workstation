"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { encodeFormError, getString } from "@/lib/forms";
import {
  createOrUpdateMarketBriefMaterialPackage,
  type MarketBriefMaterialPackageCollectionResult
} from "@/lib/market-brief-material-packages";
import { getTodayDateInShanghai } from "@/lib/market-brief-runner";

type MaterialPackageActionRecord = {
  id: string;
  owner_id: string;
  package_date: string;
  market: string;
  status: string;
  sources?: unknown[];
};

export async function recollectMarketBriefMaterialPackageAction(formData: FormData) {
  const id = getString(formData, "id");

  if (!id) {
    redirect(`/dashboard/market-briefs/materials?error=${encodeFormError("缺少素材包 ID。")}`);
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(`/dashboard/market-briefs/materials/${id}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const { data: existing, error: readError } = await supabase
    .from("market_brief_material_packages")
    .select("id,owner_id,package_date,market,status,sources")
    .eq("id", id)
    .maybeSingle();

  if (readError || !existing) {
    redirect(`/dashboard/market-briefs/materials?error=${encodeFormError(readError?.message ?? "素材包不存在或已被删除。")}`);
  }

  const materialPackage = existing as MaterialPackageActionRecord;
  let result: MarketBriefMaterialPackageCollectionResult;

  try {
    result = await createOrUpdateMarketBriefMaterialPackage(supabase, {
      ownerId: materialPackage.owner_id,
      packageDate: materialPackage.package_date,
      market: materialPackage.market,
      isHistorical: materialPackage.package_date !== getTodayDateInShanghai()
    });
  } catch (collectError) {
    redirect(`/dashboard/market-briefs/materials/${id}?error=${encodeFormError(getActionErrorMessage(collectError, "重新采集素材包失败。"))}`);
  }

  await writeActivityLog({
    action: "market_brief_material_package.recollect",
    entityType: "market_brief_material_package",
    entityId: result.package.id,
    metadata: {
      package_date: result.package.package_date,
      market: result.package.market,
      status: result.package.status,
      sources_count: result.package.sources.length
    }
  });

  revalidateMaterialPackagePaths(result.package.id);
  if (result.package.id !== id) {
    revalidateMaterialPackagePaths(id);
  }
  redirect(`/dashboard/market-briefs/materials/${result.package.id}?notice=recollected`);
}

export async function deleteMarketBriefMaterialPackageAction(formData: FormData) {
  const id = getString(formData, "id");

  if (!id) {
    redirect(`/dashboard/market-briefs/materials?error=${encodeFormError("缺少素材包 ID。")}`);
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(`/dashboard/market-briefs/materials/${id}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const { data: existing, error: readError } = await supabase
    .from("market_brief_material_packages")
    .select("id,package_date,market,status,sources")
    .eq("id", id)
    .maybeSingle();

  if (readError || !existing) {
    redirect(`/dashboard/market-briefs/materials?error=${encodeFormError(readError?.message ?? "素材包不存在或已被删除。")}`);
  }

  const materialPackage = existing as MaterialPackageActionRecord;
  const { error: deleteError } = await supabase
    .from("market_brief_material_packages")
    .delete()
    .eq("id", id);

  if (deleteError) {
    redirect(`/dashboard/market-briefs/materials/${id}?error=${encodeFormError(deleteError.message || "删除市场素材包失败。")}`);
  }

  await writeActivityLog({
    action: "market_brief_material_package.delete",
    entityType: "market_brief_material_package",
    entityId: id,
    metadata: {
      package_date: materialPackage.package_date,
      market: materialPackage.market,
      status: materialPackage.status,
      sources_count: Array.isArray(materialPackage.sources) ? materialPackage.sources.length : 0
    }
  });

  revalidateMaterialPackagePaths(id);
  redirect("/dashboard/market-briefs/materials?notice=deleted");
}

function revalidateMaterialPackagePaths(id?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/market-briefs");
  revalidatePath("/dashboard/market-briefs/jobs");
  revalidatePath("/dashboard/market-briefs/materials");
  if (id) {
    revalidatePath(`/dashboard/market-briefs/materials/${id}`);
  }
}

function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
