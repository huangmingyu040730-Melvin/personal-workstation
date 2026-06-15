export type AiContentAssetType = "project" | "publication" | "knowledge" | "skill";

export type AiContentCopilotResult = {
  title_suggestions: string[];
  summary_suggestions: string[];
  tag_suggestions: string[];
  public_readiness_notes: string[];
  sensitive_risks: string[];
  missing_fields: string[];
  next_steps: string[];
};

export type AiContentCopilotState = {
  status: "idle" | "success" | "error";
  message?: string;
  result?: AiContentCopilotResult;
  rawText?: string;
  modelName?: string;
};

export type AiContentSafeInput = {
  assetType: AiContentAssetType;
  assetLabel: string;
  fields: Record<string, string | string[] | number | null>;
};

export const defaultAiContentCopilotState: AiContentCopilotState = { status: "idle" };

export const aiContentAssetLabels: Record<AiContentAssetType, string> = {
  project: "Project",
  publication: "Publication",
  knowledge: "Knowledge",
  skill: "Skill"
};

export function normalizeAiContentAssetType(value: string): AiContentAssetType | null {
  return value === "project" || value === "publication" || value === "knowledge" || value === "skill" ? value : null;
}

export function createEmptyAiContentCopilotResult(): AiContentCopilotResult {
  return {
    title_suggestions: [],
    summary_suggestions: [],
    tag_suggestions: [],
    public_readiness_notes: [],
    sensitive_risks: [],
    missing_fields: [],
    next_steps: []
  };
}

export function normalizeAiContentCopilotResult(input: unknown): AiContentCopilotResult {
  const fallback = createEmptyAiContentCopilotResult();

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fallback;
  }

  const record = input as Record<string, unknown>;
  return {
    title_suggestions: readStringArray(record.title_suggestions),
    summary_suggestions: readStringArray(record.summary_suggestions),
    tag_suggestions: readStringArray(record.tag_suggestions),
    public_readiness_notes: readStringArray(record.public_readiness_notes),
    sensitive_risks: readStringArray(record.sensitive_risks),
    missing_fields: readStringArray(record.missing_fields),
    next_steps: readStringArray(record.next_steps)
  };
}

export function aiContentCopilotJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "title_suggestions",
      "summary_suggestions",
      "tag_suggestions",
      "public_readiness_notes",
      "sensitive_risks",
      "missing_fields",
      "next_steps"
    ],
    properties: {
      title_suggestions: { type: "array", items: { type: "string" } },
      summary_suggestions: { type: "array", items: { type: "string" } },
      tag_suggestions: { type: "array", items: { type: "string" } },
      public_readiness_notes: { type: "array", items: { type: "string" } },
      sensitive_risks: { type: "array", items: { type: "string" } },
      missing_fields: { type: "array", items: { type: "string" } },
      next_steps: { type: "array", items: { type: "string" } }
    }
  };
}

export function buildAiContentCopilotPrompt(input: AiContentSafeInput) {
  return [
    "你是一个只服务管理员后台的中文公开内容整理助手。",
    "请基于给定资产的安全字段，生成专业、克制、研究型的公开内容整理建议。",
    "重要约束：不得编造事实、论文、客户案例、产品数据、学历、经历、研究结论或投资业绩。",
    "不得生成业绩承诺、夸大营销话术、收益暗示或未经证实的数据结论。",
    "如果字段缺失，只能提醒管理员补充，不能替管理员创造不存在的信息。",
    "涉及客户、内部资料、未脱敏数据、产品敏感信息时，应建议保持 private。",
    "提醒管理员：AI 输出需要人工确认，AI 不会自动保存、不会自动公开内容。",
    "只输出 JSON object，不要输出 Markdown 代码围栏。",
    "",
    `资产类型：${input.assetLabel}`,
    `资产类型 key：${input.assetType}`,
    "",
    "允许使用的安全字段如下。这里不包含 Documents、Storage object、Storage path、signed URL、owner_id、raw relation rows 或私密文件 metadata：",
    JSON.stringify(truncatePromptFields(input.fields), null, 2)
  ].join("\n");
}

function truncatePromptFields(fields: AiContentSafeInput["fields"]) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, limitText(value, key === "content" ? 6000 : 2400)];
      }

      if (Array.isArray(value)) {
        return [key, value.map((item) => limitText(item, 160)).slice(0, 24)];
      }

      return [key, value];
    })
  );
}

function limitText(value: string, maxLength: number) {
  const trimmed = value.trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}\n[内容已截断，完整字段仍需管理员人工复核]` : trimmed;
}

function readStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(readString).filter(Boolean).slice(0, 8);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  return [];
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
