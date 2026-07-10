import OpenAI from "openai";
import { getAiProviderConfig } from "@/lib/ai-provider";
import { buildResumeAiInputContext, pickResumeBasicItem } from "@/lib/resume-ai-input";
import {
  buildResumeJdReviewPrompt,
  normalizeResumeJdReviewResult,
  resumeJdDirectionOptions,
  resumeJdReviewJsonSchema,
  type ResumeJdReviewResult
} from "@/lib/resume-jd-review";
import { getTargetKeywords } from "@/lib/resume-quality";
import type { WorkstationJdAnalyzeInput } from "./career-schemas";
import {
  createWorkstationJdReview,
  getWorkstationBasicResumeItems,
  getWorkstationCareerProfile,
  showWorkstationResumeVersion,
  type WorkstationCareerResult
} from "./career-query";

export async function analyzeWorkstationResumeJd(input: WorkstationJdAnalyzeInput): Promise<WorkstationCareerResult<Record<string, unknown>>> {
  const aiConfig = getAiProviderConfig();
  if (!aiConfig.isConfigured || !aiConfig.apiKey) {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "AI JD analysis is not configured on the Workstation server.",
        status: 503
      }
    };
  }

  const versionResult = await showWorkstationResumeVersion(input.resume_version_id);
  if (!versionResult.ok) return versionResult;

  const [profile, basicItems] = await Promise.all([
    getWorkstationCareerProfile(),
    getWorkstationBasicResumeItems()
  ]);
  const version = versionResult.data;
  const targetKeywords = getTargetKeywords(version);
  const basicItem = pickResumeBasicItem(version, basicItems);
  const resumeContext = buildResumeAiInputContext({ version, profile, basicItem, targetKeywords });
  const prompt = buildResumeJdReviewPrompt({
    jdText: input.jd_text,
    direction: input.direction,
    resumeContext
  });
  const client = new OpenAI({ apiKey: aiConfig.apiKey, baseURL: aiConfig.baseURL });

  let outputText: string;
  try {
    const response = await client.chat.completions.create({
      model: aiConfig.model,
      messages: [
        {
          role: "system",
          content: [
            "你只做中文简历匹配分析。",
            "不得编造经历、成果、数字、公司、岗位、证书或技能。",
            "输出必须是一个 JSON object，不要使用 Markdown 代码围栏。",
            "JSON object 必须符合以下 schema：",
            JSON.stringify(resumeJdReviewJsonSchema())
          ].join("\n")
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });
    outputText = response.choices[0]?.message.content?.trim() ?? "";
  } catch {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "AI JD analysis failed. Check the server-side AI provider configuration and try again.",
        status: 502
      }
    };
  }

  if (!outputText) {
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "AI JD analysis returned an empty response.", status: 502 }
    };
  }

  const parsed = parseJsonRecord(outputText);
  const result = parsed ? normalizeResumeJdReviewResult(parsed) : rawTextFallback();
  const directionLabel = resumeJdDirectionOptions.find((option) => option.value === input.direction)?.label ?? "通用";
  const reviewResult = await createWorkstationJdReview({
    resume_version_id: input.resume_version_id,
    company_name: input.company_name,
    job_title: input.job_title,
    job_direction: input.job_direction ?? directionLabel,
    job_location: input.job_location,
    application_channel: input.application_channel,
    jd_text: input.jd_text,
    target_keywords: targetKeywords,
    ai_result: parsed ?? { raw_text: outputText, parse_status: "raw_text" },
    match_summary: parsed ? result.matchSummary : "AI returned non-structured text and requires manual review.",
    missing_keywords: result.missingKeywords,
    matched_keywords: result.matchedKeywords,
    risks: result.risks,
    next_actions: result.nextActions,
    application_status: input.application_status,
    notes: input.notes,
    model_name: aiConfig.model
  });

  if (!reviewResult.ok) return reviewResult;

  return {
    ok: true,
    data: {
      review: reviewResult.data,
      result,
      parse_status: parsed ? "structured" : "raw_text",
      model_name: aiConfig.model
    }
  };
}

function parseJsonRecord(value: string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function rawTextFallback(): ResumeJdReviewResult {
  return {
    matchSummary: "AI returned non-structured text and requires manual review.",
    matchedKeywords: [],
    missingKeywords: [],
    strengths: [],
    gaps: [],
    experienceSuggestions: [],
    rewriteSuggestions: [],
    risks: ["AI output was not strict JSON. Review it manually before use."],
    nextActions: ["Open the saved record and verify every suggestion against the source resume and JD."]
  };
}
