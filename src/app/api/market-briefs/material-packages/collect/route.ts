import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/auth/admin";
import { createOrUpdateMarketBriefMaterialPackage } from "@/lib/market-brief-material-packages";
import { getTodayDateInShanghai, normalizeBriefDate } from "@/lib/market-brief-runner";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { supabase, isAdmin, actorId, error } = await getAdminClient();

  if (!supabase || !isAdmin || !actorId) {
    return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
  }

  const bodyResult = await readRequestBody(request);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const payload = isPlainRecord(bodyResult.body) ? bodyResult.body : {};
  const today = getTodayDateInShanghai();
  const packageDate = normalizeBriefDate(getOptionalText(payload.packageDate) ?? getOptionalText(payload.package_date) ?? today);
  const market = getOptionalText(payload.market) ?? "A股";

  if (!packageDate) {
    return NextResponse.json({ error: "packageDate must use YYYY-MM-DD." }, { status: 400 });
  }

  try {
    const result = await createOrUpdateMarketBriefMaterialPackage(supabase, {
      ownerId: actorId,
      packageDate,
      market,
      isHistorical: packageDate !== today
    });

    return NextResponse.json({
      ok: true,
      package_id: result.package.id,
      status: result.package.status,
      sources_count: result.sourcesCount,
      warnings: result.warnings,
      detail_url: `/dashboard/market-briefs/materials/${result.package.id}`
    });
  } catch (collectError) {
    console.error("marketBrief.materialPackage.collect.failed", {
      package_date: packageDate,
      market,
      message: getSafeErrorLogMessage(collectError)
    });
    return NextResponse.json({ error: "Failed to collect market brief material package." }, { status: 500 });
  }
}

async function readRequestBody(request: Request): Promise<{ ok: true; body: unknown } | { ok: false; response: NextResponse }> {
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      return { ok: true, body: await request.json() };
    }

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      return { ok: true, body: Object.fromEntries(formData.entries()) };
    }

    return { ok: true, body: {} };
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Invalid request body." }, { status: 400 }) };
  }
}

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getSafeErrorLogMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.slice(0, 500);
  }

  return "Unknown material package collection error.";
}
