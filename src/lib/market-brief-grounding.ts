import type { MarketBriefSearchSource } from "@/lib/market-brief-search";
import { searchMarketBriefSources } from "@/lib/market-brief-search";

export type MarketBriefGroundingContext = {
  market: string;
  briefDate: string;
  isHistorical: boolean;
  searchProvider: string;
  searchProviderLabel: string;
  groundingEnabled: boolean;
  queries: string[];
  sources: MarketBriefSearchSource[];
  warnings: string[];
  sourceNotes: string[];
};

export async function buildMarketBriefGroundingContext(input: { market: string; briefDate: string; isHistorical: boolean }): Promise<MarketBriefGroundingContext> {
  const searchResult = await searchMarketBriefSources(input);
  const sourceNotes = searchResult.sources.length > 0
    ? [
        `本简报基于 ${searchResult.providerLabel} 检索到的 ${searchResult.sources.length} 条公开来源生成。`,
        "所有精确行情数字和图表数据必须能追溯到来源编号；未在来源中确认的数据不得编造。"
      ]
    : [
        `已调用 ${searchResult.providerLabel}，但本次未检索到可用于确认行情数字的公开来源。`,
        "本次只能生成 ai_unverified 草稿，不得编造指数、行业、资金流或涨跌家数等精确数据。"
      ];

  return {
    market: input.market,
    briefDate: input.briefDate,
    isHistorical: input.isHistorical,
    searchProvider: searchResult.provider,
    searchProviderLabel: searchResult.providerLabel,
    groundingEnabled: true,
    queries: searchResult.queries,
    sources: searchResult.sources,
    warnings: searchResult.warnings,
    sourceNotes
  };
}

export function buildGroundingSourceSnapshotBase(input: MarketBriefGroundingContext & { model: string; generationStatus: string; dataQuality: string }) {
  return {
    meta: {
      market: input.market,
      brief_date: input.briefDate,
      generator: "ai",
      grounding_enabled: input.groundingEnabled,
      search_provider: input.searchProvider,
      model: input.model,
      data_quality: input.dataQuality,
      generation_status: input.generationStatus,
      is_historical: input.isHistorical,
      warnings: input.warnings,
      source_notes: input.sourceNotes,
      queries: input.queries
    },
    sources: input.sources,
    extracted_facts: {
      indices: [],
      market_breadth: {},
      sectors: [],
      hot_topics: [],
      capital_flows: [],
      policy_news: [],
      risk_signals: []
    },
    charts: []
  };
}

export function serializeGroundingSourcesForPrompt(sources: MarketBriefSearchSource[]) {
  if (sources.length === 0) {
    return "本次搜索未返回可用来源。";
  }

  return sources
    .map((source) => [
      `[${source.id}] ${source.title}`,
      `发布方：${source.publisher || "未知"}`,
      source.published_at ? `发布时间：${source.published_at}` : null,
      `URL：${source.url}`,
      `检索 query：${source.query}`,
      `相关性：${source.relevance}`,
      `摘要：${source.snippet}`
    ].filter(Boolean).join("\n"))
    .join("\n\n");
}
