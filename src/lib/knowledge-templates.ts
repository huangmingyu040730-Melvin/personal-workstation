import { formatDateInputValue } from "@/lib/format";

export type KnowledgeTemplateKey = "course" | "quant" | "project";

export type KnowledgeFormDefaults = {
  title: string;
  slug: string;
  category: string;
  project_id: string;
  excerpt: string;
  content: string;
  tags: string[];
  visibility: "private";
};

export const knowledgeTemplateOptions: Array<{
  key: KnowledgeTemplateKey;
  label: string;
  description: string;
}> = [
  {
    key: "project",
    label: "项目阶段结论",
    description: "记录本阶段完成内容、证据、决定、问题与下一步。"
  },
  {
    key: "course",
    label: "课程学习笔记",
    description: "沉淀概念、公式、例题、疑问和复习安排。"
  },
  {
    key: "quant",
    label: "量化研究记录",
    description: "覆盖假设、数据、成本约束、偏差检查、结果与失败原因。"
  }
];

export function parseKnowledgeTemplateKey(value: string | string[] | undefined): KnowledgeTemplateKey | null {
  const normalized = Array.isArray(value) ? value[0] : value;
  return knowledgeTemplateOptions.some((option) => option.key === normalized)
    ? normalized as KnowledgeTemplateKey
    : null;
}

function timestampSlugSuffix(now: Date) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(now);

  return parts.replace(/\D/g, "");
}

export function buildKnowledgeTemplateDefaults(
  template: KnowledgeTemplateKey,
  project: { id: string; title: string } | null,
  now = new Date()
): KnowledgeFormDefaults {
  const date = formatDateInputValue(now);
  const timestamp = timestampSlugSuffix(now);
  const projectLabel = project?.title ?? "当前项目";
  const projectSlugSegment = project?.id.slice(0, 8) ?? "general";

  if (template === "course") {
    return {
      title: `课程学习记录｜${date}`,
      slug: `course-note-${timestamp}`,
      category: "学术研究方法",
      project_id: project?.id ?? "",
      excerpt: `整理 ${date} 的课程核心概念、方法与待复习内容。`,
      content: `# 本次学习主题

## 核心概念
- 

## 公式与方法
- 

## 例题或应用
- 

## 尚未解决的问题
- 

## 下次复习
- `,
      tags: ["课程笔记", "学习复盘"],
      visibility: "private"
    };
  }

  if (template === "quant") {
    return {
      title: `量化研究记录｜${date}`,
      slug: `quant-research-${timestamp}`,
      category: "量化与数据分析",
      project_id: project?.id ?? "",
      excerpt: `记录 ${date} 的量化研究假设、数据方法、偏差检查与结果。`,
      content: `# 研究假设
- 

## 数据与样本区间
- 

## 方法与实现
- 

## 交易成本与约束
- 

## 偏差检查
- 前视偏差：
- 幸存者偏差：
- 过拟合：

## 结果与证据
- 

## 失败原因
- 

## 下一步
- `,
      tags: ["量化研究", "研究复盘"],
      visibility: "private"
    };
  }

  return {
    title: `${projectLabel}｜阶段结论｜${date}`,
    slug: `project-${projectSlugSegment}-checkpoint-${timestamp}`,
    category: "学术研究方法",
    project_id: project?.id ?? "",
    excerpt: `记录 ${projectLabel} 在 ${date} 的阶段进展、关键证据和下一步。`,
    content: `# 阶段概览
- 

## 本阶段完成
- 

## 关键证据
- 

## 重要决定
- 

## 当前问题
- 

## 下一步
- `,
    tags: ["阶段记录", "项目复盘"],
    visibility: "private"
  };
}
