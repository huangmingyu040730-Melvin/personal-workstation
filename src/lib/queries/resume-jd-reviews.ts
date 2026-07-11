import type { ResumeJdReviewRecord, ResumeJdReviewStatus } from "@/lib/content-types";
import { createClient } from "@/lib/supabase/server";

export type ResumeJdReviewFilters = {
  status?: string;
  q?: string;
  versionId?: string;
  direction?: string;
  channel?: string;
};

export type ResumeApplicationStats = {
  total: number;
  active: number;
  preparing: number;
  submitted: number;
  interview: number;
  offer: number;
  rejected: number;
  archived: number;
  weekNew: number;
};

export async function getResumeJdReviews(filters?: ResumeJdReviewFilters) {
  const supabase = await createClient();

  if (!supabase) {
    return [] as ResumeJdReviewRecord[];
  }

  let query = supabase
    .from("resume_jd_reviews")
    .select("*, resume_versions(id,title,target_role)")
    .order("created_at", { ascending: false });

  if (filters?.status === "active") {
    query = query.neq("application_status", "archived");
  } else if (filters?.status && filters.status !== "all") {
    query = query.eq("application_status", filters.status as ResumeJdReviewStatus);
  }

  if (filters?.versionId && filters.versionId !== "all") {
    query = query.eq("resume_version_id", filters.versionId);
  }

  if (filters?.direction && filters.direction !== "all") {
    query = query.eq("job_direction", filters.direction);
  }

  if (filters?.channel && filters.channel !== "all") {
    query = query.eq("application_channel", filters.channel);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getResumeJdReviews failed", { code: error.code, message: error.message });
    return [] as ResumeJdReviewRecord[];
  }

  const reviews = (data ?? []) as ResumeJdReviewRecord[];
  return filters?.q ? reviews.filter((review) => matchesJdReviewSearch(review, filters.q ?? "")) : reviews;
}

export async function getResumeJdReviewById(id: string) {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("resume_jd_reviews")
    .select("*, resume_versions(id,title,target_role)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getResumeJdReviewById failed", { code: error.code, message: error.message });
    return null;
  }

  return data as ResumeJdReviewRecord | null;
}

export async function getRecentResumeJdReviewsForVersion(versionId: string, limit = 3) {
  const supabase = await createClient();

  if (!supabase) {
    return [] as ResumeJdReviewRecord[];
  }

  const { data, error } = await supabase
    .from("resume_jd_reviews")
    .select("*, resume_versions(id,title,target_role)")
    .eq("resume_version_id", versionId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentResumeJdReviewsForVersion failed", { code: error.code, message: error.message });
    return [] as ResumeJdReviewRecord[];
  }

  return (data ?? []) as ResumeJdReviewRecord[];
}

export function getResumeApplicationStats(reviews: ResumeJdReviewRecord[]): ResumeApplicationStats {
  const weekStart = getCurrentWeekStart();
  const preparingStatuses: ResumeJdReviewStatus[] = ["draft", "reviewed", "ready"];

  return {
    total: reviews.length,
    active: reviews.filter((review) => review.application_status !== "archived").length,
    preparing: reviews.filter((review) => preparingStatuses.includes(review.application_status)).length,
    submitted: reviews.filter((review) => review.application_status === "submitted").length,
    interview: reviews.filter((review) => review.application_status === "interview").length,
    offer: reviews.filter((review) => review.application_status === "offer").length,
    rejected: reviews.filter((review) => review.application_status === "rejected").length,
    archived: reviews.filter((review) => review.application_status === "archived").length,
    weekNew: reviews.filter((review) => new Date(review.created_at).getTime() >= weekStart.getTime()).length
  };
}

export function getResumeApplicationFilterOptions(reviews: ResumeJdReviewRecord[]) {
  return {
    directions: uniqueStrings(reviews.map((review) => review.job_direction)),
    channels: uniqueStrings(reviews.map((review) => review.application_channel))
  };
}

function matchesJdReviewSearch(review: ResumeJdReviewRecord, q: string) {
  const keyword = q.trim().toLocaleLowerCase("zh-CN");

  if (!keyword) {
    return true;
  }

  const searchableText = [
    review.company_name,
    review.job_title,
    review.job_direction,
    review.job_location,
    review.application_channel,
    review.match_summary,
    review.resume_versions?.title,
    ...(review.target_keywords ?? []),
    ...(review.matched_keywords ?? []),
    ...(review.missing_keywords ?? []),
    ...(review.next_actions ?? [])
  ]
    .filter(Boolean)
    .join("\n")
    .toLocaleLowerCase("zh-CN");

  return searchableText.includes(keyword);
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function getCurrentWeekStart() {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - daysSinceMonday);
  start.setHours(0, 0, 0, 0);
  return start;
}
