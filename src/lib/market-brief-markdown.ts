import type { MarketBriefRecord } from "@/lib/content-types";
import { formatDate } from "@/lib/format";
import { marketBriefContentFields } from "@/lib/market-briefs";

const sectionNumbers = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

export function buildMarketBriefMarkdown(brief: MarketBriefRecord, options?: { preferStored?: boolean }) {
  const preferStored = options?.preferStored ?? true;
  const stored = brief.markdown_content?.trim();

  if (preferStored && stored) {
    return `${stored}\n`;
  }

  const lines: string[] = [
    `# ${buildMarketBriefTitle(brief)}`,
    "",
    `- 日期：${formatDate(brief.brief_date)}`,
    `- 市场：${brief.market}`
  ];

  if (brief.tags.length > 0) {
    lines.push(`- 标签：${brief.tags.join("、")}`);
  }

  lines.push("");

  marketBriefContentFields.forEach((field, index) => {
    const value = brief[field.key];

    if (typeof value !== "string" || !value.trim()) {
      return;
    }

    lines.push(`## ${sectionNumbers[index]}、${field.label}`, "", value.trim(), "");
  });

  if (brief.data_sources.length > 0) {
    lines.push("## 数据来源", "");
    brief.data_sources.forEach((source) => lines.push(`- ${source}`));
    lines.push("");
  }

  return `${trimBlankLines(lines).join("\n")}\n`;
}

export function buildMarketBriefMarkdownDraft(brief: MarketBriefRecord) {
  return buildMarketBriefMarkdown(brief, { preferStored: false });
}

export function hasMarketBriefMarkdownContent(brief: Pick<MarketBriefRecord, "markdown_content">) {
  return Boolean(brief.markdown_content?.trim());
}

export function getMarketBriefMarkdownSourceLabel(brief: Pick<MarketBriefRecord, "markdown_content">) {
  return hasMarketBriefMarkdownContent(brief) ? "Markdown 主内容" : "结构化字段自动合成";
}

function buildMarketBriefTitle(brief: MarketBriefRecord) {
  return brief.title.trim() || `${brief.market}市场收评简报｜${formatDate(brief.brief_date)}`;
}

function trimBlankLines(lines: string[]) {
  const next = [...lines];

  while (next[0] === "") {
    next.shift();
  }

  while (next[next.length - 1] === "") {
    next.pop();
  }

  return next;
}
