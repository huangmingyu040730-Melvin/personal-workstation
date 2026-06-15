import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional();
const optionalList = z.array(z.string().trim().min(1).max(80)).max(30).optional();

export const projectAiDraftRequestSchema = z.object({
  assetType: z.literal("project"),
  draft: z.object({
    title: optionalText(160),
    summary: optionalText(1200),
    background: optionalText(4000),
    research_question: optionalText(3000),
    methodology: optionalText(4000),
    tags: optionalList,
    status: z.enum(["planning", "in_progress", "completed", "archived"]).optional(),
    visibility: z.enum(["public", "private", "unlisted"]).optional(),
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

export function buildProjectAiDraftPrompt(draft: ProjectAiDraft) {
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
