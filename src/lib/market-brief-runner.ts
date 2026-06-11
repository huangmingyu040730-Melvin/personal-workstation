import type { SupabaseClient } from "@supabase/supabase-js";
import type { GeneratedMarketBrief } from "@/lib/market-brief-generator";
import { defaultMarketBriefRunnerName, generateMarketBriefDraft } from "@/lib/market-brief-generator";
import type { MarketBriefGenerationJobRecord, MarketBriefJobStatus, MarketBriefRecord } from "@/lib/content-types";
import type { MarketBriefGroundingContext } from "@/lib/market-brief-grounding";
import type { MarketBriefJobProgressStage } from "@/lib/market-brief-job-progress";
import { createMarketBriefJobProgress, mergeProgressIntoPayload } from "@/lib/market-brief-job-progress";
import { formatDateInputValue } from "@/lib/format";

type RunnerSupabaseClient = SupabaseClient;

export type CreateMarketBriefJobInput = {
  ownerId: string;
  briefDate: string;
  market: string;
  runnerName?: string;
  requestPayload?: Record<string, unknown>;
};

export type MarketBriefGenerationProgressHandler = (stage: MarketBriefJobProgressStage, message?: string) => Promise<void> | void;

export async function findExistingMarketBrief(
  supabase: RunnerSupabaseClient,
  { ownerId, briefDate, market }: { ownerId: string; briefDate: string; market: string }
) {
  const { data, error } = await supabase
    .from("market_briefs")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("brief_date", briefDate)
    .eq("market", market)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "检查市场简报失败。");
  }

  return data as Pick<MarketBriefRecord, "id"> | null;
}

export async function findActiveMarketBriefGenerationJob(
  supabase: RunnerSupabaseClient,
  { ownerId, briefDate, market }: { ownerId: string; briefDate: string; market: string }
) {
  const { data, error } = await supabase
    .from("market_brief_generation_jobs")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("brief_date", briefDate)
    .eq("market", market)
    .in("status", ["queued", "running"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "检查生成任务失败。");
  }

  return data as MarketBriefGenerationJobRecord | null;
}

export async function createQueuedMarketBriefGenerationJob(supabase: RunnerSupabaseClient, input: CreateMarketBriefJobInput) {
  const runnerName = input.runnerName ?? defaultMarketBriefRunnerName;
  const { data, error } = await supabase
    .from("market_brief_generation_jobs")
    .insert({
      owner_id: input.ownerId,
      brief_date: input.briefDate,
      market: input.market,
      status: "queued",
      runner_name: runnerName,
      request_payload: {
        source: "dashboard-button",
        market: input.market,
        brief_date: input.briefDate,
        runner_name: runnerName,
        progress: createMarketBriefJobProgress("queued"),
        ...(input.requestPayload ?? {})
      }
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "创建市场简报生成任务失败。");
  }

  return data as MarketBriefGenerationJobRecord;
}

export async function runMockMarketBriefGenerationJob(
  supabase: RunnerSupabaseClient,
  job: MarketBriefGenerationJobRecord,
  options: { grounding?: MarketBriefGroundingContext; onProgress?: MarketBriefGenerationProgressHandler } = {}
) {
  let runningJob = job;
  const updateProgress = async (stage: MarketBriefJobProgressStage, message?: string) => {
    await options.onProgress?.(stage, message);
  };

  try {
    await updateProgress("validating", "正在校验交易日与任务参数...");
    runningJob = await updateMarketBriefGenerationJobStatus(supabase, job.id, "running", {
      started_at: new Date().toISOString(),
      error_message: null
    });
    await updateProgress("preparing", "正在读取已保存市场素材包...");

    const generated = await generateMarketBriefDraft({
      market: runningJob.market,
      briefDate: runningJob.brief_date,
      runnerName: runningJob.runner_name,
      isHistorical: runningJob.request_payload?.is_historical === true,
      grounding: options.grounding,
      onProgress: updateProgress
    });
    await assertMarketBriefJobStillRunning(supabase, runningJob.id);
    await updateProgress("saving", "正在保存简报...");
    const brief = await createOrUpdateMarketBriefFromGenerated(supabase, runningJob, generated);
    const completedAt = new Date().toISOString();
    const succeededPayload = await mergeJobPayloadWithProgress(supabase, runningJob.id, "succeeded");

    const { data, error } = await supabase
      .from("market_brief_generation_jobs")
      .update({
        status: "succeeded",
        request_payload: succeededPayload,
        source_snapshot: generated.sourceSnapshot,
        result_payload: generated,
        market_brief_id: brief.id,
        completed_at: completedAt,
        error_message: null
      })
      .eq("id", runningJob.id)
      .eq("status", "running")
      .select("*")
      .maybeSingle();

    if (error || !data) {
      throw new Error(error?.message || "更新市场简报生成任务失败。");
    }

    return { job: data as MarketBriefGenerationJobRecord, brief };
  } catch (error) {
    await updateProgress("failed", "AI 生成失败");
    await markMarketBriefGenerationJobFailed(supabase, runningJob.id, getSafeRunnerErrorMessage(error));
    throw error;
  }
}

export async function markMarketBriefGenerationJobFailed(
  supabase: RunnerSupabaseClient,
  jobId: string,
  errorMessage: string,
  progressMessage = "AI 生成失败"
) {
  const requestPayload = await mergeJobPayloadWithProgress(supabase, jobId, "failed", progressMessage);
  const { data, error } = await supabase
    .from("market_brief_generation_jobs")
    .update({
      status: "failed",
      error_message: errorMessage.slice(0, 500),
      completed_at: new Date().toISOString(),
      request_payload: requestPayload
    })
    .eq("id", jobId)
    .in("status", ["queued", "running"])
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error("标记生成任务失败。");
  }

  return data as MarketBriefGenerationJobRecord | null;
}

export async function updateMarketBriefGenerationJobProgress(
  supabase: RunnerSupabaseClient,
  jobId: string,
  stage: MarketBriefJobProgressStage,
  message?: string
) {
  const requestPayload = await mergeJobPayloadWithProgress(supabase, jobId, stage, message);
  const { data, error } = await supabase
    .from("market_brief_generation_jobs")
    .update({ request_payload: requestPayload })
    .eq("id", jobId)
    .in("status", ["queued", "running"])
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "更新生成进度失败。");
  }

  return data as MarketBriefGenerationJobRecord | null;
}

export function getTodayDateInShanghai() {
  return formatDateInputValue();
}

export function normalizeBriefDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

async function createOrUpdateMarketBriefFromGenerated(
  supabase: RunnerSupabaseClient,
  job: Pick<MarketBriefGenerationJobRecord, "owner_id" | "brief_date" | "market" | "runner_name">,
  generated: GeneratedMarketBrief
) {
  const generatedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("market_briefs")
    .upsert(
      {
        owner_id: job.owner_id,
        brief_date: job.brief_date,
        title: generated.title,
        market: job.market,
        status: "draft",
        summary: generated.summary,
        markdown_content: generated.markdownContent,
        generation_status: generated.generationStatus ?? "generated",
        generated_at: generatedAt,
        generator_name: generated.generatorName || job.runner_name,
        source_snapshot: generated.sourceSnapshot,
        tags: generated.tags,
        data_sources: generated.dataSources
      },
      { onConflict: "owner_id,brief_date,market" }
    )
    .select("id,title,brief_date,market,status,generation_status,generator_name")
    .single();

  if (error) {
    throw new Error(error.message || "保存生成的市场简报失败。");
  }

  return data as Pick<MarketBriefRecord, "id" | "title" | "brief_date" | "market" | "status" | "generation_status" | "generator_name">;
}

async function updateMarketBriefGenerationJobStatus(
  supabase: RunnerSupabaseClient,
  jobId: string,
  status: MarketBriefJobStatus,
  extra: Record<string, unknown> = {}
) {
  const { data, error } = await supabase
    .from("market_brief_generation_jobs")
    .update({ status, ...extra })
    .eq("id", jobId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "更新市场简报生成任务失败。");
  }

  return data as MarketBriefGenerationJobRecord;
}

async function assertMarketBriefJobStillRunning(supabase: RunnerSupabaseClient, jobId: string) {
  const { data, error } = await supabase
    .from("market_brief_generation_jobs")
    .select("status")
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "检查市场简报生成任务状态失败。");
  }

  if (!data || data.status !== "running") {
    throw new Error("市场简报生成任务已停止，迟到的 AI 结果不会保存。");
  }
}

async function mergeJobPayloadWithProgress(
  supabase: RunnerSupabaseClient,
  jobId: string,
  stage: MarketBriefJobProgressStage,
  message?: string
) {
  const { data, error } = await supabase
    .from("market_brief_generation_jobs")
    .select("request_payload")
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "读取生成任务进度失败。");
  }

  const payload = isPlainRecord(data?.request_payload) ? data.request_payload : {};
  return mergeProgressIntoPayload(payload, createMarketBriefJobProgress(stage, message));
}

function getSafeRunnerErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.slice(0, 500);
  }

  return "市场简报生成任务失败。";
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
