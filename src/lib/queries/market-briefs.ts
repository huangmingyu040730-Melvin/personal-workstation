import type { MarketBriefRecord, MarketBriefStatus } from "@/lib/content-types";
import { createClient } from "@/lib/supabase/server";

export type MarketBriefFilters = {
  q?: string;
  status?: string;
  market?: string;
  tag?: string;
};

export type MarketBriefFilterOptions = {
  markets: string[];
  tags: string[];
};

export async function getMarketBriefs(filters?: MarketBriefFilters) {
  const supabase = await createClient();

  if (!supabase) {
    return [] as MarketBriefRecord[];
  }

  let query = supabase
    .from("market_briefs")
    .select("*")
    .order("brief_date", { ascending: false })
    .order("updated_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.market && filters.market !== "all") {
    query = query.eq("market", filters.market);
  }

  if (filters?.tag && filters.tag !== "all") {
    query = query.contains("tags", [filters.tag]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getMarketBriefs failed", { code: error.code, message: error.message });
    return [];
  }

  const briefs = (data ?? []) as MarketBriefRecord[];
  return filters?.q ? briefs.filter((brief) => matchesMarketBriefSearch(brief, filters.q ?? "")) : briefs;
}

export async function getMarketBriefById(id: string) {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from("market_briefs").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("getMarketBriefById failed", { code: error.code, message: error.message });
    return null;
  }

  return data as MarketBriefRecord | null;
}

export async function getRecentMarketBriefs(limit = 3) {
  const supabase = await createClient();

  if (!supabase) {
    return [] as MarketBriefRecord[];
  }

  const { data, error } = await supabase
    .from("market_briefs")
    .select("*")
    .order("brief_date", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentMarketBriefs failed", { code: error.code, message: error.message });
    return [];
  }

  return (data ?? []) as MarketBriefRecord[];
}

export async function getMarketBriefFilterOptions(): Promise<MarketBriefFilterOptions> {
  const briefs = await getMarketBriefs();
  const markets = Array.from(new Set(briefs.map((brief) => brief.market).filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-CN"));
  const tags = Array.from(new Set(briefs.flatMap((brief) => brief.tags ?? []).filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-CN"));

  return { markets, tags };
}

export function normalizeMarketBriefStatus(value: string | null | undefined): MarketBriefStatus {
  return value === "reviewed" || value === "published" || value === "archived" ? value : "draft";
}

function matchesMarketBriefSearch(brief: MarketBriefRecord, q: string) {
  const keyword = q.trim().toLocaleLowerCase("zh-CN");

  if (!keyword) {
    return true;
  }

  return [
    brief.title,
    brief.summary,
    brief.market_overview,
    brief.index_performance,
    brief.style_performance,
    brief.sector_performance,
    brief.hot_topics,
    brief.capital_flows,
    brief.policy_news,
    brief.risk_alerts,
    brief.tomorrow_watch,
    brief.markdown_content,
    brief.market,
    brief.status,
    brief.generation_status,
    brief.generator_name,
    ...(brief.tags ?? []),
    ...(brief.data_sources ?? [])
  ]
    .filter(Boolean)
    .join("\n")
    .toLocaleLowerCase("zh-CN")
    .includes(keyword);
}
