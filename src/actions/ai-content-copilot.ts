"use server";

import OpenAI from "openai";
import { getAdminClient } from "@/lib/auth/admin";
import {
  aiContentAssetLabels,
  aiContentCopilotJsonSchema,
  buildAiContentCopilotPrompt,
  defaultAiContentCopilotState,
  normalizeAiContentAssetType,
  normalizeAiContentCopilotResult,
  type AiContentAssetType,
  type AiContentCopilotState,
  type AiContentSafeInput
} from "@/lib/ai-content-copilot";
import { getAiProviderConfig, getAiProviderDisplayName } from "@/lib/ai-provider";
import { getString } from "@/lib/forms";

type AdminSupabaseClient = NonNullable<Awaited<ReturnType<typeof getAdminClient>>["supabase"]>;

export async function generateAiContentSuggestionsAction(previousState: AiContentCopilotState = defaultAiContentCopilotState, formData: FormData): Promise<AiContentCopilotState> {
  void previousState;

  const assetType = normalizeAiContentAssetType(getString(formData, "asset_type"));
  const assetId = getString(formData, "asset_id");

  if (!assetType || !assetId) {
    return {
      status: "error",
      message: "AI 内容助手缺少有效资产类型或资产 ID。"
    };
  }

  const aiConfig = getAiProviderConfig();
  if (!aiConfig.isConfigured || !aiConfig.apiKey) {
    return {
      status: "error",
      message: "AI 内容助手尚未配置。请在服务端环境变量中设置 AI_API_KEY，或继续使用 OPENAI_API_KEY。"
    };
  }

  const { supabase, isAdmin, error } = await getAdminClient();
  if (!supabase || !isAdmin) {
    return {
      status: "error",
      message: error ?? "当前账号没有管理员权限。"
    };
  }

  const safeInput = await getSafeAssetInput(supabase, assetType, assetId);
  if (!safeInput) {
    return {
      status: "error",
      message: "未找到当前资产，或资产字段无法读取。"
    };
  }

  const prompt = buildAiContentCopilotPrompt(safeInput);
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
            "你只为管理员后台生成中文公开内容整理建议。",
            "输出必须是一个 JSON object，不要使用 Markdown 代码围栏。",
            "JSON object 必须符合以下 schema：",
            JSON.stringify(aiContentCopilotJsonSchema())
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

    const parsed = parseJsonRecord(outputText);
    if (!parsed) {
      return {
        status: "success",
        message: "AI 返回了非结构化文本，请人工复核后再使用。",
        rawText: outputText,
        modelName: aiConfig.model
      };
    }

    return {
      status: "success",
      message: "AI 建议已生成。请人工复核后再复制、采纳或修改；本次不会自动保存或公开内容。",
      result: normalizeAiContentCopilotResult(parsed),
      modelName: aiConfig.model
    };
  } catch (requestError) {
    console.error("AI content copilot request error", {
      assetType,
      provider: getAiProviderDisplayName(aiConfig.provider),
      status: readErrorStatus(requestError),
      message: requestError instanceof Error ? requestError.message : "unknown"
    });
    return {
      status: "error",
      message: "AI 内容助手请求无法完成，请稍后重试或检查 AI Provider / AI_MODEL 配置。"
    };
  }
}

async function getSafeAssetInput(supabase: AdminSupabaseClient, assetType: AiContentAssetType, assetId: string): Promise<AiContentSafeInput | null> {
  if (assetType === "project") {
    const { data, error } = await supabase
      .from("projects")
      .select("title,summary,background,research_question,methodology,tags,status,visibility")
      .eq("id", assetId)
      .maybeSingle();

    if (error || !data) {
      logAssetReadError(assetType, error);
      return null;
    }

    return {
      assetType,
      assetLabel: aiContentAssetLabels[assetType],
      fields: {
        title: data.title,
        summary: data.summary,
        background: data.background,
        research_question: data.research_question,
        methodology: data.methodology,
        tags: data.tags ?? [],
        status: data.status,
        visibility: data.visibility
      }
    };
  }

  if (assetType === "publication") {
    const { data, error } = await supabase
      .from("publications")
      .select("title,publication_type,summary,abstract,tags,visibility,published_on")
      .eq("id", assetId)
      .maybeSingle();

    if (error || !data) {
      logAssetReadError(assetType, error);
      return null;
    }

    return {
      assetType,
      assetLabel: aiContentAssetLabels[assetType],
      fields: {
        title: data.title,
        publication_type: data.publication_type,
        summary: data.summary,
        abstract: data.abstract,
        tags: data.tags ?? [],
        visibility: data.visibility,
        published_on: data.published_on
      }
    };
  }

  if (assetType === "knowledge") {
    const { data, error } = await supabase
      .from("knowledge_notes")
      .select("title,category,excerpt,content,tags,visibility")
      .eq("id", assetId)
      .maybeSingle();

    if (error || !data) {
      logAssetReadError(assetType, error);
      return null;
    }

    return {
      assetType,
      assetLabel: aiContentAssetLabels[assetType],
      fields: {
        title: data.title,
        category: data.category,
        excerpt: data.excerpt,
        content: data.content,
        tags: data.tags ?? [],
        visibility: data.visibility
      }
    };
  }

  const { data, error } = await supabase
    .from("skills")
    .select("name,description,category,content,input_description,output_description,usage_guide,platforms,current_version,visibility")
    .eq("id", assetId)
    .maybeSingle();

  if (error || !data) {
    logAssetReadError(assetType, error);
    return null;
  }

  return {
    assetType,
    assetLabel: aiContentAssetLabels[assetType],
    fields: {
      name: data.name,
      description: data.description,
      category: data.category,
      content: data.content,
      input_description: data.input_description,
      output_description: data.output_description,
      usage_guide: data.usage_guide,
      platforms: data.platforms ?? [],
      current_version: data.current_version,
      visibility: data.visibility
    }
  };
}

function parseJsonRecord(value: string) {
  try {
    const parsed = JSON.parse(stripMarkdownCodeFence(value));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function stripMarkdownCodeFence(value: string) {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function logAssetReadError(assetType: AiContentAssetType, error: { code?: string; message?: string } | null) {
  if (!error) {
    return;
  }

  console.error("AI content copilot asset read failed", {
    assetType,
    code: error.code,
    message: error.message
  });
}

function readErrorStatus(error: unknown) {
  if (error && typeof error === "object" && "status" in error) {
    return (error as { status?: unknown }).status;
  }

  return undefined;
}
