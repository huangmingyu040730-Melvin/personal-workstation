export type MarketBriefGenerationInput = {
  market: string;
  briefDate: string;
  runnerName?: string;
};

export type GeneratedMarketBrief = {
  title: string;
  summary: string;
  markdownContent: string;
  sourceSnapshot: Record<string, unknown>;
  tags: string[];
  dataSources: string[];
  generatorName: string;
};

export const defaultMarketBriefRunnerName = "manual-skill-mock";

export async function generateMarketBriefDraft(input: MarketBriefGenerationInput): Promise<GeneratedMarketBrief> {
  const generator = process.env.MARKET_BRIEF_GENERATOR ?? "mock";

  if (generator === "mock") {
    return generateMockMarketBrief(input);
  }

  // Future extension point: call a skill runner, webhook, or reviewed data pipeline.
  return generateMockMarketBrief(input);
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
