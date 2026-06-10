"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getNearestPreviousAShareTradingDay, validateAShareTradingDay } from "@/lib/a-share-trading-calendar";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { encodeFormError, getArrayFromText, getBoolean, getOptionalString, getString } from "@/lib/forms";
import { aiMarketBriefRunnerName, externalMarketBriefRunnerName, getMarketBriefGeneratorMode } from "@/lib/market-brief-generator";
import {
  createQueuedMarketBriefGenerationJob,
  findActiveMarketBriefGenerationJob,
  findExistingMarketBrief,
  getTodayDateInShanghai,
  normalizeBriefDate,
  runMockMarketBriefGenerationJob
} from "@/lib/market-brief-runner";
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

export async function generateTodayMarketBriefAction(formData: FormData) {
  return generateMarketBriefAction(formData, { mode: "today" });
}

export async function generateMarketBriefForDateAction(formData: FormData) {
  return generateMarketBriefAction(formData, { mode: "selected-date" });
}

export async function generateMarketBriefWithAiAction(formData: FormData) {
  return generateMarketBriefAction(formData, { mode: "selected-date" });
}

async function generateMarketBriefAction(formData: FormData, options: { mode: "today" | "selected-date" }) {
  const market = getString(formData, "market") || "A股";
  const today = getTodayDateInShanghai();
  const rawBriefDate = options.mode === "today" ? today : getString(formData, "brief_date");
  const briefDate = normalizeBriefDate(rawBriefDate);
  const generatorMode = getMarketBriefGeneratorMode();

  if (!briefDate) {
    redirect(`/dashboard/market-briefs?error=${encodeFormError("请选择有效日期。")}`);
  }

  const dateValidation = validateAShareTradingDay(briefDate, today);
  if (!dateValidation.ok) {
    const message = options.mode === "today" && dateValidation.reason === "non_trading_day"
      ? `今日不是 A 股交易日，无法生成今日市场简报。你可以选择最近一个交易日补生成。${formatNearestTradingDay(dateValidation.nearestPreviousTradingDay ?? getNearestPreviousAShareTradingDay(today))}`
      : `${dateValidation.message}${formatNearestTradingDay(dateValidation.nearestPreviousTradingDay)}`;
    redirect(`/dashboard/market-briefs?error=${encodeFormError(message)}`);
  }

  const isHistorical = briefDate !== today;
  const { supabase, isAdmin, actorId, error } = await getAdminClient();

  if (!supabase || !isAdmin || !actorId) {
    redirect(`/dashboard/market-briefs?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  let existing;

  try {
    existing = await findExistingMarketBrief(supabase, { ownerId: actorId, briefDate, market });
  } catch (checkError) {
    redirect(`/dashboard/market-briefs?error=${encodeFormError(getActionErrorMessage(checkError, "检查今日市场简报失败。"))}`);
  }

  if (existing?.id) {
    redirect(`/dashboard/market-briefs/${existing.id}/preview?notice=exists`);
  }

  let activeJob;

  try {
    activeJob = await findActiveMarketBriefGenerationJob(supabase, { ownerId: actorId, briefDate, market });
  } catch (checkError) {
    redirect(`/dashboard/market-briefs?error=${encodeFormError(getActionErrorMessage(checkError, "检查生成任务失败。"))}`);
  }

  if (activeJob?.id) {
    redirect(`/dashboard/market-briefs/jobs/${activeJob.id}?notice=active`);
  }

  let job;

  try {
    job = await createQueuedMarketBriefGenerationJob(supabase, {
      ownerId: actorId,
      briefDate,
      market,
      runnerName: generatorMode === "external" ? externalMarketBriefRunnerName : generatorMode === "ai" ? aiMarketBriefRunnerName : undefined,
      requestPayload: {
        triggered_by: "dashboard",
        generator_mode: generatorMode,
        generator_name: generatorMode === "ai" ? aiMarketBriefRunnerName : generatorMode === "external" ? externalMarketBriefRunnerName : "manual-skill-mock",
        is_historical: isHistorical
      }
    });
  } catch (createError) {
    redirect(`/dashboard/market-briefs?error=${encodeFormError(getActionErrorMessage(createError, "创建生成任务失败。"))}`);
  }

  if (generatorMode === "external") {
    await writeActivityLog({
      action: "market_brief_generation_job.create",
      entityType: "market_brief_generation_job",
      entityId: job.id,
      metadata: {
        brief_date: job.brief_date,
        market: job.market,
        status: job.status,
        runner_name: job.runner_name,
        generator_mode: generatorMode,
        is_historical: isHistorical
      }
    });

    revalidateMarketBriefPaths();
    revalidateMarketBriefJobPaths(job.id);
    redirect(`/dashboard/market-briefs/jobs/${job.id}?notice=queued`);
  }

  let result;

  try {
    result = await runMockMarketBriefGenerationJob(supabase, job);
  } catch (runError) {
    revalidateMarketBriefPaths();
    revalidateMarketBriefJobPaths(job.id);
    redirect(`/dashboard/market-briefs/jobs/${job.id}?notice=failed&error=${encodeFormError(getActionErrorMessage(runError, "市场简报生成任务失败。"))}`);
  }

  await writeActivityLog({
    action: "market_brief.generate",
    entityType: "market_brief",
    entityId: result.brief.id,
    metadata: {
      title: result.brief.title,
      brief_date: result.brief.brief_date,
      market: result.brief.market,
      status: result.brief.status,
      generation_status: result.brief.generation_status,
      generator_name: result.brief.generator_name,
      job_id: result.job.id,
      job_status: result.job.status
    }
  });

  revalidateMarketBriefPaths(result.brief.id);
  revalidateMarketBriefJobPaths(result.job.id);
  redirect(`/dashboard/market-briefs/${result.brief.id}/preview?notice=generated&job=${result.job.id}`);
}

export async function cancelMarketBriefGenerationJobAction(jobId: string, formData?: FormData) {
  const { supabase, isAdmin, error } = await getAdminClient();
  const returnTo = getSafeReturnPath(formData, `/dashboard/market-briefs/jobs/${jobId}`);

  if (!supabase || !isAdmin) {
    redirect(`${returnTo}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const now = new Date().toISOString();
  const { data, error: updateError } = await supabase
    .from("market_brief_generation_jobs")
    .update({
      status: "cancelled",
      completed_at: now,
      error_message: "Manually cancelled by admin.",
      updated_at: now
    })
    .eq("id", jobId)
    .in("status", ["queued", "running"])
    .select("id,brief_date,market,status,market_brief_id")
    .maybeSingle();

  if (updateError || !data) {
    redirect(`${returnTo}?error=${encodeFormError(updateError?.message ?? "只能取消排队中或运行中的任务。")}`);
  }

  await writeActivityLog({
    action: "market_brief_generation_job.cancel",
    entityType: "market_brief_generation_job",
    entityId: data.id,
    metadata: { brief_date: data.brief_date, market: data.market, status: data.status }
  });

  revalidateMarketBriefPaths(data.market_brief_id ?? undefined);
  revalidateMarketBriefJobPaths(data.id);
  redirect(`${returnTo}?notice=cancelled`);
}

export async function requeueMarketBriefGenerationJobAction(jobId: string, formData?: FormData) {
  const { supabase, isAdmin, error } = await getAdminClient();
  const returnTo = getSafeReturnPath(formData, `/dashboard/market-briefs/jobs/${jobId}`);

  if (!supabase || !isAdmin) {
    redirect(`${returnTo}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const now = new Date().toISOString();
  const { data, error: updateError } = await supabase
    .from("market_brief_generation_jobs")
    .update({
      status: "queued",
      started_at: null,
      completed_at: null,
      error_message: null,
      updated_at: now
    })
    .eq("id", jobId)
    .in("status", ["running", "failed", "cancelled"])
    .select("id,brief_date,market,status,market_brief_id")
    .maybeSingle();

  if (updateError || !data) {
    redirect(`${returnTo}?error=${encodeFormError(updateError?.message ?? "只能将运行中、失败或已取消的任务重新排队。")}`);
  }

  await writeActivityLog({
    action: "market_brief_generation_job.requeue",
    entityType: "market_brief_generation_job",
    entityId: data.id,
    metadata: { brief_date: data.brief_date, market: data.market, status: data.status }
  });

  revalidateMarketBriefPaths(data.market_brief_id ?? undefined);
  revalidateMarketBriefJobPaths(data.id);
  redirect(`${returnTo}?notice=requeued`);
}

function revalidateMarketBriefPaths(id?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/market-briefs");
  revalidatePath("/dashboard/market-briefs/jobs");
  if (id) {
    revalidatePath(`/dashboard/market-briefs/${id}`);
    revalidatePath(`/dashboard/market-briefs/${id}/preview`);
  }
}

function revalidateMarketBriefJobPaths(id?: string) {
  revalidatePath("/dashboard/market-briefs/jobs");
  if (id) {
    revalidatePath(`/dashboard/market-briefs/jobs/${id}`);
  }
}

function normalizeMarketBriefPayload(data: MarketBriefInput) {
  return {
    ...data,
    generation_status: data.generation_status ?? "manual",
    generator_name: data.generator_name ?? (data.markdown_content ? "manual" : null)
  };
}

function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function getSafeReturnPath(formData: FormData | undefined, fallback: string) {
  const value = formData?.get("return_to");

  if (typeof value !== "string" || !value.startsWith("/dashboard/market-briefs/jobs")) {
    return fallback;
  }

  return value;
}

function formatNearestTradingDay(date: string | null) {
  return date ? ` 最近一个交易日：${date}` : "";
}
