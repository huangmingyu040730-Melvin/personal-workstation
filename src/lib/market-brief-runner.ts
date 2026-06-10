import type { SupabaseClient } from "@supabase/supabase-js";
import type { GeneratedMarketBrief } from "@/lib/market-brief-generator";
import { defaultMarketBriefRunnerName, generateMarketBriefDraft } from "@/lib/market-brief-generator";
import type { MarketBriefGenerationJobRecord, MarketBriefJobStatus, MarketBriefRecord } from "@/lib/content-types";

type RunnerSupabaseClient = SupabaseClient;

export type CreateMarketBriefJobInput = {
  ownerId: string;
  briefDate: string;
  market: string;
  runnerName?: string;
  requestPayload?: Record<string, unknown>;
};

export type SkillResultPayload = {
  job_id: string;
  brief_date?: string;
  market?: string;
  title: string;
  summary?: string | null;
  markdown_content: string;
  source_snapshot?: Record<string, unknown>;
  tags?: string[];
  data_sources?: string[];
};

export type ClaimMarketBriefJobInput = {
  market?: string;
  runnerName?: string;
};

export async function findExistingMarketBrief(
  supabase: RunnerSupabaseClient,
  { ownerId, briefDate, market }: { ownerId: string; briefDate: string; market: string }
) {
  const { data, error } = await supabase
    .from("market_briefs")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("brief_date", briefDate)
    .eq("market", market)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "检查市场简报失败。");
  }

  return data as Pick<MarketBriefRecord, "id"> | null;
}

export async function findActiveMarketBriefGenerationJob(
  supabase: RunnerSupabaseClient,
  { ownerId, briefDate, market }: { ownerId: string; briefDate: string; market: string }
) {
  const { data, error } = await supabase
    .from("market_brief_generation_jobs")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("brief_date", briefDate)
    .eq("market", market)
    .in("status", ["queued", "running"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "检查生成任务失败。");
  }

  return data as MarketBriefGenerationJobRecord | null;
}

export async function createQueuedMarketBriefGenerationJob(supabase: RunnerSupabaseClient, input: CreateMarketBriefJobInput) {
  const runnerName = input.runnerName ?? defaultMarketBriefRunnerName;
  const { data, error } = await supabase
    .from("market_brief_generation_jobs")
    .insert({
      owner_id: input.ownerId,
      brief_date: input.briefDate,
      market: input.market,
      status: "queued",
      runner_name: runnerName,
      request_payload: {
        source: "dashboard-button",
        market: input.market,
        brief_date: input.briefDate,
        runner_name: runnerName,
        ...(input.requestPayload ?? {})
      }
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "创建市场简报生成任务失败。");
  }

  return data as MarketBriefGenerationJobRecord;
}

export async function claimQueuedMarketBriefGenerationJob(supabase: RunnerSupabaseClient, input: ClaimMarketBriefJobInput = {}) {
  let query = supabase
    .from("market_brief_generation_jobs")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1);

  if (input.market) {
    query = query.eq("market", input.market);
  }

  const { data: queuedJob, error: queuedError } = await query.maybeSingle();

  if (queuedError) {
    throw new Error("读取待领取任务失败。");
  }

  if (!queuedJob) {
    return null;
  }

  const startedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("market_brief_generation_jobs")
    .update({
      status: "running",
      runner_name: input.runnerName ?? queuedJob.runner_name,
      started_at: startedAt,
      error_message: null
    })
    .eq("id", queuedJob.id)
    .eq("status", "queued")
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error("领取市场简报生成任务失败。");
  }

  return data as MarketBriefGenerationJobRecord | null;
}

export async function runMockMarketBriefGenerationJob(supabase: RunnerSupabaseClient, job: MarketBriefGenerationJobRecord) {
  let runningJob = job;

  try {
    runningJob = await updateMarketBriefGenerationJobStatus(supabase, job.id, "running", {
      started_at: new Date().toISOString(),
      error_message: null
    });

    const generated = await generateMarketBriefDraft({
      market: runningJob.market,
      briefDate: runningJob.brief_date,
      runnerName: runningJob.runner_name
    });
    const brief = await createOrUpdateMarketBriefFromGenerated(supabase, runningJob, generated);
    const completedAt = new Date().toISOString();

    const { data, error } = await supabase
      .from("market_brief_generation_jobs")
      .update({
        status: "succeeded",
        source_snapshot: generated.sourceSnapshot,
        result_payload: generated,
        market_brief_id: brief.id,
        completed_at: completedAt,
        error_message: null
      })
      .eq("id", runningJob.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message || "更新市场简报生成任务失败。");
    }

    return { job: data as MarketBriefGenerationJobRecord, brief };
  } catch (error) {
    await markMarketBriefGenerationJobFailed(supabase, runningJob.id, getSafeRunnerErrorMessage(error));
    throw error;
  }
}

export async function applySkillResultToMarketBriefJob(supabase: RunnerSupabaseClient, payload: SkillResultPayload) {
  const { data: job, error: jobError } = await supabase
    .from("market_brief_generation_jobs")
    .select("*")
    .eq("id", payload.job_id)
    .maybeSingle();

  if (jobError) {
    throw new Error("读取生成任务失败。");
  }

  if (!job) {
    throw new Error("生成任务不存在。");
  }

  const runningJob = await updateMarketBriefGenerationJobStatus(supabase, job.id, "running", {
    started_at: job.started_at ?? new Date().toISOString(),
    error_message: null
  });

  try {
    const briefDate = payload.brief_date ?? runningJob.brief_date;
    const market = payload.market ?? runningJob.market;
    const sourceSnapshot = normalizeSkillSourceSnapshot(payload.source_snapshot, {
      market,
      briefDate,
      runnerName: runningJob.runner_name
    });
    const generated: GeneratedMarketBrief = {
      title: payload.title,
      summary: payload.summary ?? "",
      markdownContent: payload.markdown_content,
      sourceSnapshot,
      tags: normalizeTextArray(payload.tags, ["市场简报", market, "待复核"]),
      dataSources: normalizeTextArray(payload.data_sources, ["Skill Runner"]),
      generatorName: runningJob.runner_name
    };
    const brief = await createOrUpdateMarketBriefFromGenerated(supabase, { ...runningJob, brief_date: briefDate, market }, generated);
    const completedAt = new Date().toISOString();

    const { data: completedJob, error: completeError } = await supabase
      .from("market_brief_generation_jobs")
      .update({
        status: "succeeded",
        source_snapshot: sourceSnapshot,
        result_payload: {
          title: generated.title,
          summary: generated.summary,
          markdown_content: generated.markdownContent,
          tags: generated.tags,
          data_sources: generated.dataSources
        },
        market_brief_id: brief.id,
        completed_at: completedAt,
        error_message: null
      })
      .eq("id", runningJob.id)
      .select("*")
      .single();

    if (completeError) {
      throw new Error("保存生成任务结果失败。");
    }

    return { job: completedJob as MarketBriefGenerationJobRecord, brief };
  } catch (error) {
    await markMarketBriefGenerationJobFailed(supabase, runningJob.id, getSafeRunnerErrorMessage(error));
    throw error;
  }
}

export async function markMarketBriefGenerationJobFailed(supabase: RunnerSupabaseClient, jobId: string, errorMessage: string) {
  const { data, error } = await supabase
    .from("market_brief_generation_jobs")
    .update({
      status: "failed",
      error_message: errorMessage.slice(0, 500),
      completed_at: new Date().toISOString()
    })
    .eq("id", jobId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error("标记生成任务失败。");
  }

  return data as MarketBriefGenerationJobRecord | null;
}

export function getTodayDateInShanghai() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

export function normalizeBriefDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function normalizeSkillSourceSnapshot(
  value: Record<string, unknown> | undefined,
  { market, briefDate, runnerName }: { market: string; briefDate: string; runnerName: string }
) {
  return {
    meta: {
      market,
      brief_date: briefDate,
      runner_name: runnerName,
      generated_at: new Date().toISOString()
    },
    indices: [],
    styles: [],
    sectors: [],
    hot_topics: [],
    capital_flows: [],
    policy_news: [],
    risk_signals: [],
    ...(value ?? {})
  };
}

async function createOrUpdateMarketBriefFromGenerated(
  supabase: RunnerSupabaseClient,
  job: Pick<MarketBriefGenerationJobRecord, "owner_id" | "brief_date" | "market" | "runner_name">,
  generated: GeneratedMarketBrief
) {
  const generatedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("market_briefs")
    .upsert(
      {
        owner_id: job.owner_id,
        brief_date: job.brief_date,
        title: generated.title,
        market: job.market,
        status: "draft",
        summary: generated.summary,
        markdown_content: generated.markdownContent,
        generation_status: "generated",
        generated_at: generatedAt,
        generator_name: generated.generatorName || job.runner_name,
        source_snapshot: generated.sourceSnapshot,
        tags: generated.tags,
        data_sources: generated.dataSources
      },
      { onConflict: "owner_id,brief_date,market" }
    )
    .select("id,title,brief_date,market,status,generation_status,generator_name")
    .single();

  if (error) {
    throw new Error(error.message || "保存生成的市场简报失败。");
  }

  return data as Pick<MarketBriefRecord, "id" | "title" | "brief_date" | "market" | "status" | "generation_status" | "generator_name">;
}

async function updateMarketBriefGenerationJobStatus(
  supabase: RunnerSupabaseClient,
  jobId: string,
  status: MarketBriefJobStatus,
  extra: Record<string, unknown> = {}
) {
  const { data, error } = await supabase
    .from("market_brief_generation_jobs")
    .update({ status, ...extra })
    .eq("id", jobId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "更新市场简报生成任务失败。");
  }

  return data as MarketBriefGenerationJobRecord;
}

function normalizeTextArray(value: string[] | undefined, fallback: string[]) {
  const values = (value && value.length > 0 ? value : fallback)
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(values));
}

function getSafeRunnerErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.slice(0, 500);
  }

  return "市场简报生成任务失败。";
}
