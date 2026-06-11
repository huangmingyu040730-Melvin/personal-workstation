import type { MarketBriefMaterialPackageRecord } from "@/lib/content-types";
import { createClient } from "@/lib/supabase/server";

export type MarketBriefMaterialPackageFilters = {
  status?: string;
  market?: string;
  packageDate?: string;
};

export type MarketBriefMaterialPackageFilterOptions = {
  markets: string[];
  statuses: string[];
};

export async function getMarketBriefMaterialPackages(filters?: MarketBriefMaterialPackageFilters) {
  const supabase = await createClient();

  if (!supabase) {
    return [] as MarketBriefMaterialPackageRecord[];
  }

  let query = supabase
    .from("market_brief_material_packages")
    .select("*")
    .order("package_date", { ascending: false })
    .order("updated_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.market && filters.market !== "all") {
    query = query.eq("market", filters.market);
  }

  if (filters?.packageDate) {
    query = query.eq("package_date", filters.packageDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getMarketBriefMaterialPackages failed", { code: error.code, message: error.message });
    return [];
  }

  return (data ?? []) as MarketBriefMaterialPackageRecord[];
}

export async function getMarketBriefMaterialPackageById(id: string) {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("market_brief_material_packages")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getMarketBriefMaterialPackageById failed", { code: error.code, message: error.message });
    return null;
  }

  return data as MarketBriefMaterialPackageRecord | null;
}

export async function getMarketBriefMaterialPackageFilterOptions(): Promise<MarketBriefMaterialPackageFilterOptions> {
  const packages = await getMarketBriefMaterialPackages();
  const markets = Array.from(new Set(packages.map((item) => item.market).filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-CN"));
  const statuses = Array.from(new Set(packages.map((item) => item.status).filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-CN"));
  return { markets, statuses };
}
