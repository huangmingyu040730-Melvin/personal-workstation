import type { ResumeJdReviewRecord, ResumeJdReviewStatus } from "@/lib/content-types";
import { createClient } from "@/lib/supabase/server";

export type ResumeJdReviewFilters = {
  status?: string;
  q?: string;
  versionId?: string;
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

  if (filters?.status && filters.status !== "all") {
    query = query.eq("application_status", filters.status as ResumeJdReviewStatus);
  }

  if (filters?.versionId) {
    query = query.eq("resume_version_id", filters.versionId);
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
