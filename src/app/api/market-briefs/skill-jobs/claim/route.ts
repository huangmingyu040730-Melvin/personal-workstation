import { NextResponse } from "next/server";
import { getMarketBriefRunnerServiceClient, readJsonBody, validateMarketBriefRunnerRequest } from "@/lib/market-brief-runner-api";
import { claimQueuedMarketBriefGenerationJob } from "@/lib/market-brief-runner";

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

  const body = isPlainRecord(bodyResult.body) ? bodyResult.body : {};
  const market = getOptionalText(body.market);
  const runnerName = getOptionalText(body.runner_name) ?? "external-skill-runner";

  try {
    const job = await claimQueuedMarketBriefGenerationJob(supabase, { market, runnerName });

    if (!job) {
      return NextResponse.json({
        job: null,
        message: "No queued market brief generation jobs."
      });
    }

    return NextResponse.json({
      job_id: job.id,
      brief_date: job.brief_date,
      market: job.market,
      runner_name: job.runner_name,
      request_payload: job.request_payload
    });
  } catch {
    return NextResponse.json({ error: "Failed to claim market brief generation job." }, { status: 500 });
  }
}

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
