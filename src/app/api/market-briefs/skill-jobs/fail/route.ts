import { NextResponse } from "next/server";
import { getMarketBriefRunnerServiceClient, readJsonBody, validateMarketBriefRunnerRequest } from "@/lib/market-brief-runner-api";
import { markMarketBriefGenerationJobFailed } from "@/lib/market-brief-runner";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authError = validateMarketBriefRunnerRequest(request);

  if (authError) {
    return authError;
  }

  const { supabase, response } = getMarketBriefRunnerServiceClient();

  if (!supabase) {
    return response;
  }

  const bodyResult = await readJsonBody(request);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  if (!isPlainRecord(bodyResult.body)) {
    return NextResponse.json({ error: "Payload must be an object." }, { status: 400 });
  }

  const jobId = getRequiredText(bodyResult.body.job_id);

  if (!jobId) {
    return NextResponse.json({ error: "job_id is required." }, { status: 400 });
  }

  const errorMessage = getRequiredText(bodyResult.body.error_message) ?? "Market brief runner failed.";

  try {
    const job = await markMarketBriefGenerationJobFailed(supabase, jobId, errorMessage);

    if (!job) {
      return NextResponse.json({ error: "Market brief generation job not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      job_id: job.id,
      status: job.status
    });
  } catch {
    return NextResponse.json({ error: "Failed to mark market brief generation job as failed." }, { status: 500 });
  }
}

function getRequiredText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
