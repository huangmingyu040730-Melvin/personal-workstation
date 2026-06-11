import type { MarketBriefSearchSource } from "@/lib/market-brief-search";

export type OfficialExchangeCollectorStatus = "ok" | "partial" | "failed";
export type OfficialExchangeUpstream = "sse" | "szse";

export type OfficialExchangeSummaryFact = {
  package_date: string;
  rows: number;
  turnover: string | null;
  market_value: string | null;
  listed_count: string | null;
  raw_fields: Record<string, unknown>;
  source_id: string;
  verification_status: "official_direct";
  unit_note: string;
};

export type OfficialExchangeCollectorResult = {
  id: string;
  provider: "official_exchange";
  upstream: OfficialExchangeUpstream;
  status: OfficialExchangeCollectorStatus;
  source: MarketBriefSearchSource;
  facts: OfficialExchangeSummaryFact | null;
  warnings: string[];
  latency_ms: number;
};

export type OfficialExchangeCollectionResult = {
  results: OfficialExchangeCollectorResult[];
  sources: MarketBriefSearchSource[];
  exchangeSummary: Record<string, OfficialExchangeSummaryFact>;
  warnings: string[];
  sourceNotes: string[];
};

const FETCH_TIMEOUT_MS = 10000;
const UNIT_NOTE = "字段值按官方接口原始值保存，代码未做单位换算；单位以交易所页面或接口字段说明为准，需人工复核。";

export async function collectOfficialExchangeSummaries(packageDate: string): Promise<OfficialExchangeCollectionResult> {
  const results = await Promise.all([
    collectSseDailyStockSummary(packageDate),
    collectSzseMarketOverview(packageDate),
    collectSzseDailyStockSummary(packageDate)
  ]);
  const exchangeSummary: Record<string, OfficialExchangeSummaryFact> = {};

  for (const result of results) {
    if (result.facts && result.id === "sse_official_daily_stock_summary") {
      exchangeSummary.sse = result.facts;
    }
    if (result.facts && result.id === "szse_official_market_overview") {
      exchangeSummary.szse = result.facts;
    }
    if (result.facts && result.id === "szse_official_daily_stock_summary") {
      exchangeSummary.szse_daily_stock = result.facts;
    }
  }

  const warnings = [
    ...results.flatMap((result) => result.warnings),
    "Phase 2N-C1 仅接入交易所总貌 summary 字段；market_breadth、sectors、资金流仍缺失，需要后续官方源、手动录入或 CSV 补充。"
  ];
  const okOrPartialCount = results.filter((result) => result.status === "ok" || result.status === "partial").length;
  const sourceNotes = [
    okOrPartialCount > 0
      ? "核心交易所总貌字段来自上交所 / 深交所官方直连源，verification_status=official_direct。"
      : "本次未能从上交所 / 深交所官方直连源取得可用交易所总貌字段。",
    "官方 summary 字段只覆盖交易所总貌，不代表完整 A 股自动采集；新闻、热点和政策线索仍只来自 supplemental search。",
    UNIT_NOTE
  ];

  return {
    results,
    sources: results.filter((result) => result.status !== "failed").map((result) => result.source),
    exchangeSummary,
    warnings,
    sourceNotes
  };
}

export async function collectSseDailyStockSummary(packageDate: string): Promise<OfficialExchangeCollectorResult> {
  const sourceId = "O1";
  const sourceURL = buildSseDailyStockSummaryURL(packageDate);

  return collectWithTiming({
    id: "sse_official_daily_stock_summary",
    sourceId,
    upstream: "sse",
    title: `上交所每日股票情况｜${packageDate}`,
    url: sourceURL,
    publisher: "上海证券交易所",
    query: `official_exchange:sse_daily_stock_summary:${packageDate}`,
    run: async () => {
      const payload = await fetchJson(sourceURL, "http://www.sse.com.cn/market/stockdata/overview/day/");
      const result = asRecord(payload);
      const rows = normalizeRows(result.result);
      const selectedRow = rows.find((row) => asText(row.PRODUCT_CODE) === "17") ?? rows.find((row) => asText(row.PRODUCT_CODE) === "01") ?? rows[0] ?? null;
      const coversTargetDate = rows.some((row) => asText(row.TRADE_DATE) === packageDate.replace(/-/g, ""));
      const facts = selectedRow
        ? createFact({
            packageDate,
            rows: rows.length,
            turnover: selectedRow.TRADE_AMT,
            marketValue: selectedRow.TOTAL_VALUE,
            listedCount: selectedRow.LIST_NUM,
            rawFields: selectedRow,
            sourceId
          })
        : null;
      const warnings = [
        ...getCoverageWarnings("上交所每日股票情况", facts, coversTargetDate),
        "上交所字段 TRADE_AMT / TOTAL_VALUE / LIST_NUM 已原样保存，单位需按官方页面或接口说明人工复核。"
      ];

      return {
        status: facts && coversTargetDate && hasRequiredSummaryFields(facts) ? "ok" : rows.length > 0 ? "partial" : "failed",
        facts,
        rowCount: rows.length,
        warnings
      };
    }
  });
}

export async function collectSzseMarketOverview(packageDate: string): Promise<OfficialExchangeCollectorResult> {
  const sourceId = "O2";
  const sourceURL = buildSzseShowReportURL("1803_sczm", packageDate);

  return collectWithTiming({
    id: "szse_official_market_overview",
    sourceId,
    upstream: "szse",
    title: `深交所市场总貌｜${packageDate}`,
    url: sourceURL,
    publisher: "深圳证券交易所",
    query: `official_exchange:szse_market_overview:${packageDate}`,
    run: async () => {
      const payload = await fetchJson(sourceURL, "http://www.szse.cn/market/overview/index.html");
      const rows = collectSzseReportRows(payload);
      const selectedRow = rows.find((row) => asText(row.lbmc)?.includes("股票")) ?? rows[0] ?? null;
      const coversTargetDate = JSON.stringify(payload).includes(packageDate);
      const facts = selectedRow
        ? createFact({
            packageDate,
            rows: rows.length,
            turnover: selectedRow.cjje,
            marketValue: selectedRow.sjzz,
            listedCount: selectedRow.zqsl,
            rawFields: selectedRow,
            sourceId
          })
        : null;
      const warnings = [
        ...getCoverageWarnings("深交所市场总貌", facts, coversTargetDate),
        "深交所字段 cjje / sjzz / zqsl 已原样保存，单位需按官方页面或接口说明人工复核。"
      ];

      return {
        status: facts && coversTargetDate && hasRequiredSummaryFields(facts) ? "ok" : rows.length > 0 ? "partial" : "failed",
        facts,
        rowCount: rows.length,
        warnings
      };
    }
  });
}

export async function collectSzseDailyStockSummary(packageDate: string): Promise<OfficialExchangeCollectorResult> {
  const sourceId = "O3";
  const sourceURL = buildSzseShowReportURL("scsj_gprdgk_after", packageDate);

  return collectWithTiming({
    id: "szse_official_daily_stock_summary",
    sourceId,
    upstream: "szse",
    title: `深交所日度概况｜${packageDate}`,
    url: sourceURL,
    publisher: "深圳证券交易所",
    query: `official_exchange:szse_daily_stock_summary:${packageDate}`,
    run: async () => {
      const payload = await fetchJson(sourceURL, "http://www.szse.cn/market/stock/situation/daily/index.html");
      const rows = collectSzseReportRows(payload);
      const turnoverRow = rows.find((row) => asText(row.zbmc)?.includes("成交金额") || asText(row["指标名称"])?.includes("成交金额"));
      const facts = rows.length > 0
        ? createFact({
            packageDate,
            rows: rows.length,
            turnover: turnoverRow?.gp ?? turnoverRow?.xz ?? null,
            marketValue: null,
            listedCount: null,
            rawFields: {
              rows,
              selected_turnover_row: turnoverRow ?? null
            },
            sourceId
          })
        : null;
      const coversTargetDate = JSON.stringify(payload).includes(packageDate);
      const warnings = [
        ...getCoverageWarnings("深交所日度概况", facts, coversTargetDate),
        "深交所日度概况可补充成交量 / 成交金额行，但本接口本身不包含完整上市数量和总市值字段。"
      ];

      return {
        status: facts && coversTargetDate && facts.turnover ? "partial" : rows.length > 0 ? "partial" : "failed",
        facts,
        rowCount: rows.length,
        warnings
      };
    }
  });
}

async function collectWithTiming(input: {
  id: string;
  sourceId: string;
  upstream: OfficialExchangeUpstream;
  title: string;
  url: string;
  publisher: string;
  query: string;
  run: () => Promise<{ status: OfficialExchangeCollectorStatus; facts: OfficialExchangeSummaryFact | null; rowCount: number; warnings: string[] }>;
}): Promise<OfficialExchangeCollectorResult> {
  const startedAt = Date.now();

  try {
    const result = await input.run();
    const latencyMs = Date.now() - startedAt;

    return {
      id: input.id,
      provider: "official_exchange",
      upstream: input.upstream,
      status: result.status,
      source: createSource({
        id: input.sourceId,
        title: input.title,
        url: input.url,
        publisher: input.publisher,
        query: input.query,
        relevance: result.status === "ok" ? "high" : result.status === "partial" ? "medium" : "low",
        snippet: `official_exchange_summary status=${result.status}; rows=${result.rowCount}; latency_ms=${latencyMs}. ${result.warnings.join(" ")}`
      }),
      facts: result.facts,
      warnings: result.warnings,
      latency_ms: latencyMs
    };
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const warning = `${input.title} 官方直连采集失败：${getSafeErrorMessage(error)}`;

    return {
      id: input.id,
      provider: "official_exchange",
      upstream: input.upstream,
      status: "failed",
      source: createSource({
        id: input.sourceId,
        title: input.title,
        url: input.url,
        publisher: input.publisher,
        query: input.query,
        relevance: "low",
        snippet: `official_exchange_summary status=failed; rows=0; latency_ms=${latencyMs}. ${warning}`
      }),
      facts: null,
      warnings: [warning],
      latency_ms: latencyMs
    };
  }
}

function createSource(input: {
  id: string;
  title: string;
  url: string;
  publisher: string;
  query: string;
  relevance: MarketBriefSearchSource["relevance"];
  snippet: string;
}): MarketBriefSearchSource {
  return {
    id: input.id,
    title: input.title,
    url: input.url,
    publisher: input.publisher,
    published_at: null,
    snippet: truncateText(input.snippet, 500),
    query: input.query,
    relevance: input.relevance,
    source_type: "official_exchange_summary"
  };
}

function createFact(input: {
  packageDate: string;
  rows: number;
  turnover: unknown;
  marketValue: unknown;
  listedCount: unknown;
  rawFields: Record<string, unknown>;
  sourceId: string;
}): OfficialExchangeSummaryFact {
  return {
    package_date: input.packageDate,
    rows: input.rows,
    turnover: asText(input.turnover),
    market_value: asText(input.marketValue),
    listed_count: asText(input.listedCount),
    raw_fields: input.rawFields,
    source_id: input.sourceId,
    verification_status: "official_direct",
    unit_note: UNIT_NOTE
  };
}

async function fetchJson(url: string, referer: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json,text/plain,*/*",
        Referer: referer,
        "User-Agent": "personal-workstation-market-brief-official-exchange-collector/2N-C1"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return parseJsonOrJsonp(await response.text());
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonOrJsonp(text: string) {
  const trimmed = text.trim().replace(/^\uFEFF/, "");

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const starts = [trimmed.indexOf("{"), trimmed.indexOf("[")].filter((index) => index >= 0);
    const start = Math.min(...starts);
    const end = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));

    if (!Number.isFinite(start) || end <= start) {
      throw new Error("Response did not contain JSON payload.");
    }

    return JSON.parse(trimmed.slice(start, end + 1)) as unknown;
  }
}

function buildSseDailyStockSummaryURL(packageDate: string) {
  const params = new URLSearchParams({
    jsonCallBack: "",
    isPagination: "false",
    sqlId: "COMMON_SSE_SJ_GPSJ_CJGK_MRGK_C",
    PRODUCT_CODE: "01,02,03,11,17",
    type: "inParams",
    SEARCH_DATE: packageDate,
    _: String(Date.now())
  });
  return `http://query.sse.com.cn/commonQuery.do?${params.toString()}`;
}

function buildSzseShowReportURL(catalogId: string, packageDate: string) {
  const params = new URLSearchParams({
    SHOWTYPE: "JSON",
    CATALOGID: catalogId,
    txtQueryDate: packageDate
  });
  return `http://www.szse.cn/api/report/ShowReport/data?${params.toString()}`;
}

function collectSzseReportRows(payload: unknown): Record<string, unknown>[] {
  const sections = Array.isArray(payload) ? payload : [payload];
  return sections.flatMap((section) => {
    const record = asRecord(section);
    const data = record.data;
    if (Array.isArray(data)) {
      return normalizeRows(data);
    }
    return [];
  });
}

function normalizeRows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.map((item) => asRecord(item)).filter((item) => Object.keys(item).length > 0)
    : [];
}

function hasRequiredSummaryFields(facts: OfficialExchangeSummaryFact) {
  return Boolean(facts.turnover && facts.market_value && facts.listed_count);
}

function getCoverageWarnings(label: string, facts: OfficialExchangeSummaryFact | null, coversTargetDate: boolean) {
  const warnings: string[] = [];

  if (!facts) {
    warnings.push(`${label} 未返回可用 rows。`);
    return warnings;
  }

  if (!coversTargetDate) {
    warnings.push(`${label} 返回数据未能确认目标日期。`);
  }

  const missingFields = [
    facts.turnover ? null : "turnover",
    facts.market_value ? null : "market_value",
    facts.listed_count ? null : "listed_count"
  ].filter((field): field is string => Boolean(field));

  if (missingFields.length > 0) {
    warnings.push(`${label} 缺少字段：${missingFields.join(", ")}。`);
  }

  return warnings;
}

function getSafeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.replace(/\s+/g, " ").slice(0, 240);
  }

  return "unknown official exchange collection error";
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asText(value: unknown) {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}
