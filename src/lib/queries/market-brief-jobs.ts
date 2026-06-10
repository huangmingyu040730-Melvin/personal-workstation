import type { MarketBriefGenerationJobRecord } from "@/lib/content-types";
import { createClient } from "@/lib/supabase/server";

export type MarketBriefJobFilters = {
  status?: string;
  market?: string;
  briefDate?: string;
};

export type MarketBriefJobFilterOptions = {
  markets: string[];
};

const jobBriefSelect = "*, market_briefs(id,title,brief_date,market)";

export async function getMarketBriefGenerationJobs(filters?: MarketBriefJobFilters) {
  const supabase = await createClient();

  if (!supabase) {
    return [] as MarketBriefGenerationJobRecord[];
  }

  let query = supabase
    .from("market_brief_generation_jobs")
    .select(jobBriefSelect)
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.market && filters.market !== "all") {
    query = query.eq("market", filters.market);
  }

  if (filters?.briefDate) {
    query = query.eq("brief_date", filters.briefDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getMarketBriefGenerationJobs failed", { code: error.code, message: error.message });
    return [];
  }

  return (data ?? []) as MarketBriefGenerationJobRecord[];
}

export async function getMarketBriefGenerationJobById(id: string) {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("market_brief_generation_jobs")
    .select(jobBriefSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getMarketBriefGenerationJobById failed", { code: error.code, message: error.message });
    return null;
  }

  return data as MarketBriefGenerationJobRecord | null;
}

export async function getMarketBriefGenerationJobsForBrief(briefId: string, limit = 3) {
  const supabase = await createClient();

  if (!supabase) {
    return [] as MarketBriefGenerationJobRecord[];
  }

  const { data, error } = await supabase
    .from("market_brief_generation_jobs")
    .select(jobBriefSelect)
    .eq("market_brief_id", briefId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getMarketBriefGenerationJobsForBrief failed", { code: error.code, message: error.message });
    return [];
  }

  return (data ?? []) as MarketBriefGenerationJobRecord[];
}

export async function getMarketBriefGenerationJobFilterOptions(): Promise<MarketBriefJobFilterOptions> {
  const jobs = await getMarketBriefGenerationJobs();
  const markets = Array.from(new Set(jobs.map((job) => job.market).filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-CN"));
  return { markets };
}
