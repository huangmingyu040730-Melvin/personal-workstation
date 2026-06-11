import type { SupabaseClient } from "@supabase/supabase-js";
import type { MarketBriefMaterialPackageRecord, MarketBriefMaterialPackageStatus } from "@/lib/content-types";
import {
  buildMarketBriefSearchQueries,
  getMarketBriefSearchConfig,
  MarketBriefSearchNotConfiguredError,
  searchMarketBriefSources,
  type MarketBriefSearchSource
} from "@/lib/market-brief-search";

type MaterialPackageSupabaseClient = SupabaseClient;

export type CreateMarketBriefMaterialPackageInput = {
  ownerId: string;
  packageDate: string;
  market: string;
  isHistorical?: boolean;
};

export type MarketBriefMaterialPackageCollectionResult = {
  package: MarketBriefMaterialPackageRecord;
  sourcesCount: number;
  warnings: string[];
};

const MIN_READY_SOURCE_COUNT = 3;

export async function createOrUpdateMarketBriefMaterialPackage(
  supabase: MaterialPackageSupabaseClient,
  input: CreateMarketBriefMaterialPackageInput
): Promise<MarketBriefMaterialPackageCollectionResult> {
  const market = input.market || "A股";
  const isHistorical = Boolean(input.isHistorical);
  const searchConfig = getMarketBriefSearchConfig();
  const queries = buildMarketBriefSearchQueries({
    market,
    briefDate: input.packageDate,
    isHistorical
  });

  try {
    const searchResult = await searchMarketBriefSources({
      market,
      briefDate: input.packageDate,
      isHistorical
    });
    const allQueriesFailed = searchResult.sources.length === 0 && searchResult.warnings.length >= searchResult.queries.length;
    const baseWarnings = [...searchResult.warnings];
    const status = getMaterialPackageStatus(searchResult.sources, allQueriesFailed);
    const warnings = status === "partial" && searchResult.sources.length === 0
      ? [...baseWarnings, "本次未检索到足够可复核来源，素材包已保存为 partial。"]
      : baseWarnings;
    const errorMessage = status === "failed" ? "市场素材包搜索全部失败，请检查搜索服务或稍后重试。" : null;
    const sourceNotes = buildSourceNotes(searchResult.providerLabel, searchResult.sources, status);
    const packageRecord = await upsertMaterialPackage(supabase, {
      ownerId: input.ownerId,
      packageDate: input.packageDate,
      market,
      status,
      provider: searchResult.provider,
      providerLabel: searchResult.providerLabel,
      queries: searchResult.queries,
      sources: searchResult.sources,
      warnings,
      sourceNotes,
      qualityScore: calculateQualityScore(searchResult.sources.length, warnings.length, status),
      errorMessage,
      isHistorical
    });

    return {
      package: packageRecord,
      sourcesCount: searchResult.sources.length,
      warnings
    };
  } catch (error) {
    const safeErrorMessage = getSafeMaterialPackageErrorMessage(error);
    const warnings = [safeErrorMessage];
    const sourceNotes = [
      "素材包采集失败，未保存任何公开来源。",
      "请检查搜索服务配置或稍后重试。"
    ];
    const packageRecord = await upsertMaterialPackage(supabase, {
      ownerId: input.ownerId,
      packageDate: input.packageDate,
      market,
      status: "failed",
      provider: searchConfig.provider,
      providerLabel: searchConfig.providerLabel,
      queries,
      sources: [],
      warnings,
      sourceNotes,
      qualityScore: 0,
      errorMessage: safeErrorMessage,
      isHistorical
    });

    return {
      package: packageRecord,
      sourcesCount: 0,
      warnings
    };
  }
}

export function getMarketBriefMaterialPackageStatusLabel(status: MarketBriefMaterialPackageStatus) {
  const labels: Record<MarketBriefMaterialPackageStatus, string> = {
    collecting: "采集中",
    ready: "已就绪",
    partial: "部分可用",
    failed: "采集失败",
    reviewed: "已复核",
    archived: "已归档"
  };
  return labels[status];
}

export function getMarketBriefMaterialPackageStatusTone(status: MarketBriefMaterialPackageStatus) {
  if (status === "ready") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "partial") return "bg-amber-50 text-amber-700 ring-amber-100";
  if (status === "failed") return "bg-rose-50 text-rose-700 ring-rose-100";
  if (status === "reviewed") return "bg-blue-50 text-blue-700 ring-blue-100";
  if (status === "archived") return "bg-slate-50 text-slate-500 ring-slate-200";
  return "bg-indigo-50 text-indigo-700 ring-indigo-100";
}

type UpsertMaterialPackageInput = {
  ownerId: string;
  packageDate: string;
  market: string;
  status: MarketBriefMaterialPackageStatus;
  provider: string | null;
  providerLabel: string | null;
  queries: string[];
  sources: MarketBriefSearchSource[];
  warnings: string[];
  sourceNotes: string[];
  qualityScore: number;
  errorMessage: string | null;
  isHistorical: boolean;
};

async function upsertMaterialPackage(supabase: MaterialPackageSupabaseClient, input: UpsertMaterialPackageInput) {
  const collectedAt = new Date().toISOString();
  const extractedFacts = createEmptyExtractedFacts();
  const sourceSnapshot = buildMaterialPackageSourceSnapshot({
    ...input,
    collectedAt,
    extractedFacts
  });
  const { data, error } = await supabase
    .from("market_brief_material_packages")
    .upsert(
      {
        owner_id: input.ownerId,
        package_date: input.packageDate,
        market: input.market,
        status: input.status,
        provider: input.provider,
        provider_label: input.providerLabel,
        queries: input.queries,
        sources: input.sources,
        source_snapshot: sourceSnapshot,
        extracted_facts: extractedFacts,
        warnings: input.warnings,
        source_notes: input.sourceNotes,
        quality_score: input.qualityScore,
        error_message: input.errorMessage,
        collected_at: collectedAt
      },
      { onConflict: "owner_id,package_date,market" }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "保存市场素材包失败。");
  }

  return data as MarketBriefMaterialPackageRecord;
}

function getMaterialPackageStatus(sources: MarketBriefSearchSource[], allQueriesFailed: boolean): MarketBriefMaterialPackageStatus {
  if (allQueriesFailed) return "failed";
  if (sources.length >= MIN_READY_SOURCE_COUNT) return "ready";
  return "partial";
}

function buildSourceNotes(providerLabel: string, sources: MarketBriefSearchSource[], status: MarketBriefMaterialPackageStatus) {
  if (status === "failed") {
    return [`已调用 ${providerLabel}，但本次搜索全部失败。`];
  }

  if (sources.length === 0) {
    return [
      `已调用 ${providerLabel}，但本次未检索到可用于复核的公开来源。`,
      "后续 AI 简报生成不得基于空素材包编造行情数据。"
    ];
  }

  return [
    `本素材包基于 ${providerLabel} 检索到的 ${sources.length} 条公开来源。`,
    "后续 AI 简报生成应优先引用素材包来源编号，缺失数据需要保留人工复核标记。"
  ];
}

function calculateQualityScore(sourcesCount: number, warningsCount: number, status: MarketBriefMaterialPackageStatus) {
  if (status === "failed") return 0;
  const sourceScore = Math.min(sourcesCount / 8, 1);
  const warningPenalty = Math.min(warningsCount * 0.08, 0.4);
  return Number(Math.max(0.1, sourceScore - warningPenalty).toFixed(2));
}

function buildMaterialPackageSourceSnapshot(input: UpsertMaterialPackageInput & { collectedAt: string; extractedFacts: Record<string, unknown> }) {
  return {
    meta: {
      market: input.market,
      package_date: input.packageDate,
      status: input.status,
      provider: input.provider,
      provider_label: input.providerLabel,
      is_historical: input.isHistorical,
      queries: input.queries,
      warnings: input.warnings,
      source_notes: input.sourceNotes,
      sources_count: input.sources.length,
      quality_score: input.qualityScore,
      collected_at: input.collectedAt,
      material_package_version: "2N-A"
    },
    sources: input.sources,
    extracted_facts: input.extractedFacts
  };
}

function createEmptyExtractedFacts() {
  return {
    indices: [],
    market_breadth: {},
    sectors: [],
    hot_topics: [],
    capital_flows: [],
    policy_news: [],
    risk_signals: []
  };
}

function getSafeMaterialPackageErrorMessage(error: unknown) {
  if (error instanceof MarketBriefSearchNotConfiguredError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.slice(0, 500);
  }

  return "市场素材包采集失败，请稍后重试。";
}
