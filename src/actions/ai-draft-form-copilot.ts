"use server";

import OpenAI from "openai";
import { getAdminClient } from "@/lib/auth/admin";
import { getAiProviderConfig, getAiProviderDisplayName, type AiProviderConfig } from "@/lib/ai-provider";
import {
  buildKnowledgeAiDraftPrompt,
  buildProjectAiDraftPrompt,
  buildPublicationAiDraftPrompt,
  buildSkillAiDraftPrompt,
  knowledgeAiDraftRequestSchema,
  normalizeKnowledgeAiDraftResult,
  normalizeProjectAiDraftResult,
  normalizePublicationAiDraftResult,
  normalizeSkillAiDraftResult,
  projectAiDraftRequestSchema,
  publicationAiDraftRequestSchema,
  skillAiDraftRequestSchema,
  type KnowledgeAiDraftState,
  type ProjectAiDraftState,
  type PublicationAiDraftState,
  type SkillAiDraftState
} from "@/lib/ai-draft-form-copilot";

export async function generateProjectAiDraftAction(input: unknown): Promise<ProjectAiDraftState> {
  const parsed = projectAiDraftRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "AI 草稿助手只接受 Project 表单白名单字段。"
    };
  }

  const { isAdmin, error } = await getAdminClient();
  if (!isAdmin) {
    return {
      status: "error",
      message: error ?? "当前账号没有管理员权限。"
    };
  }

  const aiConfig = getAiProviderConfig();
  if (!aiConfig.isConfigured || !aiConfig.apiKey) {
    return {
      status: "error",
      message: "AI 草稿助手尚未配置。请在服务端环境变量中设置 AI_API_KEY，或继续使用 OPENAI_API_KEY。"
    };
  }

  const prompt = buildProjectAiDraftPrompt(parsed.data.draft);
  return requestAiDraft({
    aiConfig,
    prompt,
    logLabel: "Project AI draft copilot request error",
    systemRole: "你是管理员后台的中文研究项目表单草稿助手。",
    normalize: normalizeProjectAiDraftResult
  });
}

export async function generatePublicationAiDraftAction(input: unknown): Promise<PublicationAiDraftState> {
  const parsed = publicationAiDraftRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "AI 草稿助手只接受 Publication 表单白名单字段。"
    };
  }

  const { isAdmin, error } = await getAdminClient();
  if (!isAdmin) {
    return {
      status: "error",
      message: error ?? "当前账号没有管理员权限。"
    };
  }

  const aiConfig = getAiProviderConfig();
  if (!aiConfig.isConfigured || !aiConfig.apiKey) {
    return {
      status: "error",
      message: "AI 草稿助手尚未配置。请在服务端环境变量中设置 AI_API_KEY，或继续使用 OPENAI_API_KEY。"
    };
  }

  return requestAiDraft({
    aiConfig,
    prompt: buildPublicationAiDraftPrompt(parsed.data.draft),
    logLabel: "Publication AI draft copilot request error",
    systemRole: "你是管理员后台的中文学术成果表单草稿助手。",
    normalize: normalizePublicationAiDraftResult
  });
}

export async function generateKnowledgeAiDraftAction(input: unknown): Promise<KnowledgeAiDraftState> {
  const parsed = knowledgeAiDraftRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "AI 草稿助手只接受 Knowledge 表单白名单字段。"
    };
  }

  const { isAdmin, error } = await getAdminClient();
  if (!isAdmin) {
    return {
      status: "error",
      message: error ?? "当前账号没有管理员权限。"
    };
  }

  const aiConfig = getAiProviderConfig();
  if (!aiConfig.isConfigured || !aiConfig.apiKey) {
    return {
      status: "error",
      message: "AI 草稿助手尚未配置。请在服务端环境变量中设置 AI_API_KEY，或继续使用 OPENAI_API_KEY。"
    };
  }

  return requestAiDraft({
    aiConfig,
    prompt: buildKnowledgeAiDraftPrompt(parsed.data.draft),
    logLabel: "Knowledge AI draft copilot request error",
    systemRole: "你是管理员后台的中文知识笔记表单草稿助手。",
    normalize: normalizeKnowledgeAiDraftResult
  });
}

export async function generateSkillAiDraftAction(input: unknown): Promise<SkillAiDraftState> {
  const parsed = skillAiDraftRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "AI 草稿助手只接受 Skill 表单白名单字段。"
    };
  }

  const { isAdmin, error } = await getAdminClient();
  if (!isAdmin) {
    return {
      status: "error",
      message: error ?? "当前账号没有管理员权限。"
    };
  }

  const aiConfig = getAiProviderConfig();
  if (!aiConfig.isConfigured || !aiConfig.apiKey) {
    return {
      status: "error",
      message: "AI 草稿助手尚未配置。请在服务端环境变量中设置 AI_API_KEY，或继续使用 OPENAI_API_KEY。"
    };
  }

  return requestAiDraft({
    aiConfig,
    prompt: buildSkillAiDraftPrompt(parsed.data.draft),
    logLabel: "Skill AI draft copilot request error",
    systemRole: "你是管理员后台的中文 Skill 表单草稿助手。",
    normalize: normalizeSkillAiDraftResult
  });
}

async function requestAiDraft<TResult>({
  aiConfig,
  prompt,
  logLabel,
  systemRole,
  normalize
}: {
  aiConfig: AiProviderConfig;
  prompt: string;
  logLabel: string;
  systemRole: string;
  normalize: (value: Record<string, unknown>) => TResult;
}): Promise<{
  status: "success" | "error";
  message?: string;
  result?: TResult;
  rawText?: string;
  modelName?: string;
}> {
  const client = new OpenAI({
    apiKey: aiConfig.apiKey ?? "",
    baseURL: aiConfig.baseURL
  });

  try {
    const response = await client.chat.completions.create({
      model: aiConfig.model,
      messages: [
        {
          role: "system",
          content: [
            systemRole,
            "你只能输出 JSON object，不要输出 Markdown 代码围栏。",
            "所有建议都必须可人工复核，不得宣称已经保存或已经公开。"
          ].join("\n")
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.25
    });

    const outputText = response.choices[0]?.message.content?.trim();
    if (!outputText) {
      return {
        status: "error",
        message: "AI 返回内容为空，请稍后重试。"
      };
    }

    const parsedOutput = parseJsonRecord(outputText);
    if (!parsedOutput) {
      return {
        status: "success",
        message: "AI 返回了非结构化文本，请人工复核后再复制使用。",
        rawText: outputText,
        modelName: aiConfig.model
      };
    }

    return {
      status: "success",
      message: "AI 草稿建议已生成。请人工复核后再采用到表单。",
      result: normalize(parsedOutput),
      modelName: aiConfig.model
    };
  } catch (requestError) {
    console.error(logLabel, {
      provider: getAiProviderDisplayName(aiConfig.provider),
      status: readErrorStatus(requestError),
      errorName: requestError instanceof Error ? requestError.name : "unknown"
    });

    return {
      status: "error",
      message: "AI 草稿建议请求无法完成，请稍后重试或检查 AI Provider / AI_MODEL 配置。"
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

function readErrorStatus(error: unknown) {
  if (error && typeof error === "object" && "status" in error) {
    return (error as { status?: unknown }).status;
  }

  return undefined;
}
