export type MarketBriefSearchProvider = "disabled" | "tavily" | "serper" | "custom";

export type MarketBriefSearchSource = {
  id: string;
  title: string;
  url: string;
  publisher: string | null;
  published_at: string | null;
  snippet: string;
  query: string;
  relevance: "high" | "medium" | "low";
  source_type?: "official_exchange_summary" | "supplemental_search" | string;
};

export type MarketBriefSearchConfig = {
  provider: MarketBriefSearchProvider;
  providerLabel: string;
  apiKey: string | null;
  baseURL?: string;
  isConfigured: boolean;
};

type RawSearchResult = {
  title: string;
  url: string;
  snippet: string;
  publisher?: string | null;
  published_at?: string | null;
  score?: number | null;
};

const MAX_MARKET_BRIEF_SEARCH_QUERIES = 4;
const MAX_MARKET_BRIEF_SEARCH_RESULTS_PER_QUERY = 3;
const MAX_MARKET_BRIEF_SEARCH_SOURCES = 8;
const MAX_MARKET_BRIEF_SOURCE_SNIPPET_LENGTH = 500;

export class MarketBriefSearchNotConfiguredError extends Error {
  constructor() {
    super("未配置市场简报搜索服务，请配置 MARKET_BRIEF_SEARCH_PROVIDER 和 MARKET_BRIEF_SEARCH_API_KEY。");
    this.name = "MarketBriefSearchNotConfiguredError";
  }
}

export function getMarketBriefSearchConfig(): MarketBriefSearchConfig {
  const provider = normalizeSearchProvider(readEnv("MARKET_BRIEF_SEARCH_PROVIDER"));
  const apiKey = readEnv("MARKET_BRIEF_SEARCH_API_KEY") ?? null;
  const baseURL = readEnv("MARKET_BRIEF_SEARCH_BASE_URL");

  if (provider === "disabled") {
    return {
      provider,
      providerLabel: "Disabled",
      apiKey: null,
      baseURL,
      isConfigured: false
    };
  }

  return {
    provider,
    providerLabel: getMarketBriefSearchProviderLabel(provider),
    apiKey,
    baseURL: baseURL || getDefaultSearchBaseURL(provider),
    isConfigured: Boolean(apiKey)
  };
}

export function getMarketBriefSearchPublicInfo() {
  const config = getMarketBriefSearchConfig();
  return {
    provider: config.provider,
    providerLabel: config.providerLabel,
    baseURL: config.baseURL,
    isConfigured: config.isConfigured
  };
}

export function buildMarketBriefSearchQueries(input: { market: string; briefDate: string; isHistorical: boolean }) {
  const displayDate = formatChineseDate(input.briefDate);
  const datePrefix = input.isHistorical ? displayDate : `${displayDate} 今日`;
  const market = input.market || "A股";

  return [
    `${datePrefix} ${market} 收评 上证指数 深证成指 创业板指 成交额`,
    `${datePrefix} ${market} 行业板块 涨幅榜 跌幅榜 热点`,
    `${datePrefix} ${market} 盘后 市场热点 政策 宏观 海外影响`,
    `${datePrefix} 沪深300 中证500 中证1000 科创50 北证50 涨跌幅`,
    `${datePrefix} ${market} 资金流向 涨跌家数 市场情绪`
  ].slice(0, MAX_MARKET_BRIEF_SEARCH_QUERIES);
}

export async function searchMarketBriefSources(input: { market: string; briefDate: string; isHistorical: boolean }) {
  const config = getMarketBriefSearchConfig();

  if (!config.isConfigured || !config.apiKey || config.provider === "disabled") {
    throw new MarketBriefSearchNotConfiguredError();
  }

  const queries = buildMarketBriefSearchQueries(input);
  const warnings: string[] = [];
  const rawSources: Array<RawSearchResult & { query: string }> = [];

  for (const query of queries) {
    try {
      const results = await searchWithProvider(config, query, MAX_MARKET_BRIEF_SEARCH_RESULTS_PER_QUERY);
      rawSources.push(...results.map((result) => ({ ...result, query })));
    } catch (error) {
      warnings.push(`搜索失败：${query}；${getSafeSearchErrorMessage(error)}`);
    }
  }

  const sources = normalizeSearchSources(rawSources, MAX_MARKET_BRIEF_SEARCH_SOURCES);
  if (rawSources.length > sources.length) {
    warnings.push("Grounding sources were truncated to fit AI prompt budget.");
  }

  return {
    provider: config.provider,
    providerLabel: config.providerLabel,
    queries,
    warnings,
    sources
  };
}

async function searchWithProvider(config: MarketBriefSearchConfig, query: string, maxResults: number) {
  if (config.provider === "tavily") {
    return searchTavily(config, query, maxResults);
  }

  if (config.provider === "serper") {
    return searchSerper(config, query, maxResults);
  }

  return searchCustom(config, query, maxResults);
}

async function searchTavily(config: MarketBriefSearchConfig, query: string, maxResults: number): Promise<RawSearchResult[]> {
  const response = await fetch(`${trimTrailingSlash(config.baseURL || "https://api.tavily.com")}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      topic: "finance",
      include_answer: false,
      include_raw_content: false,
      include_images: false,
      max_results: maxResults
    })
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed with status ${response.status}`);
  }

  const payload = await response.json() as Record<string, unknown>;
  const results = Array.isArray(payload.results) ? payload.results : [];
  return results.map((item) => {
    const record = asRecord(item);
    return {
      title: asText(record.title) || "Untitled source",
      url: asText(record.url) || "",
      snippet: asText(record.content) || "",
      publisher: getPublisherFromUrl(asText(record.url)),
      published_at: asText(record.published_date),
      score: typeof record.score === "number" ? record.score : null
    };
  });
}

async function searchSerper(config: MarketBriefSearchConfig, query: string, maxResults: number): Promise<RawSearchResult[]> {
  const response = await fetch(config.baseURL || "https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": config.apiKey || ""
    },
    body: JSON.stringify({ q: query, num: maxResults })
  });

  if (!response.ok) {
    throw new Error(`Serper search failed with status ${response.status}`);
  }

  const payload = await response.json() as Record<string, unknown>;
  const results = [...(Array.isArray(payload.news) ? payload.news : []), ...(Array.isArray(payload.organic) ? payload.organic : [])];
  return results.slice(0, maxResults).map((item) => {
    const record = asRecord(item);
    const url = asText(record.link) || asText(record.url) || "";
    return {
      title: asText(record.title) || "Untitled source",
      url,
      snippet: asText(record.snippet) || "",
      publisher: asText(record.source) || getPublisherFromUrl(url),
      published_at: asText(record.date),
      score: null
    };
  });
}

async function searchCustom(config: MarketBriefSearchConfig, query: string, maxResults: number): Promise<RawSearchResult[]> {
  if (!config.baseURL) {
    throw new Error("Custom search base URL is required.");
  }

  const response = await fetch(config.baseURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({ query, max_results: maxResults })
  });

  if (!response.ok) {
    throw new Error(`Custom search failed with status ${response.status}`);
  }

  const payload = await response.json() as Record<string, unknown>;
  const results = Array.isArray(payload.results) ? payload.results : Array.isArray(payload.sources) ? payload.sources : [];
  return results.slice(0, maxResults).map((item) => {
    const record = asRecord(item);
    const url = asText(record.url) || asText(record.link) || "";
    return {
      title: asText(record.title) || "Untitled source",
      url,
      snippet: asText(record.snippet) || asText(record.content) || asText(record.summary) || "",
      publisher: asText(record.publisher) || asText(record.source) || getPublisherFromUrl(url),
      published_at: asText(record.published_at) || asText(record.date),
      score: typeof record.score === "number" ? record.score : null
    };
  });
}

function normalizeSearchSources(values: Array<RawSearchResult & { query: string }>, limit: number): MarketBriefSearchSource[] {
  const seen = new Set<string>();
  const normalized: MarketBriefSearchSource[] = [];

  for (const value of values) {
    const url = normalizeUrl(value.url);
    const title = value.title.trim();
    const snippet = value.snippet.trim();

    if (!url || !title || !snippet || seen.has(url) || isObviouslyIrrelevant(`${title}\n${snippet}`)) {
      continue;
    }

    seen.add(url);
    normalized.push({
      id: `S${normalized.length + 1}`,
      title,
      url,
      publisher: value.publisher || getPublisherFromUrl(url),
      published_at: value.published_at || null,
      snippet: truncateText(snippet, MAX_MARKET_BRIEF_SOURCE_SNIPPET_LENGTH),
      query: value.query,
      relevance: getRelevance(value.score, title, snippet),
      source_type: "supplemental_search"
    });

    if (normalized.length >= limit) {
      break;
    }
  }

  return normalized;
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;
}

function normalizeSearchProvider(value: string | undefined): MarketBriefSearchProvider {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "tavily" || normalized === "serper" || normalized === "custom") {
    return normalized;
  }
  return "disabled";
}

function getMarketBriefSearchProviderLabel(provider: MarketBriefSearchProvider) {
  if (provider === "tavily") return "Tavily";
  if (provider === "serper") return "Serper";
  if (provider === "custom") return "Custom Search";
  return "Disabled";
}

function getDefaultSearchBaseURL(provider: MarketBriefSearchProvider) {
  if (provider === "tavily") return "https://api.tavily.com";
  if (provider === "serper") return "https://google.serper.dev/search";
  return undefined;
}

function formatChineseDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${year}年${month}月${day}日`;
}

function getRelevance(score: number | null | undefined, title: string, snippet: string): MarketBriefSearchSource["relevance"] {
  if (typeof score === "number") {
    if (score >= 0.72) return "high";
    if (score >= 0.45) return "medium";
  }

  const text = `${title}\n${snippet}`;
  const hitCount = ["A股", "上证", "深证", "创业板", "收评", "指数", "板块", "资金"].filter((term) => text.includes(term)).length;
  if (hitCount >= 3) return "high";
  if (hitCount >= 1) return "medium";
  return "low";
}

function isObviouslyIrrelevant(text: string) {
  const normalized = text.toLowerCase();
  const requiredHits = ["a股", "上证", "深证", "创业板", "沪深", "中证", "收评", "市场", "指数", "板块"].some((term) => normalized.includes(term.toLowerCase()));
  const blockedHits = ["招聘", "彩票", "小说", "游戏攻略", "影视"].some((term) => text.includes(term));
  return blockedHits || !requiredHits;
}

function getPublisherFromUrl(value: string | null) {
  if (!value) return null;
  try {
    const hostname = new URL(value).hostname.replace(/^www\./, "");
    return hostname || null;
  } catch {
    return null;
  }
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function getSafeSearchErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.slice(0, 160);
  }
  return "搜索服务请求失败";
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readEnv(key: string) {
  const value = process.env[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
