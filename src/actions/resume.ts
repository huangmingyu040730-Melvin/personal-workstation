"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { encodeFormError, getArrayFromText, getBoolean, getOptionalString, getString } from "@/lib/forms";
import { resumeItemSchema } from "@/lib/validations/resume";

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
    bullets: getArrayFromText(formData, "bullets"),
    skills: getArrayFromText(formData, "skills"),
    tags: getArrayFromText(formData, "tags"),
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
  if (id) {
    revalidatePath(`/dashboard/resume/${id}`);
  }
}
