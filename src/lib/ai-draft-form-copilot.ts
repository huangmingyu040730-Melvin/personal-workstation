import { z } from "zod";
import { knowledgeCategories, publicationTypes, skillCategories, skillPlatforms, skillStatuses } from "@/lib/content-options";

const optionalText = (max: number) => z.string().trim().max(max).optional();
const optionalList = z.array(z.string().trim().min(1).max(80)).max(30).optional();
const publicationTypeValues = publicationTypes.map((item) => item.value) as [string, ...string[]];
const skillStatusValues = skillStatuses.map((item) => item.value) as [string, ...string[]];
const visibilityValues = ["public", "private", "unlisted"] as const;
export const aiDraftModes = ["complete_missing", "improve_existing", "public_safety_check"] as const;
export type AiDraftMode = (typeof aiDraftModes)[number];
export const defaultAiDraftMode = "complete_missing" satisfies AiDraftMode;
export const aiDraftModeSchema = z.enum(aiDraftModes);

export const projectAiDraftRequestSchema = z.object({
  assetType: z.literal("project"),
  mode: aiDraftModeSchema.default(defaultAiDraftMode),
  draft: z.object({
    title: optionalText(160),
    summary: optionalText(1200),
    background: optionalText(4000),
    research_question: optionalText(3000),
    methodology: optionalText(4000),
    tags: optionalList,
    status: z.enum(["planning", "in_progress", "completed", "archived"]).optional(),
    visibility: z.enum(visibilityValues).optional(),
    milestones: optionalList,
    progress: optionalText(20),
    start_date: optionalText(40),
    end_date: optionalText(40)
  }).strict()
}).strict();

export type ProjectAiDraftRequest = z.infer<typeof projectAiDraftRequestSchema>;
export type ProjectAiDraft = ProjectAiDraftRequest["draft"];

export type ProjectAiDraftResult = {
  summary_draft: string;
  background_draft: string;
  research_question_draft: string;
  methodology_draft: string;
  tag_suggestions: string[];
  research_flow_steps: string[];
  milestone_suggestions: string[];
  public_readiness_notes: string[];
  sensitive_risks: string[];
  next_steps: string[];
};

export type ProjectAiDraftState = {
  status: "idle" | "success" | "error";
  message?: string;
  result?: ProjectAiDraftResult;
  rawText?: string;
  modelName?: string;
};

export const emptyProjectAiDraftResult: ProjectAiDraftResult = {
  summary_draft: "",
  background_draft: "",
  research_question_draft: "",
  methodology_draft: "",
  tag_suggestions: [],
  research_flow_steps: [],
  milestone_suggestions: [],
  public_readiness_notes: [],
  sensitive_risks: [],
  next_steps: []
};

export const publicationAiDraftRequestSchema = z.object({
  assetType: z.literal("publication"),
  mode: aiDraftModeSchema.default(defaultAiDraftMode),
  draft: z.object({
    title: optionalText(160),
    publication_type: z.enum(publicationTypeValues).optional(),
    summary: optionalText(1200),
    abstract: optionalText(5000),
    tags: optionalList,
    visibility: z.enum(visibilityValues).optional(),
    published_on: optionalText(40),
    project_id: optionalText(80)
  }).strict()
}).strict();

export type PublicationAiDraftRequest = z.infer<typeof publicationAiDraftRequestSchema>;
export type PublicationAiDraft = PublicationAiDraftRequest["draft"];

export type PublicationAiDraftResult = {
  title_suggestions: string[];
  summary_draft: string;
  abstract_draft: string;
  tag_suggestions: string[];
  publication_positioning: string[];
  structure_suggestions: string[];
  public_readiness_notes: string[];
  sensitive_risks: string[];
  next_steps: string[];
};

export type PublicationAiDraftState = {
  status: "idle" | "success" | "error";
  message?: string;
  result?: PublicationAiDraftResult;
  rawText?: string;
  modelName?: string;
};

export const emptyPublicationAiDraftResult: PublicationAiDraftResult = {
  title_suggestions: [],
  summary_draft: "",
  abstract_draft: "",
  tag_suggestions: [],
  publication_positioning: [],
  structure_suggestions: [],
  public_readiness_notes: [],
  sensitive_risks: [],
  next_steps: []
};

export const knowledgeAiDraftRequestSchema = z.object({
  assetType: z.literal("knowledge"),
  mode: aiDraftModeSchema.default(defaultAiDraftMode),
  draft: z.object({
    title: optionalText(140),
    category: optionalText(80),
    excerpt: optionalText(1200),
    content: optionalText(6000),
    tags: optionalList,
    visibility: z.enum(visibilityValues).optional(),
    project_id: optionalText(80)
  }).strict()
}).strict();

export type KnowledgeAiDraftRequest = z.infer<typeof knowledgeAiDraftRequestSchema>;
export type KnowledgeAiDraft = KnowledgeAiDraftRequest["draft"];

export type KnowledgeAiDraftResult = {
  title_suggestions: string[];
  excerpt_draft: string;
  content_outline: string[];
  content_draft: string;
  tag_suggestions: string[];
  category_suggestions: string[];
  public_readiness_notes: string[];
  sensitive_risks: string[];
  next_steps: string[];
};

export type KnowledgeAiDraftState = {
  status: "idle" | "success" | "error";
  message?: string;
  result?: KnowledgeAiDraftResult;
  rawText?: string;
  modelName?: string;
};

export const emptyKnowledgeAiDraftResult: KnowledgeAiDraftResult = {
  title_suggestions: [],
  excerpt_draft: "",
  content_outline: [],
  content_draft: "",
  tag_suggestions: [],
  category_suggestions: [],
  public_readiness_notes: [],
  sensitive_risks: [],
  next_steps: []
};

export const skillAiDraftRequestSchema = z.object({
  assetType: z.literal("skill"),
  mode: aiDraftModeSchema.default(defaultAiDraftMode),
  draft: z.object({
    name: optionalText(120),
    description: optionalText(1200),
    category: optionalText(80),
    content: optionalText(6000),
    input_description: optionalText(3000),
    output_description: optionalText(3000),
    usage_guide: optionalText(5000),
    platforms: optionalList,
    current_version: optionalText(40),
    visibility: z.enum(visibilityValues).optional(),
    status: z.enum(skillStatusValues).optional()
  }).strict()
}).strict();

export type SkillAiDraftRequest = z.infer<typeof skillAiDraftRequestSchema>;
export type SkillAiDraft = SkillAiDraftRequest["draft"];

export type SkillAiDraftResult = {
  name_suggestions: string[];
  description_draft: string;
  content_draft: string;
  input_description_draft: string;
  output_description_draft: string;
  usage_guide_draft: string;
  platform_suggestions: string[];
  current_version_suggestion: string;
  workflow_steps: string[];
  public_readiness_notes: string[];
  sensitive_risks: string[];
  next_steps: string[];
};

export type SkillAiDraftState = {
  status: "idle" | "success" | "error";
  message?: string;
  result?: SkillAiDraftResult;
  rawText?: string;
  modelName?: string;
};

export const emptySkillAiDraftResult: SkillAiDraftResult = {
  name_suggestions: [],
  description_draft: "",
  content_draft: "",
  input_description_draft: "",
  output_description_draft: "",
  usage_guide_draft: "",
  platform_suggestions: [],
  current_version_suggestion: "",
  workflow_steps: [],
  public_readiness_notes: [],
  sensitive_risks: [],
  next_steps: []
};

export function projectAiDraftJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "summary_draft",
      "background_draft",
      "research_question_draft",
      "methodology_draft",
      "tag_suggestions",
      "research_flow_steps",
      "milestone_suggestions",
      "public_readiness_notes",
      "sensitive_risks",
      "next_steps"
    ],
    properties: {
      summary_draft: { type: "string" },
      background_draft: { type: "string" },
      research_question_draft: { type: "string" },
      methodology_draft: { type: "string" },
      tag_suggestions: { type: "array", items: { type: "string" } },
      research_flow_steps: { type: "array", items: { type: "string" } },
      milestone_suggestions: { type: "array", items: { type: "string" } },
      public_readiness_notes: { type: "array", items: { type: "string" } },
      sensitive_risks: { type: "array", items: { type: "string" } },
      next_steps: { type: "array", items: { type: "string" } }
    }
  };
}

export function publicationAiDraftJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "title_suggestions",
      "summary_draft",
      "abstract_draft",
      "tag_suggestions",
      "publication_positioning",
      "structure_suggestions",
      "public_readiness_notes",
      "sensitive_risks",
      "next_steps"
    ],
    properties: {
      title_suggestions: { type: "array", items: { type: "string" } },
      summary_draft: { type: "string" },
      abstract_draft: { type: "string" },
      tag_suggestions: { type: "array", items: { type: "string" } },
      publication_positioning: { type: "array", items: { type: "string" } },
      structure_suggestions: { type: "array", items: { type: "string" } },
      public_readiness_notes: { type: "array", items: { type: "string" } },
      sensitive_risks: { type: "array", items: { type: "string" } },
      next_steps: { type: "array", items: { type: "string" } }
    }
  };
}

export function knowledgeAiDraftJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "title_suggestions",
      "excerpt_draft",
      "content_outline",
      "content_draft",
      "tag_suggestions",
      "category_suggestions",
      "public_readiness_notes",
      "sensitive_risks",
      "next_steps"
    ],
    properties: {
      title_suggestions: { type: "array", items: { type: "string" } },
      excerpt_draft: { type: "string" },
      content_outline: { type: "array", items: { type: "string" } },
      content_draft: { type: "string" },
      tag_suggestions: { type: "array", items: { type: "string" } },
      category_suggestions: { type: "array", items: { type: "string" } },
      public_readiness_notes: { type: "array", items: { type: "string" } },
      sensitive_risks: { type: "array", items: { type: "string" } },
      next_steps: { type: "array", items: { type: "string" } }
    }
  };
}

export function skillAiDraftJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "name_suggestions",
      "description_draft",
      "content_draft",
      "input_description_draft",
      "output_description_draft",
      "usage_guide_draft",
      "platform_suggestions",
      "current_version_suggestion",
      "workflow_steps",
      "public_readiness_notes",
      "sensitive_risks",
      "next_steps"
    ],
    properties: {
      name_suggestions: { type: "array", items: { type: "string" } },
      description_draft: { type: "string" },
      content_draft: { type: "string" },
      input_description_draft: { type: "string" },
      output_description_draft: { type: "string" },
      usage_guide_draft: { type: "string" },
      platform_suggestions: { type: "array", items: { type: "string" } },
      current_version_suggestion: { type: "string" },
      workflow_steps: { type: "array", items: { type: "string" } },
      public_readiness_notes: { type: "array", items: { type: "string" } },
      sensitive_risks: { type: "array", items: { type: "string" } },
      next_steps: { type: "array", items: { type: "string" } }
    }
  };
}

export function buildProjectAiDraftPrompt(draft: ProjectAiDraft, mode: AiDraftMode = defaultAiDraftMode) {
  const safeDraft = {
    title: truncateText(draft.title, 160),
    summary: truncateText(draft.summary, 900),
    background: truncateText(draft.background, 1800),
    research_question: truncateText(draft.research_question, 1400),
    methodology: truncateText(draft.methodology, 1800),
    tags: trimList(draft.tags, 20),
    status: draft.status ?? "",
    visibility: draft.visibility ?? "",
    milestones: trimList(draft.milestones, 20),
    progress: truncateText(draft.progress, 20),
    start_date: truncateText(draft.start_date, 40),
    end_date: truncateText(draft.end_date, 40)
  };

  return [
    "你是管理员后台的 Project 表单草稿助手，只根据管理员当前表单草稿生成可人工采纳的中文建议。",
    "",
    "任务：",
    "- 根据已填写字段补全未填写字段。",
    "- 优化已有字段表达，使其专业、克制、研究型。",
    "- 生成标签建议、研究流程 / 实验流程、阶段计划、公开准备度提示、敏感信息风险和下一步建议。",
    "",
    modePromptSection(mode),
    "",
    "严格边界：",
    "- 不编造事实、论文、客户案例、产品数据、学历、经历或研究结论。",
    "- 不能生成业绩承诺、收益暗示或夸大营销文案。",
    "- 如果信息不足，只能生成建议草稿或待补充方向，不能伪装成已验证事实。",
    "- 涉及客户、内部资料、未脱敏数据、产品敏感信息时，应建议保持 private。",
    "- AI 输出仅供管理员人工确认，不自动保存、不自动公开。",
    "- 不提及 Documents、Storage、signed URL、下载链接、API key 或 service role key。",
    "",
    "输出要求：",
    "- 只输出 JSON object，不要使用 Markdown 代码围栏。",
    "- JSON object 必须符合以下 schema：",
    JSON.stringify(projectAiDraftJsonSchema()),
    "",
    "当前表单草稿：",
    JSON.stringify(safeDraft, null, 2)
  ].join("\n");
}

export function buildPublicationAiDraftPrompt(draft: PublicationAiDraft, mode: AiDraftMode = defaultAiDraftMode) {
  const safeDraft = {
    title: truncateText(draft.title, 160),
    publication_type: draft.publication_type ?? "",
    summary: truncateText(draft.summary, 900),
    abstract: truncateText(draft.abstract, 2200),
    tags: trimList(draft.tags, 20),
    visibility: draft.visibility ?? "",
    published_on: truncateText(draft.published_on, 40),
    project_id: truncateText(draft.project_id, 80)
  };

  return [
    "你是管理员后台的 Publication 表单草稿助手，只根据管理员当前成果表单草稿生成可人工采纳的中文建议。",
    "",
    "任务：",
    "- 根据成果标题、类型、摘要和 abstract 草稿，补全成果简介、正式 abstract、标签和公开站点表述。",
    "- 生成成果定位、正文 / 摘要结构建议、公开准备度提示、敏感信息风险和下一步建议。",
    "- title_suggestions 只能是标题优化建议，不得编造论文、期刊、会议、客户案例或发布渠道。",
    "",
    modePromptSection(mode),
    "",
    commonPromptBoundary(),
    "- 特别关注业绩暗示、未验证数据、产品敏感信息、客户资料、内部资料和未脱敏内容。",
    "- 不提及 Documents、Storage、signed URL、下载链接、file_path、cover_url、API key 或 service role key。",
    "",
    "输出要求：",
    "- 只输出 JSON object，不要使用 Markdown 代码围栏。",
    "- JSON object 必须符合以下 schema：",
    JSON.stringify(publicationAiDraftJsonSchema()),
    "",
    "当前表单草稿：",
    JSON.stringify(safeDraft, null, 2)
  ].join("\n");
}

export function buildKnowledgeAiDraftPrompt(draft: KnowledgeAiDraft, mode: AiDraftMode = defaultAiDraftMode) {
  const safeDraft = {
    title: truncateText(draft.title, 140),
    category: truncateText(draft.category, 80),
    excerpt: truncateText(draft.excerpt, 900),
    content: truncateText(draft.content, 2800),
    tags: trimList(draft.tags, 20),
    visibility: draft.visibility ?? "",
    project_id: truncateText(draft.project_id, 80),
    allowed_categories: knowledgeCategories
  };

  return [
    "你是管理员后台的 Knowledge 表单草稿助手，只根据管理员当前知识笔记表单草稿生成可人工采纳的中文建议。",
    "",
    "任务：",
    "- 根据标题、分类、摘要和正文草稿，补全知识笔记摘要、正文大纲、可选 Markdown 正文草稿、标签和分类建议。",
    "- content_draft 必须是建议稿，不得伪装成已验证事实结论。",
    "- category_suggestions 应优先从 allowed_categories 中选择；如确需新分类，只能作为人工判断建议。",
    "",
    modePromptSection(mode),
    "",
    commonPromptBoundary(),
    "- 特别关注内部资料、客户资料、未脱敏内容、未验证金融数据和未经来源确认的结论。",
    "- 不提及 Documents、Storage、signed URL、下载链接、文件正文、API key 或 service role key。",
    "",
    "输出要求：",
    "- 只输出 JSON object，不要使用 Markdown 代码围栏。",
    "- JSON object 必须符合以下 schema：",
    JSON.stringify(knowledgeAiDraftJsonSchema()),
    "",
    "当前表单草稿：",
    JSON.stringify(safeDraft, null, 2)
  ].join("\n");
}

export function buildSkillAiDraftPrompt(draft: SkillAiDraft, mode: AiDraftMode = defaultAiDraftMode) {
  const safeDraft = {
    name: truncateText(draft.name, 120),
    description: truncateText(draft.description, 900),
    category: truncateText(draft.category, 80),
    content: truncateText(draft.content, 2600),
    input_description: truncateText(draft.input_description, 1200),
    output_description: truncateText(draft.output_description, 1200),
    usage_guide: truncateText(draft.usage_guide, 2200),
    platforms: trimList(draft.platforms, 12),
    current_version: truncateText(draft.current_version, 40),
    visibility: draft.visibility ?? "",
    status: draft.status ?? "",
    allowed_categories: skillCategories,
    allowed_platforms: skillPlatforms
  };

  return [
    "你是管理员后台的 Skill 表单草稿助手，只根据管理员当前 Skill 表单草稿生成可人工采纳的中文建议。",
    "",
    "任务：",
    "- 根据名称、描述、分类、平台、输入 / 输出说明和使用指南草稿，补全 Skill 简介、详细说明、输入说明、输出说明和使用指南。",
    "- 生成平台建议、工作流步骤、公开准备度提示、敏感信息风险和下一步建议。",
    "- platform_suggestions 只能从 allowed_platforms 中选择，不要编造不可用平台。",
    "- current_version_suggestion 只能在适合人工确认时给出保守版本号；信息不足时返回空字符串。",
    "",
    modePromptSection(mode),
    "",
    commonPromptBoundary(),
    "- 特别关注 secret、API key、内部流程、客户资料、不可公开提示词、上传代码和 Skill package 风险。",
    "- 不提及 Documents、Storage、signed URL、下载链接、上传代码内容、zip 内容、API key 或 service role key。",
    "",
    "输出要求：",
    "- 只输出 JSON object，不要使用 Markdown 代码围栏。",
    "- JSON object 必须符合以下 schema：",
    JSON.stringify(skillAiDraftJsonSchema()),
    "",
    "当前表单草稿：",
    JSON.stringify(safeDraft, null, 2)
  ].join("\n");
}

export function normalizeProjectAiDraftResult(value: Record<string, unknown>): ProjectAiDraftResult {
  return {
    summary_draft: readString(value.summary_draft),
    background_draft: readString(value.background_draft),
    research_question_draft: readString(value.research_question_draft),
    methodology_draft: readString(value.methodology_draft),
    tag_suggestions: readStringArray(value.tag_suggestions, 12),
    research_flow_steps: readStringArray(value.research_flow_steps, 10),
    milestone_suggestions: readStringArray(value.milestone_suggestions, 10),
    public_readiness_notes: readStringArray(value.public_readiness_notes, 8),
    sensitive_risks: readStringArray(value.sensitive_risks, 8),
    next_steps: readStringArray(value.next_steps, 8)
  };
}

export function normalizePublicationAiDraftResult(value: Record<string, unknown>): PublicationAiDraftResult {
  return {
    title_suggestions: readStringArray(value.title_suggestions, 6),
    summary_draft: readString(value.summary_draft),
    abstract_draft: readString(value.abstract_draft),
    tag_suggestions: readStringArray(value.tag_suggestions, 12),
    publication_positioning: readStringArray(value.publication_positioning, 8),
    structure_suggestions: readStringArray(value.structure_suggestions, 8),
    public_readiness_notes: readStringArray(value.public_readiness_notes, 8),
    sensitive_risks: readStringArray(value.sensitive_risks, 8),
    next_steps: readStringArray(value.next_steps, 8)
  };
}

export function normalizeKnowledgeAiDraftResult(value: Record<string, unknown>): KnowledgeAiDraftResult {
  return {
    title_suggestions: readStringArray(value.title_suggestions, 6),
    excerpt_draft: readString(value.excerpt_draft),
    content_outline: readStringArray(value.content_outline, 12),
    content_draft: readString(value.content_draft),
    tag_suggestions: readStringArray(value.tag_suggestions, 12),
    category_suggestions: readStringArray(value.category_suggestions, 8),
    public_readiness_notes: readStringArray(value.public_readiness_notes, 8),
    sensitive_risks: readStringArray(value.sensitive_risks, 8),
    next_steps: readStringArray(value.next_steps, 8)
  };
}

export function normalizeSkillAiDraftResult(value: Record<string, unknown>): SkillAiDraftResult {
  return {
    name_suggestions: readStringArray(value.name_suggestions, 6),
    description_draft: readString(value.description_draft),
    content_draft: readString(value.content_draft),
    input_description_draft: readString(value.input_description_draft),
    output_description_draft: readString(value.output_description_draft),
    usage_guide_draft: readString(value.usage_guide_draft),
    platform_suggestions: readStringArray(value.platform_suggestions, 8),
    current_version_suggestion: readString(value.current_version_suggestion),
    workflow_steps: readStringArray(value.workflow_steps, 12),
    public_readiness_notes: readStringArray(value.public_readiness_notes, 8),
    sensitive_risks: readStringArray(value.sensitive_risks, 8),
    next_steps: readStringArray(value.next_steps, 8)
  };
}

function commonPromptBoundary() {
  return [
    "严格边界：",
    "- 使用中文，风格专业、克制、研究型。",
    "- 不编造事实、论文、客户案例、产品数据、学历、经历、研究结论或可量化成果。",
    "- 不能生成业绩承诺、收益暗示或夸大营销文案。",
    "- 如果信息不足，只能生成建议草稿或待补充方向，不能伪装成已验证事实。",
    "- 涉及客户、内部资料、未脱敏数据、产品敏感信息时，应建议保持 private。",
    "- AI 输出仅供管理员人工确认，不自动保存、不自动公开。"
  ].join("\n");
}

function modePromptSection(mode: AiDraftMode) {
  const modeLabel = {
    complete_missing: "补全空字段",
    improve_existing: "优化已有内容",
    public_safety_check: "公开风险检查"
  }[mode];

  const modeRules = {
    complete_missing: [
      "- 优先补充当前缺失字段，适合新建或草稿不完整时使用。",
      "- 已经写得比较完整的字段只做轻微优化，不要大幅重写。",
      "- 信息不足时只给待补充方向，不要编造事实或把假设写成结论。"
    ],
    improve_existing: [
      "- 保留管理员已写内容的原意，重点优化语言、结构、清晰度和公开表达。",
      "- 不新增未经管理员提供的事实、结论、数据、案例、论文或经历。",
      "- 不要把简短内容扩写成夸大营销稿；缺失字段可以留空或放入 next_steps。"
    ],
    public_safety_check: [
      "- 优先输出 public_readiness_notes、sensitive_risks 和 next_steps。",
      "- 不需要生成大量正文草稿；非风险检查相关的草稿字段可以返回空字符串或空数组。",
      "- 检查客户信息、内部资料、未脱敏数据、产品敏感信息、业绩承诺、收益暗示、未验证金融数据、文件路径、secret、API key 和内部链接。",
      "- 如有风险，明确建议保持 private 或继续脱敏，最终仍由管理员判断。"
    ]
  }[mode];

  return [
    "生成模式：",
    `- mode: ${mode}`,
    `- 中文名称：${modeLabel}`,
    ...modeRules
  ].join("\n");
}

function truncateText(value: string | undefined, maxLength: number) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}...` : trimmed;
}

function trimList(value: string[] | undefined, maxItems: number) {
  return Array.from(new Set((value ?? []).map((item) => item.trim()).filter(Boolean))).slice(0, maxItems);
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
