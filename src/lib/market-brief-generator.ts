import OpenAI from "openai";
import { getAiProviderConfig, getAiProviderDisplayName } from "@/lib/ai-provider";
import { buildMarketBriefAiPrompt } from "@/lib/market-brief-ai-prompt";

export type MarketBriefGenerationInput = {
  market: string;
  briefDate: string;
  runnerName?: string;
  isHistorical?: boolean;
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
export const externalMarketBriefRunnerName = "external-skill-runner";
export const aiMarketBriefRunnerName = "ai-market-brief-generator";
export type MarketBriefGeneratorMode = "mock" | "external" | "ai";

export function getMarketBriefGeneratorMode(): MarketBriefGeneratorMode {
  const value = process.env.MARKET_BRIEF_GENERATOR?.trim().toLowerCase();
  if (value === "mock" || value === "external" || value === "ai") {
    return value;
  }
  return "ai";
}

export async function generateMarketBriefDraft(input: MarketBriefGenerationInput): Promise<GeneratedMarketBrief> {
  const generator = getMarketBriefGeneratorMode();

  if (generator === "ai") {
    return generateAiMarketBrief(input);
  }

  if (generator === "mock" || generator === "external") {
    return generateMockMarketBrief(input);
  }

  return generateMockMarketBrief(input);
}

async function generateAiMarketBrief(input: MarketBriefGenerationInput): Promise<GeneratedMarketBrief> {
  const aiConfig = getAiProviderConfig();
  const providerLabel = getAiProviderDisplayName(aiConfig.provider);

  if (!aiConfig.isConfigured || !aiConfig.apiKey) {
    throw new Error("AI 市场简报尚未配置。请在服务端环境变量中设置 AI_API_KEY，或继续使用 OPENAI_API_KEY。");
  }

  const client = new OpenAI({
    apiKey: aiConfig.apiKey,
    baseURL: aiConfig.baseURL
  });
  const prompt = buildMarketBriefAiPrompt({
    market: input.market,
    briefDate: input.briefDate,
    isHistorical: Boolean(input.isHistorical),
    providerLabel
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
    response_format: { type: "json_object" }
  });
  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("AI 未返回市场简报内容。");
  }

  const parsed = parseAiJson(content);
  const normalized = normalizeAiMarketBriefOutput(parsed, {
    market: input.market,
    briefDate: input.briefDate,
    isHistorical: Boolean(input.isHistorical),
    model: aiConfig.model,
    providerLabel
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

function parseAiJson(content: string) {
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    const matched = content.match(/\{[\s\S]*\}/);
    if (!matched) {
      throw new Error("AI 返回内容不是合法 JSON。");
    }
    try {
      return JSON.parse(matched[0]) as Record<string, unknown>;
    } catch {
      throw new Error("AI 返回内容不是合法 JSON。");
    }
  }
}

function normalizeAiMarketBriefOutput(
  value: Record<string, unknown>,
  context: { market: string; briefDate: string; isHistorical: boolean; model: string; providerLabel: string }
) {
  const title = asText(value.title) || `${context.market}市场收评简报｜${context.briefDate}`;
  const dataQuality = normalizeAiDataQuality(asText(value.data_quality));
  const generationStatus = dataQuality === "ai_verified" && hasReliableSources(value) ? "generated" : "needs_review";
  const summary = asText(value.summary) || "AI 已生成市场简报草稿，需人工复核关键数据与来源。";
  const charts = normalizeCharts(value.charts);
  const sourceSnapshotInput = asRecord(value.source_snapshot);
  const sourceSnapshotMeta = asRecord(sourceSnapshotInput.meta);
  const sourceNotes = normalizeTextArray(sourceSnapshotMeta.source_notes, [
    "当前 AI Provider 未显式提供可验证联网搜索结果时，精确行情数据需人工复核。"
  ]);
  const sources = normalizeTextArray(sourceSnapshotMeta.sources, []);
  const warnings = normalizeTextArray(sourceSnapshotMeta.warnings, []);
  const markdownContent = ensureAiMarkdown({
    markdown: asText(value.markdown_content),
    title,
    summary,
    generationStatus,
    dataQuality,
    isHistorical: context.isHistorical,
    sourceNotes
  });
  const sourceSnapshot = {
    meta: {
      ...sourceSnapshotMeta,
      market: context.market,
      brief_date: context.briefDate,
      generator: "ai",
      provider: context.providerLabel,
      model: context.model,
      data_quality: dataQuality,
      is_historical: context.isHistorical,
      generation_status: generationStatus,
      warnings,
      sources,
      source_notes: sourceNotes
    },
    indices: Array.isArray(sourceSnapshotInput.indices) ? sourceSnapshotInput.indices : [],
    sectors: Array.isArray(sourceSnapshotInput.sectors) ? sourceSnapshotInput.sectors : [],
    market_breadth: asRecord(sourceSnapshotInput.market_breadth),
    hot_topics: Array.isArray(sourceSnapshotInput.hot_topics) ? sourceSnapshotInput.hot_topics : [],
    capital_flows: Array.isArray(sourceSnapshotInput.capital_flows) ? sourceSnapshotInput.capital_flows : [],
    policy_news: Array.isArray(sourceSnapshotInput.policy_news) ? sourceSnapshotInput.policy_news : [],
    risk_signals: Array.isArray(sourceSnapshotInput.risk_signals) ? sourceSnapshotInput.risk_signals : [],
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
    tags: normalizeTextArray(value.tags, [context.market, "市场收评", "AI生成", "待复核"]),
    data_sources: normalizeTextArray(value.data_sources, sources.length > 0 ? sources : ["AI", "公开市场信息"])
  };
}

function ensureAiMarkdown(input: {
  markdown: string | null;
  title: string;
  summary: string;
  generationStatus: string;
  dataQuality: string;
  isHistorical: boolean;
  sourceNotes: string[];
}) {
  const historicalNotice = input.isHistorical
    ? "\n\n> 本简报为历史日期补生成版本，部分盘中热点、新闻和资金流数据可能无法完整回溯。"
    : "";
  const base = input.markdown?.trim();

  if (base && base.includes("## 一、市场概览") && base.includes("## 十、AI 复核状态")) {
    const withHistoricalNotice = input.isHistorical && !base.includes("历史日期补生成版本")
      ? base.replace("\n## 一、市场概览", `${historicalNotice}\n\n## 一、市场概览`)
      : base;
    return `${withHistoricalNotice}\n`;
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
    ...input.sourceNotes.map((note) => `- ${note}`),
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
  if (value === "ai_verified" || value === "ai_partial" || value === "ai_unverified") {
    return value;
  }
  return "ai_unverified";
}

function hasReliableSources(value: Record<string, unknown>) {
  const sourceSnapshot = asRecord(value.source_snapshot);
  const meta = asRecord(sourceSnapshot.meta);
  const sources = normalizeTextArray(meta.sources, []);
  return sources.length >= 2;
}

function normalizeCharts(value: unknown) {
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
        data: Array.isArray(chart.data) ? chart.data.filter((row) => typeof row === "object" && row !== null) : []
      };
    })
    .filter(Boolean);
}

function normalizeTextArray(value: unknown, fallback: string[]) {
  const source = Array.isArray(value) ? value : fallback;
  const values = source
    .map((item) => typeof item === "string" ? item.trim() : "")
    .filter(Boolean);
  return Array.from(new Set(values));
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
