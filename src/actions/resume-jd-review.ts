"use server";

import { getAdminClient } from "@/lib/auth/admin";
import {
  buildResumeJdReviewContext,
  buildResumeJdReviewPrompt,
  defaultResumeJdReviewState,
  normalizeResumeJdReviewResult,
  resumeJdDirectionOptions,
  resumeJdReviewJsonSchema,
  type ResumeJdDirection,
  type ResumeJdReviewState
} from "@/lib/resume-jd-review";

const openAiResponsesUrl = "https://api.openai.com/v1/responses";
const defaultModel = "gpt-4.1-mini";

export async function analyzeResumeJdAction(versionId: string, previousState: ResumeJdReviewState = defaultResumeJdReviewState, formData: FormData): Promise<ResumeJdReviewState> {
  void previousState;
  const jdText = readFormText(formData, "jd_text");
  const direction = normalizeDirection(readFormText(formData, "direction"));
  const modelName = process.env.OPENAI_MODEL || defaultModel;

  if (jdText.length < 80) {
    return {
      status: "error",
      message: "请粘贴更完整的目标岗位 JD，至少包含岗位职责或任职要求。"
    };
  }

  if (jdText.length > 12000) {
    return {
      status: "error",
      message: "JD 内容过长，请保留岗位职责、任职要求和关键词，控制在 12000 字以内。"
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      status: "error",
      message: "AI JD 优化尚未配置，请在环境变量中设置 OPENAI_API_KEY。"
    };
  }

  const { supabase, isAdmin, error } = await getAdminClient();
  if (!supabase || !isAdmin) {
    return {
      status: "error",
      message: error ?? "当前账号没有管理员权限。"
    };
  }

  const { data: version, error: versionError } = await supabase
    .from("resume_versions")
    .select("*, resume_version_items(*, resume_items(*))")
    .eq("id", versionId)
    .maybeSingle();

  if (versionError || !version) {
    return {
      status: "error",
      message: versionError?.message || "未找到当前简历版本。"
    };
  }

  const resumeContext = buildResumeJdReviewContext(version, version.resume_version_items ?? []);
  const prompt = buildResumeJdReviewPrompt({ jdText, direction, resumeContext });

  try {
    const response = await fetch(openAiResponsesUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || defaultModel,
        input: [
          {
            role: "system",
            content: "你只做中文简历匹配分析。输出必须是符合 JSON schema 的对象，不要使用 Markdown 代码围栏。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "resume_jd_review",
            schema: resumeJdReviewJsonSchema(),
            strict: true
          }
        }
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      console.error("OpenAI JD review failed", {
        status: response.status,
        code: payload?.error?.code,
        message: payload?.error?.message
      });
      return {
        status: "error",
        message: "AI 分析请求失败，请稍后重试或检查 OPENAI_API_KEY / OPENAI_MODEL 配置。"
      };
    }

    const outputText = extractOutputText(payload);
    if (!outputText) {
      return {
        status: "error",
        message: "AI 返回内容为空，请稍后重试。"
      };
    }

    try {
      const parsed = JSON.parse(outputText);
      return {
        status: "success",
        message: "AI JD 分析完成。以下建议不会自动写回简历，请手动复制和复核。",
        result: normalizeResumeJdReviewResult(parsed),
        jdText,
        direction,
        modelName
      };
    } catch {
      return {
        status: "success",
        message: "AI 返回了文本建议，但不是严格 JSON。请参考下方原始建议并人工复核。",
        rawText: outputText,
        jdText,
        direction,
        modelName
      };
    }
  } catch (requestError) {
    console.error("OpenAI JD review request error", {
      message: requestError instanceof Error ? requestError.message : "unknown"
    });
    return {
      status: "error",
      message: "AI 分析请求无法完成，请稍后重试。"
    };
  }
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDirection(value: string): ResumeJdDirection {
  return resumeJdDirectionOptions.some((option) => option.value === value) ? (value as ResumeJdDirection) : "general";
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "";
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === "string") {
    return record.output_text.trim();
  }

  const output = record.output;
  if (!Array.isArray(output)) {
    return "";
  }

  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return [];
      }
      const content = (item as Record<string, unknown>).content;
      if (!Array.isArray(content)) {
        return [];
      }
      return content.map((part) => {
        if (!part || typeof part !== "object" || Array.isArray(part)) {
          return "";
        }
        const partRecord = part as Record<string, unknown>;
        return typeof partRecord.text === "string" ? partRecord.text : "";
      });
    })
    .join("\n")
    .trim();
}
