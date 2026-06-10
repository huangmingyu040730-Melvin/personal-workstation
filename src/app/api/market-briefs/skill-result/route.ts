import { NextResponse } from "next/server";
import { getMarketBriefRunnerServiceClient, readJsonBody, validateMarketBriefRunnerRequest } from "@/lib/market-brief-runner-api";
import { applySkillResultToMarketBriefJob, type SkillResultPayload } from "@/lib/market-brief-runner";

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

  const parsed = parseSkillResultPayload(bodyResult.body);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await applySkillResultToMarketBriefJob(supabase, parsed.payload);
    return NextResponse.json({
      ok: true,
      job_id: result.job.id,
      market_brief_id: result.brief.id,
      preview_url: `/dashboard/market-briefs/${result.brief.id}/preview`
    });
  } catch {
    return NextResponse.json({ error: "Failed to persist market brief skill result." }, { status: 500 });
  }
}

function parseSkillResultPayload(value: unknown): { ok: true; payload: SkillResultPayload } | { ok: false; error: string } {
  if (!isPlainRecord(value)) {
    return { ok: false, error: "Payload must be an object." };
  }

  const jobId = getRequiredText(value.job_id);
  const title = getRequiredText(value.title);
  const markdownContent = getRequiredText(value.markdown_content);

  if (!jobId) {
    return { ok: false, error: "job_id is required." };
  }

  if (!title) {
    return { ok: false, error: "title is required." };
  }

  if (!markdownContent) {
    return { ok: false, error: "markdown_content is required." };
  }

  return {
    ok: true,
    payload: {
      job_id: jobId,
      brief_date: getOptionalDate(value.brief_date),
      market: getOptionalText(value.market),
      title,
      summary: getOptionalText(value.summary),
      markdown_content: markdownContent,
      source_snapshot: isPlainRecord(value.source_snapshot) ? value.source_snapshot : undefined,
      tags: getOptionalTextArray(value.tags),
      data_sources: getOptionalTextArray(value.data_sources),
      generation_status: getOptionalGenerationStatus(value.generation_status)
    }
  };
}

function getRequiredText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getOptionalDate(value: unknown) {
  const text = getOptionalText(value);
  return text && /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : undefined;
}

function getOptionalTextArray(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
  return items.length > 0 ? Array.from(new Set(items)) : undefined;
}

function getOptionalGenerationStatus(value: unknown) {
  const text = getOptionalText(value);
  return text && ["manual", "draft", "generated", "failed", "needs_review", "archived"].includes(text)
    ? (text as "manual" | "draft" | "generated" | "failed" | "needs_review" | "archived")
    : undefined;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
