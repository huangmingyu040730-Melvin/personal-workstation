"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { encodeFormError, getOptionalString, getString } from "@/lib/forms";
import { normalizeResumeJdReviewResult } from "@/lib/resume-jd-review";
import { resumeJdReviewSaveSchema, resumeJdReviewUpdateSchema } from "@/lib/validations/resume-jd-review";

function jdReviewErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeFormError(message)}`);
}

export async function createResumeJdReviewAction(formData: FormData) {
  const versionId = getString(formData, "resume_version_id");
  const sourcePath = versionId ? `/dashboard/resume/versions/${versionId}/jd-review` : "/dashboard/resume/jd-reviews";
  const aiResult = readJsonRecord(formData, "ai_result_json");
  const normalizedResult = normalizeResumeJdReviewResult(aiResult);

  const parsed = resumeJdReviewSaveSchema.safeParse({
    resume_version_id: versionId,
    company_name: getOptionalString(formData, "company_name"),
    job_title: getOptionalString(formData, "job_title"),
    job_direction: getOptionalString(formData, "job_direction"),
    job_location: getOptionalString(formData, "job_location"),
    application_channel: getOptionalString(formData, "application_channel"),
    jd_text: getString(formData, "jd_text"),
    target_keywords: readStringArray(formData, "target_keywords_json"),
    ai_result: aiResult,
    match_summary: getOptionalString(formData, "match_summary") ?? normalizedResult.matchSummary,
    missing_keywords: readStringArray(formData, "missing_keywords_json", normalizedResult.missingKeywords),
    matched_keywords: readStringArray(formData, "matched_keywords_json", normalizedResult.matchedKeywords),
    risks: readStringArray(formData, "risks_json", normalizedResult.risks),
    next_actions: readStringArray(formData, "next_actions_json", normalizedResult.nextActions),
    application_status: getString(formData, "application_status") || "reviewed",
    notes: getOptionalString(formData, "notes"),
    model_name: getOptionalString(formData, "model_name")
  });

  if (!parsed.success) {
    jdReviewErrorRedirect(sourcePath, parsed.error.issues[0]?.message ?? "请检查 JD 分析记录表单。");
  }

  const { supabase, isAdmin, actorId, error } = await getAdminClient();

  if (!supabase || !isAdmin || !actorId) {
    jdReviewErrorRedirect(sourcePath, error ?? "当前账号没有管理员权限。");
  }

  const { data: version } = await supabase.from("resume_versions").select("id,title").eq("id", parsed.data.resume_version_id).maybeSingle();
  if (!version) {
    jdReviewErrorRedirect(sourcePath, "未找到关联的简历版本。");
  }

  const { data, error: insertError } = await supabase
    .from("resume_jd_reviews")
    .insert({
      ...parsed.data,
      owner_id: actorId
    })
    .select("id,company_name,job_title,resume_version_id,application_status")
    .single();

  if (insertError) {
    jdReviewErrorRedirect(sourcePath, insertError.message || "JD 分析记录保存失败，请稍后重试。");
  }

  await writeActivityLog({
    action: "resume_jd_review.create",
    entityType: "resume_jd_review",
    entityId: data.id,
    metadata: {
      company_name: data.company_name,
      job_title: data.job_title,
      resume_version_id: data.resume_version_id,
      application_status: data.application_status
    }
  });

  revalidateResumeJdReviewPaths(data.id, data.resume_version_id);
  redirect(`/dashboard/resume/jd-reviews/${data.id}`);
}

export async function updateResumeJdReviewAction(id: string, formData: FormData) {
  const detailPath = `/dashboard/resume/jd-reviews/${id}`;
  const parsed = resumeJdReviewUpdateSchema.safeParse({
    company_name: getOptionalString(formData, "company_name"),
    job_title: getOptionalString(formData, "job_title"),
    job_direction: getOptionalString(formData, "job_direction"),
    job_location: getOptionalString(formData, "job_location"),
    application_channel: getOptionalString(formData, "application_channel"),
    application_status: getString(formData, "application_status"),
    notes: getOptionalString(formData, "notes")
  });

  if (!parsed.success) {
    jdReviewErrorRedirect(detailPath, parsed.error.issues[0]?.message ?? "请检查 JD 分析记录表单。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    jdReviewErrorRedirect(detailPath, error ?? "当前账号没有管理员权限。");
  }

  const { data, error: updateError } = await supabase
    .from("resume_jd_reviews")
    .update(parsed.data)
    .eq("id", id)
    .select("id,company_name,job_title,resume_version_id,application_status")
    .single();

  if (updateError) {
    jdReviewErrorRedirect(detailPath, updateError.message || "JD 分析记录更新失败，请稍后重试。");
  }

  await writeActivityLog({
    action: "resume_jd_review.update",
    entityType: "resume_jd_review",
    entityId: data.id,
    metadata: {
      company_name: data.company_name,
      job_title: data.job_title,
      resume_version_id: data.resume_version_id,
      application_status: data.application_status
    }
  });

  revalidateResumeJdReviewPaths(data.id, data.resume_version_id);
  redirect(detailPath);
}

function readJsonRecord(formData: FormData, key: string) {
  const value = getString(formData, key);
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function readStringArray(formData: FormData, key: string, fallback: string[] = []) {
  const value = getString(formData, key);
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
    }
  } catch {
    return value
      .split(/[\n,，、;；]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return fallback;
}

function revalidateResumeJdReviewPaths(id?: string, versionId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/resume");
  revalidatePath("/dashboard/resume/versions");
  revalidatePath("/dashboard/resume/jd-reviews");
  if (id) {
    revalidatePath(`/dashboard/resume/jd-reviews/${id}`);
  }
  if (versionId) {
    revalidatePath(`/dashboard/resume/versions/${versionId}`);
    revalidatePath(`/dashboard/resume/versions/${versionId}/jd-review`);
  }
}
