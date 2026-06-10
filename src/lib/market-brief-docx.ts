import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { MarketBriefRecord } from "@/lib/content-types";
import { formatDate } from "@/lib/format";
import { buildMarketBriefMarkdown } from "@/lib/market-brief-markdown";

export async function buildMarketBriefDocx(brief: MarketBriefRecord) {
  const markdown = buildMarketBriefMarkdown(brief);
  const children = [
    new Paragraph({
      children: [new TextRun({ text: brief.title, bold: true, size: 32 })],
      spacing: { after: 180 }
    }),
    new Paragraph({
      children: [
        new TextRun(`日期：${formatDate(brief.brief_date)}`),
        new TextRun("    "),
        new TextRun(`市场：${brief.market}`),
        new TextRun("    "),
        new TextRun(`状态：${brief.status}`)
      ],
      spacing: { after: 220 }
    }),
    ...markdownToDocxParagraphs(markdown, brief.title)
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children
      }
    ]
  });

  return Packer.toBuffer(doc);
}

function markdownToDocxParagraphs(markdown: string, title: string) {
  let skippedDuplicateTitle = false;

  return markdown.split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return [new Paragraph({ spacing: { after: 80 } })];
    }

    if (trimmed.startsWith("# ")) {
      if (!skippedDuplicateTitle && trimmed.slice(2).trim() === title.trim()) {
        skippedDuplicateTitle = true;
        return [];
      }

      return [
        new Paragraph({
          text: trimmed.slice(2),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 120, after: 160 }
        })
      ];
    }

    if (trimmed.startsWith("## ")) {
      return [
        new Paragraph({
          text: trimmed.slice(3),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 }
        })
      ];
    }

    if (trimmed.startsWith("### ")) {
      return [
        new Paragraph({
          text: trimmed.slice(4),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 }
        })
      ];
    }

    if (/^[-*]\s+/.test(trimmed)) {
      return [
        new Paragraph({
          text: trimmed.replace(/^[-*]\s+/, ""),
          bullet: { level: 0 },
          spacing: { after: 80 }
        })
      ];
    }

    return [
      new Paragraph({
        children: [new TextRun(trimmed)],
        spacing: { after: 120 }
      })
    ];
  });
}
