export const marketBriefAiTemplate = `# A股市场收评简报｜YYYY-MM-DD

> 本简报由 AI 根据公开市场信息生成，内容仅供研究复盘与人工复核，不构成投资建议。

## 一、市场概览

- 主要指数表现：
- 市场成交与流动性：
- 涨跌家数与市场情绪：
- 今日核心结论：

## 二、指数与风格表现

### 2.1 宽基指数

覆盖以下指数：

- 上证指数
- 深证成指
- 创业板指
- 沪深300
- 中证500
- 中证1000
- 中证2000
- 中证红利
- 科创50
- 北证50

### 2.2 风格表现

包括：

- 大盘 / 中盘 / 小盘；
- 成长 / 价值；
- 红利 / 科技 / 消费 / 周期；
- 高股息、低估值、微盘等，如当日有显著风格。

## 三、行业板块表现

行业划分优先使用 GICS 或 A股常见行业分类。

包括：

- 领涨行业；
- 领跌行业；
- 板块轮动；
- 可能的驱动因素。

## 四、市场热点与主题线索

包括：

- 今日核心热点；
- 主题催化；
- 持续性判断；
- 是否属于政策驱动、产业驱动、事件驱动或资金驱动。

## 五、资金面与情绪

包括：

- 成交额变化；
- 北向资金 / 主力资金 / ETF 资金，如能可靠确认；
- 涨停 / 跌停 / 连板 / 炸板，如能可靠确认；
- 风险偏好变化。

## 六、政策、宏观与海外影响

包括：

- 国内政策；
- 宏观数据；
- 海外市场；
- 汇率、利率、商品、债券等对 A 股的影响。

## 七、风险提示

包括：

- 数据不完整风险；
- 市场波动风险；
- 热点持续性风险；
- 政策和外部环境不确定性。

## 八、明日关注

包括：

- 重点指数位置；
- 重点行业；
- 重点事件；
- 可能影响市场的变量。

## 九、数据与来源说明

列出 AI 使用或参考的信息来源。

## 十、AI 复核状态

- generation_status:
- data_quality:
- 需要人工复核的字段：`;

export function buildMarketBriefAiPrompt(input: {
  market: string;
  briefDate: string;
  isHistorical: boolean;
  providerLabel: string;
}) {
  const historicalInstruction = input.isHistorical
    ? "本次是历史日期补生成，Markdown 必须包含：本简报为历史日期补生成版本，部分盘中热点、新闻和资金流数据可能无法完整回溯。"
    : "本次是今日市场简报。";

  return [
    "你是谨慎的中文金融研究员，负责生成后台私密 A 股市场收评简报。",
    "你必须输出 JSON 对象，不要输出 Markdown 代码块，不要输出 JSON 以外的解释。",
    "",
    `市场：${input.market}`,
    `日期：${input.briefDate}`,
    `AI Provider：${input.providerLabel}`,
    historicalInstruction,
    "",
    "重要约束：",
    "1. 中文输出，金融研究员风格，克制、可复核。",
    "2. 不做投资建议，不推荐个股，不输出买入 / 卖出建议。",
    "3. 必须按固定 Markdown 模板生成 markdown_content。",
    "4. 如果无法可靠确认某个精确数字，写 null、未能可靠确认或需人工复核。",
    "5. 不得编造指数涨跌幅、成交额、行业排名、资金流、涨跌家数等精确数据。",
    "6. 如果你没有联网搜索或实时行情能力，data_quality 必须为 ai_unverified，generation_status 必须为 needs_review，charts 的 data 可以为空。",
    "7. 如果引用了任何数据或判断来源，必须在 source_snapshot.meta.sources 或 source_snapshot.meta.source_notes 中说明来源边界。",
    "8. 生成状态默认 needs_review，除非来源和数据非常充分。",
    "",
    "固定 Markdown 模板：",
    marketBriefAiTemplate,
    "",
    "必须返回 JSON，字段如下：",
    JSON.stringify(
      {
        title: `A股市场收评简报｜${input.briefDate}`,
        summary: "一句话摘要",
        markdown_content: "完整 Markdown",
        generation_status: "needs_review",
        data_quality: "ai_verified | ai_partial | ai_unverified",
        charts: [
          {
            id: "index_performance",
            title: "主要宽基指数涨跌幅",
            type: "bar",
            description: "展示主要宽基指数当日涨跌幅。",
            x_key: "name",
            y_key: "change_pct",
            unit: "%",
            data: [{ name: "上证指数", code: "000001.SH", change_pct: null, source: "AI/source" }]
          },
          {
            id: "sector_performance",
            title: "行业板块涨跌幅",
            type: "bar",
            description: "展示领涨和领跌行业。",
            x_key: "name",
            y_key: "change_pct",
            unit: "%",
            data: []
          },
          {
            id: "market_breadth",
            title: "市场涨跌家数",
            type: "pie",
            description: "展示上涨、下跌和平盘股票数量占比。",
            name_key: "category",
            value_key: "count",
            data: []
          }
        ],
        source_snapshot: {
          meta: {
            market: input.market,
            brief_date: input.briefDate,
            generator: "ai",
            model: "model-name",
            data_quality: "ai_unverified",
            is_historical: input.isHistorical,
            warnings: [],
            sources: [],
            source_notes: []
          },
          indices: [],
          sectors: [],
          market_breadth: {},
          hot_topics: [],
          capital_flows: [],
          policy_news: [],
          risk_signals: []
        },
        tags: ["A股", "市场收评", "AI生成", "待复核"],
        data_sources: ["AI", "公开市场信息"]
      },
      null,
      2
    )
  ].join("\n");
}
