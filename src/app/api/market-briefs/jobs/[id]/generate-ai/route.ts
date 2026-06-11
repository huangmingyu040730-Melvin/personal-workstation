import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/auth/admin";
import type { MarketBriefGenerationJobRecord } from "@/lib/content-types";
import type { MarketBriefJobProgressStage } from "@/lib/market-brief-job-progress";
import { getMarketBriefJobProgressFromPayload } from "@/lib/market-brief-job-progress";
import { runMockMarketBriefGenerationJob, updateMarketBriefGenerationJobProgress } from "@/lib/market-brief-runner";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  if (job.status === "running" && currentProgress.stage !== "queued") {
    return NextResponse.json({ ...serializeMarketBriefJobStatus(job), already_running: true }, { status: 202 });
  }

  try {
    const result = await runMockMarketBriefGenerationJob(supabase, job, {
      onProgress: async (stage, message) => {
        await updateMarketBriefGenerationJobProgress(supabase, job.id, stage, message);
      }
    });

    revalidateMarketBriefPaths(result.brief.id, result.job.id);
    return NextResponse.json(serializeMarketBriefJobStatus(result.job));
  } catch (generationError) {
    console.error("marketBrief.generateAi.failed", {
      job_id: job.id,
      status: job.status,
      progress_stage: currentProgress.stage,
      message: generationError instanceof Error ? generationError.message : "Unknown market brief generation failure."
    });

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

  return {
    id: job.id,
    status: job.status,
    brief_date: job.brief_date,
    market: job.market,
    progress,
    error_message: job.error_message,
    market_brief_id: marketBriefId,
    preview_url: marketBriefId ? `/dashboard/market-briefs/${marketBriefId}/preview` : null,
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
