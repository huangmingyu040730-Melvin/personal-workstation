import {
  AlignmentType,
  BorderStyle,
  Document,
  LevelFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType
} from "docx";
import type { ProfileRecord, ResumeItemRecord, ResumeVersionWithItems } from "@/lib/content-types";
import { buildResumeTemplateModel, getExportableResumeVersionItems, type ResumeTemplateEntry, type ResumeTemplateModel, type ResumeTemplateSection } from "@/lib/resume-template-model";

type ResumeDocxInput = {
  version: ResumeVersionWithItems;
  profile: ProfileRecord;
  basicItem: ResumeItemRecord | null;
};

const bulletReference = "resume-bullets";
const font = "Microsoft YaHei";
const dateColumnWidth = 1700;
const contentColumnWidth = 7600;
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
};

export function getExportableResumeItems(version: ResumeVersionWithItems) {
  return getExportableResumeVersionItems(version);
}

export async function buildResumeDocx({ version, profile, basicItem }: ResumeDocxInput) {
  const model = buildResumeTemplateModel({ version, profile, basicItem });
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font,
            size: 20,
            color: "111827"
          },
          paragraph: {
            spacing: { after: 50, line: 235 }
          }
        }
      }
    },
    numbering: {
      config: [
        {
          reference: bulletReference,
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 260, hanging: 140 },
                  spacing: { after: 18, line: 230 }
                },
                run: { font, size: 19 }
              }
            }
          ]
        }
      ]
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: {
              top: 560,
              right: 720,
              bottom: 560,
              left: 720
            }
          }
        },
        children: [
          buildHeaderTable(model),
          ...model.sections.flatMap((section) => buildSection(section))
        ]
      }
    ]
  });

  return Packer.toBuffer(doc);
}

export function getResumeDocxFilename({ version, profile, basicItem }: ResumeDocxInput) {
  const model = buildResumeTemplateModel({ version, profile, basicItem });
  const name = sanitizeFilename(model.profile.name || version.title || "resume");
  const target = sanitizeFilename(version.target_role || version.title || "简历");
  return `${name}-${target}.docx`;
}

function buildHeaderTable(model: ResumeTemplateModel) {
  const contactItems = buildContactItems(model.profile);
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: model.profile.name || "简历", bold: true, size: 40, font, color: "111827" })]
    })
  ];

  if (model.profile.headline) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new TextRun({ text: model.profile.headline, size: 20, color: "374151", font })]
      })
    );
  }

  if (contactItems.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 35 },
        children: [new TextRun({ text: contactItems.join("  |  "), size: 19, color: "111827", font })]
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            borders: noBorders,
            children
          }),
          new TableCell({
            width: { size: 1200, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            borders: noBorders,
            children: model.profile.showPhoto ? [photoPlaceholder()] : [new Paragraph("")]
          })
        ]
      })
    ]
  });
}

function photoPlaceholder() {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    border: {
      top: { style: BorderStyle.SINGLE, size: 6, color: "9CA3AF" },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "9CA3AF" },
      left: { style: BorderStyle.SINGLE, size: 6, color: "9CA3AF" },
      right: { style: BorderStyle.SINGLE, size: 6, color: "9CA3AF" }
    },
    spacing: { before: 80, after: 80, line: 260 },
    children: [new TextRun({ text: "照片", size: 18, color: "6B7280", font })]
  });
}

function buildSection(section: ResumeTemplateSection) {
  return [
    sectionTitle(section),
    ...section.entries.flatMap((entry) => (entry.kind === "skill" ? buildSkillEntry(entry) : buildTimelineEntry(entry)))
  ];
}

function sectionTitle(section: ResumeTemplateSection) {
  return new Paragraph({
    spacing: { before: 120, after: 50, line: 230 },
    border: {
      bottom: { color: "94A3B8", space: 3, style: BorderStyle.SINGLE, size: 6 }
    },
    children: [
      new TextRun({ text: `${section.icon} `, bold: true, size: 22, color: "111827", font }),
      new TextRun({ text: section.label, bold: true, size: 24, color: "111827", font })
    ]
  });
}

function buildTimelineEntry(entry: ResumeTemplateEntry) {
  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: noBorders,
      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: dateColumnWidth, type: WidthType.DXA },
              verticalAlign: VerticalAlign.TOP,
              borders: noBorders,
              children: [dateParagraph(entry.date)]
            }),
            new TableCell({
              width: { size: contentColumnWidth, type: WidthType.DXA },
              verticalAlign: VerticalAlign.TOP,
              borders: noBorders,
              children: compactParagraphs([
                titleParagraph(entry.title),
                entry.subtitle ? subtitleParagraph(entry.subtitle) : null,
                entry.summary ? bodyParagraph(entry.summary) : null,
                ...entry.detailLines.map((line) => bodyParagraph(line)),
                ...entry.bullets.map((bullet) => bulletParagraph(bullet)),
                entry.tokens ? metaParagraph(`工具 / 方法：${entry.tokens}`) : null
              ])
            })
          ]
        })
      ]
    })
  ];
}

function buildSkillEntry(entry: ResumeTemplateEntry) {
  return [
    new Paragraph({
      spacing: { after: 35, line: 230 },
      children: [
        ...(entry.title ? [new TextRun({ text: `${entry.title}：`, bold: true, size: 20, color: "111827", font })] : []),
        new TextRun({ text: entry.subtitle || entry.summary || "未填写技能描述", size: 20, color: "374151", font })
      ]
    }),
    ...entry.bullets.map((bullet) => bulletParagraph(bullet))
  ];
}

function dateParagraph(text: string) {
  return new Paragraph({
    spacing: { after: 35, line: 230 },
    children: [new TextRun({ text, size: 19, color: "374151", font })]
  });
}

function titleParagraph(text: string) {
  return new Paragraph({
    spacing: { after: 20, line: 230 },
    children: [new TextRun({ text: text || "未命名经历", bold: true, size: 21, color: "111827", font })]
  });
}

function subtitleParagraph(text: string) {
  return new Paragraph({
    spacing: { after: 20, line: 230 },
    children: [new TextRun({ text, size: 20, color: "111827", font })]
  });
}

function bodyParagraph(text: string) {
  return new Paragraph({
    spacing: { after: 25, line: 230 },
    children: [new TextRun({ text, size: 19, color: "374151", font })]
  });
}

function metaParagraph(text: string) {
  return new Paragraph({
    spacing: { after: 25, line: 230 },
    children: [new TextRun({ text, size: 18, color: "64748B", font })]
  });
}

function bulletParagraph(text: string) {
  return new Paragraph({
    numbering: {
      reference: bulletReference,
      level: 0
    },
    spacing: { after: 18, line: 230 },
    children: [new TextRun({ text, size: 19, color: "111827", font })]
  });
}

function compactParagraphs(values: Array<Paragraph | null>) {
  const cleaned = values.filter((value): value is Paragraph => Boolean(value));
  return cleaned.length > 0 ? cleaned : [new Paragraph("")];
}

function buildContactItems(data: ResumeTemplateModel["profile"]) {
  const rows = [
    { label: "性别", value: data.gender },
    { label: "年龄", value: data.age },
    { label: "电话", value: data.phone },
    { label: "邮箱", value: data.email },
    { label: "所在地", value: data.location },
    { label: "链接", value: data.website },
    { label: "社交", value: data.socialLinks }
  ];

  return rows.filter((row): row is { label: string; value: string } => Boolean(row?.value)).map((row) => `${row.label}：${row.value}`);
}

function sanitizeFilename(value: string) {
  const sanitized = value
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);

  return sanitized || "resume";
}
