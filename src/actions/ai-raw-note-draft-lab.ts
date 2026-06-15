"use server";

import OpenAI from "openai";
import { getAdminClient } from "@/lib/auth/admin";
import { getAiProviderConfig, getAiProviderDisplayName } from "@/lib/ai-provider";
import {
  aiRawNoteDraftRequestSchema,
  buildRawNoteStructuredDraftPrompt,
  containsBlockedRawNotePattern,
  normalizeRawNoteDraftResult,
  type AiRawNoteDraftState
} from "@/lib/ai-raw-note-draft-lab";

export async function generateStructuredDraftFromRawNoteAction(input: unknown): Promise<AiRawNoteDraftState> {
  const parsed = aiRawNoteDraftRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "AI 草稿实验室只接受目标类型和原始素材。"
    };
  }

  const { isAdmin, error } = await getAdminClient();
  if (!isAdmin) {
    return {
      status: "error",
      message: error ?? "当前账号没有管理员权限。"
    };
  }

  if (containsBlockedRawNotePattern(parsed.data.rawText)) {
    return {
      status: "error",
      message: "原始素材疑似包含 secret、API key、Storage path、signed URL 或内部文件字段。请先移除敏感内容后再生成草稿。"
    };
  }

  const aiConfig = getAiProviderConfig();
  if (!aiConfig.isConfigured || !aiConfig.apiKey) {
    return {
      status: "error",
      message: "AI 草稿实验室尚未配置。请在服务端环境变量中设置 AI_API_KEY，或继续使用 OPENAI_API_KEY。"
    };
  }

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
            "你是管理员后台的中文 AI 草稿实验室。",
            "你只能输出 JSON object，不要输出 Markdown 代码围栏。",
            "所有草稿都必须可人工复核，不得宣称已经保存、已经创建资产或已经公开。"
          ].join("\n")
        },
        {
          role: "user",
          content: buildRawNoteStructuredDraftPrompt(parsed.data)
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
        targetType: parsed.data.targetType,
        rawText: outputText,
        modelName: aiConfig.model
      };
    }

    return {
      status: "success",
      message: "结构化草稿已生成。请人工复核后复制使用。",
      targetType: parsed.data.targetType,
      result: normalizeRawNoteDraftResult(parsed.data.targetType, parsedOutput),
      modelName: aiConfig.model
    };
  } catch (requestError) {
    console.error("AI raw note draft lab request error", {
      provider: getAiProviderDisplayName(aiConfig.provider),
      status: readErrorStatus(requestError),
      errorName: requestError instanceof Error ? requestError.name : "unknown"
    });

    return {
      status: "error",
      message: "AI 草稿实验室请求无法完成，请稍后重试或检查 AI Provider / AI_MODEL 配置。"
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
