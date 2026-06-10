import type { MarketBriefGenerationStatus, MarketBriefRecord, MarketBriefStatus } from "@/lib/content-types";

export const marketBriefContentFields: Array<{ key: keyof MarketBriefRecord; label: string; description: string }> = [
  { key: "summary", label: "摘要", description: "当天市场结论和最值得关注的变化。" },
  { key: "market_overview", label: "市场概览", description: "整体涨跌、情绪、成交、主线和背景。" },
  { key: "index_performance", label: "指数表现", description: "主要指数、宽基和代表性资产表现。" },
  { key: "style_performance", label: "风格表现", description: "大小盘、成长/价值、红利、质量、动量等风格。" },
  { key: "sector_performance", label: "行业板块", description: "行业、主题、概念板块和轮动线索。" },
  { key: "hot_topics", label: "市场热点", description: "当天热点事件、主题交易和催化链。" },
  { key: "capital_flows", label: "资金流向", description: "北向、两融、ETF、主力资金或成交结构。" },
  { key: "policy_news", label: "政策新闻", description: "政策、监管、宏观和产业新闻。" },
  { key: "risk_alerts", label: "风险提示", description: "波动、拥挤、事件、流动性或数据风险。" },
  { key: "tomorrow_watch", label: "明日关注", description: "下一交易日需要跟踪的指数、行业、事件和数据。" }
];

export function getMarketBriefStatusTone(status: MarketBriefStatus | string | null | undefined) {
  if (status === "published") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "reviewed") return "bg-blue-50 text-blue-700 ring-blue-100";
  if (status === "archived") return "bg-slate-100 text-slate-600 ring-slate-200";
  return "bg-amber-50 text-amber-700 ring-amber-100";
}

export function getMarketBriefGenerationStatusTone(status: MarketBriefGenerationStatus | string | null | undefined) {
  if (status === "generated") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "needs_review") return "bg-blue-50 text-blue-700 ring-blue-100";
  if (status === "failed") return "bg-rose-50 text-rose-700 ring-rose-100";
  if (status === "archived") return "bg-slate-100 text-slate-600 ring-slate-200";
  if (status === "draft") return "bg-amber-50 text-amber-700 ring-amber-100";
  return "bg-slate-50 text-slate-600 ring-slate-200";
}

export function marketBriefArrayToText(values: string[] | null | undefined) {
  return (values ?? []).join("\n");
}
