"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { encodeFormError, getArrayFromText, getBoolean, getOptionalString, getString } from "@/lib/forms";
import { marketBriefSchema, type MarketBriefInput } from "@/lib/validations/market-brief";

function marketBriefPayloadFromForm(formData: FormData) {
  return marketBriefSchema.safeParse({
    brief_date: getString(formData, "brief_date"),
    title: getString(formData, "title"),
    status: getString(formData, "status"),
    market: getString(formData, "market"),
    summary: getOptionalString(formData, "summary"),
    market_overview: getOptionalString(formData, "market_overview"),
    index_performance: getOptionalString(formData, "index_performance"),
    style_performance: getOptionalString(formData, "style_performance"),
    sector_performance: getOptionalString(formData, "sector_performance"),
    hot_topics: getOptionalString(formData, "hot_topics"),
    capital_flows: getOptionalString(formData, "capital_flows"),
    policy_news: getOptionalString(formData, "policy_news"),
    risk_alerts: getOptionalString(formData, "risk_alerts"),
    tomorrow_watch: getOptionalString(formData, "tomorrow_watch"),
    data_sources: getArrayFromText(formData, "data_sources"),
    tags: getArrayFromText(formData, "tags"),
    is_featured: getBoolean(formData, "is_featured"),
    markdown_content: getOptionalString(formData, "markdown_content"),
    generation_status: getString(formData, "generation_status") || "manual",
    generator_name: getOptionalString(formData, "generator_name")
  });
}

function marketBriefErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeFormError(message)}`);
}

function getMarketBriefErrorMessage(error: { code?: string; message?: string }) {
  if (error.code === "23505") {
    return "同一市场在该日期已经存在一篇简报。";
  }

  return error.message || "市场简报保存失败，请稍后重试。";
}

export async function createMarketBriefAction(formData: FormData) {
  const parsed = marketBriefPayloadFromForm(formData);

  if (!parsed.success) {
    marketBriefErrorRedirect("/dashboard/market-briefs/new", parsed.error.issues[0]?.message ?? "请检查市场简报表单。");
  }

  const { supabase, isAdmin, actorId, error } = await getAdminClient();

  if (!supabase || !isAdmin || !actorId) {
    marketBriefErrorRedirect("/dashboard/market-briefs/new", error ?? "当前账号没有管理员权限。");
  }

  const { data, error: insertError } = await supabase
    .from("market_briefs")
    .insert({ ...normalizeMarketBriefPayload(parsed.data), owner_id: actorId })
    .select("id,title,brief_date,market,status")
    .single();

  if (insertError) {
    marketBriefErrorRedirect("/dashboard/market-briefs/new", getMarketBriefErrorMessage(insertError));
  }

  await writeActivityLog({
    action: "market_brief.create",
    entityType: "market_brief",
    entityId: data.id,
    metadata: { title: data.title, brief_date: data.brief_date, market: data.market, status: data.status }
  });

  revalidateMarketBriefPaths(data.id);
  redirect(`/dashboard/market-briefs/${data.id}`);
}

export async function updateMarketBriefAction(id: string, formData: FormData) {
  const editPath = `/dashboard/market-briefs/${id}/edit`;
  const parsed = marketBriefPayloadFromForm(formData);

  if (!parsed.success) {
    marketBriefErrorRedirect(editPath, parsed.error.issues[0]?.message ?? "请检查市场简报表单。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    marketBriefErrorRedirect(editPath, error ?? "当前账号没有管理员权限。");
  }

  const { data, error: updateError } = await supabase
    .from("market_briefs")
    .update(normalizeMarketBriefPayload(parsed.data))
    .eq("id", id)
    .select("id,title,brief_date,market,status")
    .single();

  if (updateError) {
    marketBriefErrorRedirect(editPath, getMarketBriefErrorMessage(updateError));
  }

  await writeActivityLog({
    action: "market_brief.update",
    entityType: "market_brief",
    entityId: data.id,
    metadata: { title: data.title, brief_date: data.brief_date, market: data.market, status: data.status }
  });

  revalidateMarketBriefPaths(id);
  redirect(`/dashboard/market-briefs/${id}`);
}

export async function deleteMarketBriefAction(id: string) {
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(`/dashboard/market-briefs/${id}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const { data: existing } = await supabase.from("market_briefs").select("title,brief_date,market").eq("id", id).maybeSingle();
  const { error: deleteError } = await supabase.from("market_briefs").delete().eq("id", id);

  if (deleteError) {
    redirect(`/dashboard/market-briefs/${id}?error=${encodeFormError(deleteError.message || "删除市场简报失败。")}`);
  }

  await writeActivityLog({
    action: "market_brief.delete",
    entityType: "market_brief",
    entityId: id,
    metadata: {
      title: existing?.title ?? "已删除市场简报",
      brief_date: existing?.brief_date ?? null,
      market: existing?.market ?? null
    }
  });

  revalidateMarketBriefPaths(id);
  redirect("/dashboard/market-briefs");
}

function revalidateMarketBriefPaths(id?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/market-briefs");
  if (id) {
    revalidatePath(`/dashboard/market-briefs/${id}`);
    revalidatePath(`/dashboard/market-briefs/${id}/preview`);
  }
}

function normalizeMarketBriefPayload(data: MarketBriefInput) {
  return {
    ...data,
    generation_status: data.generation_status ?? "manual",
    generator_name: data.generator_name ?? (data.markdown_content ? "manual" : null)
  };
}
