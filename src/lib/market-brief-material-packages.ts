import type { SupabaseClient } from "@supabase/supabase-js";
import type { MarketBriefMaterialPackageRecord, MarketBriefMaterialPackageStatus } from "@/lib/content-types";
import type { MarketBriefGroundingContext } from "@/lib/market-brief-grounding";
import {
  collectOfficialExchangeSummaries,
  type OfficialExchangeCollectionResult
} from "@/lib/market-brief-official-exchange-collectors";
import {
  buildMarketBriefSearchQueries,
  getMarketBriefSearchConfig,
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

export const usableMarketBriefMaterialPackageStatuses: MarketBriefMaterialPackageStatus[] = ["ready", "partial", "reviewed"];
export const missingMarketBriefMaterialPackageMessage = "未找到可用市场素材包，请先采集素材包后再生成简报。";
export const missingMarketBriefMaterialPackageForJobMessage = "未找到可用市场素材包，请先采集素材包后重新排队。";

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

  const officialCollection = await collectOfficialExchangeSummaries(input.packageDate);
  const searchResult = await collectSupplementalSearchSources({
    market,
    packageDate: input.packageDate,
    isHistorical,
    fallbackQueries: queries,
    fallbackProvider: searchConfig.provider,
    fallbackProviderLabel: searchConfig.providerLabel
  });
  const sources = [...officialCollection.sources, ...searchResult.sources];
  const warnings = buildMaterialPackageWarnings(officialCollection, searchResult.warnings);
  const status = getMaterialPackageStatus(officialCollection);
  const errorMessage = status === "failed" ? "未取得可用官方交易所 summary，supplemental search 不能单独支撑市场素材包。" : null;
  const sourceNotes = buildSourceNotes({
    officialCollection,
    searchProviderLabel: searchResult.providerLabel,
    searchSources: searchResult.sources,
    status
  });
  const packageProvider = buildMaterialPackageProvider(searchResult);

  try {
    const packageRecord = await upsertMaterialPackage(supabase, {
      ownerId: input.ownerId,
      packageDate: input.packageDate,
      market,
      status,
      provider: packageProvider.provider,
      providerLabel: packageProvider.providerLabel,
      queries: searchResult.queries,
      sources,
      exchangeSummary: officialCollection.exchangeSummary,
      officialCollectorResults: officialCollection.results,
      warnings,
      sourceNotes,
      qualityScore: calculateQualityScore(sources.length, warnings.length, status, officialCollection.results.filter((result) => result.status === "ok").length),
      errorMessage,
      isHistorical
    });

    return {
      package: packageRecord,
      sourcesCount: sources.length,
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
      exchangeSummary: {},
      officialCollectorResults: [],
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

export type ResolveUsableMarketBriefMaterialPackageInput = {
  ownerId: string;
  packageDate: string;
  market: string;
  materialPackageId?: string | null;
};

export async function resolveUsableMarketBriefMaterialPackage(
  supabase: MaterialPackageSupabaseClient,
  input: ResolveUsableMarketBriefMaterialPackageInput
) {
  const materialPackageId = normalizeOptionalId(input.materialPackageId);

  if (materialPackageId) {
    const { data, error } = await supabase
      .from("market_brief_material_packages")
      .select("*")
      .eq("id", materialPackageId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || "读取市场素材包失败。");
    }

    const materialPackage = data as MarketBriefMaterialPackageRecord | null;
    if (!materialPackage || !isMaterialPackageMatchingInput(materialPackage, input) || !isUsableMarketBriefMaterialPackage(materialPackage)) {
      return null;
    }

    return materialPackage;
  }

  const { data, error } = await supabase
    .from("market_brief_material_packages")
    .select("*")
    .eq("owner_id", input.ownerId)
    .eq("package_date", input.packageDate)
    .eq("market", input.market)
    .in("status", usableMarketBriefMaterialPackageStatuses)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "读取市场素材包失败。");
  }

  return data as MarketBriefMaterialPackageRecord | null;
}

export function isUsableMarketBriefMaterialPackage(materialPackage: Pick<MarketBriefMaterialPackageRecord, "status">) {
  return usableMarketBriefMaterialPackageStatuses.includes(materialPackage.status);
}

export function buildMarketBriefGroundingContextFromMaterialPackage(
  materialPackage: MarketBriefMaterialPackageRecord,
  input: { isHistorical: boolean }
): MarketBriefGroundingContext {
  const partialWarnings = materialPackage.status === "partial"
    ? ["素材包状态为 partial：来源部分可用，生成内容必须标记需人工复核。"]
    : [];
  const sourceNotes = [
    "本简报基于已保存的市场素材包生成，不在生成时实时搜索。",
    ...materialPackage.source_notes
  ];

  return {
    market: materialPackage.market,
    briefDate: materialPackage.package_date,
    isHistorical: input.isHistorical,
    groundingMode: "material_package",
    searchProvider: materialPackage.provider ?? "material_package",
    searchProviderLabel: materialPackage.provider_label ?? "已保存市场素材包",
    groundingEnabled: true,
    queries: materialPackage.queries,
    sources: materialPackage.sources,
    warnings: [...partialWarnings, ...materialPackage.warnings],
    sourceNotes,
    extractedFacts: materialPackage.extracted_facts,
    materialPackageId: materialPackage.id,
    materialPackageStatus: materialPackage.status,
    materialPackageCollectedAt: materialPackage.collected_at
  };
}

export function getMarketBriefMaterialPackageDataQuality(status: MarketBriefMaterialPackageStatus) {
  return status === "partial" ? "ai_grounded_partial" : "ai_grounded";
}

function isMaterialPackageMatchingInput(
  materialPackage: MarketBriefMaterialPackageRecord,
  input: ResolveUsableMarketBriefMaterialPackageInput
) {
  return materialPackage.owner_id === input.ownerId
    && materialPackage.package_date === input.packageDate
    && materialPackage.market === input.market;
}

function normalizeOptionalId(value: string | null | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
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
  exchangeSummary: Record<string, unknown>;
  officialCollectorResults: OfficialExchangeCollectionResult["results"];
  warnings: string[];
  sourceNotes: string[];
  qualityScore: number;
  errorMessage: string | null;
  isHistorical: boolean;
};

async function upsertMaterialPackage(supabase: MaterialPackageSupabaseClient, input: UpsertMaterialPackageInput) {
  const collectedAt = new Date().toISOString();
  const extractedFacts = createEmptyExtractedFacts(input.exchangeSummary);
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

type SupplementalSearchCollectionResult = {
  provider: string;
  providerLabel: string;
  queries: string[];
  warnings: string[];
  sources: MarketBriefSearchSource[];
};

function buildMaterialPackageProvider(searchResult: SupplementalSearchCollectionResult) {
  if (searchResult.sources.length === 0) {
    return {
      provider: "official_exchange",
      providerLabel: "Official Exchange Summary"
    };
  }

  return {
    provider: `official_exchange+${searchResult.provider}`,
    providerLabel: `Official Exchange Summary + ${searchResult.providerLabel} supplemental search`
  };
}

async function collectSupplementalSearchSources(input: {
  market: string;
  packageDate: string;
  isHistorical: boolean;
  fallbackQueries: string[];
  fallbackProvider: string;
  fallbackProviderLabel: string;
}): Promise<SupplementalSearchCollectionResult> {
  try {
    return await searchMarketBriefSources({
      market: input.market,
      briefDate: input.packageDate,
      isHistorical: input.isHistorical
    });
  } catch (error) {
    return {
      provider: input.fallbackProvider,
      providerLabel: input.fallbackProviderLabel,
      queries: input.fallbackQueries,
      warnings: [`Supplemental search 未取得可用来源：${getSafeMaterialPackageErrorMessage(error)}`],
      sources: []
    };
  }
}

function buildMaterialPackageWarnings(officialCollection: OfficialExchangeCollectionResult, searchWarnings: string[]) {
  const usableOfficialResults = getUsableOfficialResults(officialCollection);
  const officialAvailabilityWarnings = usableOfficialResults.length === 0
    ? ["未取得可用官方交易所 summary；supplemental search sources are supplemental only，不能单独支撑可生成的 A 股素材包。"]
    : ["Supplemental search sources are supplemental only，不作为行情事实来源。"];

  return Array.from(new Set([...officialCollection.warnings, ...searchWarnings, ...officialAvailabilityWarnings].map((warning) => warning.trim()).filter(Boolean)));
}

function getMaterialPackageStatus(officialCollection: OfficialExchangeCollectionResult): MarketBriefMaterialPackageStatus {
  const usableOfficialResults = getUsableOfficialResults(officialCollection);

  if (usableOfficialResults.length === 0) return "failed";

  // Phase 2N-C1 only validates exchange summary fields. Breadth, sectors and flows are still missing,
  // so a newly collected package should stay partial until a human review or a later collector fills gaps.
  return "partial";
}

function getUsableOfficialResults(officialCollection: OfficialExchangeCollectionResult) {
  return officialCollection.results.filter((result) => result.status === "ok" || result.status === "partial");
}

function buildSourceNotes(input: {
  officialCollection: OfficialExchangeCollectionResult;
  searchProviderLabel: string;
  searchSources: MarketBriefSearchSource[];
  status: MarketBriefMaterialPackageStatus;
}) {
  const officialNotes = input.officialCollection.sourceNotes;

  if (input.status === "failed") {
    const supplementalNote = input.searchSources.length > 0
      ? `${input.searchProviderLabel} supplemental search 返回了 ${input.searchSources.length} 条来源，这些来源已保存用于诊断，但 search sources are supplemental only，不能单独支撑市场素材包生成。`
      : `已调用 ${input.searchProviderLabel} supplemental search，但本次没有可用搜索来源；即使存在搜索来源，也不能在缺少官方交易所 summary 时支撑生成。`;

    return [
      ...officialNotes,
      "未取得可用官方交易所 summary，因此该素材包不可用于生成。",
      supplementalNote
    ];
  }

  if (input.searchSources.length === 0) {
    return [
      ...officialNotes,
      `已调用 ${input.searchProviderLabel} supplemental search，但本次未检索到可用于复核的新闻 / 热点来源。`,
      "后续 AI 简报生成不得基于空素材包编造行情数据。"
    ];
  }

  return [
    ...officialNotes,
    `本素材包另含 ${input.searchProviderLabel} supplemental search 检索到的 ${input.searchSources.length} 条新闻 / 热点来源。`,
    "后续 AI 简报生成应优先引用素材包来源编号，缺失数据需要保留人工复核标记。"
  ];
}

function calculateQualityScore(sourcesCount: number, warningsCount: number, status: MarketBriefMaterialPackageStatus, officialOkCount: number) {
  if (status === "failed") return 0;
  const sourceScore = Math.min(sourcesCount / 8, 1);
  const officialScore = Math.min(officialOkCount / 2, 1) * 0.35;
  const warningPenalty = Math.min(warningsCount * 0.08, 0.4);
  return Number(Math.max(0.1, Math.min(0.85, sourceScore + officialScore - warningPenalty)).toFixed(2));
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
      material_package_version: "2N-C1",
      official_exchange_collectors: input.officialCollectorResults.map((result) => ({
        id: result.id,
        upstream: result.upstream,
        status: result.status,
        latency_ms: result.latency_ms,
        source_id: result.source.id
      }))
    },
    sources: input.sources,
    extracted_facts: input.extractedFacts
  };
}

function createEmptyExtractedFacts(exchangeSummary: Record<string, unknown> = {}) {
  return {
    indices: [],
    exchange_summary: exchangeSummary,
    market_breadth: {},
    sectors: [],
    hot_topics: [],
    capital_flows: [],
    policy_news: [],
    risk_signals: []
  };
}

function getSafeMaterialPackageErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.slice(0, 500);
  }

  return "市场素材包采集失败，请稍后重试。";
}
