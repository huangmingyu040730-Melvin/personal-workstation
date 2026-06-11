"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { buildRelatedDocumentUploadHref, getAfterCreateUploadAction } from "@/lib/document-upload-hrefs";
import { encodeFormError, getArrayFromText, getBoolean, getOptionalString, getString } from "@/lib/forms";
import { publicationSchema } from "@/lib/validations/publication";

function publicationPayloadFromForm(formData: FormData) {
  return publicationSchema.safeParse({
    title: getString(formData, "title"),
    slug: getString(formData, "slug"),
    publication_type: getString(formData, "publication_type"),
    summary: getString(formData, "summary"),
    abstract: getOptionalString(formData, "abstract"),
    published_on: getOptionalString(formData, "published_on"),
    tags: getArrayFromText(formData, "tags"),
    project_id: getOptionalString(formData, "project_id"),
    is_featured: getBoolean(formData, "is_featured"),
    visibility: getString(formData, "visibility")
  });
}

function publicationErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeFormError(message)}`);
}

function getPublicationErrorMessage(error: { code?: string; message?: string }) {
  if (error.code === "23505") {
    return "slug 已存在，请换一个成果 slug。";
  }

  return error.message || "成果保存失败，请稍后重试。";
}

export async function createPublicationAction(formData: FormData) {
  const parsed = publicationPayloadFromForm(formData);

  if (!parsed.success) {
    publicationErrorRedirect("/dashboard/publications/new", parsed.error.issues[0]?.message ?? "请检查成果表单。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    publicationErrorRedirect("/dashboard/publications/new", error ?? "当前账号没有管理员权限。");
  }

  const { data, error: insertError } = await supabase
    .from("publications")
    .insert(parsed.data)
    .select("id,title,slug")
    .single();

  if (insertError) {
    publicationErrorRedirect("/dashboard/publications/new", getPublicationErrorMessage(insertError));
  }

  await writeActivityLog({
    action: "publication.create",
    entityType: "publication",
    entityId: data.id,
    metadata: { title: data.title, slug: data.slug }
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/publications");
  revalidatePath("/dashboard/publications");
  revalidatePath(`/publications/${data.slug}`);

  const afterCreate = getAfterCreateUploadAction(formData.get("after_create"));

  if (afterCreate === "upload_single") {
    redirect(buildRelatedDocumentUploadHref({
      relatedType: "publication",
      relatedId: data.id,
      mode: "single",
      category: "publication_attachment"
    }));
  }

  if (afterCreate === "upload_batch") {
    redirect(buildRelatedDocumentUploadHref({
      relatedType: "publication",
      relatedId: data.id,
      mode: "batch",
      category: "publication_attachment",
      collectionType: "attachment_bundle"
    }));
  }

  redirect(`/dashboard/publications/${data.id}`);
}

export async function updatePublicationAction(id: string, formData: FormData) {
  const parsed = publicationPayloadFromForm(formData);
  const editPath = `/dashboard/publications/${id}/edit`;

  if (!parsed.success) {
    publicationErrorRedirect(editPath, parsed.error.issues[0]?.message ?? "请检查成果表单。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    publicationErrorRedirect(editPath, error ?? "当前账号没有管理员权限。");
  }

  const { data, error: updateError } = await supabase
    .from("publications")
    .update(parsed.data)
    .eq("id", id)
    .select("id,title,slug")
    .single();

  if (updateError) {
    publicationErrorRedirect(editPath, getPublicationErrorMessage(updateError));
  }

  await writeActivityLog({
    action: "publication.update",
    entityType: "publication",
    entityId: data.id,
    metadata: { title: data.title, slug: data.slug }
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/publications");
  revalidatePath("/dashboard/publications");
  revalidatePath(`/publications/${data.slug}`);
  revalidatePath(`/dashboard/publications/${id}`);
  redirect(`/dashboard/publications/${id}`);
}

export async function deletePublicationAction(id: string) {
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(`/dashboard/publications/${id}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const [documentsCountResult, collectionsCountResult] = await Promise.all([
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("related_type", "publication")
      .eq("related_id", id),
    supabase
      .from("document_collections")
      .select("id", { count: "exact", head: true })
      .eq("related_type", "publication")
      .eq("related_id", id)
  ]);

  if (documentsCountResult.error || collectionsCountResult.error) {
    redirect(`/dashboard/publications/${id}?error=${encodeFormError(documentsCountResult.error?.message || collectionsCountResult.error?.message || "检查关联附件失败。")}`);
  }

  if ((documentsCountResult.count ?? 0) > 0 || (collectionsCountResult.count ?? 0) > 0) {
    redirect(`/dashboard/publications/${id}?error=${encodeFormError("该成果仍有关联附件或文档包，请先删除或解除关联后再删除成果。")}`);
  }

  const { data: existing } = await supabase.from("publications").select("title,slug").eq("id", id).maybeSingle();
  const { error: deleteError } = await supabase.from("publications").delete().eq("id", id);

  if (deleteError) {
    redirect(`/dashboard/publications/${id}?error=${encodeFormError(deleteError.message || "删除成果失败。")}`);
  }

  await writeActivityLog({
    action: "publication.delete",
    entityType: "publication",
    entityId: id,
    metadata: { title: existing?.title ?? "已删除成果", slug: existing?.slug ?? null }
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/publications");
  if (existing?.slug) {
    revalidatePath(`/publications/${existing.slug}`);
  }
  revalidatePath("/dashboard/publications");
  redirect("/dashboard/publications");
}
