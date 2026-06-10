import { NextResponse } from "next/server";
import { applySkillResultToMarketBriefJob, type SkillResultPayload } from "@/lib/market-brief-runner";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const expectedSecret = process.env.MARKET_BRIEF_RUNNER_SECRET;

  if (!expectedSecret) {
    return NextResponse.json({ error: "Market brief runner is not configured." }, { status: 503 });
  }

  const receivedSecret = request.headers.get("x-market-brief-runner-secret");

  if (!receivedSecret || receivedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized market brief runner." }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  if (!supabase) {
    return NextResponse.json({ error: "Market brief persistence is not configured." }, { status: 503 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = parseSkillResultPayload(payload);

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
      data_sources: getOptionalTextArray(value.data_sources)
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

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
