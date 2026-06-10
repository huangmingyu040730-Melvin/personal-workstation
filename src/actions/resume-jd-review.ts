"use server";

import OpenAI from "openai";
import { getAdminClient } from "@/lib/auth/admin";
import { getAiProviderConfig, getAiProviderDisplayName } from "@/lib/ai-provider";
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

export async function analyzeResumeJdAction(versionId: string, previousState: ResumeJdReviewState = defaultResumeJdReviewState, formData: FormData): Promise<ResumeJdReviewState> {
  void previousState;
  const jdText = readFormText(formData, "jd_text");
  const direction = normalizeDirection(readFormText(formData, "direction"));
  const aiConfig = getAiProviderConfig();
  const modelName = aiConfig.model;

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

  if (!aiConfig.isConfigured || !aiConfig.apiKey) {
    return {
      status: "error",
      message: "AI JD 优化尚未配置。请在服务端环境变量中设置 AI_API_KEY，或继续使用 OPENAI_API_KEY。"
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
  const client = new OpenAI({
    apiKey: aiConfig.apiKey,
    baseURL: aiConfig.baseURL
  });

  try {
    const response = await client.chat.completions.create({
      model: aiConfig.model,
      messages: [
        {
          role: "system",
          content: [
            "你只做中文简历匹配分析。",
            "输出必须是一个 JSON object，不要使用 Markdown 代码围栏。",
            "JSON object 必须符合以下 schema：",
            JSON.stringify(resumeJdReviewJsonSchema())
          ].join("\n")
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const outputText = response.choices[0]?.message.content?.trim();
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
    console.error("AI JD review request error", {
      provider: getAiProviderDisplayName(aiConfig.provider),
      status: readErrorStatus(requestError),
      message: requestError instanceof Error ? requestError.message : "unknown"
    });
    return {
      status: "error",
      message: "AI 分析请求无法完成，请稍后重试或检查 AI Provider / AI_MODEL 配置。"
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

function readErrorStatus(error: unknown) {
  if (!error || typeof error !== "object" || Array.isArray(error)) {
    return undefined;
  }
  const status = (error as Record<string, unknown>).status;
  return typeof status === "number" ? status : undefined;
}
