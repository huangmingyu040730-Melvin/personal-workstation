import OpenAI from "openai";
import { getAiProviderConfig, getAiProviderDisplayName } from "@/lib/ai-provider";
import type { MarketBriefGroundingContext } from "@/lib/market-brief-grounding";
import { buildGroundingSourceSnapshotBase } from "@/lib/market-brief-grounding";
import { buildMarketBriefAiPrompt } from "@/lib/market-brief-ai-prompt";
import type { MarketBriefJobProgressStage } from "@/lib/market-brief-job-progress";
import type { MarketBriefSearchSource } from "@/lib/market-brief-search";
import { getMarketBriefMaterialPackageDataQuality } from "@/lib/market-brief-material-packages";

export type MarketBriefGenerationInput = {
  market: string;
  briefDate: string;
  runnerName?: string;
  isHistorical?: boolean;
  grounding?: MarketBriefGroundingContext;
  onProgress?: (stage: MarketBriefJobProgressStage, message?: string) => Promise<void> | void;
};

export type GeneratedMarketBrief = {
  title: string;
  summary: string;
  markdownContent: string;
  sourceSnapshot: Record<string, unknown>;
  tags: string[];
  dataSources: string[];
  generatorName: string;
  generationStatus?: "manual" | "draft" | "generated" | "failed" | "needs_review" | "archived";
};

export const defaultMarketBriefRunnerName = "manual-skill-mock";
export const aiMarketBriefRunnerName = "ai-market-brief-generator";
export type MarketBriefGeneratorMode = "mock" | "ai";

export function getMarketBriefGeneratorMode(): MarketBriefGeneratorMode {
  const value = process.env.MARKET_BRIEF_GENERATOR?.trim().toLowerCase();
  if (value === "mock" || value === "ai") {
    return value;
  }
  return "ai";
}

export async function generateMarketBriefDraft(input: MarketBriefGenerationInput): Promise<GeneratedMarketBrief> {
  const generator = getMarketBriefGeneratorMode();

  if (generator === "ai") {
    return generateAiMarketBrief(input);
  }

  if (generator === "mock") {
    return generateMockMarketBrief(input);
  }

  return generateMockMarketBrief(input);
}

async function generateAiMarketBrief(input: MarketBriefGenerationInput): Promise<GeneratedMarketBrief> {
  const grounding = input.grounding;

  if (!grounding) {
    throw new Error("未找到可用市场素材包，请先采集素材包后重新排队。");
  }

  await input.onProgress?.("analyzing", "正在整理已保存素材包与来源...");
  const aiConfig = getAiProviderConfig();
  const providerLabel = getAiProviderDisplayName(aiConfig.provider);

  if (!aiConfig.isConfigured || !aiConfig.apiKey) {
    throw new Error("AI 市场简报尚未配置。请在服务端环境变量中设置 AI_API_KEY，或继续使用 OPENAI_API_KEY。");
  }

  const client = new OpenAI({
    apiKey: aiConfig.apiKey,
    baseURL: aiConfig.baseURL
  });
  await input.onProgress?.("writing", "正在生成市场简报正文...");
  const prompt = buildMarketBriefAiPrompt({
    market: input.market,
    briefDate: input.briefDate,
    isHistorical: Boolean(input.isHistorical),
    providerLabel,
    grounding
  });
  console.info("marketBrief.aiGeneration.promptReady", {
    provider: providerLabel,
    grounding_mode: grounding.groundingMode,
    material_package_id: grounding.materialPackageId ?? null,
    source_count: grounding.sources.length,
    prompt_length_estimate: prompt.length
  });

  const response = await client.chat.completions.create({
    model: aiConfig.model,
    messages: [
      {
        role: "system",
        content: "你是谨慎的中文金融研究员。必须输出合法 JSON，不得编造无法确认的市场精确数据。"
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
    max_tokens: 3500,
    response_format: { type: "json_object" }
  });
  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("AI 未返回市场简报内容。");
  }

  const parsed = parseAiJson(content, {
    market: input.market,
    briefDate: input.briefDate
  });
  await input.onProgress?.("charting", "正在生成图表数据...");
  const normalized = normalizeAiMarketBriefOutput(parsed, {
    market: input.market,
    briefDate: input.briefDate,
    isHistorical: Boolean(input.isHistorical),
    model: aiConfig.model,
    providerLabel,
    grounding
  });

  return {
    title: normalized.title,
    summary: normalized.summary,
    markdownContent: normalized.markdown_content,
    sourceSnapshot: normalized.source_snapshot,
    tags: normalized.tags,
    dataSources: normalized.data_sources,
    generatorName: input.runnerName || aiMarketBriefRunnerName,
    generationStatus: normalized.generation_status
  };
}

function parseAiJson(content: string, fallback: { market: string; briefDate: string }) {
  const normalized = stripMarkdownCodeFence(content);
  const firstBrace = normalized.indexOf("{");
  const lastBrace = normalized.lastIndexOf("}");
  const jsonCandidate = firstBrace >= 0 && lastBrace > firstBrace ? normalized.slice(firstBrace, lastBrace + 1) : null;
  const candidates = [
    normalized,
    jsonCandidate,
    jsonCandidate ? repairCommonJsonIssues(jsonCandidate) : null
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as Record<string, unknown>;
    } catch {
      // Try the next safer candidate before falling back to a review draft.
    }
  }

  console.warn("marketBrief.aiGeneration.invalidJsonFallback", {
    content_length: content.length,
    has_json_braces: Boolean(jsonCandidate)
  });
  return buildFallbackAiOutputFromInvalidJson(normalized, fallback);
}

function stripMarkdownCodeFence(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json|JSON)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1].trim() : trimmed;
}

function repairCommonJsonIssues(content: string) {
  return content
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/[\u0000-\u001F]+/g, (match) => match.includes("\n") || match.includes("\r") || match.includes("\t") ? match : "");
}

function buildFallbackAiOutputFromInvalidJson(content: string, fallback: { market: string; briefDate: string }): Record<string, unknown> {
  const title = extractLooseStringField(content, "title") || `${fallback.market}市场收评简报｜${fallback.briefDate}`;
  const summary = extractLooseStringField(content, "summary") || "AI 已返回内容，但格式不是合法 JSON，系统已保存为待复核草稿。";
  const markdownContent = extractLooseStringField(content, "markdown_content");

  return {
    title,
    summary,
    markdown_content: markdownContent,
    generation_status: "needs_review",
    data_quality: "ai_grounded_partial",
    charts: [],
    source_snapshot: {
      meta: {
        warnings: ["AI returned non-strict JSON; saved fallback markdown draft."],
        source_notes: ["AI 返回内容格式不是合法 JSON，系统已尽量保存正文草稿，请人工复核。"]
      },
      extracted_facts: {},
      charts: []
    },
    tags: [fallback.market, "市场收评", "AI生成", "格式待复核"],
    data_sources: ["AI"]
  };
}

function extractLooseStringField(content: string, fieldName: string) {
  const fieldIndex = findLooseFieldIndex(content, fieldName);
  if (fieldIndex < 0) return null;

  const colonIndex = content.indexOf(":", fieldIndex);
  if (colonIndex < 0) return null;

  const afterColon = content.slice(colonIndex + 1);
  const nextFieldIndex = findNextLooseFieldIndex(afterColon);
  const rawValue = (nextFieldIndex >= 0 ? afterColon.slice(0, nextFieldIndex) : afterColon)
    .replace(/,\s*$/g, "")
    .trim();
  const trimmed = stripMatchingQuotes(rawValue);
  const unescaped = trimmed
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\"/g, "\"")
    .replace(/\\\\/g, "\\")
    .trim();

  return unescaped.length > 0 ? unescaped : null;
}

function findLooseFieldIndex(content: string, fieldName: string) {
  const quoted = content.indexOf(`"${fieldName}"`);
  if (quoted >= 0) return quoted;
  const singleQuoted = content.indexOf(`'${fieldName}'`);
  if (singleQuoted >= 0) return singleQuoted;
  return content.indexOf(fieldName);
}

function findNextLooseFieldIndex(content: string) {
  const fieldNames = ["summary", "markdown_content", "generation_status", "data_quality", "charts", "source_snapshot", "tags", "data_sources"];
  const indexes = fieldNames
    .flatMap((fieldName) => [content.indexOf(`"${fieldName}"`), content.indexOf(`'${fieldName}'`), content.indexOf(`\n${fieldName}`)])
    .filter((index) => index > 0);

  return indexes.length > 0 ? Math.min(...indexes) : -1;
}

function stripMatchingQuotes(value: string) {
  const trimmed = value.trim();
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];

  if ((first === "\"" && last === "\"") || (first === "'" && last === "'") || (first === "`" && last === "`")) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function normalizeAiMarketBriefOutput(
  value: Record<string, unknown>,
  context: { market: string; briefDate: string; isHistorical: boolean; model: string; providerLabel: string; grounding: MarketBriefGroundingContext }
) {
  const title = asText(value.title) || `${context.market}市场收评简报｜${context.briefDate}`;
  const dataQuality = normalizeAiDataQualityForGrounding(context.grounding, asText(value.data_quality));
  const generationStatus = normalizeGenerationStatusForGrounding(context.grounding, asText(value.generation_status));
  const summary = asText(value.summary) || "AI 已生成市场简报草稿，需人工复核关键数据与来源。";
  const sourceIds = new Set(context.grounding.sources.map((source) => source.id));
  const charts = normalizeCharts(value.charts, sourceIds);
  const sourceSnapshotInput = asRecord(value.source_snapshot);
  const sourceSnapshotMeta = asRecord(sourceSnapshotInput.meta);
  const sourceNotes = mergeTextArrays(context.grounding.sourceNotes, normalizeTextArray(sourceSnapshotMeta.source_notes, []));
  const warnings = mergeTextArrays(context.grounding.warnings, normalizeTextArray(sourceSnapshotMeta.warnings, []));
  const extractedFacts = normalizeExtractedFactsForGrounding(context.grounding, sourceSnapshotInput);
  const markdownContent = ensureAiMarkdown({
    markdown: asText(value.markdown_content),
    title,
    summary,
    generationStatus,
    dataQuality,
    isHistorical: context.isHistorical,
    groundingMode: context.grounding.groundingMode,
    sourceNotes,
    sources: context.grounding.sources
  });
  const sourceSnapshotBase = buildGroundingSourceSnapshotBase({
    ...context.grounding,
    model: context.model,
    generationStatus,
    dataQuality
  });
  const sourceSnapshot = {
    ...sourceSnapshotBase,
    meta: {
      ...sourceSnapshotBase.meta,
      provider: context.providerLabel,
      grounding_mode: context.grounding.groundingMode,
      warnings,
      source_notes: sourceNotes
    },
    sources: context.grounding.sources,
    extracted_facts: extractedFacts,
    charts
  };

  return {
    title,
    summary,
    markdown_content: markdownContent,
    generation_status: generationStatus as GeneratedMarketBrief["generationStatus"],
    data_quality: dataQuality,
    charts,
    source_snapshot: sourceSnapshot,
    tags: normalizeTextArray(value.tags, [context.market, "市场收评", "AI生成", "素材包生成", "待复核"]),
    data_sources: normalizeDataSourcesForGrounding(context.grounding, value.data_sources)
  };
}

function ensureAiMarkdown(input: {
  markdown: string | null;
  title: string;
  summary: string;
  generationStatus: string;
  dataQuality: string;
  isHistorical: boolean;
  groundingMode: MarketBriefGroundingContext["groundingMode"];
  sourceNotes: string[];
  sources: MarketBriefSearchSource[];
}) {
  const historicalNotice = input.isHistorical
    ? "\n\n> 本简报为历史日期补生成版本，部分盘中热点、新闻和资金流数据可能无法完整回溯。"
    : "";
  const base = input.markdown?.trim();

  if (base && base.includes("## 一、市场概览") && base.includes("## 十、AI 复核状态")) {
    const withHistoricalNotice = input.isHistorical && !base.includes("历史日期补生成版本")
      ? base.replace("\n## 一、市场概览", `${historicalNotice}\n\n## 一、市场概览`)
      : base;
    return `${ensureMaterialPackageMarkdownNote(withHistoricalNotice, input.groundingMode)}\n`;
  }

  const lines = [
    `# ${input.title}`,
    "",
    "> 本简报由 AI 根据公开市场信息生成，内容仅供研究复盘与人工复核，不构成投资建议。",
    input.isHistorical ? "> 本简报为历史日期补生成版本，部分盘中热点、新闻和资金流数据可能无法完整回溯。" : "",
    "",
    "## 一、市场概览",
    "",
    "- 主要指数表现：未能可靠确认。",
    "- 市场成交与流动性：未能可靠确认。",
    "- 涨跌家数与市场情绪：未能可靠确认。",
    `- 今日核心结论：${input.summary}`,
    "",
    "## 二、指数与风格表现",
    "",
    "### 2.1 宽基指数",
    "",
    "主要宽基指数精确涨跌幅暂未能可靠确认，需人工复核。",
    "",
    "### 2.2 风格表现",
    "",
    "风格表现暂未能可靠确认。",
    "",
    "## 三、行业板块表现",
    "",
    "行业板块涨跌幅和排名暂未能可靠确认。",
    "",
    "## 四、市场热点与主题线索",
    "",
    "市场热点需结合可验证新闻和行情源人工复核。",
    "",
    "## 五、资金面与情绪",
    "",
    "成交额、北向资金、主力资金、涨跌家数等字段暂未能可靠确认。",
    "",
    "## 六、政策、宏观与海外影响",
    "",
    "政策、宏观与海外影响需人工补充可靠来源。",
    "",
    "## 七、风险提示",
    "",
    "- 数据不完整风险；",
    "- 市场波动风险；",
    "- 热点持续性风险；",
    "- 政策和外部环境不确定性。",
    "",
    "## 八、明日关注",
    "",
    "建议人工复核重点指数位置、重点行业、重点事件和外部变量。",
    "",
    "## 九、数据与来源说明",
    "",
    input.groundingMode === "material_package" ? "- 本简报基于已保存的市场素材包生成，不在生成时实时搜索。" : "",
    ...input.sourceNotes.map((note) => `- ${note}`),
    ...input.sources.map((source) => `- [${source.id}] ${source.title} - ${source.publisher || "未知来源"} - ${source.url}`),
    "",
    "## 十、AI 复核状态",
    "",
    `- generation_status: ${input.generationStatus}`,
    `- data_quality: ${input.dataQuality}`,
    "- 需要人工复核的字段：指数涨跌幅、成交额、行业涨跌幅、资金流、涨跌家数、热点持续性。",
    ""
  ];

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

function normalizeAiDataQuality(value: string | null) {
  if (value === "ai_verified") return "ai_grounded";
  if (value === "ai_partial") return "ai_grounded_partial";
  if (value === "ai_grounded" || value === "ai_grounded_partial" || value === "ai_unverified") {
    return value;
  }
  return "ai_unverified";
}

function normalizeAiDataQualityForGrounding(grounding: MarketBriefGroundingContext, value: string | null) {
  if (grounding.groundingMode === "material_package" && grounding.materialPackageStatus) {
    return getMarketBriefMaterialPackageDataQuality(grounding.materialPackageStatus);
  }

  return normalizeAiDataQuality(value);
}

function normalizeGenerationStatus(value: string | null): NonNullable<GeneratedMarketBrief["generationStatus"]> {
  return value === "generated" ? "generated" : "needs_review";
}

function normalizeGenerationStatusForGrounding(grounding: MarketBriefGroundingContext, value: string | null): NonNullable<GeneratedMarketBrief["generationStatus"]> {
  if (grounding.groundingMode === "material_package") {
    return "needs_review";
  }

  return normalizeGenerationStatus(value);
}

function normalizeCharts(value: unknown, validSourceIds: Set<string>) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      const chart = asRecord(item);
      const type = asText(chart.type);
      if (type !== "bar" && type !== "pie" && type !== "line") {
        return null;
      }
      return {
        id: asText(chart.id) || `chart_${index + 1}`,
        title: asText(chart.title) || "未命名图表",
        type,
        description: asText(chart.description) || "",
        x_key: asText(chart.x_key) || "name",
        y_key: asText(chart.y_key) || "value",
        name_key: asText(chart.name_key) || "name",
        value_key: asText(chart.value_key) || "value",
        unit: asText(chart.unit) || "",
        data: Array.isArray(chart.data)
          ? chart.data
              .map((row) => normalizeSourcedChartRow(row, validSourceIds))
              .filter((row): row is Record<string, unknown> => Boolean(row))
          : []
      };
    })
    .filter(Boolean);
}

function normalizeSourcedChartRow(value: unknown, validSourceIds: Set<string>): Record<string, unknown> | null {
  const row = asRecord(value);
  if (Object.keys(row).length === 0) {
    return null;
  }

  const sourceIds = normalizeTextArray(row.source_ids, []);
  const sourceId = asText(row.source_id);
  const mergedSourceIds = Array.from(new Set([...sourceIds, ...(sourceId ? [sourceId] : [])])).filter((id) => validSourceIds.has(id));

  if (mergedSourceIds.length === 0) {
    return null;
  }

  return {
    ...row,
    source_ids: mergedSourceIds
  };
}

function normalizeExtractedFacts(sourceSnapshotInput: Record<string, unknown>) {
  const extractedFacts = asRecord(sourceSnapshotInput.extracted_facts);
  return {
    indices: Array.isArray(extractedFacts.indices) ? extractedFacts.indices : Array.isArray(sourceSnapshotInput.indices) ? sourceSnapshotInput.indices : [],
    market_breadth: asRecord(extractedFacts.market_breadth ?? sourceSnapshotInput.market_breadth),
    sectors: Array.isArray(extractedFacts.sectors) ? extractedFacts.sectors : Array.isArray(sourceSnapshotInput.sectors) ? sourceSnapshotInput.sectors : [],
    hot_topics: Array.isArray(extractedFacts.hot_topics) ? extractedFacts.hot_topics : Array.isArray(sourceSnapshotInput.hot_topics) ? sourceSnapshotInput.hot_topics : [],
    capital_flows: Array.isArray(extractedFacts.capital_flows) ? extractedFacts.capital_flows : Array.isArray(sourceSnapshotInput.capital_flows) ? sourceSnapshotInput.capital_flows : [],
    policy_news: Array.isArray(extractedFacts.policy_news) ? extractedFacts.policy_news : Array.isArray(sourceSnapshotInput.policy_news) ? sourceSnapshotInput.policy_news : [],
    risk_signals: Array.isArray(extractedFacts.risk_signals) ? extractedFacts.risk_signals : Array.isArray(sourceSnapshotInput.risk_signals) ? sourceSnapshotInput.risk_signals : []
  };
}

function normalizeExtractedFactsForGrounding(grounding: MarketBriefGroundingContext, sourceSnapshotInput: Record<string, unknown>) {
  const groundingFacts = asRecord(grounding.extractedFacts);
  if (Object.keys(groundingFacts).length > 0) {
    return {
      indices: Array.isArray(groundingFacts.indices) ? groundingFacts.indices : [],
      market_breadth: asRecord(groundingFacts.market_breadth),
      sectors: Array.isArray(groundingFacts.sectors) ? groundingFacts.sectors : [],
      hot_topics: Array.isArray(groundingFacts.hot_topics) ? groundingFacts.hot_topics : [],
      capital_flows: Array.isArray(groundingFacts.capital_flows) ? groundingFacts.capital_flows : [],
      policy_news: Array.isArray(groundingFacts.policy_news) ? groundingFacts.policy_news : [],
      risk_signals: Array.isArray(groundingFacts.risk_signals) ? groundingFacts.risk_signals : []
    };
  }

  return normalizeExtractedFacts(sourceSnapshotInput);
}

function getDefaultDataSources(grounding: MarketBriefGroundingContext) {
  if (grounding.groundingMode === "material_package") {
    return ["AI", "已保存市场素材包", grounding.searchProviderLabel];
  }

  return ["AI", grounding.searchProviderLabel];
}

function normalizeDataSourcesForGrounding(grounding: MarketBriefGroundingContext, value: unknown) {
  const defaults = getDefaultDataSources(grounding);
  const values = normalizeTextArray(value, []);
  const normalized = grounding.groundingMode === "material_package"
    ? values.map((item) => item === "Web Search" || item === "网络搜索" ? "已保存市场素材包" : item)
    : values;

  return Array.from(new Set([...normalized, ...defaults].map((item) => item.trim()).filter(Boolean)));
}

function ensureMaterialPackageMarkdownNote(markdown: string, groundingMode: MarketBriefGroundingContext["groundingMode"]) {
  if (groundingMode !== "material_package" || markdown.includes("已保存的市场素材包")) {
    return markdown;
  }

  if (markdown.includes("\n## 十、AI 复核状态")) {
    return markdown.replace(
      "\n## 十、AI 复核状态",
      "\n- 本简报基于已保存的市场素材包生成，不在生成时实时搜索。\n\n## 十、AI 复核状态"
    );
  }

  return `${markdown.trim()}\n\n## 数据与来源说明\n\n- 本简报基于已保存的市场素材包生成，不在生成时实时搜索。`;
}

function normalizeTextArray(value: unknown, fallback: string[]) {
  const source = Array.isArray(value) ? value : fallback;
  const values = source
    .map((item) => typeof item === "string" ? item.trim() : "")
    .filter(Boolean);
  return Array.from(new Set(values));
}

function mergeTextArrays(primary: string[], secondary: string[]) {
  return Array.from(new Set([...primary, ...secondary].map((item) => item.trim()).filter(Boolean)));
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function generateMockMarketBrief({ market, briefDate, runnerName = defaultMarketBriefRunnerName }: MarketBriefGenerationInput): GeneratedMarketBrief {
  const title = `${market}市场收评简报｜${briefDate}`;
  const summary = "本简报由测试生成器生成，当前尚未接入真实行情数据。内容用于验证市场简报生成、预览和下载流程。";
  const generatedAt = new Date().toISOString();
  const sections = {
    summary,
    marketOverview: "今日市场动态由 mock 生成器填充，用于模拟正式收评结构。请在接入真实数据源后复核指数、成交、情绪和主线描述。",
    indexPerformance: "指数表现为占位内容。后续可接入指数行情、涨跌幅、成交额和波动率等字段。",
    stylePerformance: "风格表现为占位内容。后续可拆分成长、价值、红利、小盘、大盘、质量和动量等风格。",
    sectorPerformance: "行业板块为占位内容。后续可接入申万、GICS、主题概念和行业轮动数据。",
    hotTopics: "市场热点为占位内容。后续可结合新闻源、公告和主题催化链生成。",
    capitalFlows: "资金流向为占位内容。后续可接入 ETF、北向、两融、主力资金或成交结构数据。",
    policyNews: "政策新闻为占位内容。后续可接入宏观、监管和产业政策公开信息源。",
    riskAlerts: "风险提示为占位内容，不构成投资建议。后续应结合波动、拥挤度、事件和流动性指标复核。",
    tomorrowWatch: "明日关注为占位内容。后续可结合交易日历、宏观数据、行业事件和重点公告生成。"
  };

  return {
    title,
    summary,
    markdownContent: [
      `# ${title}`,
      "",
      "> 本简报由测试生成器生成，当前尚未接入真实行情数据。",
      "",
      `- 日期：${briefDate}`,
      `- 市场：${market}`,
      "- 生成方式：manual-skill-mock",
      "",
      "## 一、摘要",
      "",
      sections.summary,
      "",
      "## 二、市场概览",
      "",
      sections.marketOverview,
      "",
      "## 三、指数表现",
      "",
      sections.indexPerformance,
      "",
      "## 四、风格表现",
      "",
      sections.stylePerformance,
      "",
      "## 五、行业板块",
      "",
      sections.sectorPerformance,
      "",
      "## 六、市场热点",
      "",
      sections.hotTopics,
      "",
      "## 七、资金流向",
      "",
      sections.capitalFlows,
      "",
      "## 八、政策新闻",
      "",
      sections.policyNews,
      "",
      "## 九、风险提示",
      "",
      sections.riskAlerts,
      "",
      "## 十、明日关注",
      "",
      sections.tomorrowWatch,
      "",
      "## 数据来源",
      "",
      "- Mock generator fixture",
      "- 当前尚未接入真实行情、新闻或外部数据源",
      ""
    ].join("\n"),
    sourceSnapshot: {
      meta: {
        market,
        brief_date: briefDate,
        runner_name: runnerName,
        generated_at: generatedAt,
        mode: "mock",
        data_quality: "mock_only",
        disclaimer: "本阶段未接入真实行情、新闻源、AI、邮件或 Notion。"
      },
      indices: [{ name: "上证指数", code: "000001.SH", close: null, change_pct: null, turnover: null }],
      styles: [],
      sectors: [],
      hot_topics: [],
      capital_flows: [],
      policy_news: [],
      risk_signals: [],
      sections
    },
    tags: ["市场简报", market, "mock", "待复核"],
    dataSources: ["Mock generator fixture", "未接入真实行情数据"],
    generatorName: runnerName
  };
}
