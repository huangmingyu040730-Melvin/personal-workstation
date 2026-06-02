"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { encodeFormError, getArrayFromText, getBoolean, getOptionalString, getString } from "@/lib/forms";
import { projectSchema } from "@/lib/validations/project";

function projectPayloadFromForm(formData: FormData) {
  return projectSchema.safeParse({
    title: getString(formData, "title"),
    slug: getString(formData, "slug"),
    summary: getString(formData, "summary"),
    background: getOptionalString(formData, "background"),
    research_question: getOptionalString(formData, "research_question"),
    methodology: getOptionalString(formData, "methodology"),
    status: getString(formData, "status"),
    progress: getString(formData, "progress"),
    tags: getArrayFromText(formData, "tags"),
    milestones: getArrayFromText(formData, "milestones"),
    start_date: getOptionalString(formData, "start_date"),
    is_featured: getBoolean(formData, "is_featured"),
    visibility: getString(formData, "visibility")
  });
}

function projectErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeFormError(message)}`);
}

function getProjectErrorMessage(error: { code?: string; message?: string }) {
  if (error.code === "23505") {
    return "slug 已存在，请换一个更容易识别的 slug。";
  }

  return error.message || "项目保存失败，请稍后重试。";
}

export async function createProjectAction(formData: FormData) {
  const parsed = projectPayloadFromForm(formData);

  if (!parsed.success) {
    projectErrorRedirect("/projects/new", parsed.error.issues[0]?.message ?? "请检查项目表单。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    projectErrorRedirect("/projects/new", error ?? "当前账号没有管理员权限。");
  }

  const { data, error: insertError } = await supabase.from("projects").insert(parsed.data).select("id,title,slug").single();

  if (insertError) {
    projectErrorRedirect("/projects/new", getProjectErrorMessage(insertError));
  }

  await writeActivityLog({
    action: "project.create",
    entityType: "project",
    entityId: data.id,
    metadata: { title: data.title, slug: data.slug }
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}

export async function updateProjectAction(id: string, formData: FormData) {
  const parsed = projectPayloadFromForm(formData);
  const editPath = `/projects/${id}/edit`;

  if (!parsed.success) {
    projectErrorRedirect(editPath, parsed.error.issues[0]?.message ?? "请检查项目表单。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    projectErrorRedirect(editPath, error ?? "当前账号没有管理员权限。");
  }

  const { data, error: updateError } = await supabase.from("projects").update(parsed.data).eq("id", id).select("id,title,slug").single();

  if (updateError) {
    projectErrorRedirect(editPath, getProjectErrorMessage(updateError));
  }

  await writeActivityLog({
    action: "project.update",
    entityType: "project",
    entityId: data.id,
    metadata: { title: data.title, slug: data.slug }
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  redirect(`/projects/${id}`);
}

export async function deleteProjectAction(id: string) {
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(`/projects/${id}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const { data: existing } = await supabase.from("projects").select("title,slug").eq("id", id).maybeSingle();
  const { error: deleteError } = await supabase.from("projects").delete().eq("id", id);

  if (deleteError) {
    redirect(`/projects/${id}?error=${encodeFormError(deleteError.message || "删除项目失败。")}`);
  }

  await writeActivityLog({
    action: "project.delete",
    entityType: "project",
    entityId: id,
    metadata: { title: existing?.title ?? "已删除项目", slug: existing?.slug ?? null }
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  redirect("/projects");
}
