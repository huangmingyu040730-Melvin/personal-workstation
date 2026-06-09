"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { encodeFormError, getArrayFromText, getBoolean, getOptionalString, getString } from "@/lib/forms";
import { resumeItemSchema, resumeVersionSchema } from "@/lib/validations/resume";
import { normalizeResumeBullets } from "@/lib/resume-display";

const detailTextKeys = [
  "photo_url",
  "name",
  "gender",
  "age",
  "phone",
  "email",
  "website",
  "social_links",
  "direction",
  "location",
  "school",
  "college",
  "major",
  "degree",
  "gpa",
  "company",
  "department",
  "position",
  "business_area",
  "organization_name",
  "project_role",
  "project_name",
  "background",
  "methods",
  "topic",
  "research_topic",
  "research_role",
  "conclusion",
  "skill_category",
  "language_level",
  "proficiency",
  "certificate_name",
  "award_name",
  "issuer",
  "issued_at",
  "date",
  "valid_until",
  "level",
  "results",
  "outputs",
  "achievements",
  "related_outputs",
  "description"
];

const detailArrayKeys = ["core_courses", "honors", "tools", "skill_items"];

const profileFieldKeys = ["show_photo", "show_name", "show_gender", "show_age", "show_phone", "show_email", "show_location", "show_headline", "show_website", "show_social_links"];

const visibleFieldKeys = [
  "show_date",
  "show_organization",
  "show_role_title",
  "show_location",
  "show_summary",
  "show_bullets",
  "show_skills",
  "show_tags",
  "show_core_courses",
  "show_photo",
  "show_name",
  "show_gender",
  "show_age",
  "show_phone",
  "show_email",
  "show_website",
  "show_social_links",
  "show_direction",
  "show_school",
  "show_college",
  "show_major",
  "show_degree",
  "show_gpa",
  "show_honors",
  "show_company",
  "show_department",
  "show_position",
  "show_results",
  "show_achievements",
  "show_project_name",
  "show_project_role",
  "show_background",
  "show_methods",
  "show_research_topic",
  "show_research_role",
  "show_conclusion",
  "show_outputs",
  "show_related_outputs",
  "show_skill_category",
  "show_skill_items",
  "show_proficiency",
  "show_language_level",
  "show_tools",
  "show_certificate_name",
  "show_issuer",
  "show_valid_until",
  "show_description",
  "show_award_name",
  "show_level"
];

const defaultSectionOrder = ["education", "experience", "campus", "projects", "research", "skills", "certifications", "awards", "other"];

function resumePayloadFromForm(formData: FormData) {
  return resumeItemSchema.safeParse({
    item_type: getString(formData, "item_type"),
    title: getString(formData, "title"),
    organization: getOptionalString(formData, "organization"),
    role_title: getOptionalString(formData, "role_title"),
    location: getOptionalString(formData, "location"),
    start_date: getOptionalString(formData, "start_date"),
    end_date: getOptionalString(formData, "end_date"),
    is_current: getBoolean(formData, "is_current"),
    summary: getOptionalString(formData, "summary"),
    bullets: normalizeResumeBullets(getString(formData, "bullets")),
    skills: getArrayFromText(formData, "skills"),
    tags: getArrayFromText(formData, "tags"),
    details: buildResumeDetails(formData),
    sort_order: getString(formData, "sort_order") || "0",
    visibility: getString(formData, "visibility"),
    is_featured: getBoolean(formData, "is_featured"),
    related_project_id: getOptionalString(formData, "related_project_id"),
    related_publication_id: getOptionalString(formData, "related_publication_id"),
    related_knowledge_id: getOptionalString(formData, "related_knowledge_id"),
    related_skill_id: getOptionalString(formData, "related_skill_id")
  });
}

function resumeErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeFormError(message)}`);
}

function getResumeErrorMessage(error: { message?: string }) {
  return error.message || "简历素材保存失败，请稍后重试。";
}

function buildResumeDetails(formData: FormData) {
  const details: Record<string, string | string[]> = {};

  for (const key of detailTextKeys) {
    const value = getOptionalString(formData, `detail_${key}`);
    if (value) {
      details[key] = value;
    }
  }

  for (const key of detailArrayKeys) {
    const value = getArrayFromText(formData, `detail_${key}`);
    if (value.length > 0) {
      details[key] = value;
    }
  }

  return details;
}

function getProfileFields(formData: FormData) {
  return Object.fromEntries(profileFieldKeys.map((key) => [key, getBoolean(formData, key)]));
}

function getResumeTextArray(formData: FormData, key: string) {
  return getString(formData, key)
    .split(/[\n,，、;；]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getVisibleFields(formData: FormData, itemId: string) {
  return Object.fromEntries(visibleFieldKeys.map((key) => [key, getBoolean(formData, `${key}_${itemId}`)]));
}

function resumeVersionPayloadFromForm(formData: FormData) {
  const selectedItemIds = formData
    .getAll("resume_item_id")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  return resumeVersionSchema.safeParse({
    title: getString(formData, "title"),
    target_role: getOptionalString(formData, "target_role"),
    summary: getOptionalString(formData, "summary"),
    language: getString(formData, "language"),
    template_key: getString(formData, "template_key"),
    visibility: getString(formData, "visibility"),
    is_active: getBoolean(formData, "is_active"),
    is_featured: getBoolean(formData, "is_featured"),
    notes: getOptionalString(formData, "notes"),
    profile_fields: getProfileFields(formData),
    section_order: defaultSectionOrder,
    template_options: {
      target_keywords: getResumeTextArray(formData, "target_keywords")
    },
    items: selectedItemIds.map((id) => ({
      resume_item_id: id,
      section_key: getString(formData, `section_key_${id}`),
      sort_order: getString(formData, `sort_order_${id}`) || "0",
      is_visible: getBoolean(formData, `is_visible_${id}`),
      note: getOptionalString(formData, `note_${id}`),
      visible_fields: getVisibleFields(formData, id)
    }))
  });
}

function resumeVersionErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeFormError(message)}`);
}

export async function createResumeItemAction(formData: FormData) {
  const parsed = resumePayloadFromForm(formData);

  if (!parsed.success) {
    resumeErrorRedirect("/dashboard/resume/new", parsed.error.issues[0]?.message ?? "请检查简历素材表单。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    resumeErrorRedirect("/dashboard/resume/new", error ?? "当前账号没有管理员权限。");
  }

  const { data, error: insertError } = await supabase.from("resume_items").insert(parsed.data).select("id,title,item_type").single();

  if (insertError) {
    resumeErrorRedirect("/dashboard/resume/new", getResumeErrorMessage(insertError));
  }

  await writeActivityLog({
    action: "resume.create",
    entityType: "resume_item",
    entityId: data.id,
    metadata: { title: data.title, item_type: data.item_type }
  });

  revalidateResumePaths(data.id);
  redirect(`/dashboard/resume/${data.id}`);
}

export async function updateResumeItemAction(id: string, formData: FormData) {
  const editPath = `/dashboard/resume/${id}/edit`;
  const parsed = resumePayloadFromForm(formData);

  if (!parsed.success) {
    resumeErrorRedirect(editPath, parsed.error.issues[0]?.message ?? "请检查简历素材表单。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    resumeErrorRedirect(editPath, error ?? "当前账号没有管理员权限。");
  }

  const { data, error: updateError } = await supabase.from("resume_items").update(parsed.data).eq("id", id).select("id,title,item_type").single();

  if (updateError) {
    resumeErrorRedirect(editPath, getResumeErrorMessage(updateError));
  }

  await writeActivityLog({
    action: "resume.update",
    entityType: "resume_item",
    entityId: data.id,
    metadata: { title: data.title, item_type: data.item_type }
  });

  revalidateResumePaths(id);
  redirect(`/dashboard/resume/${id}`);
}

export async function deleteResumeItemAction(id: string) {
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(`/dashboard/resume/${id}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const { data: existing } = await supabase.from("resume_items").select("title,item_type").eq("id", id).maybeSingle();
  const { error: deleteError } = await supabase.from("resume_items").delete().eq("id", id);

  if (deleteError) {
    redirect(`/dashboard/resume/${id}?error=${encodeFormError(deleteError.message || "删除简历素材失败。")}`);
  }

  await writeActivityLog({
    action: "resume.delete",
    entityType: "resume_item",
    entityId: id,
    metadata: { title: existing?.title ?? "已删除简历素材", item_type: existing?.item_type ?? null }
  });

  revalidateResumePaths(id);
  redirect("/dashboard/resume");
}

function revalidateResumePaths(id?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/resume");
  revalidatePath("/dashboard/resume/versions");
  if (id) {
    revalidatePath(`/dashboard/resume/${id}`);
  }
}

export async function createResumeVersionAction(formData: FormData) {
  const parsed = resumeVersionPayloadFromForm(formData);

  if (!parsed.success) {
    resumeVersionErrorRedirect("/dashboard/resume/versions/new", parsed.error.issues[0]?.message ?? "请检查简历版本表单。");
  }

  const { items, ...versionPayload } = parsed.data;
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    resumeVersionErrorRedirect("/dashboard/resume/versions/new", error ?? "当前账号没有管理员权限。");
  }

  const { data, error: insertError } = await supabase.from("resume_versions").insert(versionPayload).select("id,title,target_role").single();

  if (insertError) {
    resumeVersionErrorRedirect("/dashboard/resume/versions/new", insertError.message || "简历版本保存失败，请稍后重试。");
  }

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from("resume_version_items").insert(
      items.map((item) => ({
        ...item,
        resume_version_id: data.id
      }))
    );

    if (itemsError) {
      await supabase.from("resume_versions").delete().eq("id", data.id);
      resumeVersionErrorRedirect("/dashboard/resume/versions/new", itemsError.message || "简历素材选择保存失败，请重新尝试。");
    }
  }

  await writeActivityLog({
    action: "resume_version.create",
    entityType: "resume_version",
    entityId: data.id,
    metadata: { title: data.title, target_role: data.target_role }
  });

  revalidateResumeVersionPaths(data.id);
  redirect(`/dashboard/resume/versions/${data.id}`);
}

export async function updateResumeVersionAction(id: string, formData: FormData) {
  const editPath = `/dashboard/resume/versions/${id}/edit`;
  const parsed = resumeVersionPayloadFromForm(formData);

  if (!parsed.success) {
    resumeVersionErrorRedirect(editPath, parsed.error.issues[0]?.message ?? "请检查简历版本表单。");
  }

  const { items, ...versionPayload } = parsed.data;
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    resumeVersionErrorRedirect(editPath, error ?? "当前账号没有管理员权限。");
  }

  const { data, error: updateError } = await supabase.from("resume_versions").update(versionPayload).eq("id", id).select("id,title,target_role").single();

  if (updateError) {
    resumeVersionErrorRedirect(editPath, updateError.message || "简历版本保存失败，请稍后重试。");
  }

  const { error: deleteItemsError } = await supabase.from("resume_version_items").delete().eq("resume_version_id", id);

  if (deleteItemsError) {
    resumeVersionErrorRedirect(editPath, deleteItemsError.message || "更新简历素材选择失败，请稍后重试。");
  }

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from("resume_version_items").insert(
      items.map((item) => ({
        ...item,
        resume_version_id: id
      }))
    );

    if (itemsError) {
      resumeVersionErrorRedirect(editPath, itemsError.message || "简历素材选择保存失败，请重新尝试。");
    }
  }

  await writeActivityLog({
    action: "resume_version.update",
    entityType: "resume_version",
    entityId: data.id,
    metadata: { title: data.title, target_role: data.target_role }
  });

  revalidateResumeVersionPaths(id);
  redirect(`/dashboard/resume/versions/${id}`);
}

export async function deleteResumeVersionAction(id: string) {
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(`/dashboard/resume/versions/${id}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const { data: existing } = await supabase.from("resume_versions").select("title,target_role").eq("id", id).maybeSingle();
  const { error: deleteError } = await supabase.from("resume_versions").delete().eq("id", id);

  if (deleteError) {
    redirect(`/dashboard/resume/versions/${id}?error=${encodeFormError(deleteError.message || "删除简历版本失败。")}`);
  }

  await writeActivityLog({
    action: "resume_version.delete",
    entityType: "resume_version",
    entityId: id,
    metadata: { title: existing?.title ?? "已删除简历版本", target_role: existing?.target_role ?? null }
  });

  revalidateResumeVersionPaths(id);
  redirect("/dashboard/resume/versions");
}

function revalidateResumeVersionPaths(id?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/resume");
  revalidatePath("/dashboard/resume/versions");
  if (id) {
    revalidatePath(`/dashboard/resume/versions/${id}`);
    revalidatePath(`/dashboard/resume/versions/${id}/preview`);
  }
}
