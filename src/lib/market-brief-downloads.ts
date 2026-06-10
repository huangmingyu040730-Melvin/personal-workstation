import type { MarketBriefRecord } from "@/lib/content-types";
import { buildMarketBriefMarkdown } from "@/lib/market-brief-markdown";
import { marketBriefContentFields } from "@/lib/market-briefs";

export type MarketBriefDownloadExtension = "md" | "html" | "json" | "docx";

export function getMarketBriefDownloadFilename(brief: MarketBriefRecord, extension: MarketBriefDownloadExtension) {
  const marketSlug = getMarketSlug(brief.market);
  return sanitizeFilename(`${brief.brief_date}-${marketSlug}-market-brief.${extension}`);
}

export function buildMarketBriefHtml(brief: MarketBriefRecord) {
  const markdown = buildMarketBriefMarkdown(brief);
  const body = markdownToHtml(markdown);

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(brief.title)}</title>
  <style>
    :root { color-scheme: light; }
    body {
      margin: 0;
      background: #f8fafc;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif;
      line-height: 1.75;
    }
    main {
      max-width: 860px;
      margin: 32px auto;
      background: #fff;
      border: 1px solid #e2e8f0;
      padding: 42px;
    }
    h1 { margin: 0 0 18px; font-size: 30px; line-height: 1.25; }
    h2 { margin: 32px 0 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; font-size: 20px; }
    h3 { margin: 24px 0 10px; font-size: 17px; }
    p { margin: 0 0 12px; }
    ul, ol { margin: 0 0 16px; padding-left: 22px; }
    code { border-radius: 4px; background: #f1f5f9; padding: 1px 4px; }
    @media print {
      body { background: #fff; }
      main { margin: 0; max-width: none; border: 0; padding: 16mm 15mm; }
    }
  </style>
</head>
<body>
  <main>
${body}
  </main>
</body>
</html>
`;
}

export function buildMarketBriefJson(brief: MarketBriefRecord) {
  return {
    id: brief.id,
    brief_date: brief.brief_date,
    title: brief.title,
    market: brief.market,
    status: brief.status,
    generation_status: brief.generation_status,
    generated_at: brief.generated_at,
    generator_name: brief.generator_name,
    summary: brief.summary,
    markdown_content: buildMarketBriefMarkdown(brief),
    sections: Object.fromEntries(
      marketBriefContentFields.map((field) => [field.key, brief[field.key] ?? null])
    ),
    tags: brief.tags,
    data_sources: brief.data_sources,
    is_featured: brief.is_featured,
    source_snapshot: brief.source_snapshot,
    artifact_files: Array.isArray(brief.artifact_files) ? brief.artifact_files : [],
    created_at: brief.created_at,
    updated_at: brief.updated_at
  };
}

export function createAttachmentHeaders(filename: string, contentType: string) {
  return {
    "content-type": contentType,
    "content-disposition": `attachment; filename="${encodeAsciiFilename(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    "cache-control": "private, no-store"
  };
}

function markdownToHtml(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const html: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const closeList = () => {
    if (listType) {
      html.push(`    </${listType}>`);
      listType = null;
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      return;
    }

    if (trimmed.startsWith("# ")) {
      closeList();
      html.push(`    <h1>${parseInlineHtml(trimmed.slice(2))}</h1>`);
      return;
    }

    if (trimmed.startsWith("## ")) {
      closeList();
      html.push(`    <h2>${parseInlineHtml(trimmed.slice(3))}</h2>`);
      return;
    }

    if (trimmed.startsWith("### ")) {
      closeList();
      html.push(`    <h3>${parseInlineHtml(trimmed.slice(4))}</h3>`);
      return;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      if (listType !== "ul") {
        closeList();
        html.push("    <ul>");
        listType = "ul";
      }
      html.push(`      <li>${parseInlineHtml(trimmed.replace(/^[-*]\s+/, ""))}</li>`);
      return;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (listType !== "ol") {
        closeList();
        html.push("    <ol>");
        listType = "ol";
      }
      html.push(`      <li>${parseInlineHtml(trimmed.replace(/^\d+\.\s+/, ""))}</li>`);
      return;
    }

    closeList();
    html.push(`    <p>${parseInlineHtml(trimmed)}</p>`);
  });

  closeList();
  return html.join("\n");
}

function parseInlineHtml(value: string) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getMarketSlug(market: string) {
  if (market.trim().toLocaleLowerCase("zh-CN") === "a股") {
    return "a-share";
  }

  return market.trim().toLocaleLowerCase("zh-CN").replace(/\s+/g, "-") || "market";
}

function sanitizeFilename(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

function encodeAsciiFilename(filename: string) {
  return filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
}
