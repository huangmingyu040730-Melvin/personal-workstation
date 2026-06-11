"use server";

import { revalidatePath } from "next/cache";
import OpenAI from "openai";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { getAiProviderConfig, getAiProviderDisplayName } from "@/lib/ai-provider";
import { getProfileFallback, getPublicProfile } from "@/lib/queries/profile";
import { getResumeItems } from "@/lib/queries/resume";
import { buildResumeAiInputContext, pickResumeBasicItem } from "@/lib/resume-ai-input";
import { getTargetKeywords } from "@/lib/resume-quality";
import {
  buildResumeJdReviewPrompt,
  defaultResumeJdReviewState,
  normalizeResumeJdReviewResult,
  resumeJdDirectionOptions,
  resumeJdReviewJsonSchema,
  type ResumeJdDirection,
  type ResumeJdReviewResult,
  type ResumeJdReviewState
} from "@/lib/resume-jd-review";
import { resumeJdReviewSaveSchema } from "@/lib/validations/resume-jd-review";

export async function analyzeResumeJdAction(versionId: string, previousState: ResumeJdReviewState = defaultResumeJdReviewState, formData: FormData): Promise<ResumeJdReviewState> {
  void previousState;
  const jdText = readFormText(formData, "jd_text");
  const direction = normalizeDirection(readFormText(formData, "direction"));
  const directionLabel = resumeJdDirectionOptions.find((option) => option.value === direction)?.label ?? "通用";
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

  const { supabase, isAdmin, actorId, error } = await getAdminClient();
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

  const [publicProfile, basicItems] = await Promise.all([
    getPublicProfile(),
    getResumeItems({ itemType: "basic", visibility: "all" })
  ]);
  const profile = publicProfile ?? getProfileFallback();
  const versionWithItems = {
    ...version,
    resume_version_items: version.resume_version_items ?? []
  };
  const basicItem = pickResumeBasicItem(versionWithItems, basicItems);
  const resumeContext = buildResumeAiInputContext({
    version: versionWithItems,
    profile,
    basicItem,
    targetKeywords: getTargetKeywords(versionWithItems)
  });
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

    const targetKeywords = getTargetKeywords(versionWithItems);
    const parsed = parseJsonRecord(outputText);

    if (parsed) {
      const result = normalizeResumeJdReviewResult(parsed);
      const saved = await saveAnalyzedJdReview({
        supabase,
        actorId,
        versionId,
        formData,
        jdText,
        directionLabel,
        targetKeywords,
        aiResult: result as unknown as Record<string, unknown>,
        normalizedResult: result,
        modelName
      });

      if (!saved.ok) {
        return saved.errorState;
      }

      return {
        status: "success",
        message: "AI JD 分析完成，并已自动保存为 JD 分析记录。请人工复核后再使用建议。",
        result,
        jdText,
        direction,
        modelName,
        savedReviewId: saved.id,
        savedReviewUrl: saved.url,
        savedAt: saved.savedAt
      };
    }

    const rawAiResult = {
      raw_text: outputText,
      parse_status: "raw_text"
    };
    const saved = await saveAnalyzedJdReview({
      supabase,
      actorId,
      versionId,
      formData,
      jdText,
      directionLabel,
      targetKeywords,
      aiResult: rawAiResult,
      normalizedResult: createRawTextFallbackResult(),
      modelName,
      matchSummary: "AI 返回了非结构化文本，需人工复核。"
    });

    if (!saved.ok) {
      return saved.errorState;
    }

    return {
      status: "success",
      message: "AI 返回了文本建议，但不是严格 JSON；已保存为需人工复核的 JD 分析记录。",
      rawText: outputText,
      jdText,
      direction,
      modelName,
      savedReviewId: saved.id,
      savedReviewUrl: saved.url,
      savedAt: saved.savedAt
    };
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

function parseJsonRecord(value: string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function saveAnalyzedJdReview({
  supabase,
  actorId,
  versionId,
  formData,
  jdText,
  directionLabel,
  targetKeywords,
  aiResult,
  normalizedResult,
  modelName,
  matchSummary
}: {
  supabase: NonNullable<Awaited<ReturnType<typeof getAdminClient>>["supabase"]>;
  actorId: string | null;
  versionId: string;
  formData: FormData;
  jdText: string;
  directionLabel: string;
  targetKeywords: string[];
  aiResult: Record<string, unknown>;
  normalizedResult: ResumeJdReviewResult;
  modelName: string;
  matchSummary?: string;
}): Promise<
  | { ok: true; id: string; url: string; savedAt: string }
  | { ok: false; errorState: ResumeJdReviewState }
> {
  if (!actorId) {
    return {
      ok: false,
      errorState: {
        status: "error",
        message: "当前登录状态无法确认管理员身份，请重新登录后再试。"
      }
    };
  }

  const parsed = resumeJdReviewSaveSchema.safeParse({
    resume_version_id: versionId,
    company_name: readFormText(formData, "company_name") || null,
    job_title: readFormText(formData, "job_title") || null,
    job_direction: readFormText(formData, "job_direction") || directionLabel,
    job_location: readFormText(formData, "job_location") || null,
    application_channel: readFormText(formData, "application_channel") || null,
    jd_text: jdText,
    target_keywords: targetKeywords,
    ai_result: aiResult,
    match_summary: matchSummary ?? normalizedResult.matchSummary,
    missing_keywords: normalizedResult.missingKeywords,
    matched_keywords: normalizedResult.matchedKeywords,
    risks: normalizedResult.risks,
    next_actions: normalizedResult.nextActions,
    application_status: readFormText(formData, "application_status") || "reviewed",
    notes: readFormText(formData, "notes") || null,
    model_name: modelName
  });

  if (!parsed.success) {
    return {
      ok: false,
      errorState: {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "请检查投递信息后重新提交。"
      }
    };
  }

  const { data, error } = await supabase
    .from("resume_jd_reviews")
    .insert({
      ...parsed.data,
      owner_id: actorId
    })
    .select("id,company_name,job_title,resume_version_id,application_status,created_at")
    .single();

  if (error) {
    console.error("resume_jd_reviews insert after AI JD analysis failed", {
      code: error.code,
      message: error.message
    });
    return {
      ok: false,
      errorState: {
        status: "error",
        message: "AI 分析已完成但保存记录失败，请重试。"
      }
    };
  }

  await writeActivityLog({
    action: "resume_jd_review.create",
    entityType: "resume_jd_review",
    entityId: data.id,
    metadata: {
      company_name: data.company_name,
      job_title: data.job_title,
      resume_version_id: data.resume_version_id,
      application_status: data.application_status
    }
  });

  revalidateResumeJdReviewPaths(data.id, data.resume_version_id);

  return {
    ok: true,
    id: data.id,
    url: `/dashboard/resume/jd-reviews/${data.id}`,
    savedAt: data.created_at
  };
}

function createRawTextFallbackResult(): ResumeJdReviewResult {
  return {
    matchSummary: "AI 返回了非结构化文本，需人工复核。",
    matchedKeywords: [],
    missingKeywords: [],
    strengths: [],
    gaps: [],
    experienceSuggestions: [],
    rewriteSuggestions: [],
    risks: ["AI 返回内容不是严格 JSON，建议人工核对后再使用。"],
    nextActions: ["打开已保存记录，人工整理匹配摘要、关键词和下一步行动。"]
  };
}

function revalidateResumeJdReviewPaths(id: string, versionId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/resume");
  revalidatePath("/dashboard/resume/versions");
  revalidatePath(`/dashboard/resume/versions/${versionId}`);
  revalidatePath(`/dashboard/resume/versions/${versionId}/jd-review`);
  revalidatePath("/dashboard/resume/jd-reviews");
  revalidatePath(`/dashboard/resume/jd-reviews/${id}`);
  revalidatePath("/dashboard/resume/applications");
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
