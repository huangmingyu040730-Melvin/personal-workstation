import { z } from "zod";
import { optionalText, textArraySchema } from "./common";

const marketBriefStatusSchema = z.enum(["draft", "reviewed", "published", "archived"], {
  message: "请选择有效的简报状态。"
});

const marketBriefGenerationStatusSchema = z.enum(["manual", "draft", "generated", "failed", "needs_review", "archived"], {
  message: "请选择有效的生成状态。"
});

const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "请选择有效的简报日期。");

export const marketBriefSchema = z.object({
  brief_date: dateSchema,
  title: z.string().trim().min(1, "请输入简报标题。").max(160, "简报标题不能超过 160 个字符。"),
  status: marketBriefStatusSchema,
  market: z.string().trim().min(1, "请输入市场。").max(40, "市场名称不能超过 40 个字符。"),
  summary: optionalText(3000),
  market_overview: optionalText(8000),
  index_performance: optionalText(8000),
  style_performance: optionalText(8000),
  sector_performance: optionalText(8000),
  hot_topics: optionalText(8000),
  capital_flows: optionalText(8000),
  policy_news: optionalText(8000),
  risk_alerts: optionalText(8000),
  tomorrow_watch: optionalText(8000),
  data_sources: textArraySchema,
  tags: textArraySchema,
  is_featured: z.boolean().default(false),
  markdown_content: optionalText(80000),
  generation_status: marketBriefGenerationStatusSchema.default("manual"),
  generator_name: optionalText(120)
});

export type MarketBriefInput = z.infer<typeof marketBriefSchema>;
