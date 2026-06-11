import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/auth/admin";
import type { MarketBriefGenerationJobRecord } from "@/lib/content-types";
import type { MarketBriefJobProgressStage } from "@/lib/market-brief-job-progress";
import { getMarketBriefJobProgressFromPayload, isMarketBriefJobProgressStale, marketBriefJobStaleMessage } from "@/lib/market-brief-job-progress";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    console.error("marketBrief.jobStatus.readFailed", {
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
  return NextResponse.json(serializeMarketBriefJobStatus(job));
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
