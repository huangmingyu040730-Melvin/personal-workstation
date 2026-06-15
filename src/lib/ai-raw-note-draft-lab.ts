import { z } from "zod";
import { knowledgeCategories, publicationTypes, skillCategories, skillPlatforms } from "@/lib/content-options";

export const aiDraftTargetTypes = ["project", "publication", "knowledge", "skill"] as const;
export type AiDraftTargetType = (typeof aiDraftTargetTypes)[number];

export const rawNoteMaxLength = 10000;

export const aiRawNoteDraftRequestSchema = z.object({
  targetType: z.enum(aiDraftTargetTypes),
  rawText: z.string().trim().min(20, "请至少输入 20 个字符的原始素材。").max(rawNoteMaxLength, `原始素材最多 ${rawNoteMaxLength} 个字符。`)
}).strict();

export type AiRawNoteDraftRequest = z.infer<typeof aiRawNoteDraftRequestSchema>;

export type RawNoteProjectDraftResult = {
  title: string;
  summary: string;
  background: string;
  research_question: string;
  methodology: string;
  tags: string[];
  milestones: string[];
  public_readiness_notes: string[];
  sensitive_risks: string[];
  next_steps: string[];
};

export type RawNotePublicationDraftResult = {
  title: string;
  publication_type_suggestion: string;
  summary: string;
  abstract: string;
  tags: string[];
  structure_suggestions: string[];
  public_readiness_notes: string[];
  sensitive_risks: string[];
  next_steps: string[];
};

export type RawNoteKnowledgeDraftResult = {
  title: string;
  category_suggestion: string;
  excerpt: string;
  content_outline: string[];
  content_draft: string;
  tags: string[];
  public_readiness_notes: string[];
  sensitive_risks: string[];
  next_steps: string[];
};

export type RawNoteSkillDraftResult = {
  name: string;
  category_suggestion: string;
  description: string;
  content: string;
  input_description: string;
  output_description: string;
  usage_guide: string;
  platforms: string[];
  workflow_steps: string[];
  public_readiness_notes: string[];
  sensitive_risks: string[];
  next_steps: string[];
};

export type AiRawNoteDraftResult =
  | RawNoteProjectDraftResult
  | RawNotePublicationDraftResult
  | RawNoteKnowledgeDraftResult
  | RawNoteSkillDraftResult;

export type AiRawNoteDraftState = {
  status: "idle" | "success" | "error";
  message?: string;
  targetType?: AiDraftTargetType;
  result?: AiRawNoteDraftResult;
  rawText?: string;
  modelName?: string;
};

export const emptyRawNoteProjectDraftResult: RawNoteProjectDraftResult = {
  title: "",
  summary: "",
  background: "",
  research_question: "",
  methodology: "",
  tags: [],
  milestones: [],
  public_readiness_notes: [],
  sensitive_risks: [],
  next_steps: []
};

export const emptyRawNotePublicationDraftResult: RawNotePublicationDraftResult = {
  title: "",
  publication_type_suggestion: "",
  summary: "",
  abstract: "",
  tags: [],
  structure_suggestions: [],
  public_readiness_notes: [],
  sensitive_risks: [],
  next_steps: []
};

export const emptyRawNoteKnowledgeDraftResult: RawNoteKnowledgeDraftResult = {
  title: "",
  category_suggestion: "",
  excerpt: "",
  content_outline: [],
  content_draft: "",
  tags: [],
  public_readiness_notes: [],
  sensitive_risks: [],
  next_steps: []
};

export const emptyRawNoteSkillDraftResult: RawNoteSkillDraftResult = {
  name: "",
  category_suggestion: "",
  description: "",
  content: "",
  input_description: "",
  output_description: "",
  usage_guide: "",
  platforms: [],
  workflow_steps: [],
  public_readiness_notes: [],
  sensitive_risks: [],
  next_steps: []
};

export function buildRawNoteStructuredDraftPrompt({ targetType, rawText }: AiRawNoteDraftRequest) {
  const targetInstruction = {
    project: [
      "目标类型：Project / 研究项目",
      "输出应像后台 Project 新建表单的初稿，聚焦研究主题、背景、问题、方法、标签和阶段计划。",
      "research_question 应写成待验证的研究问题，不要伪装成已有结论。"
    ],
    publication: [
      "目标类型：Publication / 学术成果",
      "输出应像后台 Publication 新建表单的初稿，聚焦标题、成果类型建议、summary、abstract、标签和结构。",
      `publication_type_suggestion 应优先参考这些可用类型：${publicationTypes.map((item) => item.label).join("、")}；不确定时写“建议人工选择”。`
    ],
    knowledge: [
      "目标类型：Knowledge / 知识笔记",
      "输出应像后台 Knowledge 新建表单的初稿，聚焦标题、分类、摘要、正文大纲、Markdown 正文和标签。",
      `category_suggestion 应优先参考这些分类：${knowledgeCategories.join("、")}；不确定时写“建议人工选择”。`
    ],
    skill: [
      "目标类型：Skill / 工作流",
      "输出应像后台 Skill 新建表单的初稿，聚焦名称、分类、描述、详细说明、输入输出、使用指南、平台和步骤。",
      `category_suggestion 应优先参考这些分类：${skillCategories.join("、")}；platforms 应优先从这些平台选择：${skillPlatforms.join("、")}。`
    ]
  }[targetType];

  return [
    "你是管理员后台的 AI 草稿实验室，只把管理员粘贴的原始素材转换成可复制的结构化中文草稿。",
    "",
    ...targetInstruction,
    "",
    "严格边界：",
    "- 只能基于 rawText 生成草稿，不要引入外部知识或未提供事实。",
    "- 使用中文，风格专业、克制、研究型。",
    "- 不编造事实、论文、客户案例、产品数据、学历、经历、研究结论或业绩。",
    "- 不生成收益暗示、业绩承诺或夸大营销文案。",
    "- 信息不足时，只能写“建议补充”或留空，不能伪装成已验证事实。",
    "- 如原文包含客户信息、内部资料、未脱敏数据、产品敏感信息、文件路径、secret、API key 或内部链接，应在 sensitive_risks 中提示。",
    "- AI 输出仅供管理员人工确认，不自动保存、不自动创建资产、不自动公开。",
    "- 不提及 Documents、Storage、signed URL、下载链接、owner_id、file_path、API key 或 service role key。",
    "",
    "输出要求：",
    "- 只输出 JSON object，不要使用 Markdown 代码围栏。",
    "- JSON object 必须符合以下 schema：",
    JSON.stringify(rawNoteDraftJsonSchema(targetType)),
    "",
    "rawText：",
    truncateText(rawText, rawNoteMaxLength)
  ].join("\n");
}

export function rawNoteDraftJsonSchema(targetType: AiDraftTargetType) {
  const sharedRiskProperties = {
    public_readiness_notes: { type: "array", items: { type: "string" } },
    sensitive_risks: { type: "array", items: { type: "string" } },
    next_steps: { type: "array", items: { type: "string" } }
  };

  const schemas = {
    project: {
      type: "object",
      additionalProperties: false,
      required: ["title", "summary", "background", "research_question", "methodology", "tags", "milestones", "public_readiness_notes", "sensitive_risks", "next_steps"],
      properties: {
        title: { type: "string" },
        summary: { type: "string" },
        background: { type: "string" },
        research_question: { type: "string" },
        methodology: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        milestones: { type: "array", items: { type: "string" } },
        ...sharedRiskProperties
      }
    },
    publication: {
      type: "object",
      additionalProperties: false,
      required: ["title", "publication_type_suggestion", "summary", "abstract", "tags", "structure_suggestions", "public_readiness_notes", "sensitive_risks", "next_steps"],
      properties: {
        title: { type: "string" },
        publication_type_suggestion: { type: "string" },
        summary: { type: "string" },
        abstract: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        structure_suggestions: { type: "array", items: { type: "string" } },
        ...sharedRiskProperties
      }
    },
    knowledge: {
      type: "object",
      additionalProperties: false,
      required: ["title", "category_suggestion", "excerpt", "content_outline", "content_draft", "tags", "public_readiness_notes", "sensitive_risks", "next_steps"],
      properties: {
        title: { type: "string" },
        category_suggestion: { type: "string" },
        excerpt: { type: "string" },
        content_outline: { type: "array", items: { type: "string" } },
        content_draft: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        ...sharedRiskProperties
      }
    },
    skill: {
      type: "object",
      additionalProperties: false,
      required: ["name", "category_suggestion", "description", "content", "input_description", "output_description", "usage_guide", "platforms", "workflow_steps", "public_readiness_notes", "sensitive_risks", "next_steps"],
      properties: {
        name: { type: "string" },
        category_suggestion: { type: "string" },
        description: { type: "string" },
        content: { type: "string" },
        input_description: { type: "string" },
        output_description: { type: "string" },
        usage_guide: { type: "string" },
        platforms: { type: "array", items: { type: "string" } },
        workflow_steps: { type: "array", items: { type: "string" } },
        ...sharedRiskProperties
      }
    }
  } satisfies Record<AiDraftTargetType, object>;

  return schemas[targetType];
}

export function normalizeRawNoteDraftResult(targetType: AiDraftTargetType, value: Record<string, unknown>): AiRawNoteDraftResult {
  if (targetType === "project") {
    return {
      title: readString(value.title),
      summary: readString(value.summary),
      background: readString(value.background),
      research_question: readString(value.research_question),
      methodology: readString(value.methodology),
      tags: readStringArray(value.tags, 12),
      milestones: readStringArray(value.milestones, 10),
      public_readiness_notes: readStringArray(value.public_readiness_notes, 8),
      sensitive_risks: readStringArray(value.sensitive_risks, 8),
      next_steps: readStringArray(value.next_steps, 8)
    };
  }

  if (targetType === "publication") {
    return {
      title: readString(value.title),
      publication_type_suggestion: readString(value.publication_type_suggestion),
      summary: readString(value.summary),
      abstract: readString(value.abstract),
      tags: readStringArray(value.tags, 12),
      structure_suggestions: readStringArray(value.structure_suggestions, 8),
      public_readiness_notes: readStringArray(value.public_readiness_notes, 8),
      sensitive_risks: readStringArray(value.sensitive_risks, 8),
      next_steps: readStringArray(value.next_steps, 8)
    };
  }

  if (targetType === "knowledge") {
    return {
      title: readString(value.title),
      category_suggestion: readString(value.category_suggestion),
      excerpt: readString(value.excerpt),
      content_outline: readStringArray(value.content_outline, 12),
      content_draft: readString(value.content_draft),
      tags: readStringArray(value.tags, 12),
      public_readiness_notes: readStringArray(value.public_readiness_notes, 8),
      sensitive_risks: readStringArray(value.sensitive_risks, 8),
      next_steps: readStringArray(value.next_steps, 8)
    };
  }

  return {
    name: readString(value.name),
    category_suggestion: readString(value.category_suggestion),
    description: readString(value.description),
    content: readString(value.content),
    input_description: readString(value.input_description),
    output_description: readString(value.output_description),
    usage_guide: readString(value.usage_guide),
    platforms: readStringArray(value.platforms, 8),
    workflow_steps: readStringArray(value.workflow_steps, 12),
    public_readiness_notes: readStringArray(value.public_readiness_notes, 8),
    sensitive_risks: readStringArray(value.sensitive_risks, 8),
    next_steps: readStringArray(value.next_steps, 8)
  };
}

export function containsBlockedRawNotePattern(value: string) {
  return [
    /service[_\s-]?role/i,
    /api[_\s-]?key/i,
    /secret/i,
    /signed[_\s-]?url/i,
    /storage[_\s-]?path/i,
    /storage[_\s-]?bucket/i,
    /owner_id/i,
    /file_path/i,
    /workspace-files/i,
    /\/public-files\//i,
    /sk-[A-Za-z0-9_-]{20,}/,
    /AKIA[0-9A-Z]{16}/
  ].some((pattern) => pattern.test(value));
}

function truncateText(value: string | undefined, maxLength: number) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}...` : trimmed;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readStringArray(value: unknown, maxItems: number) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean))).slice(0, maxItems);
}
