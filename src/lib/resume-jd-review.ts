import type { ResumeAiInputContext } from "@/lib/resume-ai-input";

export type ResumeJdDirection = "investment_research" | "quant_research" | "asset_management" | "financial_product" | "ai_data" | "general";

export type ResumeJdReviewResult = {
  matchSummary: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  gaps: string[];
  experienceSuggestions: Array<{
    resumeItemTitle: string;
    reason: string;
    suggestedBullets: string[];
  }>;
  rewriteSuggestions: Array<{
    original?: string;
    rewritten: string;
    reason: string;
  }>;
  risks: string[];
  nextActions: string[];
};

export type ResumeJdReviewState = {
  status: "idle" | "success" | "error";
  message?: string;
  result?: ResumeJdReviewResult;
  rawText?: string;
  jdText?: string;
  direction?: ResumeJdDirection;
  modelName?: string;
};

export const resumeJdDirectionOptions: Array<{ value: ResumeJdDirection; label: string; description: string }> = [
  { value: "investment_research", label: "投研", description: "权益研究、基金研究、行业研究、资产配置等方向。" },
  { value: "quant_research", label: "量化研究", description: "量化策略、因子研究、回测、数据分析等方向。" },
  { value: "asset_management", label: "资产管理", description: "资产管理、产品研究、组合管理、FOF/MOM 等方向。" },
  { value: "financial_product", label: "金融产品", description: "金融产品、私募产品、渠道、竞品分析等方向。" },
  { value: "ai_data", label: "AI / 数据分析", description: "AI 工作流、数据分析、自动化、开发辅助研究等方向。" },
  { value: "general", label: "通用", description: "尚未确定具体方向时使用。" }
];

export const defaultResumeJdReviewState: ResumeJdReviewState = { status: "idle" };

export function createEmptyResumeJdReviewResult(): ResumeJdReviewResult {
  return {
    matchSummary: "",
    matchedKeywords: [],
    missingKeywords: [],
    strengths: [],
    gaps: [],
    experienceSuggestions: [],
    rewriteSuggestions: [],
    risks: [],
    nextActions: []
  };
}

export function buildResumeJdReviewPrompt({
  jdText,
  direction,
  resumeContext
}: {
  jdText: string;
  direction: ResumeJdDirection;
  resumeContext: ResumeAiInputContext;
}) {
  const directionLabel = resumeJdDirectionOptions.find((option) => option.value === direction)?.label ?? "通用";

  return [
    "你是一名专业中文金融/投研/资产管理简历顾问，熟悉中国金融实习、校招和研究岗位简历语境。",
    "请基于用户当前简历版本和目标岗位 JD 做匹配分析。",
    "重要约束：不得编造事实。不得新增用户没有提供的经历、成绩、证书、公司、岗位、数据。缺少量化数据时，只能建议用户补充，不得替用户捏造。",
    "只输出结构化 JSON，不要输出 Markdown 代码围栏。",
    "",
    `岗位方向：${directionLabel}`,
    "",
    "当前简历版本内容（与页面版本内容概览同源，仅包含当前版本已选择且可见的 Profile 字段和正文素材；不包含 Documents、Storage、signed URL 或后台权限数据）：",
    JSON.stringify(resumeContext, null, 2),
    "",
    "目标岗位 JD：",
    jdText
  ].join("\n");
}

export function normalizeResumeJdReviewResult(input: unknown): ResumeJdReviewResult {
  const fallback = createEmptyResumeJdReviewResult();
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fallback;
  }

  const record = input as Record<string, unknown>;
  return {
    matchSummary: readString(record.matchSummary),
    matchedKeywords: readStringArray(record.matchedKeywords),
    missingKeywords: readStringArray(record.missingKeywords),
    strengths: readStringArray(record.strengths),
    gaps: readStringArray(record.gaps),
    experienceSuggestions: readSuggestionArray(record.experienceSuggestions),
    rewriteSuggestions: readRewriteArray(record.rewriteSuggestions),
    risks: readStringArray(record.risks),
    nextActions: readStringArray(record.nextActions)
  };
}

export function resumeJdReviewJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "matchSummary",
      "matchedKeywords",
      "missingKeywords",
      "strengths",
      "gaps",
      "experienceSuggestions",
      "rewriteSuggestions",
      "risks",
      "nextActions"
    ],
    properties: {
      matchSummary: { type: "string" },
      matchedKeywords: { type: "array", items: { type: "string" } },
      missingKeywords: { type: "array", items: { type: "string" } },
      strengths: { type: "array", items: { type: "string" } },
      gaps: { type: "array", items: { type: "string" } },
      experienceSuggestions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["resumeItemTitle", "reason", "suggestedBullets"],
          properties: {
            resumeItemTitle: { type: "string" },
            reason: { type: "string" },
            suggestedBullets: { type: "array", items: { type: "string" } }
          }
        }
      },
      rewriteSuggestions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["original", "rewritten", "reason"],
          properties: {
            original: { type: "string" },
            rewritten: { type: "string" },
            reason: { type: "string" }
          }
        }
      },
      risks: { type: "array", items: { type: "string" } },
      nextActions: { type: "array", items: { type: "string" } }
    }
  };
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map(readString).filter(Boolean);
}

function readSuggestionArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }
      const record = item as Record<string, unknown>;
      return {
        resumeItemTitle: readString(record.resumeItemTitle),
        reason: readString(record.reason),
        suggestedBullets: readStringArray(record.suggestedBullets)
      };
    })
    .filter((item): item is { resumeItemTitle: string; reason: string; suggestedBullets: string[] } => Boolean(item && (item.resumeItemTitle || item.reason || item.suggestedBullets.length > 0)));
}

function readRewriteArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }
      const record = item as Record<string, unknown>;
      const original = readString(record.original);
      return {
        ...(original ? { original } : {}),
        rewritten: readString(record.rewritten),
        reason: readString(record.reason)
      };
    })
    .filter((item): item is { original?: string; rewritten: string; reason: string } => Boolean(item && item.rewritten));
}
