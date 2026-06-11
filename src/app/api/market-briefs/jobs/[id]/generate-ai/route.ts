import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/auth/admin";
import type { MarketBriefGenerationJobRecord } from "@/lib/content-types";
import type { MarketBriefJobProgressStage } from "@/lib/market-brief-job-progress";
import { getMarketBriefJobProgressFromPayload, isMarketBriefJobProgressStale, marketBriefJobStaleMessage } from "@/lib/market-brief-job-progress";
import { markMarketBriefGenerationJobFailed, runMockMarketBriefGenerationJob, updateMarketBriefGenerationJobProgress } from "@/lib/market-brief-runner";

export const runtime = "nodejs";
export const maxDuration = 120;

const DEFAULT_AI_GENERATION_TIMEOUT_MS = 105_000;
const AI_GENERATION_TIMEOUT_MESSAGE = "AI 生成耗时过长，请稍后重试。";
const AI_GENERATION_TIMEOUT_PROGRESS_MESSAGE = "AI 生成超时，请重新排队后重试。";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
  }

  const { data, error: jobError } = await supabase
    .from("market_brief_generation_jobs")
    .select("*, market_briefs(id,title,brief_date,market)")
    .eq("id", id)
    .maybeSingle();

  if (jobError) {
    console.error("marketBrief.generateAi.readFailed", {
      job_id: id,
      code: jobError.code,
      message: jobError.message,
      details: jobError.details,
      hint: jobError.hint
    });
    return NextResponse.json({ error: "Failed to read market brief generation job." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Market brief generation job not found." }, { status: 404 });
  }

  const job = data as MarketBriefGenerationJobRecord;

  if (job.status === "succeeded") {
    return NextResponse.json(serializeMarketBriefJobStatus(job));
  }

  if (job.status === "cancelled") {
    return NextResponse.json(serializeMarketBriefJobStatus(job), { status: 409 });
  }

  if (job.status === "failed") {
    return NextResponse.json({ error: "该任务已失败，请先重新排队后再生成。", ...serializeMarketBriefJobStatus(job) }, { status: 409 });
  }

  if (job.status !== "queued" && job.status !== "running") {
    return NextResponse.json({ error: "该任务状态不支持 AI 生成。", ...serializeMarketBriefJobStatus(job) }, { status: 409 });
  }

  const currentProgress = getMarketBriefJobProgressFromPayload(job.request_payload, getFallbackProgressStage(job.status));

  if (job.status === "running") {
    const serialized = serializeMarketBriefJobStatus(job);
    if (serialized.stale) {
      return NextResponse.json({ ...serialized, already_running: true }, { status: 409 });
    }
    return NextResponse.json({ ...serialized, already_running: true }, { status: 202 });
  }

  try {
    const result = await withTimeout(
      runMockMarketBriefGenerationJob(supabase, job, {
        onProgress: async (stage, message) => {
          await updateMarketBriefGenerationJobProgress(supabase, job.id, stage, message);
        }
      }),
      getAiGenerationTimeoutMs()
    );

    revalidateMarketBriefPaths(result.brief.id, result.job.id);
    return NextResponse.json(serializeMarketBriefJobStatus(result.job));
  } catch (generationError) {
    const safeErrorMessage = getSafeGenerationErrorMessage(generationError);
    console.error("marketBrief.generateAi.failed", {
      job_id: job.id,
      status: job.status,
      progress_stage: currentProgress.stage,
      provider: job.request_payload?.generator_name ?? job.runner_name,
      message: safeErrorMessage
    });

    await markFailedSafely(supabase, job.id, safeErrorMessage, generationError instanceof MarketBriefGenerationTimeoutError
      ? AI_GENERATION_TIMEOUT_PROGRESS_MESSAGE
      : "AI 生成失败，请重新排队后重试。");

    const failedJob = await readJobSafely(supabase, job.id);
    return NextResponse.json(
      {
        error: "Failed to generate market brief.",
        ...(failedJob ? serializeMarketBriefJobStatus(failedJob) : { status: "failed", progress: createFallbackFailedProgress() })
      },
      { status: 500 }
    );
  }
}

function serializeMarketBriefJobStatus(job: MarketBriefGenerationJobRecord) {
  const progress = getMarketBriefJobProgressFromPayload(job.request_payload, getFallbackProgressStage(job.status));
  const marketBriefId = job.market_brief_id ?? job.market_briefs?.id ?? null;
  const stale = job.status === "running" && isMarketBriefJobProgressStale(progress);

  return {
    id: job.id,
    status: job.status,
    brief_date: job.brief_date,
    market: job.market,
    progress,
    error_message: job.error_message,
    market_brief_id: marketBriefId,
    preview_url: marketBriefId ? `/dashboard/market-briefs/${marketBriefId}/preview` : null,
    stale,
    stale_message: stale ? marketBriefJobStaleMessage : null,
    updated_at: job.updated_at
  };
}

function getFallbackProgressStage(status: string): MarketBriefJobProgressStage {
  if (status === "running") return "preparing";
  if (status === "succeeded") return "succeeded";
  if (status === "failed") return "failed";
  if (status === "cancelled") return "cancelled";
  return "queued";
}

function createFallbackFailedProgress() {
  return {
    stage: "failed",
    percent: 100,
    message: "生成失败",
    updated_at: new Date().toISOString()
  };
}

function revalidateMarketBriefPaths(briefId: string, jobId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/market-briefs");
  revalidatePath("/dashboard/market-briefs/jobs");
  revalidatePath(`/dashboard/market-briefs/jobs/${jobId}`);
  revalidatePath(`/dashboard/market-briefs/${briefId}`);
  revalidatePath(`/dashboard/market-briefs/${briefId}/preview`);
}

async function readJobSafely(supabase: NonNullable<Awaited<ReturnType<typeof getAdminClient>>["supabase"]>, jobId: string) {
  const { data, error } = await supabase
    .from("market_brief_generation_jobs")
    .select("*, market_briefs(id,title,brief_date,market)")
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    console.error("marketBrief.generateAi.readFailedJobFailed", {
      job_id: jobId,
      code: error.code,
      message: error.message
    });
    return null;
  }

  return data as MarketBriefGenerationJobRecord | null;
}

async function markFailedSafely(
  supabase: NonNullable<Awaited<ReturnType<typeof getAdminClient>>["supabase"]>,
  jobId: string,
  errorMessage: string,
  progressMessage: string
) {
  try {
    await markMarketBriefGenerationJobFailed(supabase, jobId, errorMessage, progressMessage);
  } catch (markError) {
    console.error("marketBrief.generateAi.markFailedFailed", {
      job_id: jobId,
      message: markError instanceof Error ? markError.message : "Unknown mark failed error."
    });
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new MarketBriefGenerationTimeoutError());
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

class MarketBriefGenerationTimeoutError extends Error {
  constructor() {
    super(AI_GENERATION_TIMEOUT_MESSAGE);
    this.name = "MarketBriefGenerationTimeoutError";
  }
}

function getSafeGenerationErrorMessage(error: unknown) {
  if (error instanceof MarketBriefGenerationTimeoutError) {
    return AI_GENERATION_TIMEOUT_MESSAGE;
  }

  if (error instanceof Error && error.message.trim()) {
    const message = error.message.trim();
    if (message.includes("AI 返回格式无法解析")) return "AI 返回格式无法解析，请重新生成。";
    if (message.includes("AI 未返回市场简报内容")) return "AI 未返回市场简报内容，请重新生成。";
    if (message.includes("搜索") || message.includes("search") || message.includes("Tavily") || message.includes("Serper")) return message.slice(0, 500);
    if (message.includes("保存") || message.includes("Supabase") || message.includes("生成任务")) return message.slice(0, 500);
    return message.slice(0, 500);
  }

  return "市场简报 AI 生成失败，请重新排队后重试。";
}

function getAiGenerationTimeoutMs() {
  const rawValue = Number(process.env.MARKET_BRIEF_AI_TIMEOUT_MS);

  if (!Number.isFinite(rawValue) || rawValue <= 0) {
    return DEFAULT_AI_GENERATION_TIMEOUT_MS;
  }

  return Math.max(30_000, Math.min(Math.round(rawValue), 115_000));
}
