"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { buildRelatedDocumentUploadHref, getAfterCreateUploadAction } from "@/lib/document-upload-hrefs";
import { encodeFormError, getArrayFromText, getBoolean, getOptionalString, getString } from "@/lib/forms";
import { knowledgeSchema } from "@/lib/validations/knowledge";

function knowledgePayloadFromForm(formData: FormData) {
  return knowledgeSchema.safeParse({
    title: getString(formData, "title"),
    slug: getString(formData, "slug"),
    category: getString(formData, "category"),
    excerpt: getOptionalString(formData, "excerpt"),
    content: getOptionalString(formData, "content"),
    tags: getArrayFromText(formData, "tags"),
    project_id: getOptionalString(formData, "project_id"),
    is_featured: getBoolean(formData, "is_featured"),
    visibility: getString(formData, "visibility")
  });
}

function knowledgeErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeFormError(message)}`);
}

function getKnowledgeErrorMessage(error: { code?: string; message?: string }) {
  if (error.code === "23505") {
    return "slug 已存在，请换一个笔记 slug。";
  }

  return error.message || "笔记保存失败，请稍后重试。";
}

export async function createKnowledgeAction(formData: FormData) {
  const parsed = knowledgePayloadFromForm(formData);

  if (!parsed.success) {
    knowledgeErrorRedirect("/dashboard/knowledge/new", parsed.error.issues[0]?.message ?? "请检查笔记表单。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    knowledgeErrorRedirect("/dashboard/knowledge/new", error ?? "当前账号没有管理员权限。");
  }

  const { data, error: insertError } = await supabase.from("knowledge_notes").insert(parsed.data).select("id,title,slug").single();

  if (insertError) {
    knowledgeErrorRedirect("/dashboard/knowledge/new", getKnowledgeErrorMessage(insertError));
  }

  await writeActivityLog({
    action: "knowledge.create",
    entityType: "knowledge_note",
    entityId: data.id,
    metadata: { title: data.title, slug: data.slug }
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/knowledge");
  revalidatePath("/dashboard/knowledge");
  revalidatePath(`/knowledge/${data.slug}`);

  const afterCreate = getAfterCreateUploadAction(formData.get("after_create"));

  if (afterCreate === "upload_single") {
    redirect(buildRelatedDocumentUploadHref({
      relatedType: "knowledge",
      relatedId: data.id,
      mode: "single",
      category: "research_material"
    }));
  }

  if (afterCreate === "upload_batch") {
    redirect(buildRelatedDocumentUploadHref({
      relatedType: "knowledge",
      relatedId: data.id,
      mode: "batch",
      category: "research_material",
      collectionType: "attachment_bundle"
    }));
  }

  redirect(`/dashboard/knowledge/${data.id}`);
}

export async function updateKnowledgeAction(id: string, formData: FormData) {
  const parsed = knowledgePayloadFromForm(formData);
  const editPath = `/dashboard/knowledge/${id}/edit`;

  if (!parsed.success) {
    knowledgeErrorRedirect(editPath, parsed.error.issues[0]?.message ?? "请检查笔记表单。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    knowledgeErrorRedirect(editPath, error ?? "当前账号没有管理员权限。");
  }

  const { data, error: updateError } = await supabase.from("knowledge_notes").update(parsed.data).eq("id", id).select("id,title,slug").single();

  if (updateError) {
    knowledgeErrorRedirect(editPath, getKnowledgeErrorMessage(updateError));
  }

  await writeActivityLog({
    action: "knowledge.update",
    entityType: "knowledge_note",
    entityId: data.id,
    metadata: { title: data.title, slug: data.slug }
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/knowledge");
  revalidatePath("/dashboard/knowledge");
  revalidatePath(`/knowledge/${data.slug}`);
  revalidatePath(`/dashboard/knowledge/${id}`);
  redirect(`/dashboard/knowledge/${id}`);
}

export async function deleteKnowledgeAction(id: string) {
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(`/dashboard/knowledge/${id}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const { data: existing } = await supabase.from("knowledge_notes").select("title,slug").eq("id", id).maybeSingle();
  const { error: deleteError } = await supabase.from("knowledge_notes").delete().eq("id", id);

  if (deleteError) {
    redirect(`/dashboard/knowledge/${id}?error=${encodeFormError(deleteError.message || "删除笔记失败。")}`);
  }

  await writeActivityLog({
    action: "knowledge.delete",
    entityType: "knowledge_note",
    entityId: id,
    metadata: { title: existing?.title ?? "已删除笔记", slug: existing?.slug ?? null }
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/knowledge");
  if (existing?.slug) {
    revalidatePath(`/knowledge/${existing.slug}`);
  }
  revalidatePath("/dashboard/knowledge");
  redirect("/dashboard/knowledge");
}
